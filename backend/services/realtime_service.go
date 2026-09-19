package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

const pubSubChannelPrefix = "poll:"

type RealtimeService struct {
	redis      *redis.Client
	wsHandlers []func(pollID string, event *PollResultsEvent)
}

func NewRealtimeService(redis *redis.Client) *RealtimeService {
	return &RealtimeService{redis: redis}
}

func (s *RealtimeService) RegisterHandler(handler func(pollID string, event *PollResultsEvent)) {
	s.wsHandlers = append(s.wsHandlers, handler)
}

func (s *RealtimeService) Publish(pollID string, event *PollResultsEvent) {
	ctx := context.Background()
	channel := fmt.Sprintf("%s%s", pubSubChannelPrefix, pollID)

	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("[Realtime] Failed to marshal event: %v", err)
		return
	}

	if err := s.redis.Publish(ctx, channel, data).Err(); err != nil {
		log.Printf("[Realtime] Failed to publish to Redis channel %s: %v", channel, err)
		return
	}

	log.Printf("[Realtime] Published to channel %s", channel)
}

// StartSubscriber starts a background goroutine subscribing to ALL poll channels via pattern
func (s *RealtimeService) StartSubscriber() {
	go func() {
		ctx := context.Background()
		pattern := fmt.Sprintf("%s*", pubSubChannelPrefix)

		pubsub := s.redis.PSubscribe(ctx, pattern)
		defer pubsub.Close()

		log.Printf("[Realtime] Redis subscriber started, listening on pattern: %s", pattern)

		ch := pubsub.Channel()
		for msg := range ch {
			var event PollResultsEvent
			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				log.Printf("[Realtime] Failed to parse event: %v", err)
				continue
			}

			log.Printf("[Realtime] Received event for poll %s, total votes: %d", event.PollID, event.TotalVotes)

			// Dispatch to all registered handlers (WebSocket hub)
			for _, handler := range s.wsHandlers {
				handler(event.PollID, &event)
			}
		}
	}()
}
