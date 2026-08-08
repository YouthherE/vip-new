/**
 * WeChat Pay v3 条码支付（B 扫 C）
 *
 * API 文档: https://pay.weixin.qq.com/doc/v3/merchant/4012792156
 *
 * 环境变量（必填）:
 *   WECHAT_APP_ID          微信应用 AppID
 *   WECHAT_MCH_ID          微信商户号
 *   WECHAT_API_V3_KEY      API v3 密钥（32位）
 *   WECHAT_PRIVATE_KEY     商户私钥 PEM（用于签名）
 *   WECHAT_CERT_SERIAL_NO  商户证书序列号
 */

import crypto from 'crypto';
import type { PaymentProvider, PaymentRequest, PaymentResult, PaymentGatewayConfig } from './types';

// ════════ 配置 ════════

/** 合并配置：DB 配置优先，环境变量兜底 */
function getConfig(gw?: PaymentGatewayConfig) {
  // 环境变量兜底
  const env = (key: string) => process.env[key] || '';

  const dbAppId = gw?.wechatAppId;
  const dbMchId = gw?.wechatMchId;
  const dbKey = gw?.wechatApiV3Key;
  const dbPri = gw?.wechatPrivateKey;
  const dbSerial = gw?.wechatCertSerialNo;

  const appId = dbAppId || env('WECHAT_APP_ID');
  const mchId = dbMchId || env('WECHAT_MCH_ID');
  const apiV3Key = dbKey || env('WECHAT_API_V3_KEY');
  const privateKey = (dbPri || env('WECHAT_PRIVATE_KEY')).replace(/\\n/g, '\n');
  const certSerialNo = dbSerial || env('WECHAT_CERT_SERIAL_NO');

  if (!appId || !mchId || !apiV3Key || !privateKey || !certSerialNo) {
    const missing: string[] = [];
    if (!appId) missing.push('WECHAT_APP_ID');
    if (!mchId) missing.push('WECHAT_MCH_ID');
    if (!apiV3Key) missing.push('WECHAT_API_V3_KEY');
    if (!privateKey) missing.push('WECHAT_PRIVATE_KEY');
    if (!certSerialNo) missing.push('WECHAT_CERT_SERIAL_NO');
    throw new Error(`支付平台配置未就绪：${missing.join(', ')} 未设置`);
  }

  return { appId, mchId, apiV3Key, privateKey, certSerialNo };
}

// ════════ 签名工具 ════════

/** WeChat Pay v3 请求签名 */
function sign(method: 'POST' | 'GET', url: string, body: string, privateKey: string, mchId: string, serialNo: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = crypto.randomBytes(16).toString('hex');

  // 构造签名串
  const canonical = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  // RSA-SHA256 签名
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  // 构造 Authorization 头
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;
}

// ════════ 请求微信 API ════════

async function wechatPayRequest(path: string, body: Record<string, unknown>, gw?: PaymentGatewayConfig): Promise<Record<string, unknown>> {
  const cfg = getConfig(gw);
  const base = process.env.WECHAT_API_BASE || 'https://api.mch.weixin.qq.com';
  const url = `${base}${path}`;
  const bodyStr = JSON.stringify(body);

  const auth = sign('POST', path, bodyStr, cfg.privateKey, cfg.mchId, cfg.certSerialNo);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': auth,
      'User-Agent': 'StarlightKids/1.0',
    },
    body: bodyStr,
  });

  const data = await resp.json() as Record<string, unknown>;

  if (!resp.ok) {
    throw new Error(`微信支付 API 错误 [${resp.status}]: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// ════════ Provider ════════

export const wechatPayProvider: PaymentProvider = {
  async pay(req: PaymentRequest): Promise<PaymentResult> {
    try {
      const cfg = getConfig(req.config);

      // POST /v3/pay/transactions/jsapi（条码支付/付款码支付统一入口）
      const resp = await wechatPayRequest('/v3/pay/transactions/jsapi', {
        appid: cfg.appId,
        mchid: cfg.mchId,
        description: req.description || `星光儿童乐园-${req.orderNo}`,
        out_trade_no: req.orderNo,
        notify_url: (req.config?.wechatNotifyUrl || process.env.WECHAT_NOTIFY_URL || ''),
        amount: {
          total: Math.round(req.amount * 100), // 金额：分
          currency: 'CNY',
        },
        payer: {
          auth_code: req.authCode, // 顾客付款码
        },
        scene_info: {
          payer_client_ip: '127.0.0.1',
        },
      }, req.config);

      return {
        success: true,
        transactionId: resp.transaction_id as string,
        rawResponse: resp,
      };
    } catch (err: any) {
      const msg: string = err?.message || String(err);
      const code = extractErrorCode(msg);

      return {
        success: false,
        errorCode: code,
        errorMessage: msg,
        rawResponse: err,
      };
    }
  },
};

/** 从错误信息中提取微信错误码 */
function extractErrorCode(msg: string): string {
  try {
    const m = msg.match(/code[：:]\s*['"]?(\w+)/i);
    return m?.[1] || 'SYSTEM_ERROR';
  } catch {
    return 'SYSTEM_ERROR';
  }
}
