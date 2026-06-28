import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { FiUpload, FiX, FiTag, FiPackage, FiAlertCircle, FiCheck, FiShoppingBag, FiImage, FiChevronDown, FiLayers } from 'react-icons/fi';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.15)' : 'rgba(239,68,68,0.15)';
  const border = type === 'success' ? 'rgba(0,227,9,0.3)' : 'rgba(239,68,68,0.3)';
  const color = type === 'success' ? '#00E309' : '#ef4444';
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 400, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color: color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'fadeIn 0.25s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' ? <FiCheck /> : <FiAlertCircle />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>
    </div>
  );
}

function Sell({ user }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [productLimit, setProductLimit] = useState({ current: 0, max: 5 });
  const [catOpen, setCatOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const catRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock_quantity: '1',
    category: '', is_negotiable: false, product_type: 'individual'
  });

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Vehicles',
    'Real Estate', 'Services', 'Food & Drinks', 'Health & Beauty',
    'Sports & Fitness', 'Books & Education', 'Agriculture', 'Other'
  ];

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });

  useEffect(() => { 
    if (!user) { navigate('/login'); return; } 
    fetchShopAndLimits();
    const h = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [user]);

  const fetchShopAndLimits = async () => {
    try { const r = await api.get('/shops/my-shop'); if (r.data.shop) setMyShop(r.data.shop); } catch {}
    if (user?.subscription_plan) {
      const plan = user.subscription_plan;
      setProductLimit({ current: user.products_count || 0, max: plan.max_products === -1 ? Infinity : plan.max_products });
    }
  };

  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) return setError('Maximum 5 images allowed');
    setImagePreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    setImageFiles(p => [...p, ...files]); setError('');
  };

  const removeImage = (i) => { setImagePreviews(p => p.filter((_, idx) => idx !== i)); setImageFiles(p => p.filter((_, idx) => idx !== i)); };

  const uploadImages = async () => {
    if (!imageFiles.length) return [];
    setUploading(true);
    const fd = new FormData(); imageFiles.forEach(f => fd.append('images', f));
    try { const r = await api.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data.images?.map(img => img.url) || []; }
    catch { throw new Error('Image upload failed'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!formData.name.trim()) return setError('Product name is required');
    if (!formData.price || parseFloat(formData.price) <= 0) return setError('Valid price is required');
    if (!formData.category) return setError('Category is required');
    if (parseFloat(formData.price) > 99999999999) return setError('Price is too large');
    if (productLimit.current >= productLimit.max) return setError(`Product limit reached. Upgrade your plan to list more.`);
    if (formData.product_type === 'shop' && !myShop) return setError('Create a shop first or choose Individual.');
    setLoading(true);
    try {
      let imageUrls = [];
      if (imageFiles.length > 0) imageUrls = await uploadImages();
      await api.post('/products', { ...formData, price: parseFloat(formData.price), stock_quantity: parseInt(formData.stock_quantity) || 1, images: imageUrls, shop_id: formData.product_type === 'shop' && myShop ? myShop.id : null });
      showToast('Product listed successfully!');
      setFormData({ name: '', description: '', price: '', stock_quantity: '1', category: '', is_negotiable: false, product_type: 'individual' });
      setImagePreviews([]); setImageFiles([]);
      setProductLimit(p => ({ ...p, current: p.current + 1 }));
      setTimeout(() => navigate('/home'), 1500);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Error creating product'); }
    finally { setLoading(false); }
  };

  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.4)' : 'rgba(255,255,255,0.9)';
  const inputBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const accent = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const glassBg = darkMode ? 'rgba(20,20,40,0.75)' : 'rgba(255,255,255,0.75)';
  const dropdownBg = darkMode ? 'rgba(22,22,45,0.98)' : 'rgba(255,255,255,0.98)';
  const abg = darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.06)';

  const remainingProducts = productLimit.max === Infinity ? 'Unlimited' : productLimit.max - productLimit.current;
  const floatingBags = [...Array(8)].map((_, i) => ({ left: `${Math.random() * 90}%`, delay: `${Math.random() * 4}s`, duration: `${4 + Math.random() * 5}s`, size: 10 + Math.random() * 10, opacity: 0.04 }));
  const isLimitReached = productLimit.current >= productLimit.max;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, background: bgColor, position: 'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.05}95%{opacity:.05}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dropdownIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:640px){.sell-grid{grid-template-columns:1fr!important}.img-grid{grid-template-columns:repeat(3,1fr)!important}.header-row{flex-direction:column!important;align-items:flex-start!important}}
        .cat-dropdown::-webkit-scrollbar{width:0;height:0}
        .cat-dropdown{scrollbar-width:none;-ms-overflow-style:none}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingBags.map((bag, i) => (<div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}><svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '1.2rem' }}>
        
        {/* Header */}
        <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiTag size={20} style={{ color: accent }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Sell a Product</h1>
              <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0.1rem 0 0' }}>List your product and reach thousands of buyers across Rwanda</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/my-products" style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${borderColor}`, background: glassBg, backdropFilter: 'blur(12px)', color: textColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}><FiShoppingBag size={15} /> My Products</Link>
            <Link to="/subscriptions" style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: accent, color: '#000', textDecoration: 'none', transition: 'all 0.2s' }}>Upgrade Plan</Link>
          </div>
        </div>

        {/* Limit Bar */}
        <div style={{ marginBottom: '1rem', padding: '0.7rem 1rem', borderRadius: 12, background: isLimitReached ? 'rgba(239,68,68,0.06)' : 'rgba(0,227,9,0.04)', border: `1px solid ${isLimitReached ? 'rgba(239,68,68,0.15)' : 'rgba(0,227,9,0.1)'}`, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
          <FiLayers size={16} style={{ color: isLimitReached ? '#ef4444' : accent }} />
          <span style={{ color: textColor, fontWeight: 500 }}>{productLimit.current} / {productLimit.max === Infinity ? '∞' : productLimit.max} products</span>
          {isLimitReached && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.65rem', fontWeight: 700 }}>LIMIT REACHED</span>}
          <span style={{ color: textMuted, marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 500 }}>{isLimitReached ? 'Upgrade to list more' : `${remainingProducts} remaining`}</span>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '0.8rem', padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
          
          {/* Product Type */}
          <div>
            <label style={lbl}>Product Type</label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <label style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: formData.product_type === 'individual' ? `2px solid ${accent}` : `1px solid ${borderColor}`, background: formData.product_type === 'individual' ? abg : inputBg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <input type="radio" name="product_type" value="individual" checked={formData.product_type === 'individual'} onChange={handleChange} style={{ display: 'none' }} />
                <FiPackage size={22} style={{ margin: '0 auto 0.3rem', display: 'block', color: formData.product_type === 'individual' ? accent : textMuted }} />
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: formData.product_type === 'individual' ? accent : textColor }}>Individual</span>
                <p style={{ fontSize: '0.6rem', color: textMuted, marginTop: '0.15rem' }}>Sell as yourself</p>
              </label>
              <label style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: formData.product_type === 'shop' ? `2px solid ${accent}` : `1px solid ${borderColor}`, background: formData.product_type === 'shop' ? abg : inputBg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <input type="radio" name="product_type" value="shop" checked={formData.product_type === 'shop'} onChange={handleChange} style={{ display: 'none' }} />
                <FiShoppingBag size={22} style={{ margin: '0 auto 0.3rem', display: 'block', color: formData.product_type === 'shop' ? accent : textMuted }} />
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: formData.product_type === 'shop' ? accent : textColor }}>Shop Product</span>
                <p style={{ fontSize: '0.6rem', color: formData.product_type === 'shop' ? (myShop ? accent : '#ef4444') : textMuted, marginTop: '0.15rem' }}>{myShop ? myShop.shop_name : 'No shop created'}</p>
              </label>
            </div>
          </div>

          {/* Name + Category */}
          <div className="sell-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={lbl}>Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., iPhone 15 Pro Max" style={inp(textColor, borderColor, inputBg)} />
            </div>
            <div ref={catRef} style={{ position: 'relative' }}>
              <label style={lbl}>Category *</label>
              <button type="button" onClick={(e) => { e.stopPropagation(); setCatOpen(!catOpen); }}
                style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 10, border: `1px solid ${catOpen ? accent : borderColor}`, background: inputBg, color: formData.category ? textColor : textMuted, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
                <span>{formData.category || "Select category"}</span>
                <FiChevronDown size={16} style={{ color: accent }} />
              </button>
              {catOpen && (
                <div className="cat-dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 240, overflowY: 'auto', background: dropdownBg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${borderColor}`, boxShadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, animation: 'dropdownIn 0.15s ease', padding: '0.3rem' }}>
                  {categories.map(cat => (
                    <div key={cat} onClick={() => { setFormData(p => ({ ...p, category: cat })); setCatOpen(false); }}
                      style={{ padding: '0.55rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', color: formData.category === cat ? accent : textColor, background: formData.category === cat ? abg : 'transparent', fontWeight: formData.category === cat ? 600 : 400, transition: 'all 0.1s' }}>
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe your product in detail..." style={{ ...inp(textColor, borderColor, inputBg), resize: 'vertical', minHeight: 75 }} />
          </div>

          {/* Price, Stock, Negotiable */}
          <div className="sell-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={lbl}>Price (RWF) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="50,000" style={inp(textColor, borderColor, inputBg)} />
            </div>
            <div>
              <label style={lbl}>Stock Quantity</label>
              <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} placeholder="1" style={inp(textColor, borderColor, inputBg)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.55rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: textColor, fontWeight: 500 }}>
                <input type="checkbox" name="is_negotiable" checked={formData.is_negotiable} onChange={handleChange} style={{ width: 18, height: 18, accentColor: accent, cursor: 'pointer' }} /> Negotiable
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label style={lbl}><FiImage size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Product Images ({imagePreviews.length}/5)</label>
            <div className="img-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
              {[...Array(5)].map((_, i) => (
                imagePreviews[i] ? (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                    <img src={imagePreviews[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', transition: 'all 0.15s' }}><FiX size={13} /></button>
                  </div>
                ) : (
                  <label key={i} style={{ aspectRatio: '1/1', borderRadius: 10, border: `2px dashed ${borderColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textMuted, transition: 'all 0.2s', background: inputBg, gap: '0.3rem' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; e.currentTarget.style.background = darkMode ? 'rgba(0,227,9,0.04)' : 'rgba(0,227,9,0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = textMuted; e.currentTarget.style.background = inputBg; }}>
                    <FiUpload size={20} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 500 }}>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} multiple />
                  </label>
                )
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || uploading || isLimitReached}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 14, border: 'none', background: (loading || uploading || isLimitReached) ? `${accent}40` : accent, color: '#000', fontWeight: 700, fontSize: '0.9rem', cursor: (loading || uploading || isLimitReached) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', marginTop: '0.3rem', letterSpacing: '0.02em' }}>
            {loading || uploading ? (
              <>
                <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                {uploading ? 'Uploading Images...' : 'Listing Product...'}
              </>
            ) : isLimitReached ? (
              'Product Limit Reached - Upgrade Plan'
            ) : (
              'List Product'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inp = (tc, bc, ibg) => ({ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 10, border: `1px solid ${bc}`, background: ibg, fontSize: '0.82rem', outline: 'none', color: tc, boxSizing: 'border-box', transition: 'border-color 0.2s' });

export default Sell;