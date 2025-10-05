#!/bin/bash
echo "Stopping Overlook Security Testing Environment..."
cd "$(dirname "$0")"
docker-compose down
echo "Services stopped."
