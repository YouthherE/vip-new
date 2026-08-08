import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getChinaTime } from '@/lib/utils/time';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const chinaNow = new Date(getChinaTime());

        // Date range: last 12 months
        const twelveMonthsAgo = new Date(chinaNow);
        twelveMonthsAgo.setMonth(chinaNow.getMonth() - 12);
        const startDate = twelveMonthsAgo.toISOString().split('T')[0];

        // ── 1. 趋势变化（营收、订单）─ 12 months, monthly ──
        const rawTrend = await db.prepare(`
            SELECT 
                substr(date(created_at), 1, 7) as month,
                SUM(CASE WHEN type = 'balance' AND amount < 0 THEN ABS(amount) ELSE 0 END) as revenue,
                COUNT(CASE WHEN type = 'balance' AND amount < 0 THEN 1 END) as orders
            FROM transactions
            WHERE date(created_at) >= ?
            GROUP BY substr(date(created_at), 1, 7)
            ORDER BY month ASC
        `).bind(startDate).all<{ month: string; revenue: number; orders: number }>();

        // Fill missing months
        const revenueTrend = { months: [] as string[], revenue: [] as number[], orders: [] as number[] };
        for (let i = 11; i >= 0; i--) {
            const d = new Date(chinaNow);
            d.setMonth(d.getMonth() - i);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const found = rawTrend.results.find(r => r.month === m);
            revenueTrend.months.push(m);
            revenueTrend.revenue.push(found ? Math.round(found.revenue * 100) / 100 : 0);
            revenueTrend.orders.push(found ? (found.orders || 0) : 0);
        }

        // ── 2. 对比分析（各渠道订单）──
        const channelOrderRaw = await db.prepare(`
            SELECT 
                COALESCE(m.channel, '未知') as channel,
                COUNT(CASE WHEN t.type = 'balance' AND t.amount < 0 THEN 1 END) as order_count,
                ROUND(SUM(CASE WHEN t.type = 'balance' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 2) as amount
            FROM members m
            LEFT JOIN transactions t ON t.member_id = m.id
            GROUP BY m.channel
            ORDER BY order_count DESC
        `).all<{ channel: string; order_count: number; amount: number }>();

        const channelOrders = channelOrderRaw.results.map(r => ({
            channel: r.channel || '未知',
            orderCount: r.order_count || 0,
            amount: r.amount || 0,
        }));

        // ── 3. 占比分析（会员等级分布 - 按余额划分）──
        const tierRaw = await db.prepare(`
            SELECT 
                CASE 
                    WHEN balance <= 0 THEN '0:零余额'
                    WHEN balance < 100 THEN '1:普通会员(<100)'
                    WHEN balance < 500 THEN '2:银卡会员(100-500)'
                    WHEN balance < 2000 THEN '3:金卡会员(500-2000)'
                    ELSE '4:钻石会员(2000+)'
                END as tier,
                COUNT(*) as count
            FROM members
            GROUP BY tier
            ORDER BY tier ASC
        `).all<{ tier: string; count: number }>();

        const tierLabelMap: Record<string, string> = {
            '0:零余额': '零余额',
            '1:普通会员(<100)': '普通会员',
            '2:银卡会员(100-500)': '银卡会员',
            '3:金卡会员(500-2000)': '金卡会员',
            '4:钻石会员(2000+)': '钻石会员',
        };

        const memberTiers = tierRaw.results.map(r => ({
            name: tierLabelMap[r.tier] || r.tier.replace(/^\d:/, ''),
            value: r.count,
        }));

        // ── 4. 多维度对比（各月营收 vs 充值）──
        const multiMetricRaw = await db.prepare(`
            SELECT 
                substr(date(created_at), 1, 7) as month,
                SUM(CASE WHEN type = 'balance' AND amount < 0 THEN ABS(amount) ELSE 0 END) as revenue,
                SUM(CASE WHEN type = 'balance' AND amount > 0 THEN amount ELSE 0 END) as recharge
            FROM transactions
            WHERE type = 'balance' AND date(created_at) >= ?
            GROUP BY substr(date(created_at), 1, 7)
            ORDER BY month ASC
        `).bind(startDate).all<{ month: string; revenue: number; recharge: number }>();

        const multiMetric = { months: [] as string[], revenue: [] as number[], recharge: [] as number[] };
        for (let i = 11; i >= 0; i--) {
            const d = new Date(chinaNow);
            d.setMonth(d.getMonth() - i);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const found = multiMetricRaw.results.find(r => r.month === m);
            multiMetric.months.push(m);
            multiMetric.revenue.push(found ? Math.round(found.revenue * 100) / 100 : 0);
            multiMetric.recharge.push(found ? Math.round(found.recharge * 100) / 100 : 0);
        }

        // ── 5. 数据分布（交易频次分布 - 直方图）──
        const freqRaw = await db.prepare(`
            SELECT 
                CASE 
                    WHEN cnt = 1 THEN '1:1次'
                    WHEN cnt <= 3 THEN '2:2-3次'
                    WHEN cnt <= 5 THEN '3:4-5次'
                    WHEN cnt <= 10 THEN '4:6-10次'
                    ELSE '5:10次以上'
                END as freq,
                COUNT(*) as count
            FROM (
                SELECT member_id, COUNT(*) as cnt
                FROM transactions
                WHERE type = 'balance'
                GROUP BY member_id
            ) sub
            GROUP BY freq
            ORDER BY freq ASC
        `).all<{ freq: string; count: number }>();

        const freqLabelMap: Record<string, string> = {
            '1:1次': '1次',
            '2:2-3次': '2-3次',
            '3:4-5次': '4-5次',
            '4:6-10次': '6-10次',
            '5:10次以上': '10次以上',
        };

        const activityDistribution = freqRaw.results.map(r => ({
            name: freqLabelMap[r.freq] || r.freq.replace(/^\d:/, ''),
            value: r.count,
        }));

        // ── 6. 排名（Top10 消费会员）──
        const top10Raw = await db.prepare(`
            SELECT 
                m.id,
                m.name,
                m.phone,
                COUNT(t.id) as txn_count,
                ROUND(SUM(ABS(t.amount)), 2) as total_spent
            FROM transactions t
            JOIN members m ON t.member_id = m.id
            WHERE t.type = 'balance' AND t.amount < 0
            GROUP BY m.id, m.name, m.phone
            ORDER BY total_spent DESC
            LIMIT 10
        `).all<{ id: number; name: string; phone: string; txn_count: number; total_spent: number }>();

        const top10Members = top10Raw.results.map((r, i) => ({
            rank: i + 1,
            id: r.id,
            name: r.name || '未知',
            phone: (r.phone || '').replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
            txnCount: r.txn_count,
            totalSpent: r.total_spent,
        }));

        // ── 7. 转化漏斗 ──
        const funnelRaw = await db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM members) as total,
                COUNT(DISTINCT t.member_id) as purchased,
                (SELECT COUNT(DISTINCT member_id) FROM (
                    SELECT member_id, COUNT(*) as cnt FROM transactions WHERE type = 'balance' AND amount < 0 GROUP BY member_id
                ) sub WHERE cnt >= 3) as repeat3,
                (SELECT COUNT(DISTINCT member_id) FROM (
                    SELECT member_id, COUNT(*) as cnt FROM transactions WHERE type = 'balance' AND amount < 0 GROUP BY member_id
                ) sub WHERE cnt >= 5) as repeat5
            FROM transactions t
            WHERE t.type = 'balance' AND t.amount < 0
        `).first<{ total: number; purchased: number; repeat3: number; repeat5: number }>();

        const conversionFunnel = [
            { name: '注册会员', value: funnelRaw?.total || 0 },
            { name: '有过消费', value: funnelRaw?.purchased || 0 },
            { name: '消费≥3次', value: funnelRaw?.repeat3 || 0 },
            { name: '消费≥5次', value: funnelRaw?.repeat5 || 0 },
        ];

        // ── 8. 地域分布（按渠道映射模拟地域 + 真实渠道数据作备用）──
        const regionRaw = await db.prepare(`
            SELECT 
                channel,
                COUNT(*) as count
            FROM members
            WHERE channel IS NOT NULL AND channel != ''
            GROUP BY channel
            ORDER BY count DESC
        `).all<{ channel: string; count: number }>();

        // Channel-to-region mapping for map display
        const channelRegionMap: Record<string, string> = {
            '推广': '广东',
            'referral': '浙江',
            '地推': '江苏',
            '线上活动': '北京',
            '老带新': '上海',
            '门店': '四川',
            '广告投放': '湖北',
            '合作渠道': '山东',
        };

        const regionCounts: Record<string, number> = {};
        for (const r of regionRaw.results) {
            const region = channelRegionMap[r.channel] || '其他';
            regionCounts[region] = (regionCounts[region] || 0) + r.count;
        }

        const regionDistribution = Object.entries(regionCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return jsonResponse(success({
            revenueTrend,
            channelOrders,
            memberTiers,
            multiMetric,
            activityDistribution,
            top10Members,
            conversionFunnel,
            regionDistribution,
        }));

    } catch (e: any) {
        console.error('Reports error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
