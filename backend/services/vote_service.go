package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"pulsepoll/models"
	"pulsepoll/repositories"
)

var (
	ErrOptionNotFound  = errors.New("option not found")
	ErrAlreadyVoted    = errors.New("you have already voted on this poll")
	ErrInvalidVoterToken = errors.New("voter token is required")
)

type VoteService struct {
	voteRepo    *repositories.VoteRepository
	pollRepo    *repositories.PollRepository
	redis       *redis.Client
	realtime    *RealtimeService
}

func NewVoteService(
	voteRepo *repositories.VoteRepository,
	pollRepo *repositories.PollRepository,
	redis *redis.Client,
	realtime *RealtimeService,
) *VoteService {
	return &VoteService{
		voteRepo: voteRepo,
		pollRepo: pollRepo,
		redis:    redis,
		realtime: realtime,
	}
}

type CastVoteInput struct {
	PollID     string
	OptionID   string
	VoterToken string
}

func (s *VoteService) Cast(input CastVoteInput) (*PollResultsEvent, error) {
	if input.VoterToken == "" {
		return nil, ErrInvalidVoterToken
	}

	// 1. Validate poll exists and is active
	poll, err := s.pollRepo.FindByID(input.PollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}
	if poll.Status != models.PollStatusActive {
		return nil, ErrPollClosed
	}

	// 2. Validate option exists in this poll
	optionValid := false
	for _, opt := range poll.Options {
		if opt.ID == input.OptionID {
			optionValid = true
			break
		}
	}
	if !optionValid {
		return nil, ErrOptionNotFound
	}

	// 3. Check duplicate vote
	pollObjID, _ := primitive.ObjectIDFromHex(input.PollID)
	hasVoted, err := s.voteRepo.HasVoted(pollObjID, input.VoterToken)
	if err != nil {
		return nil, err
	}
	if hasVoted {
		return nil, ErrAlreadyVoted
	}

	// 4. Persist vote in MongoDB
	vote := &models.Vote{
		PollID:     pollObjID,
		OptionID:   input.OptionID,
		VoterToken: input.VoterToken,
	}
	if err := s.voteRepo.Create(vote); err != nil {
		return nil, err
	}

	// 5. Increment Redis counter atomically
	ctx := context.Background()
	redisKey := fmt.Sprintf("poll:%s", input.PollID)
	if err := s.redis.HIncrBy(ctx, redisKey, input.OptionID, 1).Err(); err != nil {
		log.Printf("[Vote] Redis HINCRBY failed: %v", err)
	}

	// 6. Read latest counts from Redis
	counts, err := s.getRedisCountsForPoll(ctx, input.PollID, poll.Options)
	if err != nil {
		log.Printf("[Vote] Redis read failed, falling back to MongoDB: %v", err)
		counts, _ = s.getMongoCountsForPoll(pollObjID, poll.Options)
	}

	total := 0
	for _, v := range counts {
		total += v
	}

	// 7. Build event
	event := &PollResultsEvent{
		Type:       "POLL_RESULTS_UPDATED",
		PollID:     input.PollID,
		Counts:     counts,
		TotalVotes: total,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
	}

	// 8. Publish to Redis Pub/Sub
	if s.realtime != nil {
		s.realtime.Publish(input.PollID, event)
	}

	log.Printf("[Vote] Vote cast on poll %s, option %s. Total votes: %d", input.PollID, input.OptionID, total)
	return event, nil
}

func (s *VoteService) getRedisCountsForPoll(ctx context.Context, pollID string, options []models.PollOption) (map[string]int, error) {
	redisKey := fmt.Sprintf("poll:%s", pollID)
	data, err := s.redis.HGetAll(ctx, redisKey).Result()
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int)
	for _, opt := range options {
		counts[opt.ID] = 0
	}
	for k, v := range data {
		var val int
		fmt.Sscanf(v, "%d", &val)
		counts[k] = val
	}
	return counts, nil
}

func (s *VoteService) getMongoCountsForPoll(pollID primitive.ObjectID, options []models.PollOption) (map[string]int, error) {
	mongoCounts, err := s.voteRepo.CountByOption(pollID)
	if err != nil {
		return nil, err
	}
	counts := make(map[string]int)
	for _, opt := range options {
		counts[opt.ID] = int(mongoCounts[opt.ID])
	}
	return counts, nil
}

// GetResults returns the current results for a poll, reading from Redis (with MongoDB fallback)
func (s *VoteService) GetResults(pollID string) (*PollResultsEvent, error) {
	poll, err := s.pollRepo.FindByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}

	ctx := context.Background()
	counts, err := s.getRedisCountsForPoll(ctx, pollID, poll.Options)
	if err != nil {
		pollObjID, _ := primitive.ObjectIDFromHex(pollID)
		counts, err = s.getMongoCountsForPoll(pollObjID, poll.Options)
		if err != nil {
			return nil, err
		}
	}

	total := 0
	for _, v := range counts {
		total += v
	}

	return &PollResultsEvent{
		Type:       "POLL_RESULTS_UPDATED",
		PollID:     pollID,
		Counts:     counts,
		TotalVotes: total,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// InitRedisCounters rebuilds Redis counters from MongoDB (called on startup)
func (s *VoteService) InitRedisCounters(pollID string, options []models.PollOption) error {
	pollObjID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	mongoCounts, err := s.voteRepo.CountByOption(pollObjID)
	if err != nil {
		return err
	}

	ctx := context.Background()
	redisKey := fmt.Sprintf("poll:%s", pollID)

	pipe := s.redis.Pipeline()
	pipe.Del(ctx, redisKey)
	for _, opt := range options {
		count := mongoCounts[opt.ID]
		if count > 0 {
			pipe.HSet(ctx, redisKey, opt.ID, count)
		} else {
			pipe.HSet(ctx, redisKey, opt.ID, 0)
		}
	}
	_, err = pipe.Exec(ctx)
	return err
}

type PollResultsEvent struct {
	Type       string         `json:"type"`
	PollID     string         `json:"pollId"`
	Counts     map[string]int `json:"counts"`
	TotalVotes int            `json:"totalVotes"`
	Timestamp  string         `json:"timestamp"`
}

func (e *PollResultsEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}
