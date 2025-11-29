#!/bin/bash
# Development startup script for Aura Ride App
# Starts backend and frontend with proper configuration

set -e

echo "🚀 Starting Aura Development Environment..."

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill 2>/dev/null || true
lsof -ti:8097 | xargs kill 2>/dev/null || true
sleep 1

# Start backend
echo "📦 Starting Backend API Server on port 3001..."
cd "$(dirname "$0")/../backend"
node server.js > logs/stdout.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  sleep 1
done

# Register test user
echo "👤 Registering test user..."
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123!", "firstName": "Test", "lastName": "User", "phone": "+1234567890"}' > /dev/null 2>&1 || true

echo ""
echo "=========================================="
echo "✅ Development Environment Ready!"
echo "=========================================="
echo ""
echo "Backend API:  http://localhost:3001"
echo "Health Check: http://localhost:3001/health"
echo ""
echo "Test Credentials:"
echo "  Email:    test@example.com"
echo "  Password: Password123!"
echo ""
echo "To start frontend, run:"
echo "  cd $(dirname "$0")/.."
echo "  npx expo start --web --port 8097"
echo ""
echo "Backend logs: backend/logs/stdout.log"
echo ""
