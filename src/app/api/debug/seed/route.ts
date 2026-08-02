import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // Optional: Clear existing data
        // await db.prepare('DELETE FROM transactions').run();
        // await db.prepare('DELETE FROM members').run();

        const firstNames = ['明', '红', '强', '丽', '伟', '芳', '军', '娜', '洋', '敏', '杰', '静'];
        const lastNames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        const channels = ['wechat', 'web', 'referral', 'store'];
        
        const members = [];
        const transactions = [];

        // Generate 50 members
        for (let i = 0; i < 50; i++) {
            const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
            const phone = '1' + Math.floor(Math.random() * 10) + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
            const channel = channels[Math.floor(Math.random() * channels.length)];
            
            // Random created_at within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
            
            const points = Math.floor(Math.random() * 10000);
            const balance = Math.floor(Math.random() * 50000) / 100;

            members.push({
                name, phone, balance, points, channel, created_at: createdAt
            });
        }

        // Insert members and get IDs
        // Note: D1 doesn't return inserted IDs easily in batch. 
        // So we insert one by one or insert and then fetch.
        // For simplicity in this script, let's insert one by one to get ID for transactions.
        
        for (const m of members) {
            const res = await db.prepare(
                'INSERT INTO members (name, phone, balance, points, channel, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(m.name, m.phone, m.balance, m.points, m.channel, m.created_at).run();
            
            // Assuming we can get the ID, but run() returns meta. lastRowId is what we need.
            // Cloudflare D1 run() result has meta.last_row_id (snake_case in some versions, camelCase in others?)
            // Let's assume standard sqlite behavior or fetch it.
            // Safest is to fetch by phone.
            
            const memberRecord = await db.prepare('SELECT id FROM members WHERE phone = ?').bind(m.phone).first<{id: number}>();
            
            if (memberRecord) {
                const memberId = memberRecord.id;
                
                // Generate transactions for this member
                const txCount = Math.floor(Math.random() * 10) + 1;
                for (let j = 0; j < txCount; j++) {
                    const txDaysAgo = Math.floor(Math.random() * 30);
                    const txCreatedAt = new Date(Date.now() - txDaysAgo * 24 * 60 * 60 * 1000).toISOString();
                    
                    const types = ['balance', 'points'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    
                    let amount = 0;
                    let remark = '';
                    
                    if (type === 'balance') {
                        if (Math.random() > 0.4) {
                            // Payment
                            amount = -Math.floor(Math.random() * 500);
                            remark = '消费';
                        } else {
                            // Recharge
                            amount = Math.floor(Math.random() * 1000);
                            remark = '充值';
                        }
                    } else {
                        if (Math.random() > 0.3) {
                            // Gain points
                            amount = Math.floor(Math.random() * 100);
                            const remarks = ['签到', '消费赠送', '活动奖励'];
                            remark = remarks[Math.floor(Math.random() * remarks.length)];
                        } else {
                            // Use points
                            amount = -Math.floor(Math.random() * 50);
                            remark = '积分兑换';
                        }
                    }
                    
                    await db.prepare(
                        'INSERT INTO transactions (member_id, type, amount, balance_after, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)'
                    ).bind(memberId, type, amount, 0, remark, txCreatedAt).run();
                }
            }
        }

        return jsonResponse(success({ count: members.length }, 'Test data generated successfully'));
    } catch (e: any) {
        return jsonResponse(error(500, e.message), 500);
    }
}
