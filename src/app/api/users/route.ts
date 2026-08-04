import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, jsonResponse } from '@/lib/utils/response';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const results = await db.prepare(
            'SELECT id, username, avatar, status, created_at FROM users ORDER BY id'
        ).all();

        return jsonResponse(success(results.results));
    } catch (e: any) {
        return jsonResponse({ code: 500, message: e.message, data: null }, 500);
    }
}
