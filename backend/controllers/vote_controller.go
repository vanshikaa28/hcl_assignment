package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"pulsepoll/services"
	"pulsepoll/utils"
	"pulsepoll/validators"
)

type VoteController struct {
	voteService *services.VoteService
}

func NewVoteController(voteService *services.VoteService) *VoteController {
	return &VoteController{voteService: voteService}
}

// POST /api/v1/polls/:id/votes
func (ctrl *VoteController) Cast(c *gin.Context) {
	pollID := c.Param("id")

	var req validators.CastVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		utils.RespondValidationError(c, err.Error())
		return
	}

	event, err := ctrl.voteService.Cast(services.CastVoteInput{
		PollID:     pollID,
		OptionID:   req.OptionID,
		VoterToken: req.VoterToken,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrPollNotFound):
			utils.RespondNotFound(c, "Poll not found")
		case errors.Is(err, services.ErrPollClosed):
			utils.RespondError(c, http.StatusConflict, "POLL_CLOSED", "This poll is closed")
		case errors.Is(err, services.ErrOptionNotFound):
			utils.RespondValidationError(c, "Invalid option")
		case errors.Is(err, services.ErrAlreadyVoted):
			utils.RespondError(c, http.StatusConflict, "ALREADY_VOTED", "You have already voted on this poll")
		case errors.Is(err, services.ErrInvalidVoterToken):
			utils.RespondValidationError(c, "Voter token is required")
		default:
			utils.RespondInternalError(c, "Failed to cast vote")
		}
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, event)
}
