import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

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

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
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
            const result = await db.prepare(
                `INSERT INTO orders (order_no, price_type, total_amount, item_count, status)
                 VALUES (?, ?, ?, ?, 1)`
            ).bind(orderNo, 'normal', totalAmount, itemCount).run();

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
                    `INSERT INTO order_items (order_id, product_id, product_name, product_image, normal_price, member_price, sold_price, price_type, quantity, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(orderId, oi.product_id, oi.product_name, oi.product_image, oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal).run();
            }

            return jsonResponse(success({
                order_id: orderId,
                order_no: orderNo,
                price_type: 'normal',
                total_amount: totalAmount,
                item_count: itemCount,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                items: orderItemsData.map(oi => ({
                    product_id: oi.product_id,
                    product_name: oi.product_name,
                    sold_price: oi.sold_price,
                    quantity: oi.quantity,
                    subtotal: oi.subtotal,
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
        const updateResult = await db.prepare(
            'UPDATE members SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(balanceAfter, member_id).run();

        if (!updateResult.success) {
            return jsonResponse(error(500, '扣款失败'), 500);
        }

        // Create order
        const orderResult = await db.prepare(
            `INSERT INTO orders (order_no, member_id, member_name, member_phone, price_type, total_amount, item_count, balance_before, balance_after, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
        ).bind(orderNo, member_id, member.name, member.phone, 'member', totalAmount, itemCount, balanceBefore, balanceAfter).run();

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
                `INSERT INTO order_items (order_id, product_id, product_name, product_image, normal_price, member_price, sold_price, price_type, quantity, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(orderId, oi.product_id, oi.product_name, oi.product_image, oi.normal_price, oi.member_price, oi.sold_price, oi.price_type, oi.quantity, oi.subtotal).run();
        }

        // Write transaction record (try with new columns, fall back to old)
        try {
            await db.prepare(
                `INSERT INTO transactions (member_id, order_id, type, amount, balance_before, balance_after, remark)
                 VALUES (?, ?, 'balance', ?, ?, ?, ?)`
            ).bind(member_id, orderId, -totalAmount, balanceBefore, balanceAfter, `购买商品，订单号：${orderNo}`).run();
        } catch {
            // Fallback: insert without new columns
            await db.prepare(
                `INSERT INTO transactions (member_id, type, amount, balance_after, remark)
                 VALUES (?, 'balance', ?, ?, ?)`
            ).bind(member_id, -totalAmount, balanceAfter, `购买商品，订单号：${orderNo}`).run();
        }

        function maskPhone(phone: string): string {
            if (!phone || phone.length < 7) return phone || '';
            return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
        }

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
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            items: orderItemsData.map(oi => ({
                product_id: oi.product_id,
                product_name: oi.product_name,
                sold_price: oi.sold_price,
                quantity: oi.quantity,
                subtotal: oi.subtotal,
            })),
        }, '购买成功'));
    } catch (e: any) {
        console.error('Checkout error:', e);
        return jsonResponse(error(500, e.message || '系统繁忙，请稍后重试'), 500);
    }
}
