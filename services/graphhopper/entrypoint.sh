#!/bin/sh
set -e

echo "Starting GraphHopper..."
echo "Java Options: $JAVA_OPTS"
echo "Working Directory: $(pwd)"
echo "Files in data directory:"
ls -la /graphhopper/data/

# GraphHopperを起動
exec java $JAVA_OPTS -jar graphhopper.jar server config.yml