/**
 * POST /api/payment/recharge
 *
 * 会员余额充值 — B 扫 C 被扫支付
 *
 * 流程：
 *   1. 扫码获取顾客付款码 → 前端调用本接口
 *   2. 识别付款码渠道（微信/支付宝）
 *   3. 调用对应支付平台 API 真实扣款
 *   4. 扣款成功 → 给会员余额充值 → 记录交易
 *
 * 请求体:
 *   { authCode: string, amount: number, memberId: number, remark?: string }
 *
 * 响应:
 *   成功: { code:200, data: { paymentNo, transactionId, method, balanceAfter } }
 *   失败: { code:402/400, message: "..." }
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { verifyJWT } from '@/lib/utils/jwt';
import { getChinaTime } from '@/lib/utils/time';
import { generatePaymentNo } from '@/lib/services/checkout';
import { getPaymentConfigs } from '@/lib/services/payment-config';
import { getPaymentProvider } from '@/lib/payments';
import type { PayMethod } from '@/lib/payments';

// ──── 付款码格式验证 ────

const AUTH_CODE_PATTERNS: Record<string, RegExp> = {
  wechat: /^1[3-9]\d{16}$/,
  alipay: /^2[5-8]\d{14,22}$/,
};

function detectMethod(authCode: string): string {
  if (AUTH_CODE_PATTERNS.wechat.test(authCode)) return 'wechat';
  if (AUTH_CODE_PATTERNS.alipay.test(authCode)) return 'alipay';
  return 'unknown';
}

function maskAuthCode(code: string): string {
  if (code.length <= 7) return '****';
  return code.substring(0, 3) + '*'.repeat(code.length - 7) + code.substring(code.length - 4);
}

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
    const operator = await getOperator(request);
    const body = await request.json() as any;
    const { authCode, amount, memberId, remark } = body;
    const paymentConfig = await getPaymentConfigs(db);

    // ════ 1. 参数验证 ════
    if (!authCode || typeof authCode !== 'string') {
      return jsonResponse(error(400, '付款码不能为空'), 400);
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return jsonResponse(error(400, '充值金额必须大于0'), 400);
    }
    if (!memberId) {
      return jsonResponse(error(400, '缺少会员ID'), 400);
    }

    const authCodeClean = authCode.trim();
    const method = detectMethod(authCodeClean);

    if (method === 'unknown') {
      return jsonResponse(error(400,
        '无法识别的付款码格式，仅支持微信支付或支付宝付款码'), 400);
    }

    // ════ 2. 验证会员存在 ════
    const member = await db.prepare(
      'SELECT id, name, balance FROM members WHERE id = ?',
    ).bind(memberId).first<any>();
    if (!member) {
      return jsonResponse(error(404, '会员不存在'), 404);
    }

    // ════ 3. 创建支付记录（pending） ════
    const paymentNo = generatePaymentNo();
    const now = getChinaTime();
    const maskedCode = maskAuthCode(authCodeClean);

    await db.prepare(
      `INSERT INTO payments (payment_no, method, auth_code, amount, status, raw_request, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    ).bind(paymentNo, method, maskedCode, numAmount,
      JSON.stringify({ auth_code: maskedCode, amount: numAmount, member_id: memberId, remark: remark || '' }),
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
      authCode: authCodeClean,
      amount: numAmount,
      orderNo: paymentNo,
      description: `星光儿童乐园-会员充值-${member.name}`,
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

    // ════ 5. 支付失败 → 返回错误 ════
    if (!gatewayResult.success) {
      await writeOperationLog(request, db, {
        target_type: 'payment',
        target_id: paymentId,
        action: 'recharge_failed',
        content: JSON.stringify({
          payment_no: paymentNo,
          member_name: member.name,
          error_code: gatewayResult.errorCode,
          error_msg: gatewayResult.errorMessage,
          method,
          amount: numAmount,
        }),
      });

      return jsonResponse(error(402,
        `${gatewayResult.errorMessage}（${gatewayResult.errorCode}）`), 402);
    }

    // ════ 6. 支付成功 → 给会员余额充值 ════
    const newBalance = (member.balance || 0) + numAmount;
    const paymentMethodLabel = method === 'wechat' ? '微信支付' : '支付宝';
    const txRemark = `[${paymentMethodLabel}] ${remark || ''} (支付单号: ${paymentNo})`;

    const batchResult = await db.batch([
      db.prepare('UPDATE members SET balance = ?, updated_at = ? WHERE id = ?')
        .bind(newBalance, getChinaTime(), memberId),
      db.prepare(
        'INSERT INTO transactions (member_id, type, amount, balance_after, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(memberId, 'balance', numAmount, newBalance, txRemark, getChinaTime()),
    ]);

    const allSuccess = batchResult.every(r => r.success);
    if (!allSuccess) {
      // 已扣款但充值失败，需要人工处理
      await db.prepare(
        `UPDATE payments SET raw_response = ?, updated_at = ? WHERE id = ?`,
      ).bind(JSON.stringify({
        ...gatewayResult,
        recharge_failed: true,
        recharge_error: '会员余额更新失败',
      }), getChinaTime(), paymentId).run();

      return jsonResponse(error(500,
        '支付成功但余额充值失败，请联系管理员'), 500);
    }

    // ════ 7. 记录操作日志 ════
    await writeOperationLog(request, db, {
      target_type: 'member',
      target_id: memberId,
      action: 'recharge',
      content: JSON.stringify({
        payment_no: paymentNo,
        transaction_id: gatewayResult.transactionId,
        method,
        amount: numAmount,
        balance_after: newBalance,
        member_name: member.name,
      }),
    });

    // ════ 8. 返回结果 ════
    return jsonResponse(success({
      paymentNo,
      transactionId: gatewayResult.transactionId,
      method,
      methodLabel: paymentMethodLabel,
      amount: numAmount,
      balanceAfter: newBalance,
      memberName: member.name,
    }, `充值成功！${member.name} 余额增加 ¥${numAmount.toFixed(2)}`));

  } catch (e: any) {
    console.error('Recharge error:', e);
    const raw = (e?.message || '') as string;
    const msg = raw.startsWith('支付平台配置未就绪')
      ? '支付平台配置未就绪，请联系管理员'
      : raw || '支付系统繁忙，请稍后重试';
    return jsonResponse(error(503, msg), 503);
  }
}
