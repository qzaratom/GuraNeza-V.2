import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiSearch, FiSliders, FiChevronDown, FiDollarSign, 
  FiMapPin, FiClock, FiPackage, FiX, FiCheck,
  FiStar, FiShield, FiArrowUp, FiEye, FiHeart
} from 'react-icons/fi';

function LazyImage({ src, alt }) { 
  const [loaded, setLoaded] = useState(false); 
  const [inView, setInView] = useState(false); 
  const imgRef = useRef(null); 
  useEffect(() => { 
    const observer = new IntersectionObserver(([entry]) => { 
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); } 
    }, { rootMargin: '200px' }); 
    if (imgRef.current) observer.observe(imgRef.current); 
    return () => observer.disconnect(); 
  }, []); 
  return (
    <div ref={imgRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {inView ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }} onLoad={() => setLoaded(true)} loading="lazy" /> : <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.03)' }} />}
      {inView && !loaded && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#00E309', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /></div>}
    </div>
  ); 
}

const getPlanPriority = (seller) => {
  if (!seller?.subscription_plan) return 0;
  const plan = seller.subscription_plan;
  let score = 0;
  if (plan.badge_vip) score += 100;
  if (plan.badge_verified_shop) score += 50;
  if (plan.badge_verified_product) score += 30;
  if (plan.badge_verified_seller) score += 10;
  score += Math.floor((plan.price_rwf || 0) / 1000);
  return score;
};

