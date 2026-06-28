import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { FiEdit2, FiTrash2, FiDownload, FiPackage, FiSearch, FiX, FiCheck, FiShoppingBag, FiAlertCircle, FiPlus, FiEye, FiChevronDown } from 'react-icons/fi';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.15)' : 'rgba(239,68,68,0.15)';
  const border = type === 'success' ? 'rgba(0,227,9,0.3)' : 'rgba(239,68,68,0.3)';
  const color = type === 'success' ? '#00E309' : '#ef4444';
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 500, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color: color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'slideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' ? <FiCheck /> : <FiAlertCircle />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} /><div><div style={{ width: 120, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)', marginBottom: 6, animation: 'shimmer 1.5s infinite' }} /><div style={{ width: 80, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.02)', animation: 'shimmer 1.5s infinite', animationDelay: '0.2s' }} /></div></div></td>
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ width: 60, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ width: 70, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ width: 50, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', animationDelay: '0.3s' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ width: 45, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem', textAlign: 'center' }}><div style={{ width: 20, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)', margin: '0 auto', animation: 'shimmer 1.5s infinite' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem' }}><div style={{ width: 55, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', animationDelay: '0.2s' }} /></td>
      <td style={{ padding: '0.8rem 0.9rem', textAlign: 'center' }}><div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}><div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} /><div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', animationDelay: '0.3s' }} /></div></td>
    </tr>
  );
}

