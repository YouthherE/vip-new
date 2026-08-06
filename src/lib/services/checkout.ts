/**
 * 订单结算核心服务
 * 被 POST /cashier/checkout 和 POST /payment/micropay 共用
 */
import { writeOperationLog } from '@/lib/utils/logger';
import { getChinaTime } from '@/lib/utils/time';

// ──── 生成 24 位唯一订单号 ────
export function generateOrderNo(): string {
  const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PO${y}${m}${d}${h}${min}${s}${ms}${rand}`;
}

// ──── 生成支付单号 ────
export function generatePaymentNo(): string {
  const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY${y}${m}${d}${h}${min}${s}${ms}${rand}`;
}

// ──── 输入类型 ────
export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CheckoutInput {
  price_type: 'normal' | 'member';
  items: OrderItemInput[];
  member_id?: number;
  operator_id: number;
  payment_method?: string;
  payment_id?: number;
  payment_time?: string;
}

export interface OrderItemResult {
  product_id: number;
  product_name: string;
  product_image: string;
  normal_price: number;
  member_price: number;
  sold_price: number;
  price_type: string;
  quantity: number;
  subtotal: number;
  entry_count?: number;
}

export interface CheckoutResult {
  order_id: number;
  order_no: string;
  price_type: 'normal' | 'member';
  member_name?: string;
  member_phone?: string;
  total_amount: number;
  item_count: number;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
  items: OrderItemResult[];
  payment_method?: string;
}

// ──── 累加入园计数 ────
export async function incrementEntryCounts(
  db: any,
  items: { product_id: number; product_name: string; quantity: number }[],
  today: string,
): Promise<Map<number, number>> {
  const countMap = new Map<number, number>();
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const existing = await db.prepare(
      'SELECT id, count FROM entry_counts WHERE entry_date = ? AND product_id = ?',
    ).bind(today, item.product_id).first();

    if (existing) {
      await db.prepare(
        'UPDATE entry_counts SET count = count + ?, updated_at = ? WHERE id = ?',
      ).bind(item.quantity, getChinaTime(), (existing as any).id).run();
      countMap.set(item.product_id, (existing as any).count + item.quantity);
    } else {
      await db.prepare(
        'INSERT INTO entry_counts (entry_date, product_id, product_name, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(today, item.product_id, item.product_name, item.quantity, getChinaTime(), getChinaTime()).run();
      countMap.set(item.product_id, item.quantity);
    }
  }
  return countMap;
}

/**
 * 核心结算逻辑（普通价 + 会员价）
 * @returns CheckoutResult 或错误
 */
