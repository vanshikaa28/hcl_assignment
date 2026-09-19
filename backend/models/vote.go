package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID     primitive.ObjectID `bson:"pollId" json:"pollId"`
	OptionID   string             `bson:"optionId" json:"optionId"`
	VoterToken string             `bson:"voterToken" json:"voterToken"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}
