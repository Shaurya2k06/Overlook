#!/bin/bash

# Overlook Security Suite Server Startup Script
# This script helps start the server safely by handling port conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_PORT=3003
BACKUP_PORT=3004
SERVER_DIR="server"
LOG_FILE="server.log"

echo -e "${BLUE}=== Overlook Security Suite Server Startup ===${NC}"
echo

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port_process() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"

    # Get PID of process using the port
    local pid=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)

    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null && echo -e "${GREEN}Process $pid killed successfully${NC}" || echo -e "${RED}Failed to kill process $pid${NC}"
        sleep 2
    fi
}

# Check if we're in the right directory
if [ ! -d "$SERVER_DIR" ]; then
    echo -e "${RED}Error: Server directory not found. Make sure you're in the Overlook project root.${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$SERVER_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in server directory.${NC}"
    exit 1
fi

# Change to server directory
cd $SERVER_DIR

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check primary port
if check_port $SERVER_PORT; then
    echo -e "${YELLOW}Port $SERVER_PORT is already in use${NC}"

    # Ask user what to do
    echo "What would you like to do?"
    echo "1) Kill the process and start on port $SERVER_PORT"
    echo "2) Start on backup port $BACKUP_PORT"
    echo "3) Exit"
    read -p "Enter your choice (1-3): " choice

    case $choice in
        1)
            kill_port_process $SERVER_PORT
            if check_port $SERVER_PORT; then
                echo -e "${RED}Failed to free port $SERVER_PORT${NC}"
                exit 1
            fi
            ;;
        2)
            if check_port $BACKUP_PORT; then
                echo -e "${RED}Backup port $BACKUP_PORT is also in use${NC}"
                kill_port_process $BACKUP_PORT
                if check_port $BACKUP_PORT; then
                    echo -e "${RED}Failed to free backup port $BACKUP_PORT${NC}"
                    exit 1
                fi
            fi
            export PORT=$BACKUP_PORT
            echo -e "${YELLOW}Starting server on backup port $BACKUP_PORT${NC}"
            ;;
        3)
            echo -e "${YELLOW}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${GREEN}Port $SERVER_PORT is available${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating a basic one...${NC}"
    cat > .env << EOF
PORT=${PORT:-$SERVER_PORT}
NODE_ENV=development
URL=mongodb://localhost:27017/overlook
JWT_SECRET=your-jwt-secret-here
EOF
    echo -e "${GREEN}.env file created. Please update it with your actual values.${NC}"
fi

# Start the server
echo -e "${GREEN}Starting Overlook server...${NC}"
echo -e "${BLUE}Server will be available at: http://localhost:${PORT:-$SERVER_PORT}${NC}"
echo -e "${BLUE}Security suite endpoints: http://localhost:${PORT:-$SERVER_PORT}/api/security${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo

# Create log file if it doesn't exist
touch $LOG_FILE

# Start server with logging
npm start 2>&1 | tee $LOG_FILE
