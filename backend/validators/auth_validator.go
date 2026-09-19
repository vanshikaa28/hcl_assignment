package validators

import (
	"errors"
	"net/mail"
	"strings"
)

type SignupRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (r *SignupRequest) Validate() error {
	r.Name = strings.TrimSpace(r.Name)
	r.Email = strings.TrimSpace(strings.ToLower(r.Email))

	if len(r.Name) < 2 {
		return errors.New("name must be at least 2 characters")
	}
	if len(r.Name) > 100 {
		return errors.New("name must be at most 100 characters")
	}
	if _, err := mail.ParseAddress(r.Email); err != nil {
		return errors.New("invalid email address")
	}
	if len(r.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(r.Password) > 128 {
		return errors.New("password is too long")
	}
	return nil
}

func (r *LoginRequest) Validate() error {
	r.Email = strings.TrimSpace(strings.ToLower(r.Email))
	if _, err := mail.ParseAddress(r.Email); err != nil {
		return errors.New("invalid email address")
	}
	return nil
}