export async function executeCheckout(
  db: any,
  input: CheckoutInput,
): Promise<{ success: true; data: CheckoutResult } | { success: false; code: number; message: string }> {
  const { price_type, items, member_id, operator_id, payment_method, payment_id, payment_time } = input;

  // ════ 检测 orders 表是否有支付相关列（迁移可能未执行） ════
  const tableInfo = (await db.prepare("PRAGMA table_info(orders)").all()).results as any[];
  const colNames = new Set(tableInfo.map((c: any) => c.name));
  const hasPaymentCols = colNames.has('payment_method');

  // ════ 查询商品 ════
  const productIds = items.map(i => i.product_id);
  const placeholders = productIds.map(() => '?').join(',');
  const productRows = (await db.prepare(
    `SELECT id, name, image, regular_price, member_price, status
     FROM products WHERE id IN (${placeholders})`,
  ).bind(...productIds).all()).results as any[];

  const productMap = new Map<number, any>();
  for (const p of productRows) {
    productMap.set(p.id as number, p);
  }

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return { success: false, code: 400, message: `商品ID ${item.product_id} 不存在` };
    }
    if (product.status !== 'listed') {
      return { success: false, code: 400, message: `商品「${product.name}」已下架，请重新选择` };
    }
  }

  // ════ 计算金额 ════
  let totalAmount = 0;
  const orderItems: {
    product_id: number; product_name: string; product_image: string;
    normal_price: number; member_price: number; sold_price: number;
    price_type: string; quantity: number; subtotal: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id)!;
    const price = price_type === 'member' ? product.member_price : product.regular_price;
    const subtotal = price * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      product_image: product.image || '',
      normal_price: product.regular_price,
      member_price: product.member_price,
      sold_price: price,
      price_type,
      quantity: item.quantity,
      subtotal,
    });
  }

  const orderNo = generateOrderNo();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const now = getChinaTime();
  const today = now.split(' ')[0];

  // ════ 普通价：直接创建订单 ════
  if (price_type === 'normal') {
    const cols = hasPaymentCols
      ? 'order_no, price_type, total_amount, item_count, status, operator_id, payment_method, payment_id, payment_time, created_at, updated_at'
      : 'order_no, price_type, total_amount, item_count, status, operator_id, created_at, updated_at';
    const placeholders = hasPaymentCols ? '?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?' : '?, ?, ?, ?, 1, ?, ?, ?';
    const values = hasPaymentCols
      ? [orderNo, 'normal', totalAmount, itemCount, operator_id, payment_method || '', payment_id || null, payment_time || null, now, now]
      : [orderNo, 'normal', totalAmount, itemCount, operator_id, now, now];

    const result = await db.prepare(
      `INSERT INTO orders (${cols}) VALUES (${placeholders})`,
    ).bind(...values).run();

    if (!result.success) {
      return { success: false, code: 500, message: '创建订单失败' };
    }

    const orderRow = await db.prepare('SELECT id FROM orders WHERE order_no = ?').bind(orderNo).first() as any;
    const orderId = orderRow.id;

    for (const oi of orderItems) {
      await db.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image,
          normal_price, member_price, sold_price, price_type, quantity, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(orderId, oi.product_id, oi.product_name, oi.product_image,
        oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal, now).run();
    }

    const entryCountMap = await incrementEntryCounts(db, orderItems, today);

    const finalItems: OrderItemResult[] = orderItems.map(oi => ({
      ...oi,
      entry_count: entryCountMap.get(oi.product_id) || 0,
    }));

    return {
      success: true,
      data: {
        order_id: orderId, order_no: orderNo, price_type: 'normal',
        total_amount: totalAmount, item_count: itemCount, created_at: now,
        items: finalItems, payment_method,
      },
    };
  }

  // ════ 会员价：验证 + 扣款 + 创建订单 ════
  if (!member_id) {
    return { success: false, code: 400, message: '会员价购买必须提供会员ID' };
  }

  const member = await db.prepare(
    "SELECT id, name, phone, balance, status FROM members WHERE id = ?",
  ).bind(member_id).first() as any;

  if (!member || member.status !== 'active') {
    return { success: false, code: 400, message: '该会员不存在或已冻结' };
  }

  if (member.balance < totalAmount) {
    const shortage = totalAmount - member.balance;
    return { success: false, code: 400, message: `余额不足，当前 ¥${member.balance.toFixed(2)}，需 ¥${totalAmount.toFixed(2)}，差额 ¥${shortage.toFixed(2)}` };
  }

  const balanceBefore = member.balance;
  const balanceAfter = balanceBefore - totalAmount;

  const updateResult = await db.prepare(
    'UPDATE members SET balance = ?, updated_at = ? WHERE id = ?',
  ).bind(balanceAfter, getChinaTime(), member_id).run();

  if (!updateResult.success) {
    return { success: false, code: 500, message: '扣款失败' };
  }

  const memberCols = hasPaymentCols
    ? 'order_no, member_id, member_name, member_phone, price_type, total_amount, item_count, balance_before, balance_after, status, operator_id, payment_method, payment_id, payment_time, created_at, updated_at'
    : 'order_no, member_id, member_name, member_phone, price_type, total_amount, item_count, balance_before, balance_after, status, operator_id, created_at, updated_at';
  const memberPlaceholders = hasPaymentCols
    ? '?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?'
    : '?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?';
  const memberValues = hasPaymentCols
    ? [orderNo, member_id, member.name, member.phone, 'member', totalAmount, itemCount, balanceBefore, balanceAfter, operator_id, payment_method || '', payment_id || null, payment_time || null, now, now]
    : [orderNo, member_id, member.name, member.phone, 'member', totalAmount, itemCount, balanceBefore, balanceAfter, operator_id, now, now];

  const orderResult = await db.prepare(
    `INSERT INTO orders (${memberCols}) VALUES (${memberPlaceholders})`,
  ).bind(...memberValues).run();

  if (!orderResult.success) {
    return { success: false, code: 500, message: '创建订单失败' };
  }

  const orderRow2 = await db.prepare('SELECT id FROM orders WHERE order_no = ?').bind(orderNo).first() as any;
  const orderId = orderRow2.id;

  for (const oi of orderItems) {
    await db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image,
        normal_price, member_price, sold_price, price_type, quantity, subtotal, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(orderId, oi.product_id, oi.product_name, oi.product_image,
      oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal, now).run();
  }

  const entryCountMap = await incrementEntryCounts(db, orderItems, today);

  // 写交易流水
  try {
    await db.prepare(
      `INSERT INTO transactions (member_id, order_id, type, amount, balance_before, balance_after, remark, created_at)
       VALUES (?, ?, 'balance', ?, ?, ?, ?, ?)`,
    ).bind(member_id, orderId, -totalAmount, balanceBefore, balanceAfter, `购买商品，订单号：${orderNo}`, now).run();
  } catch {
    await db.prepare(
      `INSERT INTO transactions (member_id, type, amount, balance_after, remark, created_at)
       VALUES (?, 'balance', ?, ?, ?, ?)`,
    ).bind(member_id, -totalAmount, balanceAfter, `购买商品，订单号：${orderNo}`, now).run();
  }

  function maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone || '';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  const finalItems: OrderItemResult[] = orderItems.map(oi => ({
    ...oi,
    entry_count: entryCountMap.get(oi.product_id) || 0,
  }));

  return {
    success: true,
    data: {
      order_id: orderId, order_no: orderNo, price_type: 'member',
      member_name: member.name, member_phone: maskPhone(member.phone),
      total_amount: totalAmount, item_count: itemCount,
      balance_before: balanceBefore, balance_after: balanceAfter,
      created_at: now, items: finalItems, payment_method,
    },
  };
}
