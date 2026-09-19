package repositories

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"pulsepoll/models"
)

type VoteRepository struct {
	collection *mongo.Collection
}

func NewVoteRepository(db *mongo.Database) *VoteRepository {
	repo := &VoteRepository{collection: db.Collection("votes")}
	repo.createIndexes()
	return repo
}

func (r *VoteRepository) createIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Unique compound index: one vote per voterToken per poll
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "pollId", Value: 1}, {Key: "voterToken", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	_, _ = r.collection.Indexes().CreateOne(ctx, indexModel)
}

func (r *VoteRepository) Create(vote *models.Vote) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	vote.ID = primitive.NewObjectID()
	vote.CreatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, vote)
	return err
}

func (r *VoteRepository) HasVoted(pollID primitive.ObjectID, voterToken string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{
		"pollId":     pollID,
		"voterToken": voterToken,
	})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *VoteRepository) CountByPoll(pollID primitive.ObjectID) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return r.collection.CountDocuments(ctx, bson.M{"pollId": pollID})
}

func (r *VoteRepository) CountByOption(pollID primitive.ObjectID) (map[string]int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"pollId": pollID}}},
		{{Key: "$group", Value: bson.M{"_id": "$optionId", "count": bson.M{"$sum": 1}}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	result := make(map[string]int64)
	var items []struct {
		ID    string `bson:"_id"`
		Count int64  `bson:"count"`
	}
	if err = cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	for _, item := range items {
		result[item.ID] = item.Count
	}
	return result, nil
}

func (r *VoteRepository) DeleteByPollID(pollID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := r.collection.DeleteMany(ctx, bson.M{"pollId": pollID})
	return err
}
