#!/bin/bash
set -e

echo "=== Building Docker image locally ==="
docker build -f apps/web/Dockerfile.apprunner.fixed -t graphhopper-frontend-test .

echo -e "\n=== Running container locally ==="
docker run -it --rm \
  -p 3000:3000 \
  -e PUBLIC_GRAPHHOPPER_URL=https://22fxfc9i7z.ap-northeast-1.awsapprunner.com \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e NODE_ENV=production \
  graphhopper-frontend-test

# 別のターミナルで以下を実行してヘルスチェック:
# curl http://localhost:3000/