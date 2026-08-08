/**
 * 字段级 AES-256-GCM 加密工具
 * 用于加密存储支付密钥、邮箱密码等敏感字段
 *
 * 加密密钥来自环境变量 ENCRYPTION_KEY（32 字节 hex）
 * 若未设置则降级为明文存储（开发环境兼容）
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<{ key: CryptoKey; enabled: boolean }> {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey || hexKey.length < 64) {
    return { key: null as unknown as CryptoKey, enabled: false };
  }
  const rawKey = new Uint8Array(hexKey.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return { key, enabled: true };
}

/** 加密明文，返回 Base64 编码的密文（格式: iv:encrypted） */
export async function encryptField(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext) return plaintext ?? null;
  const { key, enabled } = await getKey();
  if (!enabled) return plaintext;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** 解密 Base64 编码的密文，兼容明文存储（自动检测） */
export async function decryptField(ciphertext: string | null | undefined): Promise<string | null> {
  if (!ciphertext) return ciphertext ?? null;
  const { key, enabled } = await getKey();
  if (!enabled) return ciphertext;

  try {
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return decoder.decode(decrypted);
  } catch {
    // 解密失败时返回原始值（兼容明文存储的旧数据）
    return ciphertext;
  }
}
