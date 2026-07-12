#!/bin/bash
echo "======================================"
echo " InterviewVerse AI - Backend Setup"
echo "======================================"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
fi
source venv/bin/activate
pip install -r requirements.txt
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ".env created. Edit it with your IBM credentials."
fi
echo "Starting Flask server..."
python app.py
