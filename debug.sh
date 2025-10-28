#!/bin/bash

# Comic Pad Debug Script
# This script helps debug common issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if services are running
check_services() {
    print_info "Checking running services..."
    
    # Check if backend is running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend API is running on port 3001"
    else
        print_error "Backend API is not running on port 3001"
        print_info "Start it with: cd backend && npm run dev"
    fi
    
    # Check if frontend is running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is running on port 3000"
    else
        print_error "Frontend is not running on port 3000"
        print_info "Start it with: cd frontend && npm run dev"
    fi
}

# Check environment configuration
check_environment() {
    print_info "Checking environment configuration..."
    
    # Check backend .env
    if [ -f backend/.env ]; then
        print_status "Backend .env file exists"
        
        # Check required variables
        if grep -q "HEDERA_ACCOUNT_ID=0.0.123456" backend/.env; then
            print_warning "HEDERA_ACCOUNT_ID is using default value"
        fi
        
        if grep -q "HEDERA_PRIVATE_KEY=302e020100300506032b657004220420..." backend/.env; then
            print_warning "HEDERA_PRIVATE_KEY is using default value"
        fi
        
        if grep -q "PINATA_API_KEY=your_pinata_api_key" backend/.env; then
            print_warning "PINATA_API_KEY is using default value"
        fi
    else
        print_error "Backend .env file not found"
        print_info "Create it with: cp backend/env.example backend/.env"
    fi
    
    # Check frontend .env
    if [ -f frontend/.env ]; then
        print_status "Frontend .env file exists"
    else
        print_warning "Frontend .env file not found"
        print_info "Create it with: cp frontend/env.example frontend/.env"
    fi
}

# Check dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check backend dependencies
    if [ -d backend/node_modules ]; then
        print_status "Backend dependencies installed"
    else
        print_error "Backend dependencies not installed"
        print_info "Install with: cd backend && npm install"
    fi
    
    # Check frontend dependencies
    if [ -d frontend/node_modules ]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Frontend dependencies not installed"
        print_info "Install with: cd frontend && npm install"
    fi
}

# Test API endpoints
test_api() {
    print_info "Testing API endpoints..."
    
    local base_url="http://localhost:3001"
    
    # Test health endpoint
    if curl -s "$base_url/health" | grep -q "OK"; then
        print_status "Health endpoint working"
    else
        print_error "Health endpoint failed"
    fi
    
    # Test comics search
    if curl -s "$base_url/api/comics/search" | grep -q "success"; then
        print_status "Comics search endpoint working"
    else
        print_warning "Comics search endpoint may have issues"
    fi
    
    # Test marketplace stats
    if curl -s "$base_url/api/marketplace/stats" | grep -q "success"; then
        print_status "Marketplace stats endpoint working"
    else
        print_warning "Marketplace stats endpoint may have issues"
    fi
}

# Check logs for errors
check_logs() {
    print_info "Checking for errors in logs..."
    
    # Check if backend logs exist
    if [ -f backend/logs/error.log ]; then
        local error_count=$(wc -l < backend/logs/error.log)
        if [ "$error_count" -gt 0 ]; then
            print_warning "Found $error_count errors in backend logs"
            print_info "Recent errors:"
            tail -5 backend/logs/error.log
        else
            print_status "No errors in backend logs"
        fi
    else
        print_info "No backend error logs found"
    fi
}

# Test Hedera connection
test_hedera() {
    print_info "Testing Hedera connection..."
    
    cd backend
    if node -e "
        const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');
        const client = Client.forName('testnet');
        const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || '0.0.123456');
        const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || '302e020100300506032b657004220420...');
        client.setOperator(accountId, privateKey);
        console.log('Hedera client initialized successfully');
    " 2>/dev/null; then
        print_status "Hedera connection test passed"
    else
        print_error "Hedera connection test failed"
        print_info "Check your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env"
    fi
    cd ..
}

# Test IPFS connection
test_ipfs() {
    print_info "Testing IPFS connection..."
    
    cd backend
    if node -e "
        const axios = require('axios');
        const pinataApiKey = process.env.PINATA_API_KEY;
        if (pinataApiKey && pinataApiKey !== 'your_pinata_api_key') {
            axios.get('https://api.pinata.cloud/data/testAuthentication', {
                headers: { 'pinata_api_key': pinataApiKey }
            }).then(() => console.log('IPFS connection test passed'))
            .catch(() => console.log('IPFS connection test failed'));
        } else {
            console.log('IPFS not configured');
        }
    " 2>/dev/null; then
        print_status "IPFS connection test completed"
    else
        print_warning "IPFS connection test failed or not configured"
    fi
    cd ..
}

# Check port availability
check_ports() {
    print_info "Checking port availability..."
    
    # Check port 3001 (backend)
    if lsof -i :3001 > /dev/null 2>&1; then
        print_status "Port 3001 is in use (backend running)"
    else
        print_warning "Port 3001 is available (backend not running)"
    fi
    
    # Check port 3000 (frontend)
    if lsof -i :3000 > /dev/null 2>&1; then
        print_status "Port 3000 is in use (frontend running)"
    else
        print_warning "Port 3000 is available (frontend not running)"
    fi
}

# Generate debug report
generate_report() {
    print_info "Generating debug report..."
    
    local report_file="debug-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Comic Pad Debug Report"
        echo "Generated: $(date)"
        echo "================================"
        echo ""
        
        echo "System Information:"
        echo "OS: $(uname -s)"
        echo "Node.js: $(node -v 2>/dev/null || echo 'Not installed')"
        echo "npm: $(npm -v 2>/dev/null || echo 'Not installed')"
        echo ""
        
        echo "Service Status:"
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "Backend: Running"
        else
            echo "Backend: Not running"
        fi
        
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "Frontend: Running"
        else
            echo "Frontend: Not running"
        fi
        echo ""
        
        echo "Environment Files:"
        echo "Backend .env: $([ -f backend/.env ] && echo 'Exists' || echo 'Missing')"
        echo "Frontend .env: $([ -f frontend/.env ] && echo 'Exists' || echo 'Missing')"
        echo ""
        
        echo "Dependencies:"
        echo "Backend node_modules: $([ -d backend/node_modules ] && echo 'Installed' || echo 'Missing')"
        echo "Frontend node_modules: $([ -d frontend/node_modules ] && echo 'Installed' || echo 'Missing')"
        echo ""
        
        echo "Port Usage:"
        lsof -i :3000 -i :3001 2>/dev/null || echo "No processes found on ports 3000/3001"
        
    } > "$report_file"
    
    print_status "Debug report saved to $report_file"
}

# Main debug function
main() {
    echo "🔍 Comic Pad Debug Tool"
    echo "======================="
    echo ""
    
    check_services
    echo ""
    check_environment
    echo ""
    check_dependencies
    echo ""
    check_ports
    echo ""
    test_api
    echo ""
    test_hedera
    echo ""
    test_ipfs
    echo ""
    check_logs
    echo ""
    generate_report
    
    echo ""
    print_info "Debug check complete!"
    echo ""
    echo "Common fixes:"
    echo "1. Install dependencies: npm install (in both backend and frontend)"
    echo "2. Configure environment: Update .env files with real credentials"
    echo "3. Start services: ./start-dev.sh"
    echo "4. Check logs: tail -f backend/logs/error.log"
}

# Run main function
main "$@"