function Home() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 12;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterNegotiable, setFilterNegotiable] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(52);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const filterMenuRef = useRef(null);
  const catDropdownRef = useRef(null);
  const loaderRef = useRef(null);

  const allCategories = useMemo(() => { const cats = new Set(products.map(p => p.category).filter(Boolean)); return ["All", ...cats]; }, [products]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { const updateNavHeight = () => { setNavbarHeight(window.innerWidth < 1025 ? 44 : 52); }; updateNavHeight(); window.addEventListener('resize', updateNavHeight); return () => window.removeEventListener('resize', updateNavHeight); }, []);
  useEffect(() => { const h = (e) => { if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) setFilterMenuOpen(false); if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setCatDropdownOpen(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  useEffect(() => { if (filterMenuOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [filterMenuOpen]);
  useEffect(() => { setProducts([]); setPage(0); setHasMore(true); fetchProducts(0, true); }, [search, selectedCategory, minPrice, maxPrice, filterNegotiable, productTypeFilter]);

  const fetchProducts = async (pageNum, reset = false) => {
    if (reset) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit)); params.append('offset', String(pageNum * limit)); params.append('sort_by', 'newest');
      if (search) params.append('search', search);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (filterNegotiable) params.append('is_negotiable', 'true');
      const res = await api.get(`/products?${params.toString()}`);
      let newProducts = res.data.products || [];
      if (productTypeFilter === 'individual') newProducts = newProducts.filter(p => p.product_type === 'individual');
      else if (productTypeFilter === 'shop') newProducts = newProducts.filter(p => p.product_type === 'shop');
      newProducts.sort((a, b) => {
        const priorityA = getPlanPriority(a.seller);
        const priorityB = getPlanPriority(b.seller);
        if (priorityB !== priorityA) return priorityB - priorityA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      if (reset) setProducts(newProducts); else setProducts(prev => [...prev, ...newProducts]);
      setHasMore(newProducts.length === limit);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting && hasMore && !loading) { const np = page + 1; setPage(np); fetchProducts(np); } }, { rootMargin: '100px' }); if (loaderRef.current) observer.observe(loaderRef.current); return () => observer.disconnect(); }, [hasMore, loading, page]);

  const getTimeAgo = (d) => { if (!d) return ""; const s = Math.floor((new Date() - new Date(d)) / 1000); if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; };
  const resetFilters = () => { setSearch(""); setMinPrice(""); setMaxPrice(""); setSelectedCategory("All"); setFilterNegotiable(false); setProductTypeFilter("all"); };
  const activeFilterCount = (filterNegotiable ? 1 : 0) + (productTypeFilter !== 'all' ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const getSellerBadges = (seller, productType) => {
    if (!seller || !seller.subscription_plan) return [];
    const plan = seller.subscription_plan;
    const badges = [];
    if (plan.badge_vip) badges.push({ type: 'vip', label: 'VIP', icon: FiStar, bg: '#eab308' });
    if (plan.badge_verified_seller) badges.push({ type: 'verified_seller', label: 'Verified Seller', icon: FiShield, bg: '#3b82f6' });
    if (plan.badge_verified_product) badges.push({ type: 'verified_product', label: 'Verified Product', icon: FiCheck, bg: '#22c55e' });
    if (plan.badge_verified_shop && productType === 'shop') badges.push({ type: 'verified_shop', label: 'Verified Shop', icon: FiShield, bg: '#a855f7' });
    return badges;
  };

  const floatingBags = useMemo(() => [...Array(8)].map((_, i) => ({ left: `${Math.random() * 90}%`, delay: `${Math.random() * 4}s`, duration: `${4 + Math.random() * 5}s`, size: 10 + Math.random() * 10, opacity: darkMode ? 0.04 : 0.04 })), [darkMode]);

  const bg = darkMode ? '#0a0a14' : '#f8fafc';
  const tc = darkMode ? 'white' : '#1a1a2e';
  const tm = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const bc = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cbg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.95)';
  const ac = '#00E309';
  const abg = darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,227,9,0.06)';
  const glassBg = darkMode ? 'rgba(20,20,40,0.75)' : 'rgba(255,255,255,0.75)';
  const shadow = darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.05)';

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: tc, background: bg, position: 'relative', minHeight: '100vh' }}>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bagRise { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 5% { opacity: 0.05; } 95% { opacity: 0.05; } 100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: ${darkMode ? '0 8px 28px rgba(0,0,0,0.35)' : '0 8px 28px rgba(0,0,0,0.08)'}; }
        .badge-circle { transition: all 0.2s; }
        .badge-circle:hover { transform: scale(1.15); }
        .badge-tooltip { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); padding: 3px 8px; border-radius: 5px; font-size: 0.5rem; font-weight: 700; white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.15s; pointer-events: none; z-index: 20; }
        .badge-wrapper:hover .badge-tooltip { opacity: 1 !important; visibility: visible !important; }
        .btn-hover { transition: all 0.2s; }
        .cat-scroll::-webkit-scrollbar { height: 0; } .cat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-top-btn { transition: all 0.2s; animation: fadeInUp 0.3s ease; }
        .scroll-top-btn:hover { transform: scale(1.1); }
        @media (max-width: 768px) { 
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; } 
          .product-card-pad { padding: 8px !important; }
          .scroll-top-desktop { display: none !important; }
          .scroll-top-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .scroll-top-mobile { display: none !important; }
          .scroll-top-desktop { display: flex !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingBags.map((bag, i) => (<div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}><svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}
      </div>

      {/* Scroll to Top - DESKTOP (bottom right, larger) */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="scroll-top-btn scroll-top-desktop"
          style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, width: 48, height: 48, borderRadius: 14, border: `1px solid ${bc}`, background: cbg, backdropFilter: 'blur(16px)', color: ac, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', boxShadow: shadow }}
          onMouseEnter={e => { e.currentTarget.style.background = abg; e.currentTarget.style.borderColor = ac; }}
          onMouseLeave={e => { e.currentTarget.style.background = cbg; e.currentTarget.style.borderColor = bc; }}>
          <FiArrowUp size={22} />
        </button>
      )}

      {/* Scroll to Top - MOBILE (bottom right, smaller, above nav bar) */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="scroll-top-btn scroll-top-mobile"
          style={{ position: 'fixed', bottom: 90, right: 12, zIndex: 200, width: 36, height: 36, borderRadius: 10, border: `1px solid ${bc}`, background: cbg, backdropFilter: 'blur(16px)', color: ac, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', boxShadow: shadow }}
          onMouseEnter={e => { e.currentTarget.style.background = abg; e.currentTarget.style.borderColor = ac; }}
          onMouseLeave={e => { e.currentTarget.style.background = cbg; e.currentTarget.style.borderColor = bc; }}>
          <FiArrowUp size={16} />
        </button>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* STICKY: Search + Filters */}
        <div style={{ position: 'sticky', top: navbarHeight, zIndex: 80, padding: '8px 12px', background: `linear-gradient(to bottom, ${bg}, ${bg}90, transparent)` }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 14, border: `1px solid ${bc}`, background: glassBg, backdropFilter: 'blur(16px)' }}>
                <FiSearch size={16} style={{ color: ac }} />
                <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '0.8rem', padding: '4px 0', outline: 'none', color: tc }} />
              </div>
              <div ref={filterMenuRef} style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setFilterMenuOpen(!filterMenuOpen); }} className="btn-hover"
                  style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${activeFilterCount > 0 ? ac : bc}`, background: activeFilterCount > 0 ? abg : glassBg, backdropFilter: 'blur(16px)', color: activeFilterCount > 0 ? ac : tc, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <FiSliders size={18} />
                  {activeFilterCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: ac, color: '#000', fontSize: '0.5rem', minWidth: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilterCount}</span>}
                </button>
                {filterMenuOpen && (<>
                  <div onClick={() => setFilterMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} />
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, width: 'calc(100% - 2rem)', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', background: darkMode ? 'rgba(22,22,45,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', borderRadius: 20, border: `1px solid ${bc}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}><h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: tc }}>Filters</h4><button onClick={() => setFilterMenuOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${bc}`, background: 'transparent', color: tm, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div><label style={{ fontSize: '0.65rem', fontWeight: 700, color: tm, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Category</label>
                        <div ref={catDropdownRef} style={{ position: 'relative' }}><button onClick={(e) => { e.stopPropagation(); setCatDropdownOpen(!catDropdownOpen); }} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${bc}`, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: tc, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span>{selectedCategory === "All" ? "All Categories" : selectedCategory}</span><FiChevronDown size={14} style={{ color: ac }} /></button>
                          {catDropdownOpen && (<div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: darkMode ? 'rgba(22,22,45,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', borderRadius: 10, border: `1px solid ${bc}`, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 10 }}>{allCategories.map(cat => (<div key={cat} onClick={() => { setSelectedCategory(cat); setCatDropdownOpen(false); }} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.75rem', color: selectedCategory === cat ? ac : tc, background: selectedCategory === cat ? abg : 'transparent' }}>{cat === "All" ? "All Categories" : cat}</div>))}</div>)}
                        </div>
                      </div>
                      <div><label style={{ fontSize: '0.65rem', fontWeight: 700, color: tm, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Product Type</label>
                        <div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setProductTypeFilter(productTypeFilter === 'individual' ? 'all' : 'individual')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: productTypeFilter === 'individual' ? `1.5px solid ${ac}` : `1px solid ${bc}`, background: productTypeFilter === 'individual' ? abg : 'transparent', color: productTypeFilter === 'individual' ? ac : tc, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>Individual</button><button onClick={() => setProductTypeFilter(productTypeFilter === 'shop' ? 'all' : 'shop')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: productTypeFilter === 'shop' ? `1.5px solid ${ac}` : `1px solid ${bc}`, background: productTypeFilter === 'shop' ? abg : 'transparent', color: productTypeFilter === 'shop' ? ac : tc, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>Shop</button></div>
                      </div>
                      <div><label style={{ fontSize: '0.65rem', fontWeight: 700, color: tm, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Other</label>
                        <button onClick={() => setFilterNegotiable(!filterNegotiable)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: filterNegotiable ? `1.5px solid ${ac}` : `1px solid ${bc}`, background: filterNegotiable ? abg : 'transparent', color: filterNegotiable ? ac : tc, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiDollarSign size={14} /> Negotiable</span>{filterNegotiable && <FiCheck size={16} />}</button>
                      </div>
                      <div><label style={{ fontSize: '0.65rem', fontWeight: 700, color: tm, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Price Range (RWF)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${bc}`, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: tc, fontSize: '0.75rem', outline: 'none', textAlign: 'center' }} /><span style={{ color: tm, fontSize: '0.7rem' }}>to</span><input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${bc}`, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: tc, fontSize: '0.75rem', outline: 'none', textAlign: 'center' }} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${bc}` }}><button onClick={() => { resetFilters(); setFilterMenuOpen(false); }} style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${bc}`, background: 'transparent', color: tm, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Reset</button><button onClick={() => setFilterMenuOpen(false)} style={{ flex: 2, padding: '10px', borderRadius: 12, border: 'none', background: ac, color: '#000', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Apply Filters</button></div>
                    </div>
                  </div>
                </>)}
              </div>
            </div>
            <div className="cat-scroll" style={{ display: 'flex', gap: '6px', padding: '10px 0 5px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {allCategories.slice(0, 12).map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '7px 15px', borderRadius: 20, fontSize: '0.7rem', fontWeight: selectedCategory === cat ? 600 : 400, border: selectedCategory === cat ? `1.5px solid ${ac}` : `1px solid ${bc}`, background: selectedCategory === cat ? abg : cbg, backdropFilter: 'blur(16px)', color: selectedCategory === cat ? ac : tc, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>{cat === "All" ? "All" : cat}</button>))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 12px 40px', width: '100%' }}>
          {loading && products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ width: 32, height: 32, border: `3px solid ${bc}`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: tm, background: cbg, backdropFilter: 'blur(16px)', borderRadius: 20, border: `1px solid ${bc}`, boxShadow: shadow }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,227,9,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><FiPackage size={28} style={{ color: ac, opacity: 0.7 }} /></div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No products found</h3>
              <p style={{ fontSize: '0.75rem', color: tm, marginTop: '4px' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {products.map(product => {
                  const sellerBadges = getSellerBadges(product.seller, product.product_type);
                  return (
                    <div key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="card-hover"
                      style={{ background: cbg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${bc}`, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      
                      <div style={{ position: 'relative', aspectRatio: '1/1', background: darkMode ? '#0d0d1a' : '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.images?.[0] ? <LazyImage src={product.images[0]} alt={product.name} /> : <FiPackage size={48} style={{ color: tm, opacity: 0.15 }} />}
                        
                        {sellerBadges.length > 0 && (
                          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}>
                            {sellerBadges.map((badge, i) => (
                              <div key={i} className="badge-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
                                <div className="badge-circle" style={{ width: 22, height: 22, borderRadius: '50%', background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                  <badge.icon size={11} style={{ color: badge.label === 'VIP' ? '#000' : 'white' }} />
                                </div>
                                <span className="badge-tooltip" style={{ background: badge.bg, color: badge.label === 'VIP' ? '#000' : 'white' }}>{badge.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '3px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.85)', fontSize: '0.48rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px', zIndex: 2 }}>
                          <FiClock size={8} />{getTimeAgo(product.created_at)}
                        </div>
                      </div>

                      <div className="product-card-pad" style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{product.name}</h3>
                        <div style={{ color: tm, fontSize: '0.6rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '1.5rem', maxHeight: '1.5rem', marginBottom: '6px' }}>{product.description || "No description"}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ padding: '3px 7px', borderRadius: 6, fontSize: '0.48rem', fontWeight: 700, background: ac, color: '#0a0a14' }}>{product.product_type === 'shop' ? 'SHOP' : 'INDIV'}</span>
                          {product.is_negotiable && <span style={{ padding: '3px 7px', borderRadius: 6, fontSize: '0.48rem', fontWeight: 600, border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.1)', color: '#eab308', display: 'flex', alignItems: 'center', gap: '2px' }}><FiDollarSign size={8} />Negotiable</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: `1px dashed ${bc}`, marginTop: 'auto' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: ac }}>{Number(product.price).toLocaleString()} RWF</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.5rem', color: tm }}>
                            <FiEye size={9} />{product.views_count || 0}
                            <FiHeart size={9} style={{ marginLeft: '2px' }} />{product.likes_count || 0}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: darkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderTop: `1px solid ${bc}`, padding: '6px 10px', fontSize: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.6rem' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: `linear-gradient(135deg, ${ac}, #22c55e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4rem', fontWeight: 700, color: '#0a0a14', flexShrink: 0 }}>{(product.seller?.display_name || "U")[0]}</div>
                          {product.seller?.display_name || "Unknown"}
                        </div>
                        {product.seller?.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: tm, fontSize: '0.46rem', marginTop: 2 }}>
                            <FiMapPin size={8} />{product.seller.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={loaderRef} style={{ padding: '12px', textAlign: 'center' }}>
                {loading && <div style={{ width: 20, height: 20, border: `2px solid ${bc}`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;