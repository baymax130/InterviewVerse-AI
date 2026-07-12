#!/bin/bash
echo "======================================"
echo " InterviewVerse AI - Frontend"
echo "======================================"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm run dev
