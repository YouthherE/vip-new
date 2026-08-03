import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

function maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone || '';
    // Return first 3 and last 4 digits, middle masked
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { keyword } = body;

        if (!keyword || !keyword.trim()) {
            return jsonResponse(error(400, '请输入会员手机号或姓名'), 400);
        }

        const kw = keyword.trim();

        // Search by exact phone match OR name LIKE
        const result = await db.prepare(
            `SELECT id, name, phone, balance, status
             FROM members
             WHERE (phone = ? OR name LIKE ?)
               AND status = 'active'
             LIMIT 1`
        ).bind(kw, `%${kw}%`).first<any>();

        if (!result) {
            return jsonResponse(success({ found: false }, '未找到该会员'));
        }

        return jsonResponse(success({
            found: true,
            member_id: result.id,
            name: result.name,
            phone: maskPhone(result.phone),
            balance: result.balance,
        }));
    } catch (e: any) {
        console.error('Member lookup error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
