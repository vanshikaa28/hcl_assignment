package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"pulsepoll/config"
	"pulsepoll/controllers"
	"pulsepoll/database"
	"pulsepoll/middleware"
	"pulsepoll/repositories"
	"pulsepoll/routes"
	"pulsepoll/services"
	ws "pulsepoll/websocket"
)

func main() {
	// Load configuration
	cfg := config.Load()
	log.Printf("[Server] Starting PulsePoll in %s mode on port %s", cfg.Env, cfg.Port)

	// Connect MongoDB
	db, err := database.ConnectMongo(cfg.MongoURI)
	if err != nil {
		log.Fatalf("[Server] Failed to connect to MongoDB: %v", err)
	}
	defer database.DisconnectMongo()

	// Connect Redis
	redisClient, err := database.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("[Server] Failed to connect to Redis: %v", err)
	}
	defer database.DisconnectRedis()

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	pollRepo := repositories.NewPollRepository(db)
	voteRepo := repositories.NewVoteRepository(db)

	// Initialize WebSocket hub (starts the run loop)
	hub := ws.NewHub()
	go hub.Run()

	// Initialize realtime service
	realtimeService := services.NewRealtimeService(redisClient)

	// Register WebSocket handler: when Redis Pub/Sub receives an event, broadcast via WebSocket
	realtimeService.RegisterHandler(func(pollID string, event *services.PollResultsEvent) {
		payload, err := event.ToJSON()
		if err != nil {
			log.Printf("[Server] Failed to marshal broadcast payload: %v", err)
			return
		}
		hub.Broadcast(pollID, payload)
	})

	// Start Redis subscriber goroutine
	realtimeService.StartSubscriber()

	// Initialize services
	authService := services.NewAuthService(userRepo)
	pollService := services.NewPollService(pollRepo, voteRepo)
	voteService := services.NewVoteService(voteRepo, pollRepo, redisClient, realtimeService)

	// Initialize controllers
	authCtrl := controllers.NewAuthController(authService)
	pollCtrl := controllers.NewPollController(pollService, voteService)
	voteCtrl := controllers.NewVoteController(voteService)

	// Initialize WebSocket manager
	wsManager := ws.NewManager(hub)

	// Setup Gin engine
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()
	engine.Use(middleware.Recovery())
	engine.Use(middleware.CORS())
	engine.Use(gin.Logger())

	// Setup routes
	router := routes.NewRouter(authCtrl, pollCtrl, voteCtrl, wsManager)
	router.Setup(engine)

	// Start HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      engine,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("[Server] Listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Server] Error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[Server] Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("[Server] Forced shutdown: %v", err)
	}
	log.Println("[Server] Shutdown complete")
}
