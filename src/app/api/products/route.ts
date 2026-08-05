import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { getChinaTime } from '@/lib/utils/time';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');

        // Pagination params
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '12');
        const offset = (page - 1) * pageSize;

        let baseQuery = 'FROM products';
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push('name LIKE ?');
            params.push(`%${search}%`);
        }

        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        // Count total
        const countResult = await db.prepare(`SELECT COUNT(*) as total ${baseQuery}`).bind(...params).first<any>();
        const total = countResult?.total || 0;

        // Get data
        const query = `SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const results = await db.prepare(query).bind(...params).all();

        return jsonResponse(success({
            list: results.results,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        }));
    } catch (e: any) {
        console.error('Get products error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { name, regular_price, member_price, image } = body;

        // Validation
        if (!name || !name.trim()) {
            return jsonResponse(error(400, '商品名称不能为空'), 400);
        }
        if (name.length > 50) {
            return jsonResponse(error(400, '商品名称不能超过50个字符'), 400);
        }
        if (regular_price === undefined || regular_price === null || regular_price < 0) {
            return jsonResponse(error(400, '普通价格不能为空且不能小于0'), 400);
        }
        if (member_price === undefined || member_price === null || member_price < 0) {
            return jsonResponse(error(400, '会员价格不能为空且不能小于0'), 400);
        }
        if (member_price > regular_price) {
            return jsonResponse(error(400, '会员价格不能高于普通价格'), 400);
        }

        const now = getChinaTime();
        const result = await db.prepare(
            'INSERT INTO products (name, regular_price, member_price, image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            name.trim(),
            regular_price,
            member_price,
            image || '',
            'listed',
            now,
            now
        ).run();

        if (!result.success) {
            return jsonResponse(error(500, '创建商品失败'), 500);
        }

        await writeOperationLog(request, db, {
            target_type: 'product',
            target_id: undefined,
            action: 'create',
            content: JSON.stringify({ name: name.trim(), regular_price, member_price }),
        });

        return jsonResponse(success(null, '商品上架成功'));
    } catch (e: any) {
        console.error('Create product error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function PUT(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { id, name, regular_price, member_price, image } = body;

        if (!id) {
            return jsonResponse(error(400, '商品ID不能为空'), 400);
        }

        // Check if product exists
        const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<any>();
        if (!product) {
            return jsonResponse(error(404, '商品不存在'), 404);
        }

        // Validation
        if (!name || !name.trim()) {
            return jsonResponse(error(400, '商品名称不能为空'), 400);
        }
        if (name.length > 50) {
            return jsonResponse(error(400, '商品名称不能超过50个字符'), 400);
        }
        if (regular_price === undefined || regular_price === null || regular_price < 0) {
            return jsonResponse(error(400, '普通价格不能为空且不能小于0'), 400);
        }
        if (member_price === undefined || member_price === null || member_price < 0) {
            return jsonResponse(error(400, '会员价格不能为空且不能小于0'), 400);
        }
        if (member_price > regular_price) {
            return jsonResponse(error(400, '会员价格不能高于普通价格'), 400);
        }

        const result = await db.prepare(`
            UPDATE products
            SET name = ?, regular_price = ?, member_price = ?, image = ?, updated_at = ?
            WHERE id = ?
        `).bind(
            name.trim(),
            regular_price,
            member_price,
            image || '',
            getChinaTime(),
            id
        ).run();

        if (!result.success) {
            return jsonResponse(error(500, '更新商品失败'), 500);
        }

        await writeOperationLog(request, db, {
            target_type: 'product',
            target_id: id,
            action: 'update',
            content: JSON.stringify({ name: name.trim(), regular_price, member_price }),
        });

        return jsonResponse(success(null, '商品更新成功'));
    } catch (e: any) {
        console.error('Update product error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function DELETE(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return jsonResponse(error(400, '商品ID不能为空'), 400);
        }

        // Check if product exists
        const product = await db.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
        if (!product) {
            return jsonResponse(error(404, '商品不存在'), 404);
        }

        // Delete the product
        const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

        if (!result.success) {
            return jsonResponse(error(500, '删除商品失败'), 500);
        }

        await writeOperationLog(request, db, {
            target_type: 'product',
            target_id: id,
            action: 'delete',
            content: JSON.stringify({ product_name: product.name }),
        });

        return jsonResponse(success(null, '商品删除成功'));
    } catch (e: any) {
        console.error('Delete product error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
