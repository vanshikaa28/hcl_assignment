package websocket

import (
	"log"
	"sync"
)

// Hub manages all WebSocket clients grouped by pollID
type Hub struct {
	// clients maps pollID -> set of clients
	clients map[string]map[*Client]bool
	mu      sync.RWMutex

	// Channels for hub operations
	register   chan *Client
	unregister chan *Client
	broadcast  chan *BroadcastMessage
}

type BroadcastMessage struct {
	PollID  string
	Payload []byte
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
		broadcast:  make(chan *BroadcastMessage, 1024),
	}
}

func (h *Hub) Run() {
	log.Println("[WebSocket] Hub started")
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.PollID] == nil {
				h.clients[client.PollID] = make(map[*Client]bool)
			}
			h.clients[client.PollID][client] = true
			count := len(h.clients[client.PollID])
			h.mu.Unlock()
			log.Printf("[WebSocket] Client connected to poll %s. Total clients for poll: %d", client.PollID, count)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.PollID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.clients, client.PollID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("[WebSocket] Client disconnected from poll %s", client.PollID)

		case message := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[message.PollID]
			// Collect to avoid holding lock during send
			targets := make([]*Client, 0, len(clients))
			for c := range clients {
				targets = append(targets, c)
			}
			h.mu.RUnlock()

			for _, client := range targets {
				select {
				case client.send <- message.Payload:
				default:
					// Client send buffer full — disconnect it
					h.unregister <- client
				}
			}
			log.Printf("[WebSocket] Broadcast to %d clients for poll %s", len(targets), message.PollID)
		}
	}
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

func (h *Hub) Broadcast(pollID string, payload []byte) {
	h.broadcast <- &BroadcastMessage{PollID: pollID, Payload: payload}
}

func (h *Hub) ClientCount(pollID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[pollID])
}
