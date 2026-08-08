/**
 * HTML 转义工具
 * 将用户数据中的特殊字符转义，防止打印票据 HTML 注入 (XSS)
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
