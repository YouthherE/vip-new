/**
 * POST /api/payment/micropay
 *
 * B 扫 C 被扫支付 — 商家扫描用户付款码后调用
 *
 * 流程：
 *   用户展示付款码 → 扫码枪扫描 → 前端调用本接口
 *   → 识别付款码渠道 → 调用对应支付平台（微信/支付宝） → 返回交易结果
 *
 * 请求体:
 *   { auth_code: string, items: {product_id, quantity}[], price_type, member_id? }
 *
 * 响应:
 *   成功: { code:200, data: { payment_no, transaction_id, method, order: {...} } }
 *   失败: { code:402/400, message: "..." }
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { verifyJWT } from '@/lib/utils/jwt';
import { getChinaTime } from '@/lib/utils/time';
import {
  generatePaymentNo,
  executeCheckout,
  type CheckoutResult,
} from '@/lib/services/checkout';
import { getPaymentConfigs } from '@/lib/services/payment-config';
import { getPaymentProvider } from '@/lib/payments';
import type { PayMethod } from '@/lib/payments';

// ──── 付款码格式验证 ────

const AUTH_CODE_PATTERNS: Record<string, RegExp> = {
  wechat: /^1[3-9]\d{16}$/,   // 微信: 13xxxxxxxxxxxxxxxx (18位数字)
  alipay: /^2[5-8]\d{14,22}$/, // 支付宝: 25-28xxxxxxxxxxxxxx
};

/** 根据 auth_code 自动识别支付渠道 */
function detectMethod(authCode: string): string {
  if (AUTH_CODE_PATTERNS.wechat.test(authCode)) return 'wechat';
  if (AUTH_CODE_PATTERNS.alipay.test(authCode)) return 'alipay';
  return 'unknown';
}

/** 验证付款码是否合法 */
function validateAuthCode(authCode: string): { valid: boolean; reason?: string } {
  if (!authCode || typeof authCode !== 'string') {
    return { valid: false, reason: '付款码不能为空' };
  }
  const trimmed = authCode.trim();
  if (trimmed.length < 16 || trimmed.length > 32) {
    return { valid: false, reason: '付款码长度不合法（16-32位）' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, reason: '付款码应为纯数字' };
  }
  return { valid: true };
}

/** 脱敏 auth_code（保留首3位 + 末4位） */
function maskAuthCode(code: string): string {
  if (code.length <= 7) return '****';
  return code.substring(0, 3) + '*'.repeat(code.length - 7) + code.substring(code.length - 4);
}

// ──── 从请求中提取操作人 ID ────

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

