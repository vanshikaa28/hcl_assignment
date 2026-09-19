# 🚀 Deployment Guide for PulsePoll

This guide covers deploying **PulsePoll** to production:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend (Go + WebSockets)**: [Render](https://render.com) or [Railway](https://railway.app)
- **Databases**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Free) & [Upstash Redis](https://upstash.com) or [Redis Cloud](https://redis.com)

---

## Part 1: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
2. Select your repository: `vanshikaa28/hcl_assignment`.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(or leave as `./` — root `vercel.json` will handle it)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   Add the following environment variables:
   | Key | Example Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api/v1` | Production Go REST API URL |
   | `VITE_WS_URL` | `wss://your-backend.onrender.com` | Production WebSocket URL (`wss://`) |
5. Click **"Deploy"**.

---

## Part 2: Deploy Go Backend (Render / Railway)

Because PulsePoll uses persistent WebSockets and Redis Pub/Sub subscribers, the Go backend should be deployed to a platform that supports continuous long-running services:

### Deploying on Render (Free / Cheap)
1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect your `vanshikaa28/hcl_assignment` GitHub repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: `Go`
   - **Build Command**: `go build -o server cmd/server/main.go`
   - **Start Command**: `./server`
4. Set Environment Variables in Render:
   | Key | Example / Description |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/pulsepoll?retryWrites=true&w=majority` |
   | `REDIS_URL` | `rediss://default:pass@your-redis-host:6379` |
   | `JWT_SECRET` | `your-secure-random-jwt-secret-key-32-chars` |
   | `PORT` | `8080` |
   | `FRONTEND_URL` | `https://your-app.vercel.app` *(allows CORS from your Vercel URL)* |
   | `APP_ENV` | `production` |

---

## Part 3: Free Cloud Databases

1. **MongoDB**: Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). Copy the Connection URI.
2. **Redis**: Create a free Redis instance on [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com). Copy the Redis Connection URL.

Once deployed, update `FRONTEND_URL` on Render and `VITE_API_URL` / `VITE_WS_URL` on Vercel to connect the two!
