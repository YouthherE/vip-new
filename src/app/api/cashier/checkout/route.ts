import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { verifyJWT } from '@/lib/utils/jwt';
import { executeCheckout } from '@/lib/services/checkout';

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

    // ── Execute checkout via shared service ──
    const result = await executeCheckout(db, {
      price_type,
      items,
      member_id,
      operator_id: operator,
      payment_method: 'cash',  // 直接 check 默认走现金
    });

    if (!result.success) {
      return jsonResponse(error(result.code, result.message), result.code);
    }

    // Write operation log
    await writeOperationLog(request, db, {
      target_type: 'order',
      target_id: result.data.order_id,
      action: price_type === 'member' ? 'checkout_member' : 'checkout_normal',
      content: JSON.stringify({
        order_no: result.data.order_no,
        total_amount: result.data.total_amount,
        item_count: result.data.item_count,
        ...(price_type === 'member' ? {
          member_id,
          balance_before: result.data.balance_before,
          balance_after: result.data.balance_after,
        } : {}),
      }),
    });

    return jsonResponse(success(result.data, '购买成功'));
  } catch (e: any) {
    console.error('Checkout error:', e);
    return jsonResponse(error(500, e.message || '系统繁忙，请稍后重试'), 500);
  }
}
