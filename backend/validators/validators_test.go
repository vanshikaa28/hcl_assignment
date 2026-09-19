package validators_test

import (
	"testing"

	"pulsepoll/validators"
)

func TestSignupValidation(t *testing.T) {
	tests := []struct {
		name    string
		req     validators.SignupRequest
		wantErr bool
	}{
		{
			name: "valid signup",
			req: validators.SignupRequest{
				Name:     "Alice Smith",
				Email:    "alice@example.com",
				Password: "password123",
			},
			wantErr: false,
		},
		{
			name: "short password",
			req: validators.SignupRequest{
				Name:     "Alice Smith",
				Email:    "alice@example.com",
				Password: "short",
			},
			wantErr: true,
		},
		{
			name: "invalid email",
			req: validators.SignupRequest{
				Name:     "Alice Smith",
				Email:    "invalid-email",
				Password: "password123",
			},
			wantErr: true,
		},
		{
			name: "short name",
			req: validators.SignupRequest{
				Name:     "A",
				Email:    "alice@example.com",
				Password: "password123",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestPollValidation(t *testing.T) {
	tests := []struct {
		name    string
		req     validators.CreatePollRequest
		wantErr bool
	}{
		{
			name: "valid poll with 3 options",
			req: validators.CreatePollRequest{
				Title:       "What is your favorite cloud provider?",
				Description: "Select one below",
				Options: []validators.PollOptionRequest{
					{Text: "AWS"},
					{Text: "GCP"},
					{Text: "Azure"},
				},
			},
			wantErr: false,
		},
		{
			name: "too few options",
			req: validators.CreatePollRequest{
				Title: "What is your favorite cloud provider?",
				Options: []validators.PollOptionRequest{
					{Text: "Only One"},
				},
			},
			wantErr: true,
		},
		{
			name: "duplicate options",
			req: validators.CreatePollRequest{
				Title: "What is your favorite cloud provider?",
				Options: []validators.PollOptionRequest{
					{Text: "Option A"},
					{Text: "Option A"},
				},
			},
			wantErr: true,
		},
		{
			name: "short title",
			req: validators.CreatePollRequest{
				Title: "Hi",
				Options: []validators.PollOptionRequest{
					{Text: "Yes"},
					{Text: "No"},
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestVoteValidation(t *testing.T) {
	tests := []struct {
		name    string
		req     validators.CastVoteRequest
		wantErr bool
	}{
		{
			name: "valid vote",
			req: validators.CastVoteRequest{
				OptionID:   "golang",
				VoterToken: "abcdef1234567890",
			},
			wantErr: false,
		},
		{
			name: "missing voter token",
			req: validators.CastVoteRequest{
				OptionID:   "golang",
				VoterToken: "",
			},
			wantErr: true,
		},
		{
			name: "missing option id",
			req: validators.CastVoteRequest{
				OptionID:   "",
				VoterToken: "abcdef1234567890",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
