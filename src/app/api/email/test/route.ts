/**
 * 邮箱连接测试 API
 * POST /api/email/test
 * Body: { type: 'smtp' | 'imap' }
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getEmailConfig, sendTestEmail, IMAPClient } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const body = await request.json();
    const { type } = body as { type: 'smtp' | 'imap' };

    const config = await getEmailConfig(db);
    if (!config) {
      return jsonResponse(error(404, '邮箱配置不存在'));
    }

    if (type === 'smtp') {
      // 测试 SMTP 发送
      if (!config.from_address) {
        return jsonResponse(error(400, '发件人地址未配置'));
      }

      const result = await sendTestEmail({
        from_address: config.from_address,
        from_name: config.from_name,
        reply_to: config.reply_to,
      });

      if (!result.success) {
        return jsonResponse(error(500, result.error || 'SMTP 测试失败'));
      }

      return jsonResponse(success({ messageId: result.messageId }, 'SMTP 邮件发送成功，请检查收件箱确认'));
    }

    if (type === 'imap') {
      // 测试 IMAP 连接
      if (!config.imap_host || !config.imap_user || !config.imap_pass) {
        return jsonResponse(error(400, 'IMAP 配置不完整'));
      }

      const client = new IMAPClient(
        config.imap_host,
        config.imap_port,
        config.imap_user,
        config.imap_pass
      );

      try {
        const greeting = await client.connect();
        const loggedIn = await client.login();

        if (!loggedIn) {
          await client.close();
          return jsonResponse(error(500, 'IMAP 登录失败，请检查账号密码'));
        }

        const total = await client.selectInbox();
        await client.close();

        return jsonResponse(success({
          greeting: greeting.substring(0, 100),
          totalMessages: total,
        }, `IMAP 连接成功，收件箱共 ${total} 封邮件`));
      } catch (e: any) {
        return jsonResponse(error(500, `IMAP 连接失败: ${e.message}`));
      }
    }

    return jsonResponse(error(400, '请指定测试类型: smtp 或 imap'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '测试失败'));
  }
}
