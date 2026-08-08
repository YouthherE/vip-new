/**
 * IMAP 客户端 — 通过 Cloudflare Workers connect() 收取邮件
 *
 * 适配 Cloudflare Workers 环境（nodejs_compat）的轻量 IMAP 实现。
 * 支持 TLS 连接（port 993），实现 LOGIN / SELECT / SEARCH / FETCH。
 *
 * 用法：
 *   const client = new IMAPClient(host, port, user, pass);
 *   await client.connect();
 *   const emails = await client.fetchUnseen();
 *   await client.close();
 */

interface FetchResult {
  uid: string;
  header: string;
  body: string;
  raw: string;
}

export class IMAPClient {
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private socket: any;
  private tagSeq = 0;
  private buffer = '';
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(host: string, port: number, user: string, pass: string) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.pass = pass;
  }

  private nextTag(): string {
    return `A${String(++this.tagSeq).padStart(4, '0')}`;
  }

  /**
   * 建立 TLS 连接到 IMAP 服务器
   */
  async connect(): Promise<string> {
    // @ts-ignore Cloudflare Workers connect()
    this.socket = connect(
      { hostname: this.host, port: this.port },
      { secureTransport: 'on' }
    );

    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();

    // 读取服务器 greeting
    const greeting = await this.readLine();
    return greeting;
  }

  /**
   * 发送命令并等待带标签的响应
   */
  private async command(cmd: string): Promise<string> {
    const tag = this.nextTag();
    await this.write(`${tag} ${cmd}\r\n`);

    let response = '';
    while (true) {
      const line = await this.readLine();
      response += line + '\n';

      // 检查是否为带标签的完成响应
      if (line.startsWith(tag + ' ')) break;

      // 字面量处理：响应包含 {N} 表示接下来 N 字节的字面量
      const literalMatch = line.match(/\{(\d+)\}$/);
      if (literalMatch) {
        const size = parseInt(literalMatch[1]);
        // 发送 continuation
        const literalData = await this.readBytes(size + 2); // +2 for \r\n
        const literalStr = new TextDecoder().decode(literalData.slice(0, size));
        response += literalStr + '\n';
      }
    }

    return response;
  }

  /**
   * 登录
   */
  async login(): Promise<boolean> {
    const resp = await this.command(`LOGIN "${this.escapeQuote(this.user)}" "${this.escapeQuote(this.pass)}"`);
    return resp.includes('OK LOGIN') || resp.includes('OK AUTHENTICATE');
  }

  /**
   * 选择收件箱
   */
  async selectInbox(): Promise<number> {
    const resp = await this.command('SELECT INBOX');
    const match = resp.match(/(\d+)\s+EXISTS/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 搜索未读邮件 UID
   */
  async searchUnseen(): Promise<string[]> {
    const resp = await this.command('UID SEARCH UNSEEN');
    const match = resp.match(/^\*\s+SEARCH\s+(.+)$/m);
    if (!match) return [];
    return match[1].trim().split(/\s+/).filter(Boolean);
  }

  /**
   * 获取指定 UID 的邮件
   */
  async fetchMessage(uid: string): Promise<FetchResult | null> {
    const resp = await this.command(`UID FETCH ${uid} (BODY.PEEK[] FLAGS)`);
    return this.parseFetchResponse(uid, resp);
  }

  /**
   * 批量获取未读邮件
   */
  async fetchUnseen(): Promise<FetchResult[]> {
    const uids = await this.searchUnseen();
    const results: FetchResult[] = [];

    for (const uid of uids) {
      const msg = await this.fetchMessage(uid);
      if (msg) results.push(msg);
    }

    return results;
  }

  /**
   * 将邮件标记为已读（STORE +FLAGS \Seen）
   */
  async markSeen(uid: string): Promise<void> {
    await this.command(`UID STORE ${uid} +FLAGS (\\Seen)`);
  }

  /**
   * 解析 FETCH 命令的响应
   */
  private parseFetchResponse(uid: string, raw: string): FetchResult | null {
    // 提取 BODY[] 内容
    const bodyMatch = raw.match(/\{(\d+)\}\s*$/m);
    if (!bodyMatch) return null;

    // 在 raw 中找到实际的邮件内容
    // IMAP FETCH 响应格式：
    // * N FETCH (UID N FLAGS (...) BODY[] {size}
    // <raw email data>
    // )
    // A0005 OK FETCH completed

    const lines = raw.split('\n');
    let bodyStart = -1;
    let bodyEnd = -1;
    let inBody = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('*') && line.includes('BODY[]')) {
        inBody = true;
        bodyStart = i + 1;
        continue;
      }
      if (inBody && (line.startsWith(')') || line.startsWith(this.getLastTag(raw) + ' '))) {
        bodyEnd = i;
        break;
      }
    }

    if (bodyStart < 0) return null;
    const bodyRaw = lines.slice(bodyStart, bodyEnd >= 0 ? bodyEnd : undefined).join('\n');

    return { uid, header: '', body: bodyRaw, raw };
  }

  private getLastTag(raw: string): string {
    const m = raw.match(/^(A\d{4})\s+OK/m);
    return m ? m[1] : 'A9999';
  }

  /**
   * 登出并关闭连接
   */
  async close(): Promise<void> {
    try {
      await this.command('LOGOUT');
    } catch {
      // ignore
    }
    try {
      this.reader?.releaseLock();
      this.writer?.releaseLock();
    } catch {
      // ignore
    }
    try {
      this.socket?.close();
    } catch {
      // ignore
    }
  }

  // ── 底层 IO ──

  private async write(data: string): Promise<void> {
    const encoded = new TextEncoder().encode(data);
    await this.writer!.write(encoded);
  }

  private async readLine(): Promise<string> {
    let line = '';
    while (true) {
      const { value, done } = await this.reader!.read();
      if (done) break;
      if (!value) continue;
      const chunk = new TextDecoder().decode(value);
      this.buffer += chunk;

      const idx = this.buffer.indexOf('\n');
      if (idx !== -1) {
        line = this.buffer.substring(0, idx);
        // 去掉 \r
        if (line.endsWith('\r')) line = line.substring(0, line.length - 1);
        this.buffer = this.buffer.substring(idx + 1);
        break;
      }
    }
    return line;
  }

  private async readBytes(count: number): Promise<Uint8Array> {
    const result = new Uint8Array(count);
    let offset = 0;

    // 先消费 buffer 中的内容
    if (this.buffer.length > 0) {
      const fromBuffer = Math.min(this.buffer.length, count);
      const encoded = new TextEncoder().encode(this.buffer.substring(0, fromBuffer));
      result.set(encoded, 0);
      this.buffer = this.buffer.substring(fromBuffer);
      offset = fromBuffer;
    }

    while (offset < count) {
      const { value, done } = await this.reader!.read();
      if (done) break;
      if (!value) continue;
      const toCopy = Math.min(value.length, count - offset);
      result.set(value.subarray(0, toCopy), offset);
      offset += toCopy;
      // 剩余放回 buffer
      if (toCopy < value.length) {
        this.buffer += new TextDecoder().decode(value.subarray(toCopy));
      }
    }

    return result;
  }

  private escapeQuote(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}

