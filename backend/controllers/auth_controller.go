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

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

func (ctrl *AuthController) Signup(c *gin.Context) {
	var req validators.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		utils.RespondValidationError(c, err.Error())
		return
	}

	result, err := ctrl.authService.Signup(services.SignupInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, services.ErrEmailTaken) {
			utils.RespondError(c, http.StatusConflict, "EMAIL_TAKEN", "Email is already in use")
			return
		}
		utils.RespondInternalError(c, "Failed to create account")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, gin.H{
		"token": result.Token,
		"user":  result.User.ToResponse(),
	})
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var req validators.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		utils.RespondValidationError(c, err.Error())
		return
	}

	result, err := ctrl.authService.Login(services.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, services.ErrInvalidCreds) {
			utils.RespondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
			return
		}
		utils.RespondInternalError(c, "Login failed")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"token": result.Token,
		"user":  result.User.ToResponse(),
	})
}

func (ctrl *AuthController) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := ctrl.authService.GetUserByID(userID)
	if err != nil {
		utils.RespondInternalError(c, "Failed to load user")
		return
	}
	if user == nil {
		utils.RespondNotFound(c, "User not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, user.ToResponse())
}
