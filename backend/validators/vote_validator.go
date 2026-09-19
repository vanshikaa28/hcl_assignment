package validators

import (
	"errors"
	"strings"
)

type CastVoteRequest struct {
	OptionID   string `json:"optionId" binding:"required"`
	VoterToken string `json:"voterToken" binding:"required"`
}

func (r *CastVoteRequest) Validate() error {
	r.OptionID = strings.TrimSpace(r.OptionID)
	r.VoterToken = strings.TrimSpace(r.VoterToken)

	if r.OptionID == "" {
		return errors.New("optionId is required")
	}
	if r.VoterToken == "" {
		return errors.New("voterToken is required")
	}
	if len(r.VoterToken) < 8 || len(r.VoterToken) > 128 {
		return errors.New("invalid voterToken")
	}
	return nil
}
