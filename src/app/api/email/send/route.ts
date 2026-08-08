/**
 * 发送邮件 API
 * POST /api/email/send
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getEmailConfig, sendEmail, SendOptions } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const body = await request.json();
    const { to, cc, bcc, subject, body: htmlBody, textBody, replyTo } = body as any;

    // 校验必填项
    if (!to || !Array.isArray(to) || to.length === 0) {
      return jsonResponse(error(400, '收件人不能为空'));
    }
    if (!subject) {
      return jsonResponse(error(400, '邮件主题不能为空'));
    }
    if (!htmlBody && !textBody) {
      return jsonResponse(error(400, '邮件正文不能为空'));
    }

    // 获取配置
    const config = await getEmailConfig(db);
    if (!config || config.status !== 'active') {
      return jsonResponse(error(400, '邮箱服务未激活，请先配置邮箱'));
    }

    const options: SendOptions = {
      to: to.map((r: any) => ({
        address: typeof r === 'string' ? r : r.address,
        name: typeof r === 'string' ? '' : (r.name || ''),
      })),
      subject,
      htmlBody: htmlBody || undefined,
      textBody: textBody || undefined,
      fromName: config.from_name,
      fromAddress: config.from_address,
      replyTo: replyTo || config.reply_to || config.from_address,
    };

    if (cc?.length) options.cc = cc.map((r: any) => ({
      address: typeof r === 'string' ? r : r.address,
      name: typeof r === 'string' ? '' : (r.name || ''),
    }));
    if (bcc?.length) options.bcc = bcc.map((r: any) => ({
      address: typeof r === 'string' ? r : r.address,
      name: typeof r === 'string' ? '' : (r.name || ''),
    }));

    const result = await sendEmail(options);

    // 记录到发件箱
    await db.prepare(`
      INSERT INTO email_outbox (to_address, to_name, cc_address, bcc_address, subject, body_text, body_html, reply_to, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).bind(
      options.to.map(r => r.address).join('; '),
      options.to.map(r => r.name).join('; '),
      options.cc?.map(r => r.address).join('; ') || '',
      options.bcc?.map(r => r.address).join('; ') || '',
      subject,
      textBody || '',
      htmlBody || '',
      options.replyTo || '',
      result.success ? 'sent' : 'failed',
      result.error || null,
    ).run();

    if (!result.success) {
      return jsonResponse(error(500, result.error || '发送失败'));
    }

    return jsonResponse(success({ messageId: result.messageId }, '邮件发送成功'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '发送邮件失败'));
  }
}
