/**
 * 票据打印服务
 * 统一收银台出票 & 订单中心补打的 HTML 生成与打印逻辑
 */

export interface TicketItem {
  product_id: number;
  product_name: string;
  quantity: number;
  normal_price: number;
  member_price: number;
  sold_price: number;
  price_type: string;
  subtotal: number;
  entry_count: number;
}

export interface TicketData {
  order_no: string;
  price_type: 'normal' | 'member';
  total_amount: number;
  item_count: number;
  created_at: string;
  items: TicketItem[];
  member_name?: string;
  member_phone?: string;
  balance_before?: number;
  balance_after?: number;
  payment_method?: string;
}

function maskPhone(phone?: string): string {
  if (!phone || phone.length < 7) return phone || '';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

function getEntryDate(checkoutResult: TicketData): string {
  const created = checkoutResult.created_at;
  if (!created) return '';
  if (typeof created === 'string' && created.includes('T')) {
    return created.split('T')[0];
  }
  if (typeof created === 'string' && created.includes(' ')) {
    return created.split(' ')[0];
  }
  return typeof created === 'number'
    ? new Date(created).toISOString().split('T')[0]
    : String(created).split('T')[0].split(' ')[0];
}

function getWeekDay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  } catch {
    return '';
  }
}

export function generateTicketHtml(data: TicketData): string {
  const checkoutResult = data;
  const entryDateStr = getEntryDate(checkoutResult);
  const weekDay = getWeekDay(entryDateStr);
  const totalHeads = checkoutResult.items.reduce((sum, i) => sum + i.quantity, 0);

  // ── Visitor items ──
  const visitorItemsHtml = checkoutResult.items
    .map(i => {
      const seqLine = i.entry_count > 0
        ? `<div style="font-size:8px;color:#666">NO.${i.entry_count}</div>`
        : '';
      return `<div style="margin:1px 0;font-size:9px">${i.product_name} ×${i.quantity}${seqLine}</div>`;
    })
    .join('');

  // ── Price items ──
  const priceItemsHtml = checkoutResult.items
    .map(i => {
      const unit = i.sold_price;
      const label = i.price_type === 'member' ? '会员价' : '普通价';
      return `<div style="display:flex;justify-content:space-between;font-size:8px">
        <span>${i.product_name} ×${i.quantity}(${label})</span>
        <span>¥${unit.toFixed(2)}</span>
      </div>`;
    })
    .join('');

  // ── Discount (member) ──
  const normalTotal = checkoutResult.items.reduce(
    (sum, i) => sum + i.normal_price * i.quantity, 0,
  );
  const discountHtml = checkoutResult.price_type === 'member' && normalTotal > checkoutResult.total_amount
    ? `<div style="display:flex;justify-content:space-between;font-size:8px;color:#e11d48;margin-top:1px">
        <span>会员优惠</span><span>-¥${(normalTotal - checkoutResult.total_amount).toFixed(2)}</span>
      </div>`
    : '';

  // ── Member info ──
  let memberHtml = '';
  if (checkoutResult.price_type === 'member') {
    memberHtml = `
<div style="padding:2px 0;font-size:8px;line-height:1.5">
  <div style="display:flex;justify-content:space-between">
    <span>会员：${checkoutResult.member_name || ''} (${maskPhone(checkoutResult.member_phone) || ''})</span>
    <span>余额 ¥${(checkoutResult.balance_before ?? 0).toFixed(2)} → ¥${(checkoutResult.balance_after ?? 0).toFixed(2)}</span>
  </div>
</div>`;
  }

  // ── Metadata ──
  const printTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const qrData = encodeURIComponent(`order:${checkoutResult.order_no}`);
  const operatorHtml = '';

  const phoneHtml = '';
  const addressHtml = '';

  const paymentLabel = checkoutResult.price_type === 'member' ? '会员余额' : (checkoutResult.payment_method === 'wechat' ? '微信支付' : checkoutResult.payment_method === 'alipay' ? '支付宝' : '现金');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${checkoutResult.order_no}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { font-family:'PingFang SC','Microsoft YaHei',sans-serif; max-width:280px; margin:0 auto; padding:6px; color:#222; -webkit-print-color-adjust:exact; print-color-adjust:exact }
  .dot { border-top:1px dashed #bbb; margin:4px 0 }
  .bar { border-top:1px solid #333; margin:3px 0 }
  @media print { body { padding:2px } }
</style>
</head>
<body>

<div style="text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px">🎢 云端乐园</div>
<div style="text-align:center;font-size:10px;color:#555">电子票据 · ${checkoutResult.price_type === 'member' ? '会员票' : '散客票'}</div>
<div class="dot"></div>

<div style="display:flex;justify-content:space-between;font-size:9px">
  <span>单号 ${checkoutResult.order_no}</span>
  <span>${paymentLabel}</span>
</div>
<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px">
  <span style="font-size:8px;color:#999">入园日期 </span>
  <span style="font-size:14px;font-weight:bold">${entryDateStr}</span>
  <span style="font-size:9px;color:#666"> 星期${weekDay}</span>
</div>
<div class="dot"></div>

<table style="width:100%;border-collapse:collapse;font-size:9px;line-height:1.4">
  <tbody>
    <tr>
      <td style="width:55%;vertical-align:top;padding-right:4px">
        <div style="font-weight:bold;font-size:9px;margin-bottom:1px">游客信息</div>
        <div>${checkoutResult.price_type === 'member' ? '会员票' : '散客票'} · ${totalHeads}位</div>
        ${visitorItemsHtml}
      </td>
      <td style="width:45%;vertical-align:top;border-left:1px dashed #ddd;padding-left:4px">
        <div style="font-weight:bold;font-size:9px;margin-bottom:1px">金额</div>
        ${priceItemsHtml}
        ${discountHtml}
        <div style="border-top:1px solid #333;margin:1px 0;display:flex;justify-content:space-between;font-weight:bold">
          <span>实付</span><span>¥${checkoutResult.total_amount.toFixed(2)}</span>
        </div>
      </td>
    </tr>
  </tbody>
</table>

${memberHtml}
<div class="dot"></div>

<div style="text-align:center;margin:3px 0">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${qrData}" width="65" height="65" style="display:inline-block;border:1px solid #ccc;padding:1px">
  <div style="font-size:8px;font-weight:bold;margin-top:1px">扫码入园</div>
  <div style="font-size:7px;color:#999">闸机扫码核销</div>
</div>
<div class="bar"></div>

${operatorHtml}

<div style="font-size:7px;color:#888;text-align:center;line-height:1.4">
  ${phoneHtml}
  ${addressHtml}
  <div>退票：未使用可退，过期作废</div>
</div>
<div class="dot"></div>

<div style="text-align:center;font-size:7px;color:#aaa">出票：${printTime}</div>

</body>
</html>`;

  return html;
}

export function printTicket(data: TicketData): void {
  const html = generateTicketHtml(data);
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
    // Auto-print immediately (onload may not fire for write)
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}
