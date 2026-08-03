# VIP 会员管理系统

基于 Next.js 和 Cloudflare 全栈构建的会员管理与收银系统，支持会员管理、商品管理、收银结算和数据统计分析。

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
- **HTTP**: Axios

## ✨ 功能特性 (Features)

- **📊 仪表盘 (Dashboard)**
  - 关键指标概览：会员总数、今日销售额、总积分、活跃率
  - 可视化图表：会员增长趋势、交易金额趋势、性别分布、渠道分布

- **👥 会员管理 (Member Management)**
  - 会员列表展示与分页，支持按姓名/手机号搜索
  - 新增/编辑会员信息：姓名、手机号、性别、地址、渠道、状态
  - 余额/积分调整：支持手动增加或扣减，自动记录变动流水

- **🛒 商品管理 (Product Management)**
  - 商品 CRUD：名称、普通价格、会员价格、商品图片
  - 上架/下架控制，按状态筛选
  - 图片上传：支持拖拽上传 + 点击上传（JPG/PNG/GIF/WebP，最大 2MB）
  - 卡片式布局展示，普通价格与会员价格同时呈现

- **💰 收银台 (Cashier)**
  - 收银台模式：无需登录会员，收银员直接操作
  - 已上架商品网格展示，勾选商品加入结算清单
  - 输入会员手机号/姓名查询 → 校验会员身份
    - 查到会员 → 价格切换为会员价，展示会员信息卡片
    - 未查到 → 提示错误，仍可按原价购买
  - 支持两种结算方式：
    - **原价购买**：按普通价格结算，创建订单记录（不扣余额）
    - **会员价购买**：按会员价格结算，扣减会员余额 → 创建订单 → 写入交易流水
  - 余额不足时会员价按钮自动置灰，可切换回原价购买
  - 购买成功后展示扣款明细和最新余额，支持继续购买

- **📋 交易记录 (Transactions)**
  - 交易流水列表：会员信息、类型（余额/积分）、金额、余额快照
  - 按类型/会员搜索，分页展示

- **📈 统计分析 (Statistics)**
  - 收支流水统计：按日期范围筛选收入/支出趋势图表，支持指定会员查询
  - 会员增长趋势分析：按日期范围展示新注册会员趋势

- **🔐 认证系统 (Authentication)**
  - JWT Token 认证，登录/注册
  - 路由守卫：未登录自动跳转登录页，Token 过期自动处理

- **👤 个人中心 (User Profile)**
  - 修改用户名、头像、密码

## 📂 项目结构 (Project Structure)

```
├── migrations/               # 数据库迁移文件 (SQL)
├── src/
│   ├── app/
│   │   ├── (main)/           # 主要业务页面 (需登录)
│   │   │   ├── page.tsx       # 首页仪表盘
│   │   │   ├── members/       # 会员管理页
│   │   │   ├── products/      # 商品管理页
│   │   │   ├── cashier/       # 收银台页
│   │   │   ├── transactions/  # 交易记录页
│   │   │   ├── statistics/    # 统计页 (members + transactions)
│   │   │   ├── profile/       # 个人中心
│   │   │   └── others/        # 短信配置
│   │   ├── api/               # API 路由 (后端逻辑)
│   │   │   ├── auth/          # 认证接口 (login, register)
│   │   │   ├── dashboard/     # 仪表盘统计
│   │   │   ├── members/       # 会员管理 & 余额调整
│   │   │   ├── products/      # 商品管理 & 上下架
│   │   │   ├── cashier/       # 收银台 (products, lookup, checkout)
│   │   │   ├── transactions/  # 交易流水
│   │   │   ├── statistics/    # 数据统计
│   │   │   └── debug/         # 种子数据生成
│   │   ├── login/             # 登录页
│   │   └── register/          # 注册页
│   ├── components/            # 公共组件
│   │   ├── AuthGuard.tsx       # 路由守卫
│   │   ├── Dashboard.tsx       # 仪表盘组件
│   │   ├── Header.tsx          # 顶部导航
│   │   ├── Sidebar.tsx         # 侧边导航
│   │   ├── ToastProvider.tsx   # Toast 通知
│   │   └── ...
│   ├── lib/                   # 工具库
│   │   ├── axios.ts            # HTTP 客户端 (自动附加 Token)
│   │   └── utils/              # JWT、密码加密、响应格式化
│   └── proxy.ts               # 代理配置
├── wrangler.jsonc             # Cloudflare 配置
└── package.json
```

