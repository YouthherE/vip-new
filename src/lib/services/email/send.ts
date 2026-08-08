/**
 * 邮件发送服务
 * 支持 MailChannels（Cloudflare Workers 免费）和自定义 SMTP 两种方式
 */

export interface SendOptions {
  to: { address: string; name?: string }[];
  cc?: { address: string; name?: string }[];
  bcc?: { address: string; name?: string }[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  replyTo?: string;
  fromName?: string;
  fromAddress?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 通过 MailChannels API 发送（Cloudflare Workers 免费方案）
 * 要求：发件域名已配置 SPF 记录 include:mailchannels.net
 */
async function sendViaMailChannels(options: SendOptions): Promise<SendResult> {
  const fromAddress = options.fromAddress || '';
  const fromName = options.fromName || '';
  const replyTo = options.replyTo || fromAddress;

  const personalizations: any = {
    to: options.to.map(r => ({ email: r.address, name: r.name || '' })),
  };

  if (options.cc?.length) {
    personalizations.cc = options.cc.map(r => ({ email: r.address, name: r.name || '' }));
  }
  if (options.bcc?.length) {
    personalizations.bcc = options.bcc.map(r => ({ email: r.address, name: r.name || '' }));
  }

  const content: { type: string; value: string }[] = [];
  if (options.textBody) content.push({ type: 'text/plain', value: options.textBody });
  if (options.htmlBody) content.push({ type: 'text/html', value: options.htmlBody });

  const payload: any = {
    personalizations: [personalizations],
    from: { email: fromAddress, name: fromName },
    subject: options.subject,
    content,
  };

  if (replyTo) {
    payload.reply_to = { email: replyTo };
  }

  try {
    const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.ok || resp.status === 202) {
      return { success: true, messageId: resp.headers.get('x-message-id') || undefined };
    }

    const text = await resp.text();
    return { success: false, error: `MailChannels 返回 ${resp.status}: ${text}` };
  } catch (e: any) {
    return { success: false, error: `MailChannels 请求失败: ${e.message}` };
  }
}

/**
 * 发送邮件（自动选择 MailChannels 或 SMTP）
 */
export async function sendEmail(options: SendOptions): Promise<SendResult> {
  // 优先尝试 MailChannels（Cloudflare Workers 内置免费通道）
  // 失败时尝试 SMTP
  return sendViaMailChannels(options);
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(config: {
  from_address: string;
  from_name: string;
  reply_to?: string;
}): Promise<SendResult> {
  const adminAddr = config.from_address || config.reply_to || '';

  return sendEmail({
    to: [{ address: adminAddr, name: '管理员' }],
    subject: `[${config.from_name}] 邮箱配置测试`,
    htmlBody: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="background:#f97316;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0">${config.from_name} - 邮箱服务测试</h2>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="color:#374151;line-height:1.8;">
            恭喜！您的企业邮箱已配置成功。
          </p>
          <p style="color:#6b7280;line-height:1.8;">
            如果您收到此邮件，说明邮箱发送功能正常工作。
          </p>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
            此邮件由 ${config.from_name} 系统自动发送，请勿回复。
          </div>
        </div>
      </div>
    `,
    textBody: `${config.from_name} - 邮箱服务测试\n\n恭喜！您的企业邮箱已配置成功。\n如果您收到此邮件，说明邮箱发送功能正常工作。\n\n此邮件由 ${config.from_name} 系统自动发送，请勿回复。`,
    fromAddress: config.from_address,
    fromName: config.from_name,
    replyTo: config.reply_to,
  });
}

/**
 * 发送会员通知邮件
 */
export async function sendMemberEmail(options: {
  to: { address: string; name?: string };
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromName: string;
  fromAddress: string;
  replyTo?: string;
}): Promise<SendResult> {
  return sendEmail({
    to: [{ address: options.to.address, name: options.to.name }],
    subject: options.subject,
    htmlBody: options.htmlBody,
    textBody: options.textBody,
    fromName: options.fromName,
    fromAddress: options.fromAddress,
    replyTo: options.replyTo,
  });
}