/**
 * 解析原始邮件为结构化数据
 */
export function parseRawEmail(raw: string): {
  messageId: string;
  fromAddress: string;
  fromName: string;
  toAddress: string;
  replyTo: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
} {
  const headers: Record<string, string> = {};
  const headerEnd = raw.indexOf('\r\n\r\n');
  const headerSection = headerEnd > 0 ? raw.substring(0, headerEnd) : raw;

  // 解析 headers（支持多行折叠）
  let currentKey = '';
  for (const line of headerSection.split('\n')) {
    if (/^\s/.test(line) && currentKey) {
      headers[currentKey] += ' ' + line.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        currentKey = line.substring(0, colonIdx).trim().toLowerCase();
        headers[currentKey] = line.substring(colonIdx + 1).trim();
      }
    }
  }

  // 解析正文
  let bodyText = '';
  let bodyHtml = '';
  const bodySection = headerEnd > 0 ? raw.substring(headerEnd + 4) : '';

  // 简单多部分解析
  const contentType = headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = bodySection.split('--' + boundary);

    for (const part of parts) {
      if (part.startsWith('--')) continue; // end boundary

      const partHeaderEnd = part.indexOf('\r\n\r\n');
      const partHeaders = partHeaderEnd > 0 ? part.substring(0, partHeaderEnd) : '';
      const partBody = partHeaderEnd > 0 ? part.substring(partHeaderEnd + 4).trim() : part.trim();

      if (partHeaders.toLowerCase().includes('text/html') || partHeaders.toLowerCase().includes('content-type: text/html')) {
        bodyHtml = decodeQuotedPrintable(partBody);
      } else if (partHeaders.toLowerCase().includes('text/plain') || partHeaders.toLowerCase().includes('content-type: text/plain')) {
        bodyText = decodeQuotedPrintable(partBody);
      }
    }
  } else {
    // 单一部分
    if (contentType.includes('text/html')) {
      bodyHtml = decodeQuotedPrintable(bodySection);
    } else {
      bodyText = decodeQuotedPrintable(bodySection);
    }
  }

  // 解析发件人
  const from = parseAddress(headers['from'] || '');
  const to = parseAddress(headers['to'] || headers['delivered-to'] || '');

  return {
    messageId: headers['message-id'] || '',
    fromAddress: from.address,
    fromName: from.name,
    toAddress: to.address,
    replyTo: headers['reply-to'] || from.address,
    subject: decodeMimeHeader(headers['subject'] || ''),
    bodyText,
    bodyHtml,
    receivedAt: headers['date'] || new Date().toISOString(),
  };
}

/**
 * 解析地址头 "Name <email>" -> { name, address }
 */
function parseAddress(raw: string): { name: string; address: string } {
  if (!raw) return { name: '', address: '' };
  // 去除编码标记 =?UTF-8?B?...?= 之类
  raw = decodeMimeHeader(raw);

  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch) {
    const address = angleMatch[1].trim();
    const name = raw.replace(/<[^>]+>/, '').replace(/["']/g, '').trim();
    return { name: name.replace(/,$/, '').trim(), address };
  }

  // 没有尖括号，整体就是地址
  const trimmed = raw.split(',')[0].trim().replace(/["']/g, '');
  return { name: '', address: trimmed };
}

/**
 * 解码 MIME 编码的头部值 (=?charset?encoding?data?=)
 */
function decodeMimeHeader(raw: string): string {
  if (!raw) return '';
  return raw.replace(/=\?[^?]+\?[Bb]\?([^?]*)\?=/g, (_, encoded) => {
    try {
      return atob(encoded);
    } catch {
      try {
        // base64url -> base64
        return atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return encoded;
      }
    }
  }).replace(/=\?[^?]+\?[Qq]\?([^?]*)\?=/g, (_, encoded) => {
    return encoded
      .replace(/_/g, ' ')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  });
}

/**
 * 解码 Quoted-Printable
 */
function decodeQuotedPrintable(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
