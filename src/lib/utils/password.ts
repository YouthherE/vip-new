/**
 * 使用 PBKDF2 哈希密码（SHA-256, 100000 次迭代, 16 字节随机盐）
 * 格式: saltHex:hashHex（与旧版 SHA-256 纯哈希区分）
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${saltHex}:${hashHex}`;
}

/**
 * 验证明文密码是否与存储的哈希匹配
 * 兼容旧版 SHA-256 纯哈希（无冒号分隔符），并返回是否需要升级哈希
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  // 兼容旧版 SHA-256 纯哈希
  if (!storedHash.includes(':')) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return { valid: hashHex === storedHash, needsUpgrade: hashHex === storedHash };
  }

  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || saltHex.length !== 32) {
    return { valid: false, needsUpgrade: false };
  }
  const salt = new Uint8Array((saltHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const computedHash = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { valid: computedHash === hashHex, needsUpgrade: false };
}
