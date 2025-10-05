#!/bin/bash
echo "Overlook Security Testing Environment Status:"
cd "$(dirname "$0")"
docker-compose ps
