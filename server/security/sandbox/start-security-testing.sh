#!/bin/bash
echo "Starting Overlook Security Testing Environment..."
cd "$(dirname "$0")"
docker-compose up -d
echo "Services starting... Please wait 30 seconds for full initialization."
