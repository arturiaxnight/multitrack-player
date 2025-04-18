#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# 您可以修改這些變數
IMAGE_NAME="multitrack-player"  # Docker 映像檔的名稱
CONTAINER_NAME="heart-of-worship" # Docker 容器的名稱
HOST_PORT=30008 # 您想在主機上用哪個 Port 來存取應用程式 (例如 80, 8080)

# --- Script ---
echo ">>> Building Docker image: $IMAGE_NAME..."
# 建置 Docker 映像檔，使用當前目錄的 Dockerfile
docker build -t "$IMAGE_NAME" .

echo ">>> Stopping and removing existing container (if any): $CONTAINER_NAME..."
# 停止同名的舊容器 (如果存在)，忽略錯誤 (|| true)
docker stop "$CONTAINER_NAME" || true
# 移除同名的舊容器 (如果存在)，忽略錯誤 (|| true)
docker rm "$CONTAINER_NAME" || true

echo ">>> Running new container: $CONTAINER_NAME on host port $HOST_PORT..."
# 運行新的 Docker 容器
# -d: 在背景執行 (detached mode)
# -p: 將主機的 Port (HOST_PORT) 映射到容器的 Port 3000 (Next.js 預設)
# --name: 指定容器的名稱
# --restart always: 讓容器在退出或 Docker 重新啟動時自動重啟
docker run -d -p "$HOST_PORT":3000 --name "$CONTAINER_NAME" --restart always "$IMAGE_NAME"

echo ">>> Deployment complete!"
echo ">>> Application should be accessible at http://<your-server-ip>:$HOST_PORT (or http://localhost:$HOST_PORT if running locally)"

exit 0 