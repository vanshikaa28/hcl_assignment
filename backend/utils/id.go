package utils

import (
	"math/rand"
	"strings"
)

const shareCodeChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateShareCode(length int) string {
	sb := strings.Builder{}
	sb.Grow(length)
	for i := 0; i < length; i++ {
		sb.WriteByte(shareCodeChars[rand.Intn(len(shareCodeChars))])
	}
	return sb.String()
}
