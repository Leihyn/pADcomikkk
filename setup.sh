#!/bin/bash

# Comic Pad Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Comic Pad Development Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "npm $(npm -v) is installed"
}

# Install backend dependencies
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in backend directory"
        exit 1
    fi
    
    print_info "Installing backend dependencies..."
    npm install
    
    if [ ! -f .env ]; then
        print_warning "Creating .env file from template..."
        cp env.example .env
        print_warning "Please update .env with your actual credentials"
    fi
    
    print_status "Backend setup complete"
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    print_info "Installing frontend dependencies..."
    npm install
    
    print_status "Frontend setup complete"
    cd ..
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p frontend/public/images
    mkdir -p scripts
    
    print_status "Directories created"
}

# Setup environment files
setup_environment() {
    print_info "Setting up environment files..."
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
# Comic Pad Backend Environment Variables

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_PUBLIC_KEY=302a300506032b6570032100...

# IPFS Configuration
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
WEB3_STORAGE_TOKEN=your_web3_storage_token

# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/comicpad

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf,application/zip

# Comic Reader Configuration
MAX_PAGES_PER_COMIC=100
THUMBNAIL_SIZE=400x600
WEB_SIZE=1200x1800
PRINT_SIZE=2048x3072

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=250
CREATOR_ROYALTY_PERCENTAGE=1000
MAX_COMIC_SIZE_MB=50
EOF
        print_warning "Created backend/.env - Please update with your credentials"
    fi
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_HEDERA_NETWORK=testnet
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
EOF
        print_status "Created frontend/.env"
    fi
}

# Create startup scripts
create_scripts() {
    print_info "Creating startup scripts..."
    
    # Start development script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Comic Pad Development Environment"

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
EOF

    chmod +x start-dev.sh
    
    # Test script
    cat > test-all.sh << 'EOF'
#!/bin/bash
echo "🧪 Running Comic Pad Test Suite"

# Test backend
echo "Testing backend..."
cd backend && npm test

# Test frontend
echo "Testing frontend..."
cd ../frontend && npm test

echo "✅ All tests completed"
EOF

    chmod +x test-all.sh
    
    print_status "Startup scripts created"
}

# Run basic tests
run_tests() {
    print_info "Running basic tests..."
    
    # Test backend startup
    cd backend
    timeout 10s npm run dev > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 3
    
    # Test API health
    if curl -s http://localhost:3001/health > /dev/null; then
        print_status "Backend API is responding"
    else
        print_warning "Backend API test failed (may need configuration)"
    fi
    
    # Kill backend process
    kill $BACKEND_PID 2>/dev/null || true
    cd ..
    
    print_status "Basic tests completed"
}

# Main setup function
main() {
    echo ""
    print_info "Starting Comic Pad setup..."
    echo ""
    
    check_node
    check_npm
    create_directories
    setup_environment
    setup_backend
    setup_frontend
    create_scripts
    run_tests
    
    echo ""
    print_status "Comic Pad setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your Hedera and IPFS credentials"
    echo "2. Run './start-dev.sh' to start the development servers"
    echo "3. Visit http://localhost:3000 to see the application"
    echo ""
    echo "Available scripts:"
    echo "  ./start-dev.sh  - Start development servers"
    echo "  ./test-all.sh   - Run all tests"
    echo ""
    print_warning "Don't forget to configure your environment variables!"
}

# Run main function
main "$@"
