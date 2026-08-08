import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword } from '@/lib/utils/password';
import { signJWT } from '@/lib/utils/jwt';

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const body = await request.json();
        const { username, password } = body as any;

        if (!username || !password) {
            return jsonResponse(error(400, '用户名和密码不能为空'), 400);
        }

        // Find user by username
        const user = await db.prepare(
            'SELECT * FROM users WHERE username = ?'
        ).bind(username).first<any>();

        if (!user) {
             return jsonResponse(error(401, '用户名或密码错误'), 401);
        }

        // Verify password
        const hashedPassword = await hashPassword(password);
        if (hashedPassword !== user.password_hash) {
            return jsonResponse(error(401, '用户名或密码错误'), 401);
        }
        
        // Remove sensitive info
        const { password_hash, ...userInfo } = user;
        
        // Generate JWT
        const token = await signJWT({ id: user.id, username: user.username });
        
        return jsonResponse(success({
            user: userInfo,
            token
        }, '登录成功'));

    } catch (e: any) {
        console.error('Login error:', e);
        return jsonResponse(error(500, e.message || 'Internal Server Error'), 500);
    }
}
