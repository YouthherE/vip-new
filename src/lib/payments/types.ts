/** 支付方式 */
export type PayMethod = 'wechat' | 'alipay';

/** 发起支付的请求参数 */
export interface PaymentRequest {
  method: PayMethod;
  authCode: string;       // 顾客付款码（扫码枪读取）
  amount: number;          // 金额，单位：元
  orderNo: string;         // 业务单号
  description?: string;    // 商品描述
}

/** 支付平台返回结果 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;  // 第三方交易流水号
  errorCode?: string;      // 错误码（如 ACQ.PAYER_BALANCE_NOT_ENOUGH）
  errorMessage?: string;   // 错误描述
  rawResponse?: unknown;   // 原始响应（用于对账排查）
}

/** 支付服务商需实现的接口 */
export interface PaymentProvider {
  /** 发起被扫支付（B 扫 C） */
  pay(req: PaymentRequest): Promise<PaymentResult>;
}
