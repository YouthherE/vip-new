/**
 * API 路由认证与角色校验工具
 * 供所有 /api/* 路由复用
 */
import { verifyJWT } from '@/lib/utils/jwt';

export interface AuthUser {
  id: number;
  role: string;
}

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

/**
 * 从 JWT 中验证并获取当前用户 (含 DB role 查询)
 */
export async function getAuthUser(request: Request, db: any): Promise<AuthUser | null> {
  const token = getAuthToken(request);
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload?.id) return null;
  const user = await db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .bind(payload.id)
    .first() as AuthUser | null;
  return user;
}

/**
 * 校验用户是否具备指定角色之一
 * @returns 403 Response 若不通过，否则返回当前用户
 */
export function requireRole(user: AuthUser | null, ...roles: string[]): Response | null {
  if (!user) {
    return jsonUnauthorized();
  }
  if (!roles.includes(user.role)) {
    return jsonForbidden();
  }
  return null; // 通过
}

function jsonUnauthorized(): Response {
  return new Response(JSON.stringify({ code: 401, message: '未授权，请先登录', data: null }), {
    status: 401,
    headers: securityHeaders(),
  });
}

function jsonForbidden(): Response {
  return new Response(JSON.stringify({ code: 403, message: '无权限执行此操作', data: null }), {
    status: 403,
    headers: securityHeaders(),
  });
}

export function securityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
  };
}
