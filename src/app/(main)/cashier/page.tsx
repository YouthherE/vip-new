'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';
import {
  Search, X, Loader2, ShoppingCart, ImageIcon,
  Check, Circle, User, Phone, Wallet, AlertCircle,
  Minus, Plus, Printer, Banknote, Smartphone,
  ChevronRight, Barcode
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';

interface Product {
  id: number;
  name: string;
  cover_image: string;
  normal_price: number;
  member_price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface MemberInfo {
  found: boolean;
  member_id?: number;
  name?: string;
  phone?: string;
  balance?: number;
}

interface CheckoutResult {
  order_id: number;
  order_no: string;
  price_type: 'normal' | 'member';
  member_name?: string;
  member_phone?: string;
  total_amount: number;
  item_count: number;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
  items: CheckoutItem[];
}

interface CheckoutItem {
  product_id: number;
  product_name: string;
  sold_price: number;
  normal_price: number;
  member_price: number;
  quantity: number;
  subtotal: number;
  entry_count: number;
}

// ──── Print Ticket Component ────
// Print spec: 80mm × 60mm thermal receipt
function PrintTicketContent({ result }: { result: CheckoutResult }) {
  const ticketNo = result.order_no;
  const entryDate = new Date(result.created_at);
  const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[entryDate.getDay()];
  const printTime = result.created_at;
  const qrData = encodeURIComponent(`票号:${ticketNo}\n入园:${entryDateStr}`);

  const totalHeads = result.items.reduce((s, i) => s + i.quantity, 0);

  // Get current operator info from localStorage
  let operatorName = '';
  let operatorPhone = '';
  let operatorAddress = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      operatorName = user.username || '';
      operatorPhone = user.phone || '';
      operatorAddress = user.address || '';
    }
  } catch {}

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 1.5mm; size: 80mm 60mm; }
          body { margin: 0; padding: 0; }
        }
        .tk { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #000; }
        .tk-dot { border-top: 1px dashed #999; margin: 2px 0; }
        .tk-bar { border-top: 1.5px solid #333; margin: 2px 0; }
      `}</style>

      {/* Header */}
      <div className="tk" style={{ textAlign: 'center', marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>星光儿童乐园</span>
      </div>

      {/* Ticket Title + Entry Counts */}
      <div className="tk" style={{
        textAlign: 'center', fontWeight: 'bold', fontSize: '11px',
        padding: '1px 0', borderTop: '1.5px solid #333', borderBottom: '1.5px solid #333',
        letterSpacing: '3px', marginBottom: '2px'
      }}>
        入园人数:
        <span style={{ fontSize: '8px', fontWeight: 'normal', color: '#e53e3e', letterSpacing: '0' }}>
          {' '}{result.items.map(item => `${item.product_name} NO.${item.entry_count}`).join(' · ')}
        </span>
      </div>

      <div className="tk" style={{ textAlign: 'right', fontSize: '8px', color: '#666' }}>
        票号：{ticketNo}
      </div>

      <div className="tk-dot" />

      {/* Entry Date */}
      <div className="tk" style={{
        textAlign: 'center', background: '#f5f5f5',
        padding: '3px 0', margin: '2px 0'
      }}>
        <span style={{ fontSize: '8px', color: '#999' }}>入园日期 </span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{entryDateStr}</span>
        <span style={{ fontSize: '9px', color: '#666' }}> 星期{weekDay}</span>
      </div>

      <div className="tk-dot" />

      {/* Visitor + Price (compact table, 2 columns) */}
      <table className="tk" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', lineHeight: '1.4' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '1px' }}>游客信息</div>
              <div>{result.price_type === 'member' ? '🎫会员票' : '🎫散客票'} · {totalHeads}位</div>
              {result.items.map((item, i) => (
                <div key={i} style={{ fontSize: '8px', color: '#555' }}>
                  {item.product_name} ×{item.quantity}  #{item.entry_count}
                </div>
              ))}
            </td>
            <td style={{ width: '45%', verticalAlign: 'top', borderLeft: '1px dashed #ddd', paddingLeft: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '1px' }}>金额</div>
              {result.items.map((item, i) => {
                const itemRegularTotal = item.normal_price * item.quantity;
                const isMember = result.price_type === 'member';
                return (
                  <div key={i}>
                    {isMember && (
                      <div style={{ fontSize: '7px', display: 'flex', justifyContent: 'space-between', color: '#999', textDecoration: 'line-through' }}>
                        <span>{item.product_name.slice(0, 4)}</span>
                        <span>¥{itemRegularTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.product_name.slice(0, 4)}{isMember ? ' 会员' : ''}</span>
                      <span>¥{item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
              {result.price_type === 'member' && (
                <div style={{ fontSize: '7px', display: 'flex', justifyContent: 'space-between', color: '#e53e3e' }}>
                  <span>优惠</span>
                  <span>-¥{(result.items.reduce((s, i) => s + i.normal_price * i.quantity, 0) - result.total_amount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #333', margin: '1px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>实付</span>
                <span>¥{result.total_amount.toFixed(2)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Member info */}
      {result.price_type === 'member' && result.member_name && (
        <div className="tk" style={{ fontSize: '7px', marginTop: '2px', lineHeight: '1.4', color: '#888' }}>
          💳 {result.member_name}{result.member_phone ? ` · ${result.member_phone}` : ''}
          {result.balance_before !== undefined && (
            <span> · 扣款前 ¥{result.balance_before!.toFixed(2)} → 扣款后 ¥{result.balance_after!.toFixed(2)}</span>
          )}
        </div>
      )}

      <div className="tk-dot" />

      {/* QR Code */}
      <div className="tk" style={{ textAlign: 'center', margin: '3px 0' }}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${qrData}`}
          alt="入园码"
          width="65"
          height="65"
          style={{ display: 'inline-block', border: '1px solid #ccc', padding: '1px' }}
        />
        <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '1px' }}>扫码入园</div>
        <div style={{ fontSize: '7px', color: '#999' }}>闸机扫码核销</div>
      </div>

      <div className="tk-bar" />

      {/* Operator */}
      {operatorName && (
        <div className="tk" style={{ textAlign: 'center', fontSize: '7px', color: '#888', marginBottom: '2px' }}>
          操作人：{operatorName}
        </div>
      )}

      {/* Footer */}
      <div className="tk" style={{ fontSize: '7px', color: '#888', textAlign: 'center', lineHeight: '1.4' }}>
        {operatorPhone && <div>📞客服电话：{operatorPhone} · 当日有效仅限本人</div>}
        {operatorAddress && <div>📍{operatorAddress}</div>}
        <div>退票：未使用可退，过期作废</div>
      </div>

      <div className="tk-dot" />

      <div className="tk" style={{ textAlign: 'center', fontSize: '7px', color: '#aaa' }}>
        出票：{printTime}
      </div>
    </>
  );
}

