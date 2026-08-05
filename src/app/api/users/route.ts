import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { hashPassword } from '@/lib/utils/password';
import { verifyJWT } from '@/lib/utils/jwt';
import { getChinaTime } from '@/lib/utils/time';
import { writeOperationLog } from '@/lib/utils/logger';

const ROLE_MAP: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '普通管理员',
  operator: '运营人员',
};

function getRoleLabel(role: string): string {
  return ROLE_MAP[role] || role;
}

function getAuthTokenId(request: Request): { token: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return { token: authHeader.split(' ')[1] };
}

async function getAuthUserInfo(request: Request, db: any) {
  const authInfo = getAuthTokenId(request);
  if (!authInfo) return null;
  const payload = await verifyJWT(authInfo.token);
  if (!payload?.id) return null;
  const user = await db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .bind(payload.id)
    .first() as { id: number; role: string } | null;
  return user;
}

// GET /api/users - 员工列表（搜索、筛选、分页、排序）
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const validSortColumns = ['username', 'role', 'status', 'created_at'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR phone LIKE ?)';
      const likeStr = `%${search}%`;
      params.push(likeStr, likeStr);
    }

    if (role) {
      whereClause += ` AND role = ?`;
      params.push(role);
    }

    if (status !== '') {
      whereClause += ` AND status = ?`;
      params.push(parseInt(status));
    }

    // 总数
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`)
      .bind(...params)
      .first() as { total: number } | null;

    const total = countResult?.total || 0;

    // 列表
    const offset = (page - 1) * pageSize;
    const list = await db
      .prepare(
        `SELECT id, username, role, avatar, phone, email, status, created_at, updated_at
         FROM users ${whereClause}
         ORDER BY ${column} ${order}
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all();

    const rows = (list.results as any[]).map((u) => ({
      ...u,
      roleLabel: getRoleLabel(u.role),
    }));

    return jsonResponse(
      success({
        list: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (e: any) {
    console.error('GET /api/users error:', e);
    return jsonResponse(error(500, e.message || '服务器错误'), 500);
  }
}

// POST /api/users - 新增员工
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    // 认证 + 权限检查：仅超级管理员可新增员工
    const authUser = await getAuthUserInfo(request, db);
    if (!authUser) {
      return jsonResponse(error(401, '未授权'), 401);
    }
    if (authUser.role !== 'super_admin') {
      return jsonResponse(error(403, '无权限执行此操作'), 403);
    }
    const operatorId = authUser.id;

    const body = await request.json() as any;
    const { role, username, phone, password, status } = body;

    // 校验
    if (!role) {
      return jsonResponse(error(400, '角色不能为空'), 400);
    }
    if (!username || !username.trim()) {
      return jsonResponse(error(400, '账户名不能为空'), 400);
    }
    if (!password || password.length < 6) {
      return jsonResponse(error(400, '密码至少6位'), 400);
    }

    // 检查账户名唯一性
    const existing = await db
      .prepare('SELECT id FROM users WHERE username = ?')
      .bind(username.trim())
      .first();

    if (existing) {
      return jsonResponse(error(409, '账户名已存在，请更换'), 409);
    }

    // 检查手机号唯一性（如果填写了）
    if (phone && phone.trim()) {
      const phoneExisting = await db
        .prepare('SELECT id FROM users WHERE phone = ?')
        .bind(phone.trim())
        .first();
      if (phoneExisting) {
        return jsonResponse(error(409, '手机号已被其他账号绑定'), 409);
      }
    }

    const passwordHash = await hashPassword(password);
    const now = getChinaTime();

    const result = await db
      .prepare(
        `INSERT INTO users (username, role, phone, password_hash, status, created_at, updated_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        username.trim(),
        role,
        phone?.trim() || '',
        passwordHash,
        status !== undefined ? status : 1,
        now,
        now,
        operatorId
      )
      .run();

    if (!result.success) {
      return jsonResponse(error(500, '创建失败'), 500);
    }

    // 记录操作日志
    try {
      await writeOperationLog(request, db, {
        target_type: 'user',
        target_id: result.meta?.last_row_id as any,
        action: 'create',
        content: `新增员工：${username.trim()}`,
      });
    } catch {} // 日志写入失败不影响主流程

    return jsonResponse(success(null, '员工添加成功'));
  } catch (e: any) {
    console.error('POST /api/users error:', e);
    return jsonResponse(error(500, e.message || '服务器错误'), 500);
  }
}

// PUT /api/users - 编辑员工
export async function PUT(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    // 认证 + 权限检查：仅超级管理员可编辑员工
    const authUser = await getAuthUserInfo(request, db);
    if (!authUser) {
      return jsonResponse(error(401, '未授权'), 401);
    }
    if (authUser.role !== 'super_admin') {
      return jsonResponse(error(403, '无权限执行此操作'), 403);
    }
    const operatorId = authUser.id;

    const body = await request.json() as any;
    const { id, role, phone, password, status } = body;

    if (!id) {
      return jsonResponse(error(400, '缺少员工ID'), 400);
    }
    if (!role) {
      return jsonResponse(error(400, '角色不能为空'), 400);
    }

    // 检查员工是否存在
    const user = await db
      .prepare('SELECT id, username FROM users WHERE id = ?')
      .bind(id)
      .first() as { id: number; username: string } | null;

    if (!user) {
      return jsonResponse(error(404, '员工不存在'), 404);
    }

    // 检查手机号唯一性
    if (phone && phone.trim()) {
      const phoneExisting = await db
        .prepare('SELECT id FROM users WHERE phone = ? AND id != ?')
        .bind(phone.trim(), id)
        .first();
      if (phoneExisting) {
        return jsonResponse(error(409, '手机号已被其他账号绑定'), 409);
      }
    }

    const now = getChinaTime();
    let updateFields = 'role = ?, phone = ?, status = ?, updated_at = ?, updated_by = ?';
    const params: any[] = [
      role,
      phone?.trim() || '',
      status,
      now,
      operatorId,
    ];

    // 密码可选
    if (password && password.length >= 6) {
      const passwordHash = await hashPassword(password);
      updateFields += ', password_hash = ?';
      params.push(passwordHash);
    }

    params.push(id);

    const result = await db
      .prepare(`UPDATE users SET ${updateFields} WHERE id = ?`)
      .bind(...params)
      .run();

    if (!result.success) {
      return jsonResponse(error(500, '更新失败'), 500);
    }

    // 记录操作日志
    try {
      await writeOperationLog(request, db, {
        target_type: 'user',
        target_id: id,
        action: 'update',
        content: `编辑员工：${user.username}`,
      });
    } catch {} // 日志写入失败不影响主流程

    return jsonResponse(success(null, '员工信息更新成功'));
  } catch (e: any) {
    console.error('PUT /api/users error:', e);
    return jsonResponse(error(500, e.message || '服务器错误'), 500);
  }
}

// DELETE /api/users - 删除员工
export async function DELETE(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    // 认证 + 权限检查：仅超级管理员可删除员工
    const authUser = await getAuthUserInfo(request, db);
    if (!authUser) {
      return jsonResponse(error(401, '未授权'), 401);
    }
    if (authUser.role !== 'super_admin') {
      return jsonResponse(error(403, '无权限执行此操作'), 403);
    }
    const operatorId = authUser.id;

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return jsonResponse(error(400, '缺少员工ID'), 400);
    }

    // 不能删除自己
    if (id === operatorId) {
      return jsonResponse(error(400, '不能删除自己的账号'), 400);
    }

    const user = await db
      .prepare('SELECT id, username FROM users WHERE id = ?')
      .bind(id)
      .first() as { id: number; username: string } | null;

    if (!user) {
      return jsonResponse(error(404, '员工不存在'), 404);
    }

    const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    if (!result.success) {
      return jsonResponse(error(500, '删除失败'), 500);
    }

    // 记录操作日志
    try {
      await writeOperationLog(request, db, {
        target_type: 'user',
        target_id: id,
        action: 'delete',
        content: `删除员工：${user.username}`,
      });
    } catch {} // 日志写入失败不影响主流程

    return jsonResponse(success(null, '员工已删除'));
  } catch (e: any) {
    console.error('DELETE /api/users error:', e);
    return jsonResponse(error(500, e.message || '服务器错误'), 500);
  }
}
