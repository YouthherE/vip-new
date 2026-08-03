'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';
import { TableSkeleton } from '@/components/TableSkeleton';
import {
  Search, Plus, X, ChevronLeft, ChevronRight, Loader2,
  Package, Pencil, Trash2, ArrowUp, ArrowDown, Upload, ImageIcon
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  regular_price: number;
  member_price: number;
  image: string;
  status: 'listed' | 'unlisted';
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form
  const [productForm, setProductForm] = useState({
    id: 0,
    name: '',
    regular_price: '',
    member_price: '',
    image: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ──── Data Fetching ────

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search,
          status: statusFilter,
          page,
          pageSize: pagination.pageSize
        }
      });
      if (res.data.code === 200) {
        setProducts(res.data.data.list);
        setPagination(res.data.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // ──── Form Validation ────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!productForm.name.trim()) {
      errors.name = '商品名称不能为空';
    } else if (productForm.name.length > 50) {
      errors.name = '商品名称不能超过50个字符';
    }

    const regularPrice = parseFloat(productForm.regular_price);
    if (productForm.regular_price === '' || isNaN(regularPrice)) {
      errors.regular_price = '请输入有效的普通价格';
    } else if (regularPrice < 0) {
      errors.regular_price = '普通价格不能小于0';
    }

    const memberPrice = parseFloat(productForm.member_price);
    if (productForm.member_price === '' || isNaN(memberPrice)) {
      errors.member_price = '请输入有效的会员价格';
    } else if (memberPrice < 0) {
      errors.member_price = '会员价格不能小于0';
    } else if (memberPrice > regularPrice) {
      errors.member_price = '会员价格不能高于普通价格';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [productForm]);

  useEffect(() => {
    if (productForm.name || productForm.regular_price || productForm.member_price) {
      validateForm();
    }
  }, [productForm, validateForm]);

  // ──── Image Upload ────

  const processImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProductForm(prev => ({ ...prev, image: dataUrl }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setProductForm(prev => ({ ...prev, image: '' }));
    setImagePreview('');
  };

  // ──── CRUD Operations ────

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...productForm,
        name: productForm.name.trim(),
        regular_price: parseFloat(productForm.regular_price),
        member_price: parseFloat(productForm.member_price),
      };

      if (formMode === 'add') {
        const res = await api.post('/products', dataToSubmit);
        if (res.data.code === 200) {
          setIsFormOpen(false);
          fetchProducts(1);
          toast.success('商品上架成功');
        } else {
          toast.error(res.data.message);
        }
      } else {
        const res = await api.put('/products', dataToSubmit);
        if (res.data.code === 200) {
          setIsFormOpen(false);
          fetchProducts(pagination.page);
          toast.success('商品更新成功');
        } else {
          toast.error(res.data.message);
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'listed' ? 'unlisted' : 'listed';
    const actionText = newStatus === 'listed' ? '上架' : '下架';
    try {
      const res = await api.put('/products/status', { ids: [product.id], status: newStatus });
      if (res.data.code === 200) {
        fetchProducts(pagination.page);
        toast.success(`${actionText}成功`);
      } else {
        toast.error(res.data.message);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || `${actionText}失败`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete('/products', { params: { id: deleteTarget.id } });
      if (res.data.code === 200) {
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        fetchProducts(pagination.page);
        toast.success('商品删除成功');
      } else {
        toast.error(res.data.message);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '删除失败');
    }
  };

  // ──── Modal Helpers ────

  const openAdd = () => {
    setFormMode('add');
    setProductForm({ id: 0, name: '', regular_price: '', member_price: '', image: '' });
    setImagePreview('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setFormMode('edit');
    setProductForm({
      id: product.id,
      name: product.name,
      regular_price: String(product.regular_price),
      member_price: String(product.member_price),
      image: product.image || ''
    });
    setImagePreview(product.image || '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openDelete = (product: Product) => {
    setDeleteTarget(product);
    setIsDeleteOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProducts(newPage);
    }
  };

  // ──── Price Display Helper ────

  const formatPrice = (price: number) => {
    return `¥ ${price.toFixed(2)}`;
  };

  // ──── Render ────

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-600"
            >
              <option value="all">全部状态</option>
              <option value="listed">已上架</option>
              <option value="unlisted">已下架</option>
            </select>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新增商品
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm">暂无商品数据</p>
              <button
                onClick={openAdd}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                立即添加第一个商品
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md group ${
                    product.status === 'unlisted' ? 'opacity-70 border-slate-200' : 'border-slate-100'
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-xs mt-1">暂无图片</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'listed'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {product.status === 'listed' ? '已上架' : '已下架'}
                    </span>
                    {/* Action overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                        className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-indigo-600 transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(product); }}
                        className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-amber-600 transition-colors"
                        title={product.status === 'listed' ? '下架' : '上架'}
                      >
                        {product.status === 'listed' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDelete(product); }}
                        className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <h4 className="font-medium text-slate-800 text-sm truncate" title={product.name}>
                      {product.name}
                    </h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xs text-slate-400">普通</span>
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(product.regular_price)}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400">会员</span>
                      <span className="text-sm font-semibold text-indigo-600">{formatPrice(product.member_price)}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-slate-500">
            共 {pagination.total} 条，页码 {pagination.page}/{pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ──── Add / Edit Modal ──── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {formMode === 'add' ? '新增商品' : '编辑商品'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="productForm" onSubmit={handleFormSubmit} className="space-y-5">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    商品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={50}
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="请输入商品名称（最多50字）"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}
                  <p className="text-xs text-slate-400">{productForm.name.length}/50</p>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      普通价格 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.regular_price}
                        onChange={e => setProductForm({ ...productForm, regular_price: e.target.value })}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                          formErrors.regular_price ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {formErrors.regular_price && (
                      <p className="text-xs text-red-500">{formErrors.regular_price}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      会员价格 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">¥</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.member_price}
                        onChange={e => setProductForm({ ...productForm, member_price: e.target.value })}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                          formErrors.member_price ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {formErrors.member_price && (
                      <p className="text-xs text-red-500">{formErrors.member_price}</p>
                    )}
                    <p className="text-xs text-slate-400">会员价格不应高于普通价格</p>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">商品图片</label>

                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="w-40 h-40 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragOver
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">
                        拖拽图片到此处，或<span className="text-indigo-600">点击上传</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        支持 JPG、PNG、GIF、WebP 格式，大小不超过 2MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {formMode === 'add' ? '确认上架' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Delete Confirmation Modal ──── */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">确认删除</h3>
              <button
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-full flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-700">
                    确定要删除商品 <span className="font-semibold text-slate-900">「{deleteTarget.name}」</span> 吗？
                  </p>
                  <p className="text-xs text-slate-400 mt-1">此操作不可撤销，商品的所有数据将被永久删除。</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
