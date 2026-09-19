package validators

import (
	"errors"
	"strings"

	"pulsepoll/models"
)

type CreatePollRequest struct {
	Title       string              `json:"title" binding:"required"`
	Description string              `json:"description"`
	Options     []PollOptionRequest `json:"options" binding:"required"`
}

type PollOptionRequest struct {
	ID   string `json:"id"`
	Text string `json:"text" binding:"required"`
}

type UpdatePollRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
}

func (r *CreatePollRequest) Validate() ([]models.PollOption, error) {
	r.Title = strings.TrimSpace(r.Title)
	r.Description = strings.TrimSpace(r.Description)

	if len(r.Title) < 5 {
		return nil, errors.New("title must be at least 5 characters")
	}
	if len(r.Title) > 300 {
		return nil, errors.New("title must be at most 300 characters")
	}
	if len(r.Description) > 1000 {
		return nil, errors.New("description must be at most 1000 characters")
	}
	if len(r.Options) < 2 {
		return nil, errors.New("poll must have at least 2 options")
	}
	if len(r.Options) > 10 {
		return nil, errors.New("poll cannot have more than 10 options")
	}

	seen := make(map[string]bool)
	options := make([]models.PollOption, 0, len(r.Options))

	for i, opt := range r.Options {
		text := strings.TrimSpace(opt.Text)
		if text == "" {
			return nil, errors.New("option text cannot be empty")
		}
		if len(text) > 200 {
			return nil, errors.New("option text must be at most 200 characters")
		}
		lower := strings.ToLower(text)
		if seen[lower] {
			return nil, errors.New("duplicate option text not allowed")
		}
		seen[lower] = true

		// Generate option ID if not provided
		optID := opt.ID
		if optID == "" {
			optID = strings.ToLower(strings.ReplaceAll(text, " ", "-"))
			// Add index to ensure uniqueness for edge cases
			if seen["id:"+optID] {
				optID = strings.Join([]string{optID, strings.Repeat("x", i)}, "-")
			}
			seen["id:"+optID] = true
		}

		options = append(options, models.PollOption{
			ID:   optID,
			Text: text,
		})
	}

	return options, nil
}