// ──── POST Handler ────

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const paymentConfig = await getPaymentConfigs(db);
    const operator = await getOperator(request);
    const body = await request.json() as any;
    const { auth_code, price_type, items, member_id } = body;

    // ════ 1. 参数验证 ════
    const codeCheck = validateAuthCode(auth_code);
    if (!codeCheck.valid) {
      return jsonResponse(error(400, codeCheck.reason!), 400);
    }

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

    const authCode = auth_code.trim();
    const method = detectMethod(authCode);
    const maskedCode = maskAuthCode(authCode);

    // ════ 拦截非支付码 ════
    if (method === 'unknown') {
      return jsonResponse(error(400,
        '无法识别的付款码格式，仅支持微信支付或支付宝付款码'), 400);
    }

    // ════ 2. 计算金额（预查商品） ════
    const productIds = items.map((i: any) => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const productRows = await db.prepare(
      `SELECT id, regular_price, member_price, status FROM products WHERE id IN (${placeholders})`,
    ).bind(...productIds).all<any>();
    const productMap = new Map<number, any>();
    for (const p of productRows.results) productMap.set(p.id, p);

    let amount = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return jsonResponse(error(400, `商品ID ${item.product_id} 不存在`), 400);
      }
      const price = price_type === 'member' ? product.member_price : product.regular_price;
      amount += price * item.quantity;
    }

    // ════ 3. 创建支付记录（pending） ════
    const paymentNo = generatePaymentNo();
    const now = getChinaTime();

    await db.prepare(
      `INSERT INTO payments (payment_no, method, auth_code, amount, status, raw_request, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    ).bind(paymentNo, method, maskedCode, amount,
      JSON.stringify({ auth_code: maskedCode, items: items.map((i: any) => ({ ...i })), price_type }),
      now, now).run();

    const paymentRow = await db.prepare(
      'SELECT id FROM payments WHERE payment_no = ?',
    ).bind(paymentNo).first<any>();
    const paymentId = paymentRow!.id;

    // ════ 4. 调用真实支付平台（微信/支付宝） ════
    await db.prepare(
      'UPDATE payments SET status = ?, updated_at = ? WHERE id = ?',
    ).bind('processing', getChinaTime(), paymentId).run();

    const provider = getPaymentProvider(method as PayMethod);
    const gatewayResult = await provider.pay({
      method: method as PayMethod,
      authCode,
      amount,
      orderNo: paymentNo,
      description: `星光儿童乐园-${maskedCode}`,
      config: paymentConfig,
    });
    const paymentStatus = gatewayResult.success ? 'success' : 'failed';

    await db.prepare(
      `UPDATE payments SET status = ?, transaction_id = ?, raw_response = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(
      paymentStatus,
      gatewayResult.transactionId || null,
      JSON.stringify(gatewayResult),
      getChinaTime(),
      paymentId,
    ).run();

    // ════ 5. 支付失败 → 直接返回 ════
    if (!gatewayResult.success) {
      await writeOperationLog(request, db, {
        target_type: 'payment',
        target_id: paymentId,
        action: 'micropay_failed',
        content: JSON.stringify({
          payment_no: paymentNo,
          error_code: gatewayResult.errorCode,
          error_msg: gatewayResult.errorMessage,
          method,
          amount,
        }),
      });

      return jsonResponse(error(402,
        `${gatewayResult.errorMessage}（${gatewayResult.errorCode}）`), 402);
    }

    // ════ 6. 支付成功 → 创建订单 ════
    const paymentTime = getChinaTime();
    const checkoutResult = await executeCheckout(db, {
      price_type,
      items,
      member_id,
      operator_id: operator,
      payment_method: method,
      payment_id: paymentId,
      payment_time: paymentTime,
    });

    if (!checkoutResult.success) {
      // 订单创建失败但已扣款，标记 payment 需要人工处理
      await db.prepare(
        `UPDATE payments SET status = 'success', raw_response = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(JSON.stringify({
        ...gatewayResult,
        order_failed: true,
        order_error: checkoutResult.message,
      }), getChinaTime(), paymentId).run();

      return jsonResponse(error(500,
        `支付成功但订单创建失败：${checkoutResult.message}，请联系管理员`), 500);
    }

    // ════ 7. 关联支付与订单 ════
    await db.prepare(
      'UPDATE payments SET order_no = ?, updated_at = ? WHERE id = ?',
    ).bind(checkoutResult.data.order_no, getChinaTime(), paymentId).run();

    // 写操作日志
    await writeOperationLog(request, db, {
      target_type: 'payment',
      target_id: paymentId,
      action: 'micropay_success',
      content: JSON.stringify({
        payment_no: paymentNo,
        transaction_id: gatewayResult.transactionId,
        method,
        amount,
        order_no: checkoutResult.data.order_no,
        price_type,
      }),
    });

    // ════ 8. 返回完整结果 ════
    return jsonResponse(success({
      payment_no: paymentNo,
      transaction_id: gatewayResult.transactionId,
      method,
      auth_code_masked: maskedCode,
      amount,
      status: 'success',
      order: checkoutResult.data,
    }, '支付成功'));

  } catch (e: any) {
    console.error('Micropay error:', e);
    const raw = (e?.message || '') as string;
    const msg = raw.startsWith('支付平台配置未就绪')
      ? '支付平台配置未就绪，请联系管理员'
      : raw || '支付系统繁忙，请稍后重试';
    return jsonResponse(error(503, msg), 503);
  }
}
