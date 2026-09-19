package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Success bool        `json:"success"`
	Error   ErrorDetail `json:"error"`
}

func RespondSuccess(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Data:    data,
	})
}

func RespondError(c *gin.Context, statusCode int, code, message string) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error: ErrorDetail{
			Code:    code,
			Message: message,
		},
	})
}

func RespondValidationError(c *gin.Context, message string) {
	RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", message)
}

func RespondUnauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Unauthorized"
	}
	RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", message)
}

func RespondForbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Forbidden"
	}
	RespondError(c, http.StatusForbidden, "FORBIDDEN", message)
}

func RespondNotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Not found"
	}
	RespondError(c, http.StatusNotFound, "NOT_FOUND", message)
}

func RespondInternalError(c *gin.Context, message string) {
	if message == "" {
		message = "Internal server error"
	}
	RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", message)
}