export default function CashierPage() {
  const toast = useToast();

  // ──── Products ────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ──── Cart ────
  const [cart, setCart] = useState<Map<number, CartItem>>(new Map());

  // ──── Modals ────
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  // ──── Payment ────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [pendingPriceType, setPendingPriceType] = useState<'normal' | 'member'>('normal');
  const [payingOut, setPayingOut] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // ──── Member lookup ────
  const [memberKeyword, setMemberKeyword] = useState('');
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [lookingUpMember, setLookingUpMember] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  // ──── Entry Counts ────
  interface EntryCountItem { product_id: number; product_name: string; count: number; }
  const [entryCounts, setEntryCounts] = useState<{ date: string; list: EntryCountItem[]; total: number }>({ date: '', list: [], total: 0 });

  // ──── Barcode Scanner ────
  const [scanCode, setScanCode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanFeedback, setScanFeedback] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const fetchEntryCounts = useCallback(async () => {
    try {
      const res = await api.get('/cashier/entry-counts');
      if (res.data?.code === 200 && res.data?.data) {
        setEntryCounts(res.data.data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchEntryCounts();
  }, [fetchEntryCounts]);
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.keyword = search.trim();
      const res = await api.get('/cashier/products', { params });
      if (res.data.code === 200) {
        setProducts(res.data.data.list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // ──── Cart Operations ────
  const toggleProduct = (product: Product) => {
    setCart(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });
  };

  const isSelected = (productId: number) => cart.has(productId);

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const next = new Map(prev);
        next.delete(productId);
        return next;
      });
      return;
    }
    setCart(prev => {
      const next = new Map(prev);
      const item = next.get(productId);
      if (item) {
        next.set(productId, { ...item, quantity: Math.min(quantity, 99) });
      }
      return next;
    });
  };

  const clearCart = () => setCart(new Map());

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);

  const selectedCount = cartItems.reduce((s, c) => s + c.quantity, 0);

  const normalTotal = cartItems.reduce((s, c) => s + c.product.normal_price * c.quantity, 0);
  const memberTotal = cartItems.reduce((s, c) => s + c.product.member_price * c.quantity, 0);

  // For display: which total are we showing?
  const displayTotal = memberInfo?.found ? memberTotal : normalTotal;


  // ──── Member Lookup ────
  const handleLookupMember = async () => {
    if (!memberKeyword.trim()) {
      // Empty input: reset to normal price
      setMemberInfo(null);
      setLookupError('');
      return;
    }

    setLookingUpMember(true);
    setLookupError('');
    try {
      const res = await api.post('/cashier/member/lookup', { keyword: memberKeyword.trim() });
      if (res.data.code === 200) {
        if (res.data.data.found) {
          setMemberInfo(res.data.data);
        } else {
          setMemberInfo({ found: false });
          setLookupError('未找到该会员，请重新输入');
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setLookupError(err.response?.data?.message || '查询失败');
      setMemberInfo({ found: false });
    } finally {
      setLookingUpMember(false);
    }
  };

  const clearMember = () => {
    setMemberKeyword('');
    setMemberInfo(null);
    setLookupError('');
  };

  // ──── Checkout ────
  const handleCheckout = async (priceType: 'normal' | 'member') => {
    setCheckingOut(true);
    try {
      const body: {
        price_type: string;
        items: { product_id: number; quantity: number }[];
        member_id?: number;
      } = {
        price_type: priceType,
        items: cartItems.map(c => ({
          product_id: c.product.id,
          quantity: c.quantity,
        })),
      };

      if (priceType === 'member' && memberInfo?.member_id) {
        body.member_id = memberInfo.member_id;
      }

      const res = await api.post('/cashier/checkout', body);
      if (res.data.code === 200) {
        setCheckoutResult(res.data.data);
        setShowCheckout(false);
        setShowSuccess(true);
        clearCart();
        setMemberKeyword('');
        setMemberInfo(null);
        setLookupError('');
        fetchEntryCounts(); // 刷新入园计数
      } else {
        toast.error(res.data.message);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '购买失败');
    } finally {
      setCheckingOut(false);
    }
  };

  // ──── Payment Method Handlers ────
  const handleStartPayment = (priceType: 'normal' | 'member') => {
    setPendingPriceType(priceType);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleCashPayment = () => {
    setShowPaymentModal(false);
    handleCheckout(pendingPriceType);
  };

  const handleMobilePayment = () => {
    setShowScanner(true);
  };

  /** 扫码成功后 → 调用 micropay API */
  const handleScanSuccess = async (authCode: string) => {
    setShowScanner(false);
    setShowPaymentModal(false);
    setPayingOut(true);

    try {
      const payload: any = {
        auth_code: authCode,
        price_type: pendingPriceType,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };
      if (pendingPriceType === 'member' && memberInfo?.found) {
        payload.member_id = memberInfo.member_id;
      }

      const res = await api.post('/payment/micropay', payload);

      if (res.data?.code === 200 && res.data?.data) {
        const { order } = res.data.data;
        setCheckoutResult(order);
        setShowCheckout(false);
        setShowSuccess(true);
        clearCart();
        setMemberKeyword('');
        setMemberInfo(null);
        setLookupError('');
        fetchEntryCounts();
      } else {
        setPaymentError(res.data?.message || '支付失败');
        setShowPaymentModal(true); // 回到支付选择，可以重试
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '支付请求异常';
      setPaymentError(msg);
      setShowPaymentModal(true);
    } finally {
      setPayingOut(false);
    }
  };

  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setMemberKeyword('');
    setMemberInfo(null);
    setLookupError('');
    setShowCheckout(true);
  };

  // ──── Print ────
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // 弹窗打开时屏蔽扫码防止误触发
  const isModalOpen = showCheckout || showPaymentModal || showScanner || showSuccess || payingOut || showPrintPreview;

  // ──── Scan Input Auto-focus ────
  useEffect(() => {
    if (!isModalOpen && scanInputRef.current && document.activeElement !== scanInputRef.current) {
      const timer = setTimeout(() => scanInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // ──── Barcode Scan Handler ────
  const handleScanProduct = async () => {
    const code = scanCode.trim();
    if (!code || scanning || isModalOpen) return;

    setScanning(true);
    setScanFeedback('');
    try {
      const res = await api.get('/cashier/products/scan', { params: { code } });
      if (res.data.code === 200) {
        const product: Product = res.data.data;
        const existingInCart = cart.get(product.id);
        setCart(prev => {
          const next = new Map(prev);
          if (next.has(product.id)) {
            const item = next.get(product.id)!;
            next.set(product.id, { ...item, quantity: Math.min(item.quantity + 1, 99) });
          } else {
            next.set(product.id, { product, quantity: 1 });
          }
          return next;
        });
        const newQty = existingInCart ? Math.min(existingInCart.quantity + 1, 99) : 1;
        setScanFeedback(`${product.name} x${newQty}`);
        setScanStatus('success');
        scrollToProduct(product.id);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setScanFeedback(err.response?.data?.message || '未找到该商品');
      setScanStatus('error');
    } finally {
      setScanning(false);
      setScanCode('');
      setTimeout(() => {
        setScanStatus('idle');
        setScanFeedback('');
      }, 2500);
    }
  };

  // 扫码成功后滚动商品到可视区域
  const scrollToProduct = (productId: number) => {
    setTimeout(() => {
      const el = document.getElementById(`product-card-${productId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleContinue = () => {
    setShowSuccess(false);
    setCheckoutResult(null);
    setPaymentError('');
  };

  const handleOpenPrint = () => {
    setShowSuccess(false);
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    if (!checkoutResult) return;

    const ticketNo = checkoutResult.order_no;
    const entryDate = new Date(checkoutResult.created_at);
    const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[entryDate.getDay()];
    const printTime = checkoutResult.created_at;
    const totalHeads = checkoutResult.items.reduce((s, i) => s + i.quantity, 0);

    // Visitor items list
    const visitorItemsHtml = checkoutResult.items.map(item =>
      `<div style="font-size:8px;color:#555">${item.product_name} ×${item.quantity}</div>`
    ).join('');

    // Entry counts line
    const entryCountsLine = checkoutResult.items.map(item =>
      `${item.product_name} NO.${item.entry_count}`
    ).join(' · ');

    // Price items list (with dual pricing for members)
    const isMember = checkoutResult.price_type === 'member';
    const regularTotal = checkoutResult.items.reduce((s, i) => s + i.normal_price * i.quantity, 0);
    const priceItemsHtml = checkoutResult.items.map(item => {
      const itemRegularTotal = item.normal_price * item.quantity;
      let itemHtml = '';
      if (isMember) {
        itemHtml += `<div style="font-size:7px;display:flex;justify-content:space-between;color:#999;text-decoration:line-through"><span>${item.product_name.slice(0, 4)} 原价</span><span>¥${itemRegularTotal.toFixed(2)}</span></div>`;
      }
      itemHtml += `<div style="font-size:8px;display:flex;justify-content:space-between"><span>${item.product_name.slice(0, 4)}${isMember ? ' 会员' : ''}</span><span>¥${item.subtotal.toFixed(2)}</span></div>`;
      return itemHtml;
    }).join('');
    // Discount line
    const discountHtml = isMember
      ? `<div style="font-size:7px;display:flex;justify-content:space-between;color:#e53e3e"><span>优惠</span><span>-¥${(regularTotal - checkoutResult.total_amount).toFixed(2)}</span></div>`
      : '';

    // Member section (name + phone + balance on one line)
    let memberHtml = '';
    if (checkoutResult.price_type === 'member' && checkoutResult.member_name) {
      let line = `💳 ${checkoutResult.member_name}${checkoutResult.member_phone ? ' · ' + checkoutResult.member_phone : ''}`;
      if (checkoutResult.balance_before !== undefined) {
        line += ` · 扣款前 ¥${checkoutResult.balance_before!.toFixed(2)} → 扣款后 ¥${checkoutResult.balance_after!.toFixed(2)}`;
      }
      memberHtml = `<div style="font-size:7px;margin-top:2px;line-height:1.4;color:#888">${line}</div>`;
    }

    // Get current operator info
    let operatorName = '';
    let operatorPhone = '';
    let operatorAddress = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        operatorName = user.username || '';
        operatorPhone = user.phone || '';
        operatorAddress = user.address || '';
      }
    } catch {}

    const operatorHtml = operatorName ? `<div style="text-align:center;font-size:7px;color:#888;margin-bottom:2px">操作人：${operatorName}</div>` : '';
    const phoneHtml = operatorPhone ? `<div>📞客服电话：${operatorPhone} · 当日有效仅限本人</div>` : '';
    const addressHtml = operatorAddress ? `<div>📍${operatorAddress}</div>` : '';

    const qrData = encodeURIComponent(`票号:${ticketNo}\n入园:${entryDateStr}`);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'PingFang SC','Microsoft YaHei',sans-serif; color:#000; padding:3px; }
  @page { margin:1.5mm; size:80mm auto; }
  .dot { border-top:1px dashed #999; margin:2px 0; }
  .bar { border-top:1.5px solid #333; margin:2px 0; }
</style>
</head>
<body>

<div style="text-align:center;margin-bottom:2px">
  <span style="font-weight:bold;font-size:13px;letter-spacing:1px">星光儿童乐园</span>
</div>

<div style="text-align:center;font-weight:bold;font-size:11px;padding:1px 0;border-top:1.5px solid #333;border-bottom:1.5px solid #333;letter-spacing:3px;margin-bottom:2px">
  入园人数:<span style="font-size:8px;font-weight:normal;color:#e53e3e;letter-spacing:0">${entryCountsLine}</span>
</div>

<div style="text-align:right;font-size:8px;color:#666">票号：${ticketNo}</div>
<div class="dot"></div>

<div style="text-align:center;background:#f5f5f5;padding:3px 0;margin:2px 0">
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
        <div>${checkoutResult.price_type === 'member' ? '🎫会员票' : '🎫散客票'} · ${totalHeads}位</div>
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
  };

  const handleClosePrint = () => {
    setShowPrintPreview(false);
    setCheckoutResult(null);
  };

  // ──── Helper ────
  const formatPrice = (price: number) => `¥ ${price.toFixed(2)}`;

  const memberBalanceInsufficient = memberInfo?.found && memberInfo.balance !== undefined && memberInfo.balance < memberTotal;

  // ──── Render ────
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Header / Toolbar */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-lg text-slate-800">收银台</h2>
            </div>
            <div className="relative w-56">
              {loading && search ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              )}
              <input
                type="text"
                placeholder="搜索商品名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            {/* ──── Barcode Scanner ──── */}
            <div className="flex items-center gap-2">
              <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                scanStatus === 'success' ? 'bg-emerald-50 border-emerald-300' :
                scanStatus === 'error' ? 'bg-red-50 border-red-300' :
                isModalOpen ? 'bg-slate-100 border-slate-200 opacity-50' :
                'bg-slate-50 border-slate-200'
              }`}>
                <Barcode className={`w-4 h-4 transition-colors duration-300 ${
                  scanStatus === 'success' ? 'text-emerald-500' :
                  scanStatus === 'error' ? 'text-red-400' :
                  isModalOpen ? 'text-slate-300' :
                  scanning ? 'text-indigo-400 animate-pulse' : 'text-indigo-400 animate-pulse'
                }`} />
                <input
                  ref={scanInputRef}
                  type="text"
                  disabled={isModalOpen}
                  placeholder="扫码枪扫描条码..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScanProduct(); }}
                  className="w-36 bg-transparent text-sm outline-none placeholder-slate-400 disabled:cursor-not-allowed"
                />
                {scanning && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
              </div>
              {scanFeedback && (
                <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  scanStatus === 'success' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {scanFeedback}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Today's Entry Counts */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500">今日入园</span>
            {entryCounts.list.length === 0 ? (
              <span className="text-xs text-slate-400">暂无记录</span>
            ) : (
              <>
                {entryCounts.list.map(item => (
                  <span key={item.product_id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {item.product_name}
                    <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{item.count}</span>
                  </span>
                ))}
              </>
            )}
            {entryCounts.total > 0 && (
              <span className="ml-auto text-xs font-bold text-slate-600">
                合计 <span className="text-indigo-600 text-sm">{entryCounts.total}</span> 人
              </span>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm">暂无已上架的商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map((product) => {
                const selected = isSelected(product.id);
                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => toggleProduct(product)}
                    className={`bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                      selected
                        ? 'border-indigo-500 shadow-md shadow-indigo-100 ring-1 ring-indigo-500'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      {product.cover_image ? (
                        <img
                          src={product.cover_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-300">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs mt-1">暂无图片</span>
                        </div>
                      )}
                      {/* Selection indicator */}
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white/80 border-slate-300'
                      }`}>
                        {selected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-transparent" />
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-2.5">
                      <h4 className="font-medium text-slate-800 text-xs truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">
                          {formatPrice(product.normal_price)}
                        </span>
                      </div>
                      {product.member_price < product.normal_price && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-400">会员</span>
                          <span className="text-xs font-semibold text-indigo-600">
                            {formatPrice(product.member_price)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">已选：</span>
                <span className="font-bold text-slate-800">{selectedCount} 件</span>
              </div>
              <div>
                <span className="text-slate-500">合计（原价）：</span>
                <span className="font-bold text-lg text-slate-800">{formatPrice(normalTotal)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors text-sm"
                >
                  清空选择
                </button>
              )}
              <button
                onClick={openCheckout}
                disabled={cartItems.length === 0 || checkingOut}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                {checkingOut && <Loader2 className="w-4 h-4 animate-spin" />}
                去结算
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ──── Checkout Modal ──── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">结算</h3>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {cartItems.map(ci => {
                  const unitPrice = memberInfo?.found ? ci.product.member_price : ci.product.normal_price;
                  const subtotal = unitPrice * ci.quantity;
                  return (
                    <div key={ci.product.id} className="flex items-center gap-3 text-sm">
                      {/* Product name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 font-medium truncate">{ci.product.name}</p>
                        <p className="text-xs text-slate-400">{formatPrice(unitPrice)} / 件</p>
                      </div>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-0 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(ci.product.id, ci.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-l-md text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={ci.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            updateQuantity(ci.product.id, val);
                          }}
                          className="w-12 h-7 border-y border-slate-200 text-center text-xs font-medium text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(ci.product.id, ci.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-r-md text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Subtotal */}
                      <span className="font-medium text-slate-700 w-20 text-right flex-shrink-0">{formatPrice(subtotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    {memberInfo?.found ? '会员价合计：' : '原价合计：'}
                  </span>
                  <span className="font-bold text-lg text-slate-800">
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>

              {/* Member Lookup */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="会员手机号/名称"
                      value={memberKeyword}
                      onChange={(e) => {
                        setMemberKeyword(e.target.value);
                        if (!e.target.value.trim()) {
                          setMemberInfo(null);
                          setLookupError('');
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLookupMember(); }}
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    />
                    {memberKeyword && (
                      <button
                        onClick={clearMember}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleLookupMember}
                    disabled={lookingUpMember || !memberKeyword.trim()}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm disabled:opacity-50 flex items-center gap-1"
                  >
                    {lookingUpMember ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    查询
                  </button>
                </div>

                {/* Lookup Error */}
                {lookupError && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lookupError}
                  </div>
                )}

                {/* Member Info Card */}
                {memberInfo?.found && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-slate-800">{memberInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-600">{memberInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-600">
                        余额：{formatPrice(memberInfo.balance!)}
                      </span>
                    </div>
                    {!memberBalanceInsufficient && (
                      <div className="flex items-center gap-2 text-sm text-indigo-600">
                        <span>扣款后：{formatPrice(memberInfo.balance! - memberTotal)}</span>
                      </div>
                    )}
                    {memberBalanceInsufficient && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        余额不足，差额 {formatPrice(memberTotal - memberInfo.balance!)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-sm"
              >
                取消
              </button>

              {/* Original Price Button - always available */}
              <button
                onClick={() => handleStartPayment('normal')}
                disabled={checkingOut}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-sm disabled:opacity-50"
              >
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                原价购买
              </button>

              {/* Member Price Button - only visible when member found */}
              {memberInfo?.found && (
                <button
                  onClick={() => handleStartPayment('member')}
                  disabled={checkingOut || memberBalanceInsufficient}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  会员价购买
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── Payment Method Modal ──── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 text-center">
              <h3 className="text-lg font-bold text-slate-800">选择支付方式</h3>
              <p className="text-sm text-slate-400 mt-1">
                {pendingPriceType === 'member' && memberInfo?.found
                  ? `会员价合计 ${formatPrice(memberTotal)}`
                  : `合计 ${formatPrice(normalTotal)}`}
              </p>
            </div>

            {/* Error Banner */}
            {paymentError && (
              <div className="mx-6 mb-1 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Options */}
            <div className="p-6 space-y-3">
              {/* Cash Payment */}
              <button
                onClick={handleCashPayment}
                disabled={checkingOut}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                  <Banknote size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-bold text-slate-800">现金支付</p>
                  <p className="text-xs text-slate-400 mt-0.5">确认金额后直接完成购买</p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </button>

              {/* Mobile Payment */}
              <button
                onClick={handleMobilePayment}
                disabled={checkingOut}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                  <Smartphone size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-bold text-slate-800">手机支付</p>
                  <p className="text-xs text-slate-400 mt-0.5">扫描顾客微信/支付宝付款码</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </button>
            </div>

            {/* Cancel */}
            <div className="px-6 pb-6">
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentError(''); }}
                disabled={checkingOut || payingOut}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── QR Scanner Modal ──── */}
      {showScanner && !payingOut && (
        <QRScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ──── Paying Overlay ──── */}
      {payingOut && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Loader2 size={28} className="text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">正在支付</h3>
            <p className="text-sm text-slate-400">
              {pendingPriceType === 'member' ? `会员价 ${formatPrice(memberTotal)}` : `￥${formatPrice(normalTotal)}`}
            </p>
            <p className="text-xs text-slate-300 mt-2">请稍候，正在处理支付请求...</p>
          </div>
        </div>
      )}

      {/* ──── Print Preview Modal ──── */}
      {showPrintPreview && checkoutResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">打印票据预览</h3>
              <button onClick={handleClosePrint} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="overflow-y-auto p-6 flex justify-center bg-slate-100">
              <div className="bg-white shadow-lg" style={{ width: '280px', minHeight: '400px', padding: '16px 14px', fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif", fontSize: '12px' }}>
                <PrintTicketContent result={checkoutResult} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={handleClosePrint}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> 确认打印
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Success Modal ──── */}
      {showSuccess && checkoutResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              {/* Success Icon */}
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" />
              </div>

              <h3 className="font-bold text-xl text-slate-800">购买成功</h3>

              {/* Member info (only for member purchase) */}
              {checkoutResult.price_type === 'member' && checkoutResult.member_name && (
                <p className="text-sm text-slate-500">
                  会员：{checkoutResult.member_name}
                </p>
              )}

              <p className="text-sm text-slate-500">
                消费金额：
                <span className="font-bold text-slate-800">
                  {formatPrice(checkoutResult.total_amount)}
                </span>
                {checkoutResult.price_type === 'member' ? '（会员价）' : '（原价）'}
              </p>

              {/* Balance card (only for member purchase) */}
              {checkoutResult.price_type === 'member' && checkoutResult.balance_before !== undefined && (
                <div className="bg-slate-50 rounded-lg p-4 text-left space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">扣款前余额：</span>
                    <span className="font-medium text-slate-700">{formatPrice(checkoutResult.balance_before!)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">扣款金额：</span>
                    <span className="font-medium text-red-600">-{formatPrice(checkoutResult.total_amount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm">
                    <span className="text-slate-500">当前余额：</span>
                    <span className="font-bold text-indigo-600">{formatPrice(checkoutResult.balance_after!)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-center gap-3 bg-slate-50">
              <button
                onClick={handleOpenPrint}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-white transition-colors font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> 打印票据
              </button>
              <button
                onClick={handleContinue}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 font-medium"
              >
                继续购买
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
