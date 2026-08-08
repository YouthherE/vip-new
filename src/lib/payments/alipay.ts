/**
 * Alipay 条码支付（B 扫 C）
 *
 * API 文档: https://opendocs.alipay.com/open/194/105072
 *
 * 环境变量（必填）:
 *   ALIPAY_APP_ID          支付宝应用 AppID
 *   ALIPAY_PRIVATE_KEY      应用私钥 PEM（用于签名）
 *   ALIPAY_PUBLIC_KEY       支付宝公钥 PEM（用于验签）
 */

import crypto from 'crypto';
import type { PaymentProvider, PaymentRequest, PaymentResult } from './types';

// ════════ 配置 ════════

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`支付平台配置未就绪：${key} 未设置`);
  return v;
}

function getConfig() {
  return {
    appId: env('ALIPAY_APP_ID'),
    privateKey: env('ALIPAY_PRIVATE_KEY').replace(/\\n/g, '\n'),
    publicKey: env('ALIPAY_PUBLIC_KEY').replace(/\\n/g, '\n'),
  };
}

// ════════ 签名工具 ════════

/** 按字母序拼接参数 */
function buildQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .filter(k => params[k] !== '' && params[k] !== undefined && params[k] !== null)
    .sort()
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
}

/** RSA-SHA256 签名（输出 Base64） */
function rsaSign(data: string, privateKey: string): string {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data, 'utf8');
  signer.end();
  return signer.sign(privateKey, 'base64');
}

// ════════ 请求支付宝 API ════════

interface AlipayTradePayResp {
  alipay_trade_pay_response: {
    code: string;
    msg: string;
    trade_no?: string;
    out_trade_no?: string;
    buyer_logon_id?: string;
    total_amount?: string;
    sub_code?: string;
    sub_msg?: string;
  };
  sign?: string;
}

async function alipayRequest(method: string, bizContent: Record<string, unknown>): Promise<AlipayTradePayResp> {
  const cfg = getConfig();
  const base = process.env.ALIPAY_API_BASE || 'https://openapi.alipay.com/gateway.do';

  const common = {
    app_id: cfg.appId,
    method,
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00').replace('T', ' '),
    version: '1.0',
    biz_content: JSON.stringify(bizContent),
  };

  // 拼参数 → 签名
  const queryStr = buildQuery(common as Record<string, string>);
  const signature = rsaSign(queryStr, cfg.privateKey);

  // 发请求
  const formBody = queryStr + '&sign=' + encodeURIComponent(signature);
  const resp = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: formBody,
  });

  const raw = await resp.text();
  const data = JSON.parse(raw) as AlipayTradePayResp;
  return data;
}

// ════════ Provider ════════

export const alipayProvider: PaymentProvider = {
  async pay(req: PaymentRequest): Promise<PaymentResult> {
    try {
      const resp = await alipayRequest('alipay.trade.pay', {
        out_trade_no: req.orderNo,
        scene: 'bar_code',           // 条码支付场景
        auth_code: req.authCode,     // 顾客付款码
        subject: req.description || `星光儿童乐园-${req.orderNo}`,
        total_amount: req.amount.toFixed(2),
        terminal_id: 'POS01',
        timeout_express: '5m',       // 5分钟超时
      });

      const r = resp.alipay_trade_pay_response;
      const successCode = '10000'; // 支付宝成功码

      if (r.code === successCode) {
        return {
          success: true,
          transactionId: r.trade_no,
          rawResponse: resp,
        };
      }

      // 支付失败（业务失败，非网络错误）
      return {
        success: false,
        errorCode: r.sub_code || r.code,
        errorMessage: r.sub_msg || r.msg,
        rawResponse: resp,
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err?.message || String(err),
        rawResponse: err,
      };
    }
  },
};
