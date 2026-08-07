export type { PayMethod, PaymentRequest, PaymentResult, PaymentProvider } from './types';
export { wechatPayProvider } from './wechat';
export { alipayProvider } from './alipay';

import type { PaymentProvider, PayMethod } from './types';
import { wechatPayProvider } from './wechat';
import { alipayProvider } from './alipay';

const providers: Record<PayMethod, PaymentProvider> = {
  wechat: wechatPayProvider,
  alipay: alipayProvider,
};

/** 根据支付渠道获取对应服务商 */
export function getPaymentProvider(method: PayMethod): PaymentProvider {
  const p = providers[method];
  if (!p) throw new Error(`不支持的支付方式: ${method}`);
  return p;
}
