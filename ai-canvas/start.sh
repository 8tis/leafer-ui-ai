#!/usr/bin/env bash

# ==============================================================================
# RollDek AI Canvas Studio - Linux / macOS 一键环境安装与启动脚本
# ==============================================================================

set -e

# 定位到脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "================================================================="
echo "   ⚡ RollDek AI Canvas Studio (LeaferJS 无限智能画布)"
echo "   一键自动化环境安装与启动程序 [Linux / macOS]"
echo "================================================================="
echo ""

# 检查本地独立免安装运行时 runtime/node
if [ -f "$SCRIPT_DIR/runtime/node/bin/node" ]; then
    export PATH="$SCRIPT_DIR/runtime/node/bin:$PATH"
fi

# 1. 检查 Node.js 环境
if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  未检测到 Node.js 环境，正在启动全自动免配置静默安装..."
    
    INSTALLED=0

    # 尝试包管理器安装 (如果用户有 sudo 权限)
    if command -v brew >/dev/null 2>&1; then
        echo "检测到 Homebrew，正在自动安装 Node.js..."
        brew install node && INSTALLED=1 || true
    elif [ "$(id -u)" = "0" ] || sudo -n true 2>/dev/null; then
        if command -v apt-get >/dev/null 2>&1; then
            echo "检测到 Debian/Ubuntu 系统，正在自动安装 Node.js..."
            sudo apt-get update -qq && sudo apt-get install -y nodejs npm && INSTALLED=1 || true
        elif command -v yum >/dev/null 2>&1; then
            echo "检测到 RHEL/CentOS 系统，正在自动安装 Node.js..."
            sudo yum install -y nodejs npm && INSTALLED=1 || true
        elif command -v pacman >/dev/null 2>&1; then
            echo "检测到 Arch Linux 系统，正在自动安装 Node.js..."
            sudo pacman -S --noconfirm nodejs npm && INSTALLED=1 || true
        fi
    fi

    # 如果包管理器未能安装 (例如无 sudo 权限)，自动下载官方独立绿色版 Node.js 到本地
    if ! command -v node >/dev/null 2>&1; then
        echo "正在自动下载官方独立绿色版 Node.js LTS 运行环境..."
        mkdir -p "$SCRIPT_DIR/runtime"
        
        OS_TYPE="$(uname -s | tr '[:upper:]' '[:lower:]')"
        ARCH_TYPE="$(uname -m)"

        case "$ARCH_TYPE" in
            x86_64|amd64) NODE_ARCH="x64" ;;
            aarch64|arm64) NODE_ARCH="arm64" ;;
            *) NODE_ARCH="x64" ;;
        esac

        NODE_VER="v20.18.0"
        
        if [ "$OS_TYPE" = "darwin" ]; then
            TAR_NAME="node-${NODE_VER}-darwin-${NODE_ARCH}.tar.gz"
        else
            TAR_NAME="node-${NODE_VER}-linux-${NODE_ARCH}.tar.xz"
        fi

        DL_URL="https://mirrors.aliyun.com/nodejs-release/${NODE_VER}/${TAR_NAME}"
        OFFICIAL_URL="https://nodejs.org/dist/${NODE_VER}/${TAR_NAME}"

        echo "正在高速下载: $TAR_NAME ..."
        curl -f -L -s "$DL_URL" -o "/tmp/$TAR_NAME" || curl -f -L -s "$OFFICIAL_URL" -o "/tmp/$TAR_NAME"

        echo "正在解压运行环境..."
        mkdir -p "/tmp/node_temp"
        if [[ "$TAR_NAME" == *.tar.xz ]]; then
            tar -xf "/tmp/$TAR_NAME" -C "/tmp/node_temp"
        else
            tar -xzf "/tmp/$TAR_NAME" -C "/tmp/node_temp"
        fi

        EXTRACTED_DIR=$(find /tmp/node_temp -maxdepth 1 -mindepth 1 -type d | head -n 1)
        rm -rf "$SCRIPT_DIR/runtime/node"
        mv "$EXTRACTED_DIR" "$SCRIPT_DIR/runtime/node"
        rm -rf "/tmp/node_temp" "/tmp/$TAR_NAME"

        export PATH="$SCRIPT_DIR/runtime/node/bin:$PATH"
    fi
fi

if ! command -v node >/dev/null 2>&1; then
    echo "❌ 自动安装未能完成，请手动安装 Node.js (v16+): https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node -v)
echo "✅ Node.js 运行环境就绪: $NODE_VER"

# 2. 检查项目依赖
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        echo "📦 正在自动初始化项目依赖..."
        npm install --silent || true
    fi
fi

PORT=3002
echo ""
echo "================================================================="
echo "🚀 启动 RollDek AI Canvas 服务 (端口: $PORT)..."
echo "👉 访问地址: http://localhost:$PORT"
echo "👉 提示: 按 Ctrl + C 可随时停止服务"
echo "================================================================="
echo ""

# 自动打开浏览器
if command -v xdg-open >/dev/null 2>&1; then
    (sleep 1.2 && xdg-open "http://localhost:$PORT") >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    (sleep 1.2 && open "http://localhost:$PORT") >/dev/null 2>&1 &
fi

# 启动 Node.js 服务
node server.js
