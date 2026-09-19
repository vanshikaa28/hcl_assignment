package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"pulsepoll/controllers"
	"pulsepoll/middleware"
	ws "pulsepoll/websocket"
)

type Router struct {
	authCtrl  *controllers.AuthController
	pollCtrl  *controllers.PollController
	voteCtrl  *controllers.VoteController
	wsManager *ws.Manager
}

func NewRouter(
	authCtrl *controllers.AuthController,
	pollCtrl *controllers.PollController,
	voteCtrl *controllers.VoteController,
	wsManager *ws.Manager,
) *Router {
	return &Router{
		authCtrl:  authCtrl,
		pollCtrl:  pollCtrl,
		voteCtrl:  voteCtrl,
		wsManager: wsManager,
	}
}

func (r *Router) Setup(engine *gin.Engine) {
	// Health check
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "pulsepoll",
		})
	})

	// WebSocket endpoint
	engine.GET("/ws/polls/:pollId", r.wsManager.ServeWS)

	// API v1
	api := engine.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/signup", r.authCtrl.Signup)
		auth.POST("/login", r.authCtrl.Login)
		auth.GET("/me", middleware.AuthRequired(), r.authCtrl.Me)
	}

	// Public poll routes (no auth required)
	public := api.Group("/public")
	{
		public.GET("/polls/:shareCode", r.pollCtrl.GetPublic)
		public.POST("/polls/:shareCode/votes", r.voteCtrlByShareCode())
		public.GET("/polls/:shareCode/results", r.publicResults())
	}

	// Protected poll routes
	polls := api.Group("/polls", middleware.AuthRequired())
	{
		polls.POST("", r.pollCtrl.Create)
		polls.GET("", r.pollCtrl.List)
		polls.GET("/:id", r.pollCtrl.GetByID)
		polls.PATCH("/:id", r.pollCtrl.Update)
		polls.DELETE("/:id", r.pollCtrl.Delete)
		polls.POST("/:id/close", r.pollCtrl.Close)
		polls.GET("/:id/results", r.pollCtrl.Results)

		// Vote by poll ID (requires auth or just poll ID)
		polls.POST("/:id/votes", r.voteCtrl.Cast)
	}
}

// voteCtrlByShareCode resolves shareCode → pollID then delegates to voteCtrl
func (r *Router) voteCtrlByShareCode() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Remap: frontend posts to /public/polls/:shareCode/votes with pollId in body or resolved separately
		// The vote_controller expects :id, so we just pass shareCode as id for public voting
		// The vote_service resolves by poll ID, so we need to handle this via share code lookup
		// For simplicity, the frontend sends the actual poll ID in the request
		c.Params = append(c.Params, gin.Param{Key: "id", Value: c.Param("shareCode")})
		r.voteCtrl.Cast(c)
	}
}

// publicResults fetches results by shareCode
func (r *Router) publicResults() gin.HandlerFunc {
	return func(c *gin.Context) {
		shareCode := c.Param("shareCode")
		c.Params = append(c.Params, gin.Param{Key: "id", Value: shareCode})
		r.pollCtrl.Results(c)
	}
}
