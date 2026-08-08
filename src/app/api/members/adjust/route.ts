import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { getChinaTime } from '@/lib/utils/time';

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { memberId, type, amount, remark, paymentMethod } = body;

        if (!memberId || !type || amount === undefined) {
            return jsonResponse(error(400, '缺少必要字段'), 400);
        }

        if (type !== 'balance' && type !== 'points') {
            return jsonResponse(error(400, '无效的变动类型'), 400);
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount === 0) {
             return jsonResponse(error(400, '无效的金额/积分'), 400);
        }

        // 充值仅允许正向金额
        if (numAmount <= 0) {
             return jsonResponse(error(400, '充值金额必须大于0'), 400);
        }

        // Get current member info
        const member = await db.prepare('SELECT * FROM members WHERE id = ?').bind(memberId).first<any>();
        if (!member) {
            return jsonResponse(error(404, '会员不存在'), 404);
        }

        // Calculate new balance/points
        let newBalance = member.balance;
        let newPoints = member.points;
        let balanceAfter = 0;

        if (type === 'balance') {
            newBalance = (member.balance || 0) + numAmount;
            balanceAfter = newBalance;
        } else {
            newPoints = (member.points || 0) + numAmount;
            balanceAfter = newPoints;
        }

        const payment = paymentMethod || '';
        const txRemark = payment ? `[${payment === 'cash' ? '现金' : '手机支付'}] ${remark || ''}` : (remark || '');

        // Use batch execution for transaction-like behavior (D1 supports batch)
        const now = getChinaTime();
        const batch = [
            db.prepare(`UPDATE members SET ${type} = ?, updated_at = ? WHERE id = ?`).bind(balanceAfter, now, memberId),
            db.prepare('INSERT INTO transactions (member_id, type, amount, balance_after, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(memberId, type, numAmount, balanceAfter, txRemark, now)
        ];

        const results = await db.batch(batch);
        
        // Check if all succeeded
        const allSuccess = results.every(r => r.success);
        if (!allSuccess) {
             return jsonResponse(error(500, '变动处理失败'), 500);
        }

        await writeOperationLog(request, db, {
            target_type: 'member',
            target_id: memberId,
            action: 'recharge',
            content: JSON.stringify({ type, amount: numAmount, balanceAfter, remark, paymentMethod: payment }),
        });

        return jsonResponse(success({ balanceAfter }, '变动记录添加成功'));

    } catch (e: any) {
        console.error('Adjust error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
