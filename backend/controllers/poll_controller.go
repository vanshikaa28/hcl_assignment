package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"pulsepoll/middleware"
	"pulsepoll/services"
	"pulsepoll/utils"
	"pulsepoll/validators"
)

type PollController struct {
	pollService *services.PollService
	voteService *services.VoteService
}

func NewPollController(pollService *services.PollService, voteService *services.VoteService) *PollController {
	return &PollController{pollService: pollService, voteService: voteService}
}

// POST /api/v1/polls
func (ctrl *PollController) Create(c *gin.Context) {
	var req validators.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body")
		return
	}

	options, err := req.Validate()
	if err != nil {
		utils.RespondValidationError(c, err.Error())
		return
	}

	userID := middleware.GetUserID(c)
	poll, err := ctrl.pollService.Create(services.CreatePollInput{
		Title:       req.Title,
		Description: req.Description,
		Options:     options,
		CreatorID:   userID,
	})
	if err != nil {
		if errors.Is(err, services.ErrTooFewOptions) || errors.Is(err, services.ErrTooManyOptions) || errors.Is(err, services.ErrDuplicateOption) {
			utils.RespondValidationError(c, err.Error())
			return
		}
		utils.RespondInternalError(c, "Failed to create poll")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, poll)
}

// GET /api/v1/polls
func (ctrl *PollController) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	polls, err := ctrl.pollService.GetByCreator(userID)
	if err != nil {
		utils.RespondInternalError(c, "Failed to load polls")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, polls)
}

// GET /api/v1/polls/:id
func (ctrl *PollController) GetByID(c *gin.Context) {
	id := c.Param("id")
	poll, err := ctrl.pollService.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		utils.RespondInternalError(c, "Failed to load poll")
		return
	}

	// Check ownership
	userID := middleware.GetUserID(c)
	if poll.CreatorID.Hex() != userID {
		utils.RespondForbidden(c, "You don't have permission to view this poll")
		return
	}

	// Attach results
	results, _ := ctrl.voteService.GetResults(id)
	if results != nil {
		utils.RespondSuccess(c, http.StatusOK, gin.H{
			"poll":       poll,
			"counts":     results.Counts,
			"totalVotes": results.TotalVotes,
		})
		return
	}

	utils.RespondSuccess(c, http.StatusOK, poll)
}

// PATCH /api/v1/polls/:id
func (ctrl *PollController) Update(c *gin.Context) {
	id := c.Param("id")
	var req validators.UpdatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body")
		return
	}

	userID := middleware.GetUserID(c)
	poll, err := ctrl.pollService.Update(id, userID, services.UpdatePollInput{
		Title:       req.Title,
		Description: req.Description,
	})
	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			utils.RespondForbidden(c, "You don't have permission to update this poll")
			return
		}
		utils.RespondInternalError(c, "Failed to update poll")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, poll)
}

// DELETE /api/v1/polls/:id
func (ctrl *PollController) Delete(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := ctrl.pollService.Delete(id, userID); err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			utils.RespondForbidden(c, "You don't have permission to delete this poll")
			return
		}
		utils.RespondInternalError(c, "Failed to delete poll")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Poll deleted"})
}

// POST /api/v1/polls/:id/close
func (ctrl *PollController) Close(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	poll, err := ctrl.pollService.Close(id, userID)
	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			utils.RespondForbidden(c, "You don't have permission to close this poll")
			return
		}
		utils.RespondInternalError(c, "Failed to close poll")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, poll)
}

// GET /api/v1/polls/:id/results
func (ctrl *PollController) Results(c *gin.Context) {
	id := c.Param("id")
	results, err := ctrl.voteService.GetResults(id)
	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		utils.RespondInternalError(c, "Failed to load results")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, results)
}

// GET /api/v1/public/polls/:shareCode
func (ctrl *PollController) GetPublic(c *gin.Context) {
	shareCode := c.Param("shareCode")
	poll, err := ctrl.pollService.GetByShareCode(shareCode)
	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			utils.RespondNotFound(c, "Poll not found")
			return
		}
		utils.RespondInternalError(c, "Failed to load poll")
		return
	}

	// Return public-safe data only
	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"id":          poll.ID.Hex(),
		"title":       poll.Title,
		"description": poll.Description,
		"options":     poll.Options,
		"status":      poll.Status,
		"shareCode":   poll.ShareCode,
		"createdAt":   poll.CreatedAt,
	})
}
