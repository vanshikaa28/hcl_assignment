package utils_test

import (
	"testing"

	"pulsepoll/config"
	"pulsepoll/utils"
)

func TestPasswordHashing(t *testing.T) {
	password := "SecretP@ssw0rd123!"

	hash, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == password {
		t.Errorf("Hash should not equal raw password")
	}

	if !utils.CheckPasswordHash(password, hash) {
		t.Errorf("Password verification failed for correct password")
	}

	if utils.CheckPasswordHash("wrongpassword", hash) {
		t.Errorf("Password verification should have failed for incorrect password")
	}
}

func TestJWTGenerationAndValidation(t *testing.T) {
	config.AppConfig = &config.Config{
		JWTSecret: "test-secret-key-at-least-32-chars-long",
	}

	userID := "65f0123456789abcdef01234"
	email := "user@example.com"

	token, err := utils.GenerateJWT(userID, email)
	if err != nil {
		t.Fatalf("Failed to generate JWT: %v", err)
	}

	if token == "" {
		t.Errorf("Token should not be empty")
	}

	claims, err := utils.ValidateJWT(token)
	if err != nil {
		t.Fatalf("Failed to validate JWT: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("Expected Email %s, got %s", email, claims.Email)
	}
}

func TestGenerateShareCode(t *testing.T) {
	code1 := utils.GenerateShareCode(8)
	code2 := utils.GenerateShareCode(8)

	if len(code1) != 8 || len(code2) != 8 {
		t.Errorf("Expected length 8, got len(code1)=%d, len(code2)=%d", len(code1), len(code2))
	}

	if code1 == code2 {
		t.Errorf("Subsequent share codes should be distinct")
	}
}
