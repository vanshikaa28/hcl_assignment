import { api } from "./api"
import { getVoterToken } from "@/utils/helpers"

export interface PollOption {
  id: string
  text: string
}

export interface Poll {
  id: string
  creatorId: string
  title: string
  description: string
  options: PollOption[]
  shareCode: string
  status: "active" | "closed"
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

export interface PollResults {
  type: string
  pollId: string
  counts: Record<string, number>
  totalVotes: number
  timestamp: string
}

export interface CreatePollData {
  title: string
  description: string
  options: { text: string }[]
}

export const pollService = {
  // Creator (authenticated)
  async create(data: CreatePollData): Promise<Poll> {
    return api.post<Poll>("/polls", data, true)
  },

  async list(): Promise<Poll[]> {
    return api.get<Poll[]>("/polls", true)
  },

  async getById(id: string): Promise<Poll> {
    return api.get<Poll>(`/polls/${id}`, true)
  },

  async update(id: string, data: Partial<Pick<Poll, "title" | "description">>): Promise<Poll> {
    return api.patch<Poll>(`/polls/${id}`, data, true)
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/polls/${id}`, true)
  },

  async close(id: string): Promise<Poll> {
    return api.post<Poll>(`/polls/${id}/close`, {}, true)
  },

  async getResults(id: string): Promise<PollResults> {
    return api.get<PollResults>(`/polls/${id}/results`, true)
  },

  // Public (no auth)
  async getPublic(shareCode: string): Promise<Poll> {
    return api.get<Poll>(`/public/polls/${shareCode}`)
  },

  async getPublicResults(shareCode: string): Promise<PollResults> {
    return api.get<PollResults>(`/public/polls/${shareCode}/results`)
  },

  async vote(pollId: string, optionId: string): Promise<PollResults> {
    const voterToken = getVoterToken()
    return api.post<PollResults>(`/polls/${pollId}/votes`, {
      optionId,
      voterToken,
    })
  },
}
