import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);

        const start = searchParams.get('start'); // YYYY-MM-DD
        const end = searchParams.get('end');     // YYYY-MM-DD
        const type = searchParams.get('type') || 'all'; // all, recharge, consume
        const memberQuery = searchParams.get('member'); // name or phone

        // Default to last 30 days if not provided
        const endDate = end ? new Date(end) : new Date();
        const startDate = start ? new Date(start) : new Date();
        if (!start) {
            startDate.setDate(endDate.getDate() - 29);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        let query = `
            SELECT 
                date(t.created_at) as date,
                SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as recharge,
                SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as consumption,
                COUNT(*) as count
            FROM transactions t
        `;

        const params: any[] = [];

        // Join members table if searching by member
        if (memberQuery) {
            query += ` JOIN members m ON t.member_id = m.id `;
        }

        query += ` WHERE t.type = 'balance' 
            AND date(t.created_at) >= ? 
            AND date(t.created_at) <= ?
        `;
        params.push(startDateStr, endDateStr);

        if (type === 'recharge') {
            query += ' AND t.amount > 0';
        } else if (type === 'consume') {
            query += ' AND t.amount < 0';
        }

        if (memberQuery) {
            query += ` AND (m.name LIKE ? OR m.phone LIKE ?)`;
            params.push(`%${memberQuery}%`, `%${memberQuery}%`);
        }

        query += ' GROUP BY date(t.created_at) ORDER BY date(t.created_at)';

        const results = await db.prepare(query).bind(...params).all<{ date: string, recharge: number, consumption: number, count: number }>();

        // Fill missing dates
        const filledData = [];
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);

        // Map existing results for faster lookup
        const resultMap = new Map();
        results.results.forEach(r => resultMap.set(r.date, r));

        let totalRecharge = 0;
        let totalConsumption = 0;
        let totalCount = 0;

        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const found = resultMap.get(dateStr);

            const recharge = found ? found.recharge : 0;
            const consumption = found ? found.consumption : 0;
            const count = found ? found.count : 0;

            filledData.push({
                date: dateStr,
                recharge,
                consumption,
                count
            });

            totalRecharge += recharge;
            totalConsumption += consumption;
            totalCount += count;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return jsonResponse(success({
            list: filledData,
            summary: {
                totalRecharge,
                totalConsumption,
                netIncome: totalRecharge - totalConsumption,
                totalCount,
                startDate: startDateStr,
                endDate: endDateStr,
                memberQuery: memberQuery || null
            }
        }));

    } catch (e: any) {
        console.error('Transaction stats error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