## 🗄️ 数据库表结构 (Database Schema)

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 系统用户表 | id, username, password_hash, avatar |
| `members` | 会员信息表 | id, name, phone, balance, points, gender, address, channel, status |
| `transactions` | 交易变动流水 | id, member_id, order_id, type, amount, balance_before, balance_after |
| `products` | 商品主表 | id, name, regular_price, member_price, image, status |
| `orders` | 购买订单主表 | id, order_no, member_id, price_type, total_amount, balance_before, balance_after |
| `order_items` | 订单明细表 | id, order_id, product_id, sold_price, price_type, quantity, subtotal |

### ER 关系图

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│ members  │────→│    orders    │────→│ order_items │
│ (会员)   │ 可选 │  (订单)     │ 1:N │ (订单明细)  │←── products
└────┬─────┘     └──────┬──────┘     └─────────────┘
     │                  │
     │ 1:N              │ 0..1
     │                  │
┌────▼──────────┐       │
│ transactions  │←──────┘  (仅会员价购买)
│  (交易流水)   │
└───────────────┘
```

## 🚀 快速开始 (Getting Started)

### 前置要求

- Node.js 18+
- npm 或 yarn
- Wrangler CLI (`npm i -g wrangler`)

### 1. 安装依赖

```bash
npm install
```

### 2. 数据库迁移

```bash
# 本地执行全部迁移
npx wrangler d1 execute nextjs-db --local --file=migrations/0001_create_users_table.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0002_create_members_and_transactions.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0003_add_member_fields.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0004_create_products_tables.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0005_add_image_to_products.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0006_create_orders_tables.sql
npx wrangler d1 execute nextjs-db --local --file=migrations/0007_add_transaction_columns.sql
# 远程（生产环境）添加 --remote
# npx wrangler d1 execute nextjs-db --remote --file=migrations/0001_create_users_table.sql
```

### 3. 生成测试数据

```bash
curl -X POST http://localhost:3000/api/debug/seed
```

> 自动生成 50 个会员及随机交易数据。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

### 默认账户

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

## 📡 API 接口

### 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 401 | 未登录 / Token 过期 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 接口列表

#### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |

#### 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘统计数据 |

#### 会员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/members` | 会员列表（分页+搜索） |
| POST | `/api/members` | 新增会员 |
| PUT | `/api/members` | 编辑会员 |
| DELETE | `/api/members` | 删除会员 |
| POST | `/api/members/adjust` | 余额/积分调整 |

#### 商品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 商品列表（分页+筛选） |
| POST | `/api/products` | 上架商品 |
| PUT | `/api/products` | 编辑商品 |
| DELETE | `/api/products` | 删除商品 |
| PUT | `/api/products/status` | 批量上架/下架 |

#### 收银台

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cashier/products` | 获取已上架商品 |
| POST | `/api/cashier/member/lookup` | 查询会员（手机号/姓名） |
| POST | `/api/cashier/checkout` | 确认结算（原价/会员价） |

#### 交易记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/transactions` | 交易流水列表 |

#### 数据统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/statistics/transactions` | 收支流水统计 |
| GET | `/api/statistics/members` | 会员增长趋势 |

## ⚙️ 业务规则

| 规则项 | 说明 |
|--------|------|
| 价格体系 | 每个商品设置普通价格和会员价格，会员价 ≤ 普通价 |
| 收银台结算 | 不填会员按原价购买（不扣余额，不写流水）；填会员且校验通过按会员价购买（扣余额+写流水） |
| 余额校验 | 会员价合计 ≤ 余额方可扣款，否则按钮置灰提示余额不足 |
| 价格快照 | 订单明细冗余存储商品名称和价格，历史订单不受后续商品修改影响 |
| 交易流水 | 仅会员价消费时写入 `transactions`；原价购买仅写 `orders` + `order_items` |
| 会员校验 | 仅 `status=active` 的会员可享受会员价；已冻结会员不可使用 |

## 📝 脚本说明 (Scripts)

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 构建项目 |
| `npm run deploy` | 构建并部署到 Cloudflare Workers |
| `npm run cf-typegen` | 生成 Cloudflare 环境 TypeScript 类型 |
| `npm run lint` | ESLint 代码检查 |

## 📄 许可

[MIT](LICENSE)
