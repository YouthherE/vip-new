import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword } from '@/lib/utils/password';
import { verifyJWT } from '@/lib/utils/jwt';
import { getChinaTime } from '@/lib/utils/time';

/** 从 Authorization header 中提取 token 并验证用户身份 */
async function authenticate(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token);
  if (!payload || !payload.id) return null;

  return payload.id as number;
}

/** GET /api/user/profile - 获取当前登录用户的最新资料 */
export async function GET(request: Request) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return jsonResponse(error(401, 'Unauthorized'), 401);
    }

    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const user = await db
      .prepare('SELECT id, username, avatar, email, phone, address, bio, role, status, created_at, updated_at FROM users WHERE id = ?')
      .bind(userId)
      .first() as Record<string, unknown> | null;

    if (!user) {
      return jsonResponse(error(404, '用户不存在'), 404);
    }

    return jsonResponse(success(user));
  } catch (e: unknown) {
    console.error('Get profile error:', e);
    return jsonResponse(error(500, (e as Error).message || 'Internal Server Error'), 500);
  }
}

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
        const { username, password, email, phone, address, bio } = body;

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
        let updateQuery = 'UPDATE users SET username = ?, updated_at = ?';
        const now = getChinaTime();
        const params: any[] = [username, now];

        // Extended profile fields
        if (email !== undefined) {
            updateQuery += ', email = ?';
            params.push(email);
        }
        if (phone !== undefined) {
            updateQuery += ', phone = ?';
            params.push(phone);
        }
        if (address !== undefined) {
            updateQuery += ', address = ?';
            params.push(address);
        }
        if (bio !== undefined) {
            updateQuery += ', bio = ?';
            params.push(bio);
        }

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
        const updatedUser = await db.prepare('SELECT id, username, avatar, email, phone, address, bio, status, created_at, updated_at FROM users WHERE id = ?').bind(userId).first();

        return jsonResponse(success(updatedUser, '个人信息更新成功'));

    } catch (e: any) {
        console.error('Update profile error:', e);
        return jsonResponse(error(500, e.message || 'Internal Server Error'), 500);
    }
}
