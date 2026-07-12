@echo off
echo ====================================
echo  InterviewVerse AI - Backend Setup
echo ====================================
cd backend
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
)
call venv\Scripts\activate
pip install -r requirements.txt
if not exist .env (
    copy .env.example .env
    echo .env file created. Please edit it with your IBM credentials.
)
echo Starting Flask server...
python app.py
