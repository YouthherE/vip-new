/**
 * 邮箱配置管理
 * 读取/更新 D1 中的 email_configs 单条配置记录
 * SMTP/IMAP 密码使用 AES-256-GCM 加密存储
 */

import { encryptField, decryptField } from '@/lib/utils/crypto';

export interface EmailConfig {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: number;
  smtp_user: string;
  smtp_pass: string;
  imap_host: string;
  imap_port: number;
  imap_secure: number;
  imap_user: string;
  imap_pass: string;
  from_name: string;
  from_address: string;
  reply_to: string;
  signature: string;
  use_mailchannels: number;
  status: string;
}

/**
 * 获取邮箱配置（D1 数据库），自动解密密码字段
 */
export async function getEmailConfig(db: D1Database): Promise<EmailConfig | null> {
  const row = await db.prepare('SELECT * FROM email_configs WHERE id = 1').first<EmailConfig>();
  if (!row) return null;
  return {
    ...row,
    smtp_pass: (await decryptField(row.smtp_pass)) ?? row.smtp_pass,
    imap_pass: (await decryptField(row.imap_pass)) ?? row.imap_pass,
  };
}

/**
 * 更新邮箱配置，自动加密密码字段
 */
export async function updateEmailConfig(
  db: D1Database,
  data: Partial<Omit<EmailConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<EmailConfig | null> {
  const processed = { ...data } as any;

  // 加密密码字段（仅在提供新密码时，不处理脱敏占位符）
  if (processed.smtp_pass !== undefined && !processed.smtp_pass.includes('****')) {
    processed.smtp_pass = await encryptField(processed.smtp_pass);
  } else {
    delete processed.smtp_pass; // 不更新脱敏占位符
  }
  if (processed.imap_pass !== undefined && !processed.imap_pass.includes('****')) {
    processed.imap_pass = await encryptField(processed.imap_pass);
  } else {
    delete processed.imap_pass;
  }

  const fields: string[] = [];
  const values: any[] = [];

  const allowed = [
    'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
    'imap_host', 'imap_port', 'imap_secure', 'imap_user', 'imap_pass',
    'from_name', 'from_address', 'reply_to', 'signature',
    'use_mailchannels', 'status',
  ];

  for (const key of allowed) {
    if (processed[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(processed[key]);
    }
  }

  if (fields.length === 0) return getEmailConfig(db);

  fields.push("updated_at = datetime('now', 'localtime')");

  await db.prepare(`UPDATE email_configs SET ${fields.join(', ')} WHERE id = 1`)
    .bind(...values)
    .run();

  return getEmailConfig(db);
}

/**
 * 脱敏显示密码
 */
export function maskPassword(pass: string): string {
  if (!pass || pass.length <= 2) return pass ? '****' : '';
  return pass.substring(0, 2) + '****' + pass.substring(pass.length - 1);
}
