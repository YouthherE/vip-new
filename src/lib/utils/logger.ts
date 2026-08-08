import { verifyJWT } from '@/lib/utils/jwt';
import { getChinaTime } from '@/lib/utils/time';

interface LogEntry {
  target_type: string;
  target_id?: number | string;
  action: string;
  content?: string;
}

/**
 * Extract operator info from request Authorization header
 */
async function getOperator(request: Request): Promise<{ id: number; username: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token);
    if (!payload) return null;
    return {
      id: (payload.id as number) || 0,
      username: (payload.username as string) || 'unknown',
    };
  } catch {
    return null;
  }
}

/**
 * Write an operation log to the product_operation_logs table
 */
export async function writeOperationLog(
  request: Request,
  db: any,
  entry: LogEntry
): Promise<void> {
  try {
    const operator = await getOperator(request);
    const content = entry.content
      ? (typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content))
      : null;

    await db.prepare(
      `INSERT INTO product_operation_logs (target_type, target_id, operator_id, action, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      entry.target_type,
      entry.target_id || null,
      operator?.id || 0,
      entry.action,
      content,
      getChinaTime()
    ).run();
  } catch (e) {
    // Log silently - don't break the main operation
    console.error('Failed to write operation log:', e);
  }
}
