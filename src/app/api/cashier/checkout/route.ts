import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { getChinaTime } from '@/lib/utils/time';
import { verifyJWT } from '@/lib/utils/jwt';

function generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO${y}${m}${d}${h}${min}${s}${rand}`;
}

/** 从请求 Authorization header 中提取操作人 ID */
async function getOperator(request: Request): Promise<number> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return 0;
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token);
        return (payload?.id as number) || 0;
    } catch {
        return 0;
    }
}

/** 累加入园人数计数（每种商品单独计数，每天独立），返回累加后的最新计数 */
async function incrementEntryCounts(
    db: any,
    items: { product_id: number; product_name: string; quantity: number }[],
    today: string
): Promise<Map<number, number>> {
    const countMap = new Map<number, number>();

    for (const item of items) {
        if (item.quantity <= 0) continue;
        const existing = await db.prepare(
            'SELECT id, count FROM entry_counts WHERE entry_date = ? AND product_id = ?'
        ).bind(today, item.product_id).first();

        if (existing) {
            await db.prepare(
                'UPDATE entry_counts SET count = count + ?, updated_at = ? WHERE id = ?'
            ).bind(item.quantity, getChinaTime(), existing.id).run();
            countMap.set(item.product_id, (existing as any).count + item.quantity);
        } else {
            await db.prepare(
                'INSERT INTO entry_counts (entry_date, product_id, product_name, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(today, item.product_id, item.product_name, item.quantity, getChinaTime(), getChinaTime()).run();
            countMap.set(item.product_id, item.quantity);
        }
    }

    return countMap;
}

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const operator = await getOperator(request);
        const body = await request.json() as any;
        const { member_id, price_type, items } = body;

        // ── Validation ──
        if (!items || !Array.isArray(items) || items.length === 0) {
            return jsonResponse(error(400, '请选择至少一个商品'), 400);
        }

        if (!price_type || !['normal', 'member'].includes(price_type)) {
            return jsonResponse(error(400, '价格类型无效'), 400);
        }

        if (price_type === 'member' && !member_id) {
            return jsonResponse(error(400, '会员价购买必须提供会员ID'), 400);
        }

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity < 1 || item.quantity > 99) {
                return jsonResponse(error(400, '购买数量必须在1-99之间'), 400);
            }
        }

        // ── Fetch products ──
        const productIds = items.map((i: any) => i.product_id);
        const placeholders = productIds.map(() => '?').join(',');
        const productRows = await db.prepare(
            `SELECT id, name, image, regular_price, member_price, status
             FROM products
             WHERE id IN (${placeholders})`
        ).bind(...productIds).all<any>();

        const productMap = new Map<number, any>();
        for (const p of productRows.results) {
            productMap.set(p.id, p);
        }

        // Check all products exist and are listed
        const offlineProducts: number[] = [];
        for (const item of items) {
            const product = productMap.get(item.product_id);
            if (!product) {
                return jsonResponse(error(400, `商品ID ${item.product_id} 不存在`), 400);
            }
            if (product.status !== 'listed') {
                offlineProducts.push(item.product_id);
            }
        }

        if (offlineProducts.length > 0) {
            const names = offlineProducts.map(id => {
                const p = productMap.get(id);
                return p ? p.name : String(id);
            });
            return jsonResponse(error(400, `商品「${names.join('、')}」已下架，请重新选择`), 400);
        }

        // ── Calculate total ──
        let totalAmount = 0;
        const orderItemsData: any[] = [];

        for (const item of items) {
            const product = productMap.get(item.product_id)!;
            const price = price_type === 'member' ? product.member_price : product.regular_price;
            const subtotal = price * item.quantity;
            totalAmount += subtotal;

            orderItemsData.push({
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
        const itemCount = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

        // ── Normal price: just create order ──
        if (price_type === 'normal') {
            const now = getChinaTime();
            const today = now.split(' ')[0];
            const result = await db.prepare(
                `INSERT INTO orders (order_no, price_type, total_amount, item_count, status, operator_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
            ).bind(orderNo, 'normal', totalAmount, itemCount, operator, now, now).run();

            if (!result.success) {
                return jsonResponse(error(500, '创建订单失败'), 500);
            }

            // Get the inserted order ID
            const orderRow = await db.prepare(
                'SELECT id FROM orders WHERE order_no = ?'
            ).bind(orderNo).first<any>();
            const orderId = orderRow!.id;

            // Insert order items
            for (const oi of orderItemsData) {
                await db.prepare(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_image, normal_price, member_price, sold_price, price_type, quantity, subtotal, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(orderId, oi.product_id, oi.product_name, oi.product_image, oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal, now).run();
            }

            // 累加入园计数
            const entryCountMap = await incrementEntryCounts(db, orderItemsData, today);

            await writeOperationLog(request, db, {
                target_type: 'order',
                target_id: orderId,
                action: 'checkout_normal',
                content: JSON.stringify({ order_no: orderNo, total_amount: totalAmount, item_count: itemCount }),
            });

            return jsonResponse(success({
                order_id: orderId,
                order_no: orderNo,
                price_type: 'normal',
                total_amount: totalAmount,
                item_count: itemCount,
                created_at: now,
                items: orderItemsData.map(oi => ({
                    product_id: oi.product_id,
                    product_name: oi.product_name,
                    sold_price: oi.sold_price,
                    normal_price: oi.normal_price,
                    member_price: oi.member_price,
                    quantity: oi.quantity,
                    subtotal: oi.subtotal,
                    entry_count: entryCountMap.get(oi.product_id) || 0,
                })),
            }, '购买成功'));
        }

        // ── Member price: verify member, check balance, deduct ──
        // Fetch member
        const member = await db.prepare(
            "SELECT id, name, phone, balance, status FROM members WHERE id = ?"
        ).bind(member_id).first<any>();

        if (!member || member.status !== 'active') {
            return jsonResponse(error(400, '该会员不存在或已冻结，请重新确认'), 400);
        }

        // Check balance
        if (member.balance < totalAmount) {
            const shortage = totalAmount - member.balance;
            return jsonResponse(error(400,
                `余额不足，当前余额 ¥${member.balance.toFixed(2)}，需支付 ¥${totalAmount.toFixed(2)}，差额 ¥${shortage.toFixed(2)}`), 400);
        }

        // Transaction: deduct balance + create order + write transaction
        const balanceBefore = member.balance;
        const balanceAfter = balanceBefore - totalAmount;

        // Update member balance
        const nowMember = getChinaTime();
        const updateResult = await db.prepare(
            'UPDATE members SET balance = ?, updated_at = ? WHERE id = ?'
        ).bind(balanceAfter, nowMember, member_id).run();

        if (!updateResult.success) {
            return jsonResponse(error(500, '扣款失败'), 500);
        }

        // Create order
        const nowOrder = getChinaTime();
        const today = nowOrder.split(' ')[0];
        const orderResult = await db.prepare(
            `INSERT INTO orders (order_no, member_id, member_name, member_phone, price_type, total_amount, item_count, balance_before, balance_after, status, operator_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
        ).bind(orderNo, member_id, member.name, member.phone, 'member', totalAmount, itemCount, balanceBefore, balanceAfter, operator, nowOrder, nowOrder).run();

        if (!orderResult.success) {
            return jsonResponse(error(500, '创建订单失败'), 500);
        }

        const orderRow = await db.prepare(
            'SELECT id FROM orders WHERE order_no = ?'
        ).bind(orderNo).first<any>();
        const orderId = orderRow!.id;

        // Insert order items
        for (const oi of orderItemsData) {
            await db.prepare(
                `INSERT INTO order_items (order_id, product_id, product_name, product_image, normal_price, member_price, sold_price, price_type, quantity, subtotal, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(orderId, oi.product_id, oi.product_name, oi.product_image, oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal, nowOrder).run();
        }

        // 累加入园计数
        const entryCountMap = await incrementEntryCounts(db, orderItemsData, today);

        // Write transaction record (try with new columns, fall back to old)
        try {
            await db.prepare(
                `INSERT INTO transactions (member_id, order_id, type, amount, balance_before, balance_after, remark, created_at)
                 VALUES (?, ?, 'balance', ?, ?, ?, ?, ?)`
            ).bind(member_id, orderId, -totalAmount, balanceBefore, balanceAfter, `购买商品，订单号：${orderNo}`, nowOrder).run();
        } catch {
            // Fallback: insert without new columns
            await db.prepare(
                `INSERT INTO transactions (member_id, type, amount, balance_after, remark, created_at)
                 VALUES (?, 'balance', ?, ?, ?, ?)`
            ).bind(member_id, -totalAmount, balanceAfter, `购买商品，订单号：${orderNo}`, nowOrder).run();
        }

        function maskPhone(phone: string): string {
            if (!phone || phone.length < 7) return phone || '';
            return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
        }

        await writeOperationLog(request, db, {
            target_type: 'order',
            target_id: orderId,
            action: 'checkout_member',
            content: JSON.stringify({ order_no: orderNo, member_id, total_amount: totalAmount, balance_before: balanceBefore, balance_after: balanceAfter }),
        });

        return jsonResponse(success({
            order_id: orderId,
            order_no: orderNo,
            price_type: 'member',
            member_name: member.name,
            member_phone: maskPhone(member.phone),
            total_amount: totalAmount,
            item_count: itemCount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            created_at: nowOrder,
            items: orderItemsData.map(oi => ({
                product_id: oi.product_id,
                product_name: oi.product_name,
                sold_price: oi.sold_price,
                normal_price: oi.normal_price,
                member_price: oi.member_price,
                quantity: oi.quantity,
                subtotal: oi.subtotal,
                entry_count: entryCountMap.get(oi.product_id) || 0,
            })),
        }, '购买成功'));
    } catch (e: any) {
        console.error('Checkout error:', e);
        return jsonResponse(error(500, e.message || '系统繁忙，请稍后重试'), 500);
    }
}
