package services

import (
	"errors"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"pulsepoll/models"
	"pulsepoll/repositories"
)

var (
	ErrPollNotFound    = errors.New("poll not found")
	ErrPollClosed      = errors.New("poll is closed")
	ErrUnauthorized    = errors.New("not authorized")
	ErrDuplicateOption = errors.New("duplicate option text not allowed")
	ErrTooFewOptions   = errors.New("poll must have at least 2 options")
	ErrTooManyOptions  = errors.New("poll cannot have more than 10 options")
)

type PollService struct {
	pollRepo *repositories.PollRepository
	voteRepo *repositories.VoteRepository
}

func NewPollService(pollRepo *repositories.PollRepository, voteRepo *repositories.VoteRepository) *PollService {
	return &PollService{pollRepo: pollRepo, voteRepo: voteRepo}
}

type CreatePollInput struct {
	Title       string
	Description string
	Options     []models.PollOption
	CreatorID   string
}

type UpdatePollInput struct {
	Title       *string
	Description *string
}

func (s *PollService) Create(input CreatePollInput) (*models.Poll, error) {
	if err := validateOptions(input.Options); err != nil {
		return nil, err
	}

	creatorObjID, err := primitive.ObjectIDFromHex(input.CreatorID)
	if err != nil {
		return nil, err
	}

	poll := &models.Poll{
		CreatorID:   creatorObjID,
		Title:       input.Title,
		Description: input.Description,
		Options:     input.Options,
		Status:      models.PollStatusActive,
	}

	if err := s.pollRepo.Create(poll); err != nil {
		return nil, err
	}

	log.Printf("[Poll] Created poll '%s' by creator %s", poll.Title, input.CreatorID)
	return poll, nil
}

func validateOptions(options []models.PollOption) error {
	if len(options) < 2 {
		return ErrTooFewOptions
	}
	if len(options) > 10 {
		return ErrTooManyOptions
	}
	seen := make(map[string]bool)
	for _, opt := range options {
		lower := opt.Text
		if seen[lower] {
			return ErrDuplicateOption
		}
		seen[lower] = true
	}
	return nil
}

func (s *PollService) GetByID(id string) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}
	return poll, nil
}

func (s *PollService) GetByShareCode(shareCode string) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByShareCode(shareCode)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}
	return poll, nil
}

func (s *PollService) GetByCreator(creatorID string) ([]models.Poll, error) {
	return s.pollRepo.FindByCreatorID(creatorID)
}

func (s *PollService) Update(pollID, userID string, input UpdatePollInput) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}
	if poll.CreatorID.Hex() != userID {
		return nil, ErrUnauthorized
	}

	update := bson.M{}
	if input.Title != nil {
		update["title"] = *input.Title
	}
	if input.Description != nil {
		update["description"] = *input.Description
	}

	if err := s.pollRepo.Update(pollID, update); err != nil {
		return nil, err
	}

	return s.pollRepo.FindByID(pollID)
}

func (s *PollService) Delete(pollID, userID string) error {
	poll, err := s.pollRepo.FindByID(pollID)
	if err != nil {
		return err
	}
	if poll == nil {
		return ErrPollNotFound
	}
	if poll.CreatorID.Hex() != userID {
		return ErrUnauthorized
	}

	// Delete associated votes
	if err := s.voteRepo.DeleteByPollID(poll.ID); err != nil {
		log.Printf("[Poll] Error deleting votes for poll %s: %v", pollID, err)
	}

	return s.pollRepo.Delete(pollID)
}

func (s *PollService) Close(pollID, userID string) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, ErrPollNotFound
	}
	if poll.CreatorID.Hex() != userID {
		return nil, ErrUnauthorized
	}

	if err := s.pollRepo.Close(pollID); err != nil {
		return nil, err
	}

	log.Printf("[Poll] Poll closed: %s", pollID)
	return s.pollRepo.FindByID(pollID)
}
