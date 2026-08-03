import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword');

        let query = "SELECT id, name, image, regular_price, member_price FROM products WHERE status = 'listed'";
        const params: any[] = [];

        if (keyword && keyword.trim()) {
            query += ' AND name LIKE ?';
            params.push(`%${keyword.trim()}%`);
        }

        query += ' ORDER BY id DESC';

        const results = await db.prepare(query).bind(...params).all();

        // Map field names to match the API spec: image → cover_image, regular_price → normal_price
        const list = results.results.map((row: any) => ({
            id: row.id,
            name: row.name,
            cover_image: row.image || '',
            normal_price: row.regular_price,
            member_price: row.member_price,
        }));

        return jsonResponse(success({ list }));
    } catch (e: any) {
        console.error('Get cashier products error:', e);
        return jsonResponse({ code: 500, message: e.message, data: null }, 500);
    }
}
