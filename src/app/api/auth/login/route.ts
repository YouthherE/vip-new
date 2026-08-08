import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import { signJWT } from '@/lib/utils/jwt';
import { checkRateLimit, resetRateLimit } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const body = await request.json();
        const { username, password } = body as any;

        if (!username || !password) {
            return jsonResponse(error(400, '用户名和密码不能为空'), 400);
        }

        // 输入长度限制
        if (username.length > 64 || password.length > 128) {
            return jsonResponse(error(400, '用户名或密码长度超出限制'), 400);
        }

        // ═════ 速率限制：同一用户名 15 分钟内最多 5 次失败尝试 ═════
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rateLimitKey = `login:${username}:${clientIp}`;
        if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
            return jsonResponse(error(429, '登录尝试过于频繁，请 15 分钟后再试'), 429);
        }

        // Find user by username
        const user = await db.prepare(
            'SELECT * FROM users WHERE username = ?'
        ).bind(username).first<any>();

        if (!user) {
             return jsonResponse(error(401, '用户名或密码错误'), 401);
        }

        // Verify password with PBKDF2 (backward compatible with old SHA-256)
        const { valid, needsUpgrade } = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return jsonResponse(error(401, '用户名或密码错误'), 401);
        }

        // 登录成功后重置失败计数
        resetRateLimit(rateLimitKey);

        // 自动升级旧 SHA-256 哈希为 PBKDF2
        if (needsUpgrade) {
            const upgradedHash = await hashPassword(password);
            await db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now", "localtime") WHERE id = ?')
                .bind(upgradedHash, user.id)
                .run();
        }

        // Remove sensitive info
        const { password_hash, ...userInfo } = user;

        // Generate JWT
        const token = await signJWT({ id: user.id, username: user.username });

        return jsonResponse(success({
            user: userInfo,
            token,
        }, '登录成功'));

    } catch (e: any) {
        console.error('Login error:', e);
        return jsonResponse(error(500, e.message || 'Internal Server Error'), 500);
    }
}
