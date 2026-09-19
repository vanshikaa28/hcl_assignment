package services

import (
	"errors"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"pulsepoll/models"
	"pulsepoll/repositories"
	"pulsepoll/utils"
)

var (
	ErrEmailTaken     = errors.New("email already in use")
	ErrInvalidCreds   = errors.New("invalid credentials")
	ErrUserNotFound   = errors.New("user not found")
)

type AuthService struct {
	userRepo *repositories.UserRepository
}

func NewAuthService(userRepo *repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type SignupInput struct {
	Name     string
	Email    string
	Password string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthResult struct {
	User  *models.User
	Token string
}

func (s *AuthService) Signup(input SignupInput) (*AuthResult, error) {
	existing, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, ErrEmailTaken
	}

	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: hash,
	}

	if err := s.userRepo.Create(user); err != nil {
		// Handle duplicate key race condition
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}

	token, err := utils.GenerateJWT(user.ID.Hex(), user.Email)
	if err != nil {
		return nil, err
	}

	log.Printf("[Auth] User signed up: %s", user.Email)
	return &AuthResult{User: user, Token: token}, nil
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCreds
	}

	if !utils.CheckPasswordHash(input.Password, user.PasswordHash) {
		return nil, ErrInvalidCreds
	}

	token, err := utils.GenerateJWT(user.ID.Hex(), user.Email)
	if err != nil {
		return nil, err
	}

	log.Printf("[Auth] User logged in: %s", user.Email)
	return &AuthResult{User: user, Token: token}, nil
}

func (s *AuthService) GetUserByID(id string) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}
