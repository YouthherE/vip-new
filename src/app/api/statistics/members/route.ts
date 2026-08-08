import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);

        const start = searchParams.get('start'); // YYYY-MM-DD
        const end = searchParams.get('end');     // YYYY-MM-DD

        // Default to last 30 days if not provided
        const endDate = end ? new Date(end) : new Date();
        const startDate = start ? new Date(start) : new Date();
        if (!start) {
            startDate.setDate(endDate.getDate() - 29);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Query member growth
        const query = `
            SELECT 
                date(created_at) as date,
                COUNT(*) as count
            FROM members 
            WHERE date(created_at) >= ? 
            AND date(created_at) <= ?
            GROUP BY date(created_at) 
            ORDER BY date(created_at)
        `;

        const results = await db.prepare(query).bind(startDateStr, endDateStr).all<{ date: string, count: number }>();

        // Fill missing dates
        const filledData = [];
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);

        // Map existing results for faster lookup
        const resultMap = new Map();
        results.results.forEach(r => resultMap.set(r.date, r));

        let totalNewMembers = 0;

        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const found = resultMap.get(dateStr);
            const count = found ? found.count : 0;

            filledData.push({
                date: dateStr,
                count
            });

            totalNewMembers += count;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Get total members count for reference
        const totalMembersResult = await db.prepare('SELECT COUNT(*) as count FROM members').first<{ count: number }>();
        const totalMembers = totalMembersResult?.count || 0;

        return jsonResponse(success({
            list: filledData,
            summary: {
                totalNewMembers,
                totalMembers,
                startDate: startDateStr,
                endDate: endDateStr
            }
        }));

    } catch (e: any) {
        console.error('Member stats error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
