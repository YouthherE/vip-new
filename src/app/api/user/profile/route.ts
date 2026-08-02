import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword } from '@/lib/utils/password';
import { verifyJWT } from '@/lib/utils/jwt';

export async function PUT(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        
        // 1. Authenticate User
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonResponse(error(401, 'Unauthorized'), 401);
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token);
        
        if (!payload || !payload.id) {
            return jsonResponse(error(401, 'Invalid token'), 401);
        }

        const userId = payload.id;

        // 2. Parse Body
        const body = await request.json() as any;
        const { username, password } = body;

        if (!username) {
            return jsonResponse(error(400, '用户名不能为空'), 400);
        }

        // 3. Check username uniqueness (if changed)
        // Get current user data first
        const currentUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<any>();
        
        if (!currentUser) {
            return jsonResponse(error(404, 'User not found'), 404);
        }

        if (currentUser.username !== username) {
            const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
            if (existingUser) {
                return jsonResponse(error(409, '用户名已存在'), 409);
            }
        }

        // 4. Update User
        let updateQuery = 'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP';
        const params: any[] = [username];

        if (password) {
            const hashedPassword = await hashPassword(password);
            updateQuery += ', password_hash = ?';
            params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(userId);

        const result = await db.prepare(updateQuery).bind(...params).run();

        if (!result.success) {
            return jsonResponse(error(500, '更新失败'), 500);
        }

        // 5. Return updated user info (excluding password)
        const updatedUser = await db.prepare('SELECT id, username, avatar, status, created_at, updated_at FROM users WHERE id = ?').bind(userId).first();

        return jsonResponse(success(updatedUser, '个人信息更新成功'));

    } catch (e: any) {
        console.error('Update profile error:', e);
        return jsonResponse(error(500, e.message || 'Internal Server Error'), 500);
    }
}
