@echo off
echo =====================================
echo  InterviewVerse AI - Frontend Setup
echo =====================================
cd frontend
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting Vite dev server...
npm run dev
