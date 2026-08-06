# 项目记忆

## 项目概述
- 项目名称: cf-nextjs-vip-new — 乐园会员管理系统
- 技术栈: Next.js 14 (App Router) + TypeScript + Tailwind CSS + D1 (Cloudflare)
- 数据库: SQLite (D1)
- 部署: Cloudflare Pages + Workers

## 代码规范
- D1 数据库查询使用 `db.prepare().bind().all()` / `.first()` / `.run()` 模式
- D1 类型不支持泛型参数，需用 `as any` 类型断言
- Axios 实例 (`src/lib/axios.ts`) 已自动处理 token 注入和 401 拦截
- API 路由统一返回 `{ code, message, data }` 格式

## 关键组件
- `src/components/Sidebar.tsx` — 侧边栏（熊猫 Logo + 导航菜单）
- `src/components/Dashboard.tsx` — 首页仪表盘
- `src/components/QRScanner.tsx` — 二维码扫码器（html5-qrcode）
- `src/lib/services/checkout.ts` — 订单结算共享服务

## 支付架构 (B扫C)
- 现金支付: 直接调用 `POST /api/cashier/checkout`
- 手机支付: 扫描付款码 → `POST /api/payment/micropay` → 支付平台模拟 → 创建订单
- 支付平台模拟成功率: 95%
