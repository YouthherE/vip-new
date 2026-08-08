import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getChinaTime } from '@/lib/utils/time';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // 1. Summary Cards
        const totalMembersResult = await db.prepare('SELECT COUNT(*) as count FROM members').first<{ count: number }>();
        const totalMembers = totalMembersResult?.count || 0;

        // Today's Sales (Balance Consumption) — using China time (UTC+8)
        const todayDate = getChinaTime().substring(0, 10);
        const todaySalesResult = await db.prepare(`
            SELECT SUM(ABS(amount)) as total
            FROM transactions
            WHERE type = 'balance'
            AND amount < 0
            AND date(created_at) = ?
        `).bind(todayDate).first<{ total: number }>();
        const todaySales = todaySalesResult?.total || 0;

        const totalPointsResult = await db.prepare('SELECT SUM(points) as total FROM members').first<{ total: number }>();
        const totalPoints = totalPointsResult?.total || 0;

        // Active Members (Transactions in last 7 days) — using China time
        const chinaNow = new Date(getChinaTime());
        const sixDaysAgoDate = new Date(chinaNow);
        sixDaysAgoDate.setDate(chinaNow.getDate() - 6);
        const sixDaysAgoStr = sixDaysAgoDate.toISOString().split('T')[0];
        const sevenDaysAgoDate2 = new Date(chinaNow);
        sevenDaysAgoDate2.setDate(chinaNow.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgoDate2.toISOString().split('T')[0];

        const activeMembersResult = await db.prepare(`
            SELECT COUNT(DISTINCT member_id) as count
            FROM transactions
            WHERE date(created_at) >= ?
        `).bind(sevenDaysAgoStr).first<{ count: number }>();
        const activeMembersCount = activeMembersResult?.count || 0;
        const activeRate = totalMembers > 0 ? ((activeMembersCount / totalMembers) * 100).toFixed(1) : 0;

        // 2. Member Growth (Last 7 Days) — using China time
        const memberGrowthResult = await db.prepare(`
            SELECT date(created_at) as date, COUNT(*) as count
            FROM members
            WHERE date(created_at) >= ?
            GROUP BY date(created_at)
            ORDER BY date(created_at)
        `).bind(sixDaysAgoStr).all<{ date: string, count: number }>();

        // Fill missing dates
        const memberGrowthData = [];
        const today = chinaNow;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = memberGrowthResult.results.find(r => r.date === dateStr);
            memberGrowthData.push({
                date: dateStr,
                count: found ? found.count : 0
            });
        }

        // 3. Transaction Volume (Last 7 Days) — using China time
        const transactionVolumeResult = await db.prepare(`
            SELECT
                date(created_at) as date,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as recharge,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as consumption
            FROM transactions
            WHERE type = 'balance'
            AND date(created_at) >= ?
            GROUP BY date(created_at)
            ORDER BY date(created_at)
        `).bind(sixDaysAgoStr).all<{ date: string, recharge: number, consumption: number }>();

        const transactionData = {
            dates: [] as string[],
            recharge: [] as number[],
            consumption: [] as number[]
        };

        // Fill dates for transactions too
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = transactionVolumeResult.results.find(r => r.date === dateStr);
            transactionData.dates.push(dateStr);
            transactionData.recharge.push(found ? found.recharge : 0);
            transactionData.consumption.push(found ? found.consumption : 0); // Consumption as positive for bar chart
        }

        // 4. Member Gender Distribution
        const genderResult = await db.prepare(`
            SELECT 
                gender,
                COUNT(*) as count
            FROM members
            GROUP BY gender
        `).all<{ gender: string, count: number }>();

        // 5. User Channel Distribution (User Persona)
        const channelResult = await db.prepare(`
            SELECT channel, COUNT(*) as count 
            FROM members 
            GROUP BY channel
        `).all<{ channel: string, count: number }>();

        return jsonResponse(success({
            summary: {
                totalMembers,
                todaySales,
                totalPoints,
                activeRate
            },
            charts: {
                memberGrowth: memberGrowthData,
                transactionVolume: transactionData,
                memberGender: genderResult.results,
                userChannel: channelResult.results
            }
        }));

    } catch (e: any) {
        console.error('Stats error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
