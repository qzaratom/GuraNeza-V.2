import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';

const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E309" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const ShopIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>);
const PackageIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>);
const CheckIcon = () => (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>);
const ChevronDown = () => (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00E309" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>);
const LocationIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const PhoneIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>);
const EmailIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const PlusIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>);
const EditIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DeleteIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>);
const StoreIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>);
const ImageIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const XIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>);

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.15)' : type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)';
  const border = type === 'success' ? 'rgba(0,227,9,0.3)' : type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)';
  const color = type === 'success' ? '#00E309' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 400, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color: color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'fadeIn 0.25s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' && <CheckIcon />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><XIcon /></button>
    </div>
  );
}

function Shops() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("market");
  const [shops, setShops] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchShop, setSearchShop] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [formData, setFormData] = useState({ shop_name: "", description: "", category: "", location: "", phone: "", email: "", poster_url: "" });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });

  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", stock_quantity: "1", category: "", is_negotiable: false });
  const [productImages, setProductImages] = useState([]);
  const [productImagePreviews, setProductImagePreviews] = useState([]);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [editCatOpen, setEditCatOpen] = useState(false);
  const catRef = useRef(null);
  const editCatRef = useRef(null);

  const categories = ["Electronics", "Fashion", "Groceries", "Home & Living", "Beauty & Personal Care", "Agriculture", "Automotive", "Sports & Fitness", "Books & Educational", "Other"];

  useEffect(() => { const h = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); if (editCatRef.current && !editCatRef.current.contains(e.target)) setEditCatOpen(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  useEffect(() => { fetchShops(); fetchMyShop(); fetchCurrentUser(); }, []);

  const fetchCurrentUser = async () => { try { const r = await api.get('/auth/refresh/me'); if (r.data.user) setCurrentUser(r.data.user); } catch {} };
  const fetchShops = async () => { try { const r = await api.get('/shops'); setShops(r.data.shops || []); } catch {} finally { setLoading(false); } };

  const fetchMyShop = async () => {
    try { const r = await api.get('/shops/my-shop'); if (r.data.shop) { setMyShop({ ...r.data.shop, products: r.data.products || [] }); setFormData({ shop_name: r.data.shop.shop_name || "", description: r.data.shop.description || "", category: r.data.shop.category || "", location: r.data.shop.location || "", phone: r.data.shop.phone_numbers?.[0] || "", email: r.data.shop.email || "", poster_url: r.data.shop.poster_url || "" }); if (r.data.shop.poster_url) setPosterPreview(r.data.shop.poster_url); } } catch {}
  };

  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); setFormError(""); };
  const handlePosterChange = (e) => { const f = e.target.files[0]; if (f) { setPosterFile(f); setPosterPreview(URL.createObjectURL(f)); } };

  const uploadPoster = async () => { if (!posterFile) return formData.poster_url || ""; setUploading(true); try { const fd = new FormData(); fd.append('image', posterFile); const r = await api.post('/upload/single', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data.image?.url || ""; } catch { throw new Error("Upload failed"); } finally { setUploading(false); } };

  const handleCreateShop = async (e) => { e.preventDefault(); if (!formData.shop_name.trim()) { setFormError("Shop name required"); return; } setFormLoading(true); setFormError(""); try { let pu = formData.poster_url; if (posterFile) pu = await uploadPoster(); await api.post('/shops', { shop_name: formData.shop_name, description: formData.description, category: formData.category, location: formData.location, phone_numbers: formData.phone ? [formData.phone] : [], email: formData.email, poster_url: pu }); showToast("Shop created successfully!"); setShowCreateForm(false); setPosterFile(null); setPosterPreview(""); fetchMyShop(); fetchShops(); } catch (err) { setFormError(err.response?.data?.message || "Failed"); } finally { setFormLoading(false); } };
  const handleUpdateShop = async (e) => { e.preventDefault(); if (!formData.shop_name.trim()) { setFormError("Shop name required"); return; } setFormLoading(true); setFormError(""); try { let pu = formData.poster_url; if (posterFile) pu = await uploadPoster(); await api.put(`/shops/${myShop.id}`, { shop_name: formData.shop_name, description: formData.description, category: formData.category, location: formData.location, phone_numbers: formData.phone ? [formData.phone] : [], email: formData.email, poster_url: pu }); showToast("Shop updated!"); setShowEditForm(false); setPosterFile(null); fetchMyShop(); fetchShops(); } catch (err) { setFormError(err.response?.data?.message || "Failed"); } finally { setFormLoading(false); } };

  const handleDeleteProduct = async (id) => { try { await api.delete(`/products/${id}`); showToast("Product deleted"); fetchMyShop(); setDeleteConfirm(null); } catch { showToast("Failed to delete", "error"); } };

  const handleEditProduct = (product) => { setEditingProduct(product); setProductForm({ name: product.name || "", description: product.description || "", price: product.price || "", stock_quantity: product.stock_quantity || "1", category: product.category || "", is_negotiable: product.is_negotiable || false }); setProductImagePreviews(product.images || []); setProductImages([]); setProductFormError(""); };
  const handleProductImageChange = (e) => { const files = Array.from(e.target.files); if (files.length + productImagePreviews.length > 5) { setProductFormError("Max 5 images"); return; } setProductImages(prev => [...prev, ...files]); setProductImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]); setProductFormError(""); };
  const removeProductImage = (i) => { setProductImagePreviews(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSaveProduct = async (e) => {
    e.preventDefault(); if (!productForm.name || !productForm.price) { setProductFormError("Name and price required"); return; }
    setProductFormLoading(true); setProductFormError("");
    try {
      let imageUrls = productImagePreviews.filter(img => typeof img === 'string' && !img.startsWith('blob:'));
      const newFiles = productImages.filter(f => f instanceof File);
      if (newFiles.length > 0) { const fd = new FormData(); newFiles.forEach(f => fd.append('images', f)); const r = await api.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); const newUrls = r.data.images?.map(img => img.url) || []; imageUrls = [...imageUrls, ...newUrls]; }
      await api.put(`/products/${editingProduct.id}`, { ...productForm, price: parseFloat(productForm.price), stock_quantity: parseInt(productForm.stock_quantity), images: imageUrls });
      showToast("Product updated!");
      setTimeout(() => { setEditingProduct(null); fetchMyShop(); }, 500);
    } catch (err) { setProductFormError(err.response?.data?.message || "Failed"); } finally { setProductFormLoading(false); }
  };

  const getTimeAgo = (d) => { if (!d) return ""; const s = Math.floor((new Date() - new Date(d)) / 1000); if (s < 60) return "Now"; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

  const filteredShops = useMemo(() => {
    let r = [...shops]; if (searchShop.trim()) { const t = searchShop.toLowerCase(); r = r.filter(s => s.shop_name?.toLowerCase().includes(t) || s.description?.toLowerCase().includes(t)); } if (searchLocation.trim()) { const l = searchLocation.toLowerCase(); r = r.filter(s => s.location?.toLowerCase().includes(l)); }
    const ul = currentUser?.location?.toLowerCase() || ''; r.sort((a, b) => { const sc = (s) => { let x = 0; const p = s.owner?.subscription_plan; if (p?.badge_vip) x += 300; if (p?.badge_verified_shop) x += 200; if (p?.badge_verified_seller) x += 100; if (ul && s.location?.toLowerCase().includes(ul)) x += 10; return x; }; const d = sc(b) - sc(a); return d !== 0 ? d : new Date(b.created_at) - new Date(a.created_at); }); return r;
  }, [shops, searchShop, searchLocation, currentUser]);

  const getShopBadges = (owner) => { const b = []; const p = owner?.subscription_plan; if (p?.badge_vip) b.push({ l: 'VIP', bg: '#eab308', c: '#000' }); if (p?.badge_verified_shop) b.push({ l: 'Verified', bg: '#3b82f6', c: '#fff' }); return b; };
  const getMyShopBadge = () => { if (!myShop) return null; const p = currentUser?.subscription_plan; if (p?.badge_verified_shop) return { l: 'Verified Shop', bg: '#3b82f6', c: '#fff' }; return null; };

  const tc = darkMode ? 'white' : '#1a1a2e'; const tm = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const bc = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; const cbg = darkMode ? 'rgba(26,26,46,0.4)' : 'rgba(255,255,255,0.9)';
  const ac = '#00E309'; const abg = darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.06)';
  const ibg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; const gbg = darkMode ? 'rgba(20,20,40,0.75)' : 'rgba(255,255,255,0.75)';
  const dbg = darkMode ? 'rgba(22,22,45,0.95)' : 'rgba(255,255,255,0.95)'; const bbg = darkMode ? '#0a0a14' : '#f8fafc';
  const bags = [...Array(8)].map((_, i) => ({ l: `${Math.random() * 90}%`, d: `${Math.random() * 4}s`, dur: `${4 + Math.random() * 5}s`, s: 10 + Math.random() * 10, o: 0.04 }));
  const msb = getMyShopBadge();

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: tc, background: bbg, position: 'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}} @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.05}95%{opacity:.05}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .ch:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.25)!important}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        @media(max-width:640px){.sg{grid-template-columns:repeat(2,1fr)!important}.fg{grid-template-columns:1fr!important}.cg{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {bags.map((b, i) => (<div key={i} style={{ position: 'absolute', left: b.l, bottom: '-30px', animation: `bagRise ${b.dur} linear infinite`, animationDelay: b.d, opacity: b.o }}><svg width={b.s} height={b.s} viewBox="0 0 24 24" fill={darkMode?"white":"#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '1.2rem' }}>
        
        {/* Header - LEFT ALIGNED */}
        <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShopIcon /></div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Shops</h1>
            <p style={{ color: tm, fontSize: '0.78rem', margin: '0.1rem 0 0' }}>Browse marketplace shops or manage your own</p>
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: gbg, backdropFilter: 'blur(16px)', borderRadius: 12, border: `1px solid ${bc}`, padding: '0.5rem 0.8rem', flex: '1 1 200px', maxWidth: 320 }}><SearchIcon /><input type="text" placeholder="Search shops..." value={searchShop} onChange={(e) => setSearchShop(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.78rem', padding: '0.15rem 0', outline: 'none', color: tc }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: gbg, backdropFilter: 'blur(16px)', borderRadius: 12, border: `1px solid ${bc}`, padding: '0.5rem 0.8rem', flex: '1 1 180px', maxWidth: 260 }}><LocationIcon /><input type="text" placeholder="Location..." value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.78rem', padding: '0.15rem 0', outline: 'none', color: tc }} /></div>
          <div style={{ display: 'flex', gap: '3px', background: gbg, backdropFilter: 'blur(16px)', borderRadius: 10, padding: '3px', border: `1px solid ${bc}`, flexShrink: 0 }}>
            <button onClick={() => setActiveTab("market")} style={{ padding: '0.45rem 1.2rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab==="market"?ac:'transparent', color: activeTab==="market"?'#000':tc, transition: 'all 0.2s' }}>Market</button>
            <button onClick={() => setActiveTab("myshop")} style={{ padding: '0.45rem 1.2rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab==="myshop"?ac:'transparent', color: activeTab==="myshop"?'#000':tc, transition: 'all 0.2s' }}>My Shop</button>
          </div>
        </div>

        {/* MARKET TAB */}
        {activeTab === "market" && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}><div style={{ width: 32, height: 32, border: `2px solid ${bc}`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
            ) : filteredShops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: cbg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${bc}` }}>
                <StoreIcon />
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.6rem' }}>{shops.length===0?"No shops yet":"No shops match your search"}</h2>
                <p style={{ color: tm, fontSize: '0.75rem', marginTop: '0.3rem' }}>{shops.length===0?"Be the first to create a shop!" : "Try different search terms"}</p>
              </div>
            ) : (
              <div className="sg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.9rem' }}>
                {filteredShops.map(shop => {
                  const badges = getShopBadges(shop.owner);
                  const isLocal = currentUser?.location && shop.location?.toLowerCase().includes(currentUser.location.toLowerCase());
                  return (
                    <div key={shop.id} className="ch" onClick={() => navigate(`/shops/${shop.id}`)} style={{ background: cbg, backdropFilter: 'blur(16px)', borderRadius: 14, border: `1px solid ${bc}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}>
                      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,0.1)' }}>
                        {shop.poster_url ? <img src={shop.poster_url} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <StoreIcon />}
                        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {badges.map((b, i) => (<span key={i} style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.55rem', fontWeight: 700, background: b.bg, color: b.c }}>{b.l}</span>))}
                          {isLocal && <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.55rem', fontWeight: 600, background: ac, color: '#000', display: 'flex', alignItems: 'center', gap: 3 }}><LocationIcon /> Nearby</span>}
                        </div>
                      </div>
                      <div style={{ padding: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'flex-start' }}>
                          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, flex: 1 }}>{shop.shop_name}</h3>
                          {shop.category && <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.55rem', background: abg, color: ac, whiteSpace: 'nowrap', marginLeft: '0.4rem' }}>{shop.category}</span>}
                        </div>
                        <p style={{ color: tm, fontSize: '0.68rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '1.8rem', margin: '0.3rem 0 0' }}>{shop.description || "No description"}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: `1px solid ${bc}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg,${ac},#22c55e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: '#000' }}>{(shop.owner?.display_name||"S")[0].toUpperCase()}</div>
                            <span style={{ fontWeight: 600, fontSize: '0.68rem' }}>{shop.owner?.display_name||"Unknown"}</span>
                          </div>
                          {shop.location && <span style={{ fontSize: '0.6rem', color: tm, display: 'flex', alignItems: 'center', gap: 3 }}><LocationIcon />{shop.location}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY SHOP TAB */}
        {activeTab === "myshop" && (
          <div>
            {!myShop && !showCreateForm ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: cbg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${bc}`, maxWidth: 450, margin: '0 auto' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><StoreIcon /></div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.8rem', marginBottom: '0.3rem' }}>No shop yet</h2>
                <p style={{ color: tm, fontSize: '0.75rem', marginBottom: '1rem' }}>Create your shop to start selling products</p>
                <button onClick={() => setShowCreateForm(true)} style={{ padding: '0.6rem 1.8rem', borderRadius: 24, background: ac, color: '#000', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><PlusIcon /> Create Shop</button>
              </div>
            ) : showCreateForm || showEditForm ? (
              <div style={{ maxWidth: 580, margin: '0 auto' }}>
                <div style={{ background: cbg, backdropFilter: 'blur(20px)', borderRadius: 18, padding: '1.8rem', border: `1px solid ${bc}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.4rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{showEditForm?<EditIcon/>:<StoreIcon/>}</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{showEditForm?"Edit Your Shop":"Create Your Shop"}</h2>
                  </div>
                  {formError && <div style={{ marginBottom: '0.8rem', padding: '0.7rem 0.9rem', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 10, color: '#ff4444', fontSize: '0.75rem' }}>{formError}</div>}
                  <form onSubmit={showEditForm?handleUpdateShop:handleCreateShop} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div><label style={lbl}>Shop Name *</label><input type="text" name="shop_name" value={formData.shop_name} onChange={handleFormChange} style={is(tc,bc,ibg)} placeholder="Enter shop name" /></div>
                    <div><label style={lbl}>Description</label><textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} style={{...is(tc,bc,ibg),resize:'vertical',minHeight:70}} placeholder="Describe your shop" /></div>
                    <div ref={catRef} style={{ position: 'relative' }}><label style={lbl}>Category</label><button type="button" onClick={() => setCatOpen(!catOpen)} style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: 10, border: `1px solid ${catOpen?ac:bc}`, background: ibg, color: formData.category?tc:tm, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', outline: 'none' }}><span>{formData.category||"Select category"}</span><ChevronDown /></button>{catOpen && (<div className="no-scrollbar" style={{ position: 'absolute', top: 'calc(100% + 0.2rem)', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: dbg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${bc}`, boxShadow: '0 12px 32px rgba(0,0,0,0.3)', zIndex: 20, padding: '0.25rem', animation: 'slideDown 0.15s ease' }}>{categories.map(c => (<div key={c} onClick={() => { setFormData(p=>({...p,category:c})); setCatOpen(false); }} style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: formData.category===c?ac:tc, background: formData.category===c?abg:'transparent', fontWeight: formData.category===c?600:400 }}>{c}</div>))}</div>)}</div>
                    <div className="fg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}><div><label style={lbl}>Location</label><input type="text" name="location" value={formData.location} onChange={handleFormChange} style={is(tc,bc,ibg)} placeholder="e.g. Kigali" /></div><div><label style={lbl}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} style={is(tc,bc,ibg)} placeholder="+250 7XX XXX XXX" /></div></div>
                    <div><label style={lbl}>Email</label><input type="email" name="email" value={formData.email} onChange={handleFormChange} style={is(tc,bc,ibg)} placeholder="shop@example.com" /></div>
                    <div><label style={lbl}>Shop Poster</label>{posterPreview?(<div style={{ position: 'relative', width: '100%', height: 130, borderRadius: 12, overflow: 'hidden', marginBottom: '0.4rem', border: `1px solid ${bc}` }}><img src={posterPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><button type="button" onClick={()=>{setPosterFile(null);setPosterPreview("");setFormData(p=>({...p,poster_url:""}));}} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon/></button></div>):(<label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '1.5rem', borderRadius: 12, border: `2px dashed ${bc}`, cursor: 'pointer', background: ibg, transition: 'all 0.2s' }}><ImageIcon /><span style={{ fontSize: '0.75rem', color: tm }}>Click to upload poster</span><input type="file" accept="image/*" onChange={handlePosterChange} style={{ display: 'none' }} /></label>)}{posterPreview&&(<label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: 10, border: `1px solid ${bc}`, cursor: 'pointer', fontSize: '0.7rem', color: tm, marginTop: '0.4rem', transition: 'all 0.2s' }}><ImageIcon /> Change poster<input type="file" accept="image/*" onChange={handlePosterChange} style={{ display: 'none' }} /></label>)}</div>
                    <div style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.4rem' }}><button type="submit" disabled={formLoading||uploading} style={{ flex: 1, padding: '0.6rem', borderRadius: 12, border: 'none', background: (formLoading||uploading)?`${ac}60`:ac, color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: (formLoading||uploading)?'not-allowed':'pointer', transition: 'all 0.2s' }}>{uploading?"Uploading...":formLoading?"Saving...":showEditForm?"Update Shop":"Create Shop"}</button><button type="button" onClick={()=>{showEditForm?setShowEditForm(false):setShowCreateForm(false);setPosterFile(null);setPosterPreview("");}} style={{ padding: '0.6rem 1.4rem', borderRadius: 12, border: `1px solid ${bc}`, background: 'transparent', color: tc, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button></div>
                  </form>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    {myShop.poster_url?<img src={myShop.poster_url} alt={myShop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>:<StoreIcon/>}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '1.2rem 1.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <div style={{ color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{myShop.shop_name}</h2>
                          {msb && <span style={{ padding: '3px 12px', borderRadius: 10, fontSize: '0.6rem', fontWeight: 700, background: msb.bg, color: msb.c }}>{msb.l}</span>}
                        </div>
                        <p style={{ fontSize: '0.7rem', opacity: 0.85, margin: '0.2rem 0 0' }}>{myShop.description||"No description"}</p>
                      </div>
                      <button onClick={() => setShowEditForm(true)} style={{ padding: '0.5rem 1.4rem', borderRadius: 20, background: 'white', color: '#1a1a2e', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}><EditIcon/>Edit Shop</button>
                    </div>
                  </div>
                </div>

                <div style={{ background: cbg, backdropFilter: 'blur(16px)', borderRadius: 14, padding: '1.2rem', border: `1px solid ${bc}`, marginBottom: '0.9rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.82rem', margin: '0 0 0.7rem', color: tm, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Information</h3>
                  <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
                    {[{icon:<EmailIcon/>,l:'Email',v:myShop.email||"Not set"},{icon:<PhoneIcon/>,l:'Phone',v:myShop.phone_numbers?.[0]||"Not set"},{icon:<LocationIcon/>,l:'Location',v:myShop.location||"Not set"}].map((item,i)=>(
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.7rem', borderRadius: 10, background: ibg }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.55rem', color: tm, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.l}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: cbg, backdropFilter: 'blur(16px)', borderRadius: 14, padding: '1.2rem', border: `1px solid ${bc}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Products ({(myShop.products||[]).length})</h3>
                    <Link to="/sell" style={{ padding: '0.5rem 1.2rem', borderRadius: 18, fontSize: '0.72rem', fontWeight: 700, background: ac, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}><PlusIcon/>Add Product</Link>
                  </div>
                  {(!myShop.products||myShop.products.length===0)?(
                    <div style={{ textAlign: 'center', padding: '2rem' }}><PackageIcon/><p style={{ color: tm, marginTop: '0.5rem', fontSize: '0.75rem' }}>No products yet. Add your first product!</p></div>
                  ):(
                    <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.7rem' }}>
                      {myShop.products.map(product=>(
                        <div key={product.id} style={{ background: ibg, borderRadius: 12, overflow: 'hidden', border: `1px solid ${bc}`, position: 'relative', transition: 'all 0.2s' }}>
                          <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)' }}>
                              {product.images?.[0]?<img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>:<PackageIcon/>}
                            </div>
                            <div style={{ padding: '0.6rem' }}>
                              <h4 style={{ fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{product.name}</h4>
                              <p style={{ fontWeight: 700, fontSize: '0.72rem', color: ac, margin: '0.15rem 0 0' }}>{Number(product.price).toLocaleString()} RWF</p>
                            </div>
                          </Link>
                          <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: '4px' }}>
                            <button onClick={(e)=>{e.stopPropagation();e.preventDefault();handleEditProduct(product);}} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.4)', color: '#93c5fd', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><EditIcon/></button>
                            <button onClick={(e)=>{e.stopPropagation();e.preventDefault();setDeleteConfirm(product.id);}} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.4)', color: '#fca5a5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><DeleteIcon/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: dbg, backdropFilter: 'blur(24px)', borderRadius: 18, padding: '1.8rem', maxWidth: 360, width: '90%', border: `1px solid ${bc}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'modalIn 0.2s ease', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><DeleteIcon /></div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.3rem', color: tc }}>Delete Product?</h3>
            <p style={{ color: tm, fontSize: '0.72rem', margin: '0 0 1.2rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => handleDeleteProduct(deleteConfirm)} style={{ flex: 1, padding: '0.55rem', borderRadius: 12, background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.55rem', borderRadius: 12, background: 'transparent', border: `1px solid ${bc}`, color: tc, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setEditingProduct(null)}>
          <div style={{ background: dbg, backdropFilter: 'blur(24px)', borderRadius: 18, padding: '1.8rem', maxWidth: 500, width: '90%', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${bc}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'modalIn 0.2s ease' }} className="no-scrollbar" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: tc }}>Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${bc}`, background: 'transparent', color: tm, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><CloseIcon /></button>
            </div>
            {productFormError && <div style={{ marginBottom: '0.8rem', padding: '0.6rem 0.9rem', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 8, color: '#ff4444', fontSize: '0.72rem' }}>{productFormError}</div>}
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div><label style={lbl}>Name *</label><input type="text" value={productForm.name} onChange={e=>setProductForm(p=>({...p,name:e.target.value}))} style={is(tc,bc,ibg)} /></div>
              <div><label style={lbl}>Description</label><textarea value={productForm.description} onChange={e=>setProductForm(p=>({...p,description:e.target.value}))} rows={3} style={{...is(tc,bc,ibg),resize:'vertical',minHeight:55}} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}><div><label style={lbl}>Price (RWF) *</label><input type="number" value={productForm.price} onChange={e=>setProductForm(p=>({...p,price:e.target.value}))} style={is(tc,bc,ibg)} /></div><div><label style={lbl}>Stock</label><input type="number" value={productForm.stock_quantity} onChange={e=>setProductForm(p=>({...p,stock_quantity:e.target.value}))} style={is(tc,bc,ibg)} /></div></div>
              <div ref={editCatRef} style={{ position: 'relative' }}><label style={lbl}>Category</label><button type="button" onClick={()=>setEditCatOpen(!editCatOpen)} style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: 10, border: `1px solid ${editCatOpen?ac:bc}`, background: ibg, color: productForm.category?tc:tm, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', outline: 'none' }}><span>{productForm.category||"Select category"}</span><ChevronDown/></button>{editCatOpen&&(<div className="no-scrollbar" style={{ position: 'absolute', top: 'calc(100% + 0.2rem)', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: dbg, backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${bc}`, boxShadow: '0 12px 32px rgba(0,0,0,0.3)', zIndex: 20, padding: '0.25rem', animation: 'slideDown 0.15s ease' }}>{categories.map(c=>(<div key={c} onClick={()=>{setProductForm(p=>({...p,category:c}));setEditCatOpen(false);}} style={{ padding: '0.5rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: productForm.category===c?ac:tc, background: productForm.category===c?abg:'transparent', fontWeight: productForm.category===c?600:400 }}>{c}</div>))}</div>)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={productForm.is_negotiable} onChange={e=>setProductForm(p=>({...p,is_negotiable:e.target.checked}))} style={{ width: 18, height: 18, accentColor: ac, cursor: 'pointer' }} /><label style={{ fontSize: '0.75rem', color: tc, cursor: 'pointer' }}>Price is negotiable</label></div>
              <div><label style={lbl}>Images (Max 5)</label><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>{productImagePreviews.map((img,i)=>(<div key={i} style={{ position: 'relative', width: 65, height: 65, borderRadius: 8, overflow: 'hidden', border: `1px solid ${bc}` }}><img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/><button type="button" onClick={()=>removeProductImage(i)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem' }}><XIcon/></button></div>))}{productImagePreviews.length<5&&(<label style={{ width: 65, height: 65, borderRadius: 8, border: `2px dashed ${bc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: ibg, transition: 'all 0.2s' }}><PlusIcon/><input type="file" accept="image/*" onChange={handleProductImageChange} multiple style={{ display: 'none' }}/></label>)}</div></div>
              <div style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.4rem' }}><button type="submit" disabled={productFormLoading} style={{ flex: 1, padding: '0.6rem', borderRadius: 12, border: 'none', background: productFormLoading?`${ac}60`:ac, color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: productFormLoading?'not-allowed':'pointer', transition: 'all 0.2s' }}>{productFormLoading?"Saving...":"Update Product"}</button><button type="button" onClick={()=>setEditingProduct(null)} style={{ padding: '0.6rem 1.4rem', borderRadius: 12, border: `1px solid ${bc}`, background: 'transparent', color: tc, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const is = (tc,bc,ibg) => ({ width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: `1px solid ${bc}`, background: ibg, fontSize: '0.78rem', outline: 'none', color: tc, boxSizing: 'border-box', transition: 'border-color 0.2s' });

export default Shops;