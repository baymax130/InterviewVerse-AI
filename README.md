# InterviewVerse AI

**AI-powered interview preparation platform** built with React, Flask, and IBM watsonx.ai Granite.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- IBM watsonx.ai account (for AI features)

---

### Backend Setup

```bash
cd interviewverse/backend

# 1. Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env and fill in your IBM credentials:
# IBM_API_KEY, IBM_PROJECT_ID, IBM_URL, IBM_MODEL_ID, JWT_SECRET

# 4. Start the server
python app.py
```

Backend runs at: http://localhost:5000

---

### Frontend Setup

```bash
cd interviewverse/frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🔑 IBM watsonx.ai Setup

1. Create an account at https://cloud.ibm.com
2. Provision **watsonx.ai** service
3. Create a project and note the **Project ID**
4. Generate an **API key** from IAM
5. Set these in your `.env` file:

```
IBM_API_KEY=your_api_key
IBM_PROJECT_ID=your_project_id
IBM_URL=https://us-south.ml.cloud.ibm.com
IBM_MODEL_ID=ibm/granite-13b-chat-v2
```

> The app works without IBM credentials using intelligent fallback responses.

---

## 📁 Project Structure

```
interviewverse/
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── requirements.txt
│   ├── models/                   # SQLAlchemy ORM models
│   ├── controllers/              # Business logic
│   ├── routes/                   # API route definitions
│   └── services/
│       ├── watsonx_service.py    # IBM Granite AI integration
│       └── report_service.py     # PDF report generation
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/                # All page components
    │   ├── components/           # Reusable components
    │   ├── context/              # React Context (Auth)
    │   └── services/             # API service layer
    └── package.json
```

---

## 🎯 Features

| Feature | Status |
|---|---|
| 🤖 IBM Granite AI Interviews | ✅ |
| 6 Interview Modes | ✅ |
| 25+ Role-Specific Questions | ✅ |
| Real-time AI Evaluation | ✅ |
| Adaptive Difficulty | ✅ |
| PDF Report Download | ✅ |
| Analytics Dashboard | ✅ |
| XP / Levels / Achievements | ✅ |
| Daily Streak Tracking | ✅ |
| Leaderboard | ✅ |
| User Profile | ✅ |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: Flask, Flask-JWT-Extended, SQLAlchemy, bcrypt
- **AI**: IBM watsonx.ai (Granite-13B)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Reports**: ReportLab (PDF)

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/:id/submit` | Submit answer + get AI evaluation |
| GET  | `/api/interview/:id/report` | Get final report |
| GET  | `/api/interview/:id/report/pdf` | Download PDF |
| GET  | `/api/dashboard/` | Dashboard data |
| GET  | `/api/dashboard/analytics` | Analytics data |
| GET  | `/api/profile/` | User profile |
| PUT  | `/api/profile/` | Update profile |
| GET  | `/api/profile/leaderboard` | Leaderboard |

---

Built with ❤️ using IBM watsonx.ai | Final Year Engineering Project
