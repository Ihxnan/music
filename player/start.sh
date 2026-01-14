#!/bin/bash

# 音乐播放器启动脚本

echo "正在启动音乐播放器..."

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 启动服务器
cd "$SCRIPT_DIR"
python3 server.py