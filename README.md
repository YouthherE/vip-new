# VIP 管理系统 (VIP Management System)

基于 Next.js 和 Cloudflare 全栈构建的会员管理系统。提供会员管理、余额充值/消费、数据统计分析等功能。

## 截图
![alt text](image.png)

## 🛠️ 技术栈 (Tech Stack)

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **部署/运行时**: [Cloudflare Workers](https://workers.cloudflare.com/) / [OpenNext](https://opennext.js.org/)
- **数据库**: Cloudflare D1 (SQLite)
- **语言**: TypeScript
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **图表**: [ECharts](https://echarts.apache.org/) (echarts-for-react)
- **图标**: [Lucide React](https://lucide.dev/)
- **认证**: JWT (jose)

## ✨ 功能特性 (Features)

- **📊 仪表盘 (Dashboard)**
  - 关键指标概览（总会员数、总收入、今日数据）
  - 可视化图表（会员增长趋势、收支统计、性别分布等）

- **👥 会员管理 (Member Management)**
  - 会员列表展示与分页
  - 新增/编辑会员信息
  - 搜索功能（支持姓名、手机号）
  - 会员等级管理

- **💰 交易管理 (Transactions)**
  - 余额变动记录（充值/消费）
  - 交易流水查询

- **📈 统计分析 (Statistics)**
  - 收支流水统计：支持按日期范围筛选、指定会员查询
  - 会员增长趋势分析

- **👤 个人中心 (User Profile)**
  - 管理员信息修改（用户名、密码）
  - 安全退出

## 📂 项目结构 (Project Structure)

```
.
├── migrations/             # 数据库迁移文件 (SQL)
├── src/
│   ├── app/
│   │   ├── (main)/         # 主要业务页面 (需登录)
│   │   ├── api/            # API 路由 (后端逻辑)
│   │   ├── login/          # 登录页
│   │   └── register/       # 注册页
│   ├── components/         # 公共 UI 组件
│   ├── lib/                # 工具函数 (Auth, DB, Utils)
│   └── ...
├── wrangler.jsonc          # Cloudflare 配置文件
└── package.json            # 项目依赖配置
```

## 🚀 快速开始 (Getting Started)

### 前置要求

- Node.js 18+
- npm 或 yarn
- Wrangler CLI (Cloudflare 开发工具)

### 1. 安装依赖

```bash
npm install
```

### 2. 数据库设置

本项目使用 Cloudflare D1 数据库。在本地开发前，需要初始化数据库并应用迁移。

```bash
# 生成类型定义
npm run cf-typegen

# 本地应用迁移 (需确保已登录 wrangler)
npx wrangler d1 migrations apply DB --local

# 导入示例数据 (可选，默认密码admin/admin123)
npx wrangler d1 execute DB --local --file=./cf-nextjs-vip.sql
```

### 3. 启动开发服务器

```bash
npm run dev
```
访问 http://localhost:3000 查看应用。

### 4. 部署 (Deployment)

部署到 Cloudflare Workers:

```bash
npm run deploy
```

## 📝 脚本说明 (Scripts)

- `npm run dev`: 启动 Next.js 开发服务器
- `npm run build`: 构建项目
- `npm run deploy`: 构建并部署到 Cloudflare
- `npm run cf-typegen`: 生成 Cloudflare 环境类型定义

## 📄 许可证

[MIT](LICENSE)
