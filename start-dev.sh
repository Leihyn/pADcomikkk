#!/bin/bash

# Comic Pad Development Startup Script
echo "🚀 Starting Comic Pad Development Environment..."

# Function to start backend
start_backend() {
    echo "📡 Starting Backend Server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

# Start both services
start_backend
sleep 3
start_frontend

echo ""
echo "✅ Comic Pad is now running!"
echo "📡 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