function MyProducts({ user }) {
  const { darkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', stock_quantity: '1', category: '', is_negotiable: false, status: 'active' });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [catOpen, setCatOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const catRef = useRef(null);
  const statusRef = useRef(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Vehicles', 'Real Estate', 'Services', 'Food & Drinks', 'Health & Beauty', 'Sports & Fitness', 'Books & Education', 'Agriculture', 'Other'];
  const statuses = [
    { value: 'active', label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { value: 'sold', label: 'Sold', color: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
    { value: 'archived', label: 'Archived', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' },
  ];

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });

  useEffect(() => {
    fetchProducts();
    const h = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const r = await api.get('/products/my/products');
      const data = r.data.products || [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) { console.error(err); showToast('Failed to load products', 'error'); }
    finally { setTimeout(() => setLoading(false), 400); }
  };

  useEffect(() => {
    if (!search.trim()) { setFilteredProducts(products); return; }
    const t = search.toLowerCase();
    setFilteredProducts(products.filter(p => p.name?.toLowerCase().includes(t) || p.category?.toLowerCase().includes(t) || p.description?.toLowerCase().includes(t)));
  }, [search, products]);

  const openEdit = (product) => {
    setEditingProduct(product);
    setEditForm({ name: product.name || '', description: product.description || '', price: product.price || '', stock_quantity: product.stock_quantity || '1', category: product.category || '', is_negotiable: product.is_negotiable || false, status: product.status || 'active' });
    setImagePreviews(product.images || []); setImageFiles([]); setFormError(''); setCatOpen(false); setStatusOpen(false); setShowEditModal(true);
  };

  const handleEditChange = (e) => { const { name, value, type, checked } = e.target; setEditForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (imagePreviews.length + files.length > 5) { setFormError('Maximum 5 images'); return; }
    setImagePreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]); setImageFiles(p => [...p, ...files]);
  };

  const removeImage = (i) => {
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
    const existingCount = editingProduct?.images?.length || 0;
    if (i >= existingCount) setImageFiles(p => p.filter((_, idx) => idx !== (i - existingCount)));
  };

  const uploadImages = async () => {
    if (!imageFiles.length) return [];
    setUploading(true); const fd = new FormData(); imageFiles.forEach(f => fd.append('images', f));
    try { const r = await api.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data.images?.map(img => img.url) || []; }
    catch { throw new Error('Upload failed'); } finally { setUploading(false); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.price || !editForm.category) { setFormError('Name, price, and category are required'); return; }
    setSaving(true);
    try {
      const existingImages = imagePreviews.filter(img => typeof img === 'string' && !img.startsWith('blob:'));
      let imageUrls = existingImages;
      if (imageFiles.length > 0) { const newUrls = await uploadImages(); imageUrls = [...existingImages, ...newUrls]; }
      await api.put(`/products/${editingProduct.id}`, { ...editForm, price: parseFloat(editForm.price), stock_quantity: parseInt(editForm.stock_quantity), images: imageUrls });
      showToast('Product updated successfully!'); setShowEditModal(false); fetchProducts();
    } catch (e) { setFormError(e.response?.data?.message || 'Error saving'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try { await api.delete(`/products/${deleteConfirm.id}`); showToast(`"${deleteConfirm.name}" deleted`); setDeleteConfirm(null); fetchProducts(); }
    catch { showToast('Error deleting product', 'error'); } finally { setDeleting(false); }
  };

  const exportCSV = () => {
    const rows = filteredProducts.map(p => [p.name || '', formatPrice(p.price), p.category || '', p.status || '', p.product_type || '', p.stock_quantity || 0, p.is_negotiable ? 'Yes' : 'No', new Date(p.created_at).toLocaleDateString()]);
    let csv = 'Name,Price,Category,Status,Type,Stock,Negotiable,Created\n'; rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `my_products_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast('CSV exported!');
  };

  const formatPrice = (p) => Number(p).toLocaleString();
  const getStatusInfo = (status) => statuses.find(s => s.value === status) || statuses[0];

  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.4)' : 'rgba(255,255,255,0.9)';
  const inputBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const accent = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const glassBg = darkMode ? 'rgba(20,20,40,0.75)' : 'rgba(255,255,255,0.75)';
  const modalBg = darkMode ? 'rgba(22,22,45,0.98)' : 'rgba(255,255,255,0.98)';
  const dropdownBg = darkMode ? 'rgba(22,22,45,0.98)' : 'rgba(255,255,255,0.98)';
  const abg = darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.06)';

  const floatingBags = [...Array(8)].map((_, i) => ({ left: `${Math.random() * 90}%`, delay: `${Math.random() * 4}s`, duration: `${4 + Math.random() * 5}s`, size: 10 + Math.random() * 10, opacity: 0.04 }));

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, background: bgColor, position: 'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.05}95%{opacity:.05}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        @keyframes dropdownIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{opacity:0.3}50%{opacity:0.6}100%{opacity:0.3}}
        @keyframes rowFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        tr:not(.skeleton-row):hover td{background:rgba(255,255,255,0.015)}
        .product-row{animation:rowFadeIn 0.4s ease forwards}
        .modal-scroll::-webkit-scrollbar{width:0;height:0}
        .modal-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .dropdown-scroll::-webkit-scrollbar{width:0;height:0}
        .dropdown-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .table-wrap::-webkit-scrollbar{height:4px}
        .table-wrap::-webkit-scrollbar-track{background:transparent}
        .table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        @media(max-width:768px){.header-row{flex-direction:column!important;align-items:flex-start!important}}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingBags.map((bag, i) => (<div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}><svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '1.2rem' }}>
        
        {/* Header */}
        <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiPackage size={20} style={{ color: accent }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>My Products</h1>
              <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0.1rem 0 0' }}>{!loading && `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} listed`}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={exportCSV} disabled={loading || products.length === 0} style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, border: `1px solid rgba(34,197,94,0.25)`, background: 'rgba(34,197,94,0.06)', color: '#4ade80', cursor: (loading || products.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s', opacity: (loading || products.length === 0) ? 0.5 : 1 }}>
              <FiDownload size={14} /> Export CSV
            </button>
            <Link to="/sell" style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: accent, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}>
              <FiPlus size={14} /> Add New
            </Link>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: 12, border: `1px solid ${borderColor}`, background: glassBg, backdropFilter: 'blur(12px)', maxWidth: 360 }}>
            <FiSearch size={15} style={{ color: textMuted }} />
            <input type="text" placeholder="Search your products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.78rem', padding: '0.15rem 0', outline: 'none', color: textColor }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>}
          </div>
        </div>

        {/* Table - SCROLLABLE ON MOBILE */}
        <div className="table-wrap" style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, overflow: 'hidden', boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750, fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}`, background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}>
                  <th style={thStyle(textMuted)}>Product</th>
                  <th style={thStyle(textMuted)}>Price</th>
                  <th style={thStyle(textMuted)}>Category</th>
                  <th style={thStyle(textMuted)}>Type</th>
                  <th style={thStyle(textMuted)}>Status</th>
                  <th style={thStyle(textMuted)}>Stock</th>
                  <th style={thStyle(textMuted)}>Created</th>
                  <th style={{ ...thStyle(textMuted), textAlign: 'center', width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                  </>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: textMuted }}>
                      <FiShoppingBag size={32} style={{ marginBottom: '0.8rem', opacity: 0.3, display: 'block', margin: '0 auto 0.8rem' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', color: textColor }}>
                        {products.length === 0 ? 'No products yet' : 'No products match your search'}
                      </div>
                      <p style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                        {products.length === 0 ? 'Start listing your products to reach thousands of buyers.' : 'Try adjusting your search terms.'}
                      </p>
                      {products.length === 0 && (
                        <Link to="/sell" style={{ display: 'inline-block', padding: '0.55rem 1.4rem', borderRadius: 22, background: accent, color: '#000', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>List Your First Product</Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const statusInfo = getStatusInfo(product.status);
                    return (
                      <tr key={product.id} className="product-row" style={{ borderBottom: `1px solid ${borderColor}`, animationDelay: `${index * 0.05}s` }}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderColor}` }}>
                              {product.images?.[0] ? <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiPackage size={15} style={{ color: textMuted }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ color: textColor, fontSize: '0.78rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{product.name}</p>
                              <p style={{ color: textMuted, fontSize: '0.62rem', margin: '0.1rem 0 0' }}>{product.description?.substring(0, 50) || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: accent, whiteSpace: 'nowrap' }}>{formatPrice(product.price)} RWF</td>
                        <td style={tdStyle}><span style={badgeStyle('rgba(0,227,9,0.08)', accent)}>{product.category}</span></td>
                        <td style={tdStyle}><span style={badgeStyle('rgba(168,85,247,0.08)', '#a855f7')}>{product.product_type}</span></td>
                        <td style={tdStyle}>
                          <span style={badgeStyle(statusInfo.bg, statusInfo.color)}>{statusInfo.label}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: textMuted }}>{product.stock_quantity || 0}</td>
                        <td style={{ ...tdStyle, color: textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <Link to={`/products/${product.id}`} style={actionBtn('#22c55e')} title="View"><FiEye size={13} /></Link>
                            <button onClick={() => openEdit(product)} style={actionBtn('#3b82f6')} title="Edit"><FiEdit2 size={13} /></button>
                            <button onClick={() => setDeleteConfirm({ id: product.id, name: product.name })} style={actionBtn('#ef4444')} title="Delete"><FiTrash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setShowEditModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
          <div className="modal-scroll" style={{ position: 'relative', background: modalBg, borderRadius: 16, border: `1px solid ${borderColor}`, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'modalIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, background: modalBg, zIndex: 5, borderRadius: '16px 16px 0 0' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: textColor, margin: 0 }}>Edit Product</h2>
                <p style={{ color: textMuted, fontSize: '0.65rem', margin: '0.05rem 0 0' }}>{editingProduct?.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><FiX size={14} /></button>
            </div>
            <form onSubmit={saveEdit} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {formError && <div style={{ padding: '0.5rem 0.8rem', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.7rem' }}>{formError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div><label style={lbl}>Name *</label><input type="text" name="name" value={editForm.name} onChange={handleEditChange} style={inp(textColor, borderColor, inputBg)} /></div>
                <div><label style={lbl}>Price (RWF) *</label><input type="number" name="price" value={editForm.price} onChange={handleEditChange} style={inp(textColor, borderColor, inputBg)} /></div>
              </div>
              
              <div><label style={lbl}>Description</label><textarea name="description" value={editForm.description} onChange={handleEditChange} rows={2} style={{ ...inp(textColor, borderColor, inputBg), resize: 'vertical', minHeight: 55 }} /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div ref={catRef} style={{ position: 'relative' }}>
                  <label style={lbl}>Category *</label>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setCatOpen(!catOpen); setStatusOpen(false); }}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${catOpen ? accent : borderColor}`, background: inputBg, color: editForm.category ? textColor : textMuted, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                    <span>{editForm.category || "Select category"}</span>
                    <FiChevronDown size={15} style={{ color: accent, transition: 'transform 0.2s', transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {catOpen && (
                    <div className="dropdown-scroll" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                      {categories.map(cat => (
                        <div key={cat} onClick={() => { setEditForm(p => ({ ...p, category: cat })); setCatOpen(false); }}
                          style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: editForm.category === cat ? accent : textColor, background: editForm.category === cat ? abg : 'transparent', fontWeight: editForm.category === cat ? 600 : 400, transition: 'all 0.1s' }}
                          onMouseEnter={e => { if (editForm.category !== cat) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                          onMouseLeave={e => { if (editForm.category !== cat) e.currentTarget.style.background = 'transparent'; }}>
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={statusRef} style={{ position: 'relative' }}>
                  <label style={lbl}>Status</label>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen); setCatOpen(false); }}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${statusOpen ? accent : borderColor}`, background: inputBg, color: textColor, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusInfo(editForm.status).color }} />
                      {getStatusInfo(editForm.status).label}
                    </span>
                    <FiChevronDown size={15} style={{ color: accent, transition: 'transform 0.2s', transform: statusOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {statusOpen && (
                    <div className="dropdown-scroll" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                      {statuses.map(status => (
                        <div key={status.value} onClick={() => { setEditForm(p => ({ ...p, status: status.value })); setStatusOpen(false); }}
                          style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: editForm.status === status.value ? status.color : textColor, background: editForm.status === status.value ? status.bg : 'transparent', fontWeight: editForm.status === status.value ? 600 : 400, transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          onMouseEnter={e => { if (editForm.status !== status.value) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                          onMouseLeave={e => { if (editForm.status !== status.value) e.currentTarget.style.background = 'transparent'; }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }} />
                          {status.label}
                          {editForm.status === status.value && <FiCheck size={12} style={{ marginLeft: 'auto', color: status.color }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div><label style={lbl}>Stock</label><input type="number" name="stock_quantity" value={editForm.stock_quantity} onChange={handleEditChange} style={inp(textColor, borderColor, inputBg)} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.45rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: textColor }}>
                    <input type="checkbox" name="is_negotiable" checked={editForm.is_negotiable} onChange={handleEditChange} style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer' }} /> Negotiable
                  </label>
                </div>
              </div>
              
              <div>
                <label style={lbl}>Images ({imagePreviews.length}/5)</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {imagePreviews.map((preview, i) => (
                    <div key={i} style={{ position: 'relative', width: 55, height: 55, borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                      <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✕</button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <label style={{ width: 55, height: 55, borderRadius: 8, border: `2px dashed ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textMuted, fontSize: '1.2rem', background: inputBg, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = textMuted; }}>
                      +<input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} multiple />
                    </label>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${borderColor}` }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={saving || uploading} style={{ flex: 1.5, padding: '0.55rem', borderRadius: 10, border: 'none', background: (saving || uploading) ? `${accent}50` : accent, color: '#000', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setDeleteConfirm(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', background: modalBg, borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '90%', border: `1px solid ${borderColor}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'modalIn 0.25s ease', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <FiTrash2 size={22} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: textColor, margin: '0 0 0.3rem' }}>Delete Product?</h3>
            <p style={{ color: textMuted, fontSize: '0.72rem', margin: '0 0 1.2rem' }}>Are you sure you want to delete <strong style={{ color: textColor }}>"{deleteConfirm.name}"</strong>? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1.5, padding: '0.55rem', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><FiTrash2 size={13} />{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = (c) => ({ textAlign: 'left', padding: '0.65rem 0.9rem', color: c, fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' });
const tdStyle = { padding: '0.7rem 0.9rem', verticalAlign: 'middle', fontSize: '0.74rem' };
const badgeStyle = (bg, color) => ({ padding: '3px 10px', borderRadius: 10, fontSize: '0.62rem', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' });
const actionBtn = (color) => ({ width: 28, height: 28, borderRadius: 6, border: 'none', background: `${color}15`, color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', textDecoration: 'none' });
const lbl = { display: 'block', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.25rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inp = (tc, bc, ib) => ({ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1px solid ${bc}`, background: ib, fontSize: '0.75rem', outline: 'none', color: tc, boxSizing: 'border-box', transition: 'border-color 0.2s' });

export default MyProducts;