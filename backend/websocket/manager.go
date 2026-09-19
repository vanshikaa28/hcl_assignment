package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	gorillaws "github.com/gorilla/websocket"
)

var upgrader = gorillaws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate origin against allowed list
		return true
	},
}

// Manager wires the WebSocket HTTP handler
type Manager struct {
	hub *Hub
}

func NewManager(hub *Hub) *Manager {
	return &Manager{hub: hub}
}

// ServeWS handles WebSocket upgrade and client registration
// Route: GET /ws/polls/:pollId
func (m *Manager) ServeWS(c *gin.Context) {
	pollID := c.Param("pollId")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pollId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade error: %v", err)
		return
	}

	client := NewClient(m.hub, conn, pollID)
	m.hub.Register(client)

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()
}
