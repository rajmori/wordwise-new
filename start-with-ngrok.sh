#!/bin/bash

echo "🚀 Starting WordWise with ngrok for webhook testing..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null
then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Install ngrok:"
    echo "  macOS: brew install ngrok"
    echo "  Or download from: https://ngrok.com/download"
    echo ""
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend might not be ready yet, but continuing..."
fi

echo ""
echo "✅ Backend started on http://localhost:3000"
echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY THE HTTPS URL FROM BELOW AND USE IT IN RAZORPAY DASHBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Webhook URL format:"
echo "  https://YOUR-NGROK-URL.ngrok-free.app/api/subscriptions/webhook"
echo ""
echo "ngrok Web Interface: http://127.0.0.1:4040"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start ngrok (this will run in foreground)
ngrok http 3000

# This line will only be reached if ngrok exits
cleanup

