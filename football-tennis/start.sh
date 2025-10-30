#!/bin/bash
# Start both backend and frontend servers

echo "🎾 Starting Football Knowledge Tennis..."
echo ""

# Check if data has been imported
cd backend
if [ ! -f ".env" ]; then
    echo "❌ Backend .env not found! Run ./setup.sh first"
    exit 1
fi

echo "Starting backend server on http://localhost:3000"
npm run dev &
BACKEND_PID=$!

cd ../frontend
echo "Starting frontend server on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers running!"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
