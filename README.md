# AI Interview Copilot 🚀

An AI-powered platform to help developers ace their interviews — practice mock interviews, analyze resumes, generate cover letters, follow personalized roadmaps, and track DSA progress.

## Project Structure

```
ai-interview-copilot/
├── frontend/    # Next.js 16 + Tailwind CSS (Deployed on Vercel)
├── backend/     # Node.js + Express + Prisma (Deployed on Render)
└── README.md
```

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | Next.js 16, Tailwind CSS, Recharts      |
| Backend      | Node.js, Express, Helmet, Rate Limiting |
| Database     | PostgreSQL (Neon) via Prisma ORM        |
| Auth         | Clerk                                   |
| AI           | Groq (Llama 3.1)                        |
| Storage      | Cloudinary                              |
| Deployment   | Vercel (FE) + Render (BE)               |

## Features

### 🎤 AI Mock Interview
- Choose from preset roles or enter custom roles
- Select question count: **5 / 10 / 15** questions
- Each answer is scored on a **0-10** scale with detailed AI feedback
- View interview results with per-question breakdown

### 📋 Interview History
- Browse all past interviews with date, role, score, and question count
- Filter and search by role
- Click to view detailed results

### 📄 Resume Analyzer
- Upload PDF resume (up to 5MB)
- Get **ATS score** with AI-powered analysis
- Skills detection, strengths, suggestions, and missing keywords

### ✉️ Cover Letter Generator
- AI-tailored cover letters from job descriptions
- Uses your resume data for personalization
- **Copy to clipboard** + **Download as PDF** + **Download as TXT**
- Word count display

### 🗺️ Learning Roadmap
- Generate **3, 6, 9, or 12-month** personalized roadmaps
- Week-by-week topics, resources, and milestones
- **Progress tracking** — mark weeks complete (saved to localStorage)
- Collapsible month sections with overall progress bar
- **Share** roadmap via URL

### 📈 DSA Tracker
- Sync LeetCode progress automatically
- Manual problem logging (name, difficulty, status)
- Visual bar charts for Easy/Medium/Hard breakdown

### 📊 Analytics Dashboard
- Interview score trends (area chart)
- Average, best, and worst score cards
- Role breakdown (donut chart)
- Recent interviews table with score badges
- DSA progress visualization
- Activity feed

### 👤 User Profile
- View account info (from Clerk)
- Quick stats summary
- Sign out and data management

### 🛡️ Security
- **Helmet.js** security headers
- **Rate limiting**: 100 req/15min general, 10 req/15min for AI endpoints
- Input sanitization and validation
- CORS hardened for production

### 🔍 SEO
- Dynamic meta tags (title, description, OpenGraph, Twitter)
- robots.txt and sitemap.xml
- Semantic HTML structure

## Pages

| Route                        | Description                    |
|------------------------------|--------------------------------|
| `/`                          | Public landing page            |
| `/dashboard`                 | Analytics dashboard            |
| `/interview`                 | Start mock interview           |
| `/interview/history`         | Past interview list            |
| `/interview/session/[id]`    | Active interview session       |
| `/interview/results/[id]`    | Interview results & feedback   |
| `/resume`                    | Resume upload & analysis       |
| `/cover-letter`              | AI cover letter generator      |
| `/roadmap`                   | Roadmap generator              |
| `/roadmap/[id]`              | Roadmap detail view            |
| `/dsa`                       | DSA tracker                    |
| `/profile`                   | User profile & settings        |

## API Endpoints

### Interviews
| Method | Endpoint                          | Description                |
|--------|-----------------------------------|----------------------------|
| POST   | `/api/interviews/start`           | Start interview (AI-limited) |
| POST   | `/api/interviews/answer`          | Submit answer for scoring  |
| GET    | `/api/interviews/:id`             | Get interview details      |
| GET    | `/api/interviews/user/:id/all`    | Get all user interviews    |

**POST /api/interviews/start** body:
```json
{
  "jobRole": "Software Engineer",
  "questionCount": 10  // optional: 5 | 10 | 15 (default: 5)
}
```

### Users
| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| POST   | `/api/users`            | Create user           |
| GET    | `/api/users/:id`        | Get user with data    |
| GET    | `/api/users/:id/stats`  | Get analytics stats   |

### Roadmaps
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | `/api/roadmaps/generate`     | Generate roadmap (AI)    |
| GET    | `/api/roadmaps/:id`          | Get roadmap detail       |
| GET    | `/api/roadmaps/user/:id`     | Get user's roadmaps      |

**POST /api/roadmaps/generate** body:
```json
{
  "jobRole": "Data Scientist",
  "duration": 6  // optional: 3 | 6 | 9 | 12 months (default: 3)
}
```

### Resume
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/resume/upload`        | Upload resume PDF        |
| POST   | `/api/resume/analyze/:id`   | Analyze resume (AI)      |

### Cover Letter
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/cover-letter/generate`  | Generate cover letter    |

### DSA
| Method | Endpoint                 | Description              |
|--------|--------------------------|--------------------------|
| GET    | `/api/dsa/user/:id`      | Get DSA stats            |
| POST   | `/api/dsa/sync`          | Sync LeetCode progress   |

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- PostgreSQL database (Neon recommended)
- [Clerk](https://clerk.com) account
- [Groq](https://console.groq.com) API key (free)
- [Cloudinary](https://cloudinary.com) account

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-repo/ai-interview-copilot.git
cd ai-interview-copilot

# 2. Backend setup
cd backend
cp .env.example .env  # Fill in your values
npm install
npx prisma generate
npx prisma db push
node index.js

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env.local  # Fill in your values
npm install
npm run dev
```

### Environment Variables

**Backend** (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `GROQ_API_KEY` — Groq AI API key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` — Frontend origin (for CORS)
- `PORT` — Server port (default: 5000)

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- `NEXT_PUBLIC_API_URL` — Backend URL (default: http://localhost:5000)

## Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import in Vercel
3. Set env vars from `.env.example`
4. Deploy

### Backend → Render
1. Create Web Service
2. Set build: `npm install`, start: `node index.js`
3. Set env vars from `.env.example`
4. Deploy

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0   | Initial release — Interview, Resume, Roadmap, DSA, Cover Letter |
| 1.1.0   | Configurable question count (5/10/15), Roadmap duration (3-12mo) |
| 1.2.0   | Dashboard analytics, Interview history, Profile page, Landing page, SEO, Security hardening |

---

Built with ❤️ for developers preparing for their dream jobs.
