import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { FiTrash2, FiEdit2, FiX, FiSearch, FiDownload, FiPackage, FiChevronDown, FiCheck, FiAlertCircle } from 'react-icons/fi';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.12)' : 'rgba(239,68,68,0.12)';
  const border = type === 'success' ? 'rgba(0,227,9,0.25)' : 'rgba(239,68,68,0.25)';
  const color = type === 'success' ? '#00E309' : '#ef4444';
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 500, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'slideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>
    </div>
  );
}

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock_quantity: '1', category: '', is_negotiable: false, product_type: 'individual', status: 'active' });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown states
  const [catOpen, setCatOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const catRef = useRef(null);
  const statusRef = useRef(null);
  const typeRef = useRef(null);

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Vehicles', 'Real Estate', 'Services', 'Food & Drinks', 'Health & Beauty', 'Sports & Fitness', 'Books & Education', 'Agriculture', 'Other'];
  const statuses = [
    { value: 'active', label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { value: 'sold', label: 'Sold', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    { value: 'archived', label: 'Archived', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' },
  ];
  const productTypes = [
    { value: 'individual', label: 'Individual', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { value: 'shop', label: 'Shop', color: '#00E309', bg: 'rgba(0,227,9,0.1)' },
  ];

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type, id: Date.now() }); };

  useEffect(() => {
    fetchProducts();
    const h = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '200');
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '', description: product.description || '',
      price: product.price || '', stock_quantity: product.stock_quantity || '1',
      category: product.category || '', is_negotiable: product.is_negotiable || false,
      product_type: product.product_type || 'individual', status: product.status || 'active'
    });
    setImagePreviews(product.images || []);
    setImageFiles([]);
    setFormError('');
    setCatOpen(false); setStatusOpen(false); setTypeOpen(false);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => { setShowEditModal(false); setEditingProduct(null); setFormError(''); };

  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (imagePreviews.length + files.length > 5) { setFormError('Maximum 5 images'); return; }
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => {
      const fileIndex = index - (imagePreviews.length - imageFiles.length);
      return i !== fileIndex;
    }));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    setUploading(true);
    const fd = new FormData();
    imageFiles.forEach(f => fd.append('images', f));
    try {
      const res = await api.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.images?.map(img => img.url) || [];
    } catch { throw new Error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) { setFormError('Name, price, and category are required'); return; }
    setSaving(true);
    try {
      const existingImages = imagePreviews.filter(img => typeof img === 'string' && !img.startsWith('blob:'));
      let imageUrls = existingImages;
      if (imageFiles.length > 0) { const newUrls = await uploadImages(); imageUrls = [...existingImages, ...newUrls]; }
      await api.put(`/products/${editingProduct.id}`, { ...formData, price: parseFloat(formData.price), stock_quantity: parseInt(formData.stock_quantity), images: imageUrls });
      showToast('Product updated successfully');
      handleCloseEdit();
      fetchProducts();
    } catch (e) { setFormError(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/products/${deleteConfirm.id}`);
      showToast(`"${deleteConfirm.name}" deleted`);
      setDeleteConfirm(null);
      fetchProducts();
    } catch { showToast('Error deleting product', 'error'); }
  };

  const exportCSV = () => {
    const rows = products.map(p => [
      p.name || '', p.seller?.display_name || '', formatPrice(p.price),
      p.category || '', p.status || '', p.product_type || '',
      p.stock_quantity || 0, new Date(p.created_at).toLocaleDateString()
    ]);
    let csv = 'Name,Seller,Price,Category,Status,Type,Stock,Created\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `guraneza_products_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Products exported successfully');
  };

  const formatPrice = (p) => new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(p);
  const getStatusInfo = (s) => statuses.find(st => st.value === s) || statuses[0];
  const getTypeInfo = (t) => productTypes.find(pt => pt.value === t) || productTypes[0];

  const accent = '#00E309';
  const borderColor = 'rgba(255,255,255,0.06)';
  const cardBg = 'rgba(26,26,46,0.5)';
  const inputBg = 'rgba(255,255,255,0.03)';
  const dropdownBg = 'rgba(22,22,45,0.98)';
  const abg = 'rgba(0,227,9,0.1)';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        @keyframes dropdownIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        tr:hover td{background:rgba(255,255,255,0.015)}
        .modal-scroll::-webkit-scrollbar{width:0;height:0}
        .modal-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .dropdown-scroll::-webkit-scrollbar{width:0;height:0}
        .dropdown-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .table-wrap::-webkit-scrollbar{height:4px}
        .table-wrap::-webkit-scrollbar-track{background:transparent}
        .table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        @media(max-width:768px){
          .header-row{flex-direction:column!important;align-items:flex-start!important;gap:0.8rem!important}
          .search-row{flex-direction:column!important;width:100%!important}
          .search-row input{width:100%!important;max-width:100%!important}
          .btn-group{width:100%!important;justify-content:flex-start!important}
          .edit-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      {/* Header */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiPackage size={18} style={{ color: accent }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.4rem)', fontWeight: 700, color: 'white', margin: 0 }}>Product Management</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>{products.length} products</p>
          </div>
        </div>
        <div className="search-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ position: 'relative', flex: '1 1 auto' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }} />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              style={{ padding: '0.45rem 0.7rem 0.45rem 1.8rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: 'white', fontSize: '0.72rem', outline: 'none', width: '100%', maxWidth: 250, boxSizing: 'border-box' }} />
          </div>
          <div className="btn-group" style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={fetchProducts} style={{ padding: '0.45rem 0.9rem', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${borderColor}`, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Search</button>
            <button onClick={exportCSV}
              style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.06)', color: '#4ade80', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
              <FiDownload size={13} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 14, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Seller</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Stock</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.images?.[0] ? <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiPackage size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{product.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', margin: 0 }}>{product.description?.substring(0, 40) || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{product.seller?.display_name || 'Unknown'}</td>
                  <td style={{ ...tdStyle, color: accent, fontWeight: 600, fontSize: '0.75rem' }}>{formatPrice(product.price)}</td>
                  <td style={tdStyle}><span style={badgeStyle('rgba(0,227,9,0.1)', accent)}>{product.category}</span></td>
                  <td style={tdStyle}><span style={badgeStyle(getTypeInfo(product.product_type).bg, getTypeInfo(product.product_type).color)}>{getTypeInfo(product.product_type).label}</span></td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(getStatusInfo(product.status).bg, getStatusInfo(product.status).color)}>{getStatusInfo(product.status).label}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{product.stock_quantity || 0}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                      <button onClick={() => handleOpenEdit(product)} title="Edit" style={actionBtn('#3b82f6')}><FiEdit2 size={12} /></button>
                      <button onClick={() => setDeleteConfirm({ id: product.id, name: product.name })} title="Delete" style={actionBtn('#ef4444')}><FiTrash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                  <FiPackage size={24} style={{ marginBottom: '0.5rem', opacity: 0.3 }} /><div>No products found</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-scroll" style={{ background: '#1a1a2e', borderRadius: 18, border: `1px solid ${borderColor}`, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'modalIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, background: '#1a1a2e', zIndex: 5, borderRadius: '18px 18px 0 0' }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Edit Product</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', margin: '0.1rem 0 0' }}>{editingProduct?.name}</p>
              </div>
              <button onClick={handleCloseEdit} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={14} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {formError && <div style={{ padding: '0.5rem 0.8rem', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.7rem' }}>{formError}</div>}
              
              <div><label style={lbl}>Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inpStyle} /></div>
              
              <div className="edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div><label style={lbl}>Price (RWF) *</label><input type="number" name="price" value={formData.price} onChange={handleChange} style={inpStyle} /></div>
                <div><label style={lbl}>Stock</label><input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} style={inpStyle} /></div>
              </div>

              {/* Category Dropdown */}
              <div ref={catRef} style={{ position: 'relative' }}>
                <label style={lbl}>Category *</label>
                <button type="button" onClick={(e) => { e.stopPropagation(); setCatOpen(!catOpen); setStatusOpen(false); setTypeOpen(false); }}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${catOpen ? accent : borderColor}`, background: inputBg, color: formData.category ? 'white' : 'rgba(255,255,255,0.35)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                  <span>{formData.category || "Select category"}</span>
                  <FiChevronDown size={15} style={{ color: accent, transition: 'transform 0.2s', transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {catOpen && (
                  <div className="dropdown-scroll" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 30, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                    {categories.map(cat => (
                      <div key={cat} onClick={() => { setFormData(p => ({ ...p, category: cat })); setCatOpen(false); }}
                        style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: formData.category === cat ? accent : 'rgba(255,255,255,0.7)', background: formData.category === cat ? abg : 'transparent', fontWeight: formData.category === cat ? 600 : 400, transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={e => { if (formData.category !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (formData.category !== cat) e.currentTarget.style.background = 'transparent'; }}>
                        {cat} {formData.category === cat && <FiCheck size={12} style={{ color: accent }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {/* Status Dropdown */}
                <div ref={statusRef} style={{ position: 'relative' }}>
                  <label style={lbl}>Status</label>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen); setCatOpen(false); setTypeOpen(false); }}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${statusOpen ? accent : borderColor}`, background: inputBg, color: 'white', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusInfo(formData.status).color }} />
                      {getStatusInfo(formData.status).label}
                    </span>
                    <FiChevronDown size={15} style={{ color: accent, transition: 'transform 0.2s', transform: statusOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {statusOpen && (
                    <div className="dropdown-scroll" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 30, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                      {statuses.map(status => (
                        <div key={status.value} onClick={() => { setFormData(p => ({ ...p, status: status.value })); setStatusOpen(false); }}
                          style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: formData.status === status.value ? status.color : 'rgba(255,255,255,0.7)', background: formData.status === status.value ? status.bg : 'transparent', fontWeight: formData.status === status.value ? 600 : 400, transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          onMouseEnter={e => { if (formData.status !== status.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (formData.status !== status.value) e.currentTarget.style.background = 'transparent'; }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }} />
                          {status.label}
                          {formData.status === status.value && <FiCheck size={12} style={{ marginLeft: 'auto', color: status.color }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Type Dropdown */}
                <div ref={typeRef} style={{ position: 'relative' }}>
                  <label style={lbl}>Type</label>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setTypeOpen(!typeOpen); setCatOpen(false); setStatusOpen(false); }}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${typeOpen ? accent : borderColor}`, background: inputBg, color: 'white', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: getTypeInfo(formData.product_type).color }} />
                      {getTypeInfo(formData.product_type).label}
                    </span>
                    <FiChevronDown size={15} style={{ color: accent, transition: 'transform 0.2s', transform: typeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {typeOpen && (
                    <div className="dropdown-scroll" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 30, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                      {productTypes.map(type => (
                        <div key={type.value} onClick={() => { setFormData(p => ({ ...p, product_type: type.value })); setTypeOpen(false); }}
                          style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: formData.product_type === type.value ? type.color : 'rgba(255,255,255,0.7)', background: formData.product_type === type.value ? type.bg : 'transparent', fontWeight: formData.product_type === type.value ? 600 : 400, transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          onMouseEnter={e => { if (formData.product_type !== type.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (formData.product_type !== type.value) e.currentTarget.style.background = 'transparent'; }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: type.color }} />
                          {type.label}
                          {formData.product_type === type.value && <FiCheck size={12} style={{ marginLeft: 'auto', color: type.color }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                  <input type="checkbox" name="is_negotiable" checked={formData.is_negotiable} onChange={handleChange} style={{ width: 15, height: 15, accentColor: accent }} /> Negotiable
                </label>
              </div>

              <div>
                <label style={lbl}>Images ({imagePreviews.length}/5)</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  {imagePreviews.map((preview, i) => (
                    <div key={i} style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                      <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✕</button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <label style={{ width: 56, height: 56, borderRadius: 8, border: `2px dashed ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
                      +<input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} multiple />
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${borderColor}` }}>
                <button type="button" onClick={handleCloseEdit} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={saving || uploading} style={{ flex: 1.5, padding: '0.55rem', borderRadius: 10, border: 'none', background: (saving || uploading) ? `${accent}60` : accent, color: '#000', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1a1a2e', borderRadius: 18, padding: '1.6rem', maxWidth: 400, width: '90%', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'modalIn 0.2s ease', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
              <FiTrash2 size={22} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem' }}>Delete Product?</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', margin: '0 0 0.2rem', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong style={{ color: 'white' }}>"{deleteConfirm.name}"</strong>?
            </p>
            <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.65rem', margin: '0 0 1.2rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1.5, padding: '0.55rem', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><FiTrash2 size={13} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '0.55rem 0.7rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.5rem 0.7rem', verticalAlign: 'middle' };
const badgeStyle = (bg, color) => ({ padding: '2px 7px', borderRadius: 10, fontSize: '0.58rem', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' });
const actionBtn = (color) => ({ width: 28, height: 28, borderRadius: 6, border: 'none', background: `${color}18`, color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' });
const lbl = { fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem', display: 'block' };
const inpStyle = { width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' };

export default ProductManagement;