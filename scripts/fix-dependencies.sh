#!/bin/bash

# 修复依赖问题的脚本

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 修复 Dewu Mock API 依赖问题${NC}"
echo -e "${BLUE}================================${NC}"

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
echo -e "Node.js 版本: ${GREEN}$NODE_VERSION${NC}"

# 清理现有依赖
echo -e "${YELLOW}🧹 清理现有依赖...${NC}"
rm -rf node_modules package-lock.json

# 清理构建缓存
echo -e "${YELLOW}🗑️  清理构建缓存...${NC}"
rm -rf dist .vite

# 重新安装依赖
echo -e "${YELLOW}📦 重新安装依赖...${NC}"
npm install

# 验证安装
echo -e "${YELLOW}✅ 验证安装...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

# 测试构建
echo -e "${YELLOW}🔨 测试构建...${NC}"
npm run build:server

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务器构建成功${NC}"
else
    echo -e "${RED}❌ 服务器构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 依赖修复完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步:${NC}"
echo -e "  ${YELLOW}npm run dev${NC} - 启动开发服务器"
echo -e "  ${YELLOW}npm run build${NC} - 构建生产版本"
echo -e "  ${YELLOW}npm test${NC} - 运行测试"