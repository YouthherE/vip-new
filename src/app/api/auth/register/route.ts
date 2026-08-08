import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword } from '@/lib/utils/password';
import { getChinaTime } from '@/lib/utils/time';
import { checkRateLimit } from '@/lib/utils/rate-limit';

/** 密码强度校验：至少 8 位，含大小写字母+数字 */
function validatePasswordStrength(password: string): string | null {
    if (password.length < 8) {
        return '密码至少需要 8 个字符';
    }
    if (password.length > 64) {
        return '密码不能超过 64 个字符';
    }
    if (!/[a-z]/.test(password)) {
        return '密码需要包含至少一个小写字母';
    }
    if (!/[A-Z]/.test(password)) {
        return '密码需要包含至少一个大写字母';
    }
    if (!/[0-9]/.test(password)) {
        return '密码需要包含至少一个数字';
    }
    return null;
}

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // 速率限制：同 IP 每 15 分钟最多 3 次注册请求
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
        if (!checkRateLimit(`register:${clientIp}`, 3, 15 * 60_000)) {
            return jsonResponse(error(429, '注册请求过于频繁，请 15 分钟后再试'), 429);
        }

        const body = await request.json();
        const { username, password } = body as any;

        if (!username || !password) {
            return jsonResponse(error(400, '用户名和密码不能为空'), 400);
        }

        // 用户名格式校验
        if (typeof username !== 'string' || username.length < 3 || username.length > 32) {
            return jsonResponse(error(400, '用户名需为 3-32 个字符'), 400);
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return jsonResponse(error(400, '用户名只能包含字母、数字和下划线'), 400);
        }

        // 密码强度校验
        const pwdError = validatePasswordStrength(password);
        if (pwdError) {
            return jsonResponse(error(400, pwdError), 400);
        }

        // Check if user exists by username
        const existingUser = await db.prepare(
            'SELECT id FROM users WHERE username = ?'
        ).bind(username).first();

        if (existingUser) {
            return jsonResponse(error(409, '该用户名已存在'), 409);
        }

        const hashedPassword = await hashPassword(password);

        // Insert user
        const now = getChinaTime();
        const result = await db.prepare(
            'INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)'
        ).bind(username, hashedPassword, now, now).run();

        if (!result.success) {
             return jsonResponse(error(500, '创建用户失败'), 500);
        }

        return jsonResponse(success({ username }, '注册成功'));
    } catch (e: any) {
        console.error('Register error:', e);
        return jsonResponse(error(500, e.message || 'Internal Server Error'), 500);
    }
}
