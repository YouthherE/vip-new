import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, jsonResponse } from '@/lib/utils/response';

/**
 * 扫码枪扫描商品条码 → 查询商品
 * GET /api/cashier/products/scan?code=xxx
 */
export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code || !code.trim()) {
            return jsonResponse({ code: 400, message: '缺少条码参数', data: null }, 400);
        }

        const row = await db
            .prepare('SELECT id, name, image, regular_price, member_price, status, code FROM products WHERE code = ? LIMIT 1')
            .bind(code.trim())
            .first<{ id: number; name: string; image: string; regular_price: number; member_price: number; status: string; code: string }>();

        if (!row) {
            return jsonResponse({ code: 404, message: '未找到对应商品，请检查条码', data: null }, 404);
        }

        if (row.status !== 'listed') {
            return jsonResponse({ code: 400, message: `商品「${row.name}」已下架，无法购买`, data: null }, 400);
        }

        return jsonResponse(success({
            id: row.id,
            name: row.name,
            cover_image: row.image || '',
            normal_price: row.regular_price,
            member_price: row.member_price,
        }));
    } catch (e: unknown) {
        const err = e as Error;
        return jsonResponse({ code: 500, message: err.message, data: null }, 500);
    }
}
