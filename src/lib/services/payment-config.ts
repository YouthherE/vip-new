/**
 * 支付配置服务
 *
 * 从 D1 数据库中读取/写入微信支付和支付宝的配置参数。
 * DB 配置优先于环境变量，允许超级管理员在后台 UI 中动态修改。
 */
import type { PaymentGatewayConfig } from '@/lib/payments';

interface PaymentConfigRow {
  id: number;
  wechat_app_id: string;
  wechat_mch_id: string;
  wechat_api_v3_key: string;
  wechat_private_key: string;
  wechat_cert_serial_no: string;
  wechat_notify_url: string;
  alipay_app_id: string;
  alipay_private_key: string;
  alipay_public_key: string;
  status: string;
}

/**
 * 从 payment_configs 表读取配置（只取最新一条 active 记录）
 * 如果 DB 无配置或状态为 inactive，返回 undefined（届时支付模块将走环境变量）
 */
export async function getPaymentConfigs(db: D1Database): Promise<PaymentGatewayConfig | undefined> {
  const row = await db.prepare(
    'SELECT * FROM payment_configs WHERE status = ? ORDER BY id DESC LIMIT 1',
  ).bind('active').first<PaymentConfigRow>();

  if (!row) return undefined;

  return {
    wechatAppId: row.wechat_app_id || undefined,
    wechatMchId: row.wechat_mch_id || undefined,
    wechatApiV3Key: row.wechat_api_v3_key || undefined,
    wechatPrivateKey: row.wechat_private_key || undefined,
    wechatCertSerialNo: row.wechat_cert_serial_no || undefined,
    wechatNotifyUrl: row.wechat_notify_url || undefined,
    alipayAppId: row.alipay_app_id || undefined,
    alipayPrivateKey: row.alipay_private_key || undefined,
    alipayPublicKey: row.alipay_public_key || undefined,
  };
}

/**
 * 写入/更新支付配置
 * 策略：将旧配置标记为 inactive，插入一条新配置为 active
 */
export async function savePaymentConfigs(
  db: D1Database,
  config: PaymentGatewayConfig,
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '+08:00');

  // 将所有旧配置标记为 inactive
  await db.prepare(
    "UPDATE payment_configs SET status = 'inactive', updated_at = ? WHERE status = 'active'",
  ).bind(now).run();

  // 插入新配置
  await db.prepare(
    `INSERT INTO payment_configs (
      wechat_app_id, wechat_mch_id, wechat_api_v3_key,
      wechat_private_key, wechat_cert_serial_no, wechat_notify_url,
      alipay_app_id, alipay_private_key, alipay_public_key,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).bind(
    config.wechatAppId || '',
    config.wechatMchId || '',
    config.wechatApiV3Key || '',
    config.wechatPrivateKey || '',
    config.wechatCertSerialNo || '',
    config.wechatNotifyUrl || '',
    config.alipayAppId || '',
    config.alipayPrivateKey || '',
    config.alipayPublicKey || '',
    now, now,
  ).run();
}

/**
 * 脱敏显示密钥（只显示首尾各4个字符）
 */
export function maskSecret(value: string): string {
  if (!value || value.length <= 8) return value ? '****' : '';
  return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 8, 20)) + value.substring(value.length - 4);
}
