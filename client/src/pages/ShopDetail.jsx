import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiMapPin, FiPhone, FiMail, FiCalendar, FiUser, FiPackage, FiArrowLeft,
  FiHeart, FiEye, FiMessageSquare, FiShoppingBag, FiStar, FiShield,
  FiAward, FiZap, FiClock, FiGrid, FiInfo, FiCheck
} from 'react-icons/fi';

function ShopDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (id) fetchShop();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchShop = async () => {
    try {
      const res = await api.get(`/shops/${id}`);
      setShop(res.data.shop);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/chats', {
        participant_id: shop.owner?.id || shop.owner_id,
        chat_type: 'user',
        initial_message: `Hi! I'm interested in your shop "${shop.shop_name}" on GuraNeza.`
      });
      navigate('/chats');
    } catch { navigate('/chats'); }
  };

  const formatPrice = (p) => {
    try { return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(p); }
    catch { return Number(p).toLocaleString() + ' RWF'; }
  };

  const getOwnerBadges = () => {
    if (!shop?.owner?.subscription_plan) return [];
    const plan = shop.owner.subscription_plan;
    const badges = [];
    if (plan.badge_verified_seller) badges.push({ label: 'Verified Seller', icon: FiShield, color: '#00E309' });
    if (plan.badge_verified_product) badges.push({ label: 'Verified Product', icon: FiAward, color: '#3b82f6' });
    if (plan.badge_verified_shop) badges.push({ label: 'Verified Shop', icon: FiStar, color: '#8b5cf6' });
    if (plan.badge_vip) badges.push({ label: 'VIP', icon: FiZap, color: '#eab308' });
    return badges;
  };

  const ownerBadges = getOwnerBadges();

  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.95)';
  const accent = '#00E309';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: bgColor }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgColor, color: textColor }}>
        <div style={{ textAlign: 'center' }}>
          <FiShoppingBag size={48} style={{ color: textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Shop Not Found</h2>
          <p style={{ color: textMuted, marginTop: '0.5rem' }}>This shop may have been removed or doesn't exist.</p>
          <Link to="/shops" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: 12, background: accent, color: '#0a0a14', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Browse Shops</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, background: bgColor }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn{position:relative;transition:all 0.2s}
        .product-card{transition:all 0.2s}
        .product-card:hover{transform:translateY(-3px)}
        @media(max-width:768px){
          .shop-header{flex-direction:column!important;text-align:center!important;align-items:center!important}
          .shop-info-grid{grid-template-columns:1fr!important}
          .products-grid{grid-template-columns:repeat(2,1fr)!important;gap:0.5rem!important}
          .shop-poster{height:160px!important}
          .shop-avatar{margin-top:-40px!important}
          .shop-name{font-size:1.2rem!important}
          .contact-btn-desktop{display:none!important}
          .contact-btn-mobile{display:flex!important}
        }
        @media(min-width:769px){
          .contact-btn-mobile{display:none!important}
          .contact-btn-desktop{display:flex!important}
        }
      `}</style>

      {/* Shop Poster/Cover */}
      <div className="shop-poster" style={{
        width: '100%', height: 200, position: 'relative', overflow: 'hidden',
        background: darkMode ? '#0d0d1a' : '#e2e8f0', borderRadius: '0 0 20px 20px'
      }}>
        {shop.poster_url ? (
          <img src={shop.poster_url} alt="Shop Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}20, #8b5cf618, ${accent}10)` }} />
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: `linear-gradient(to top, ${bgColor}, transparent)` }} />
        
        {/* Verified Shop Badge */}
        {shop.is_verified && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            padding: '0.3rem 0.7rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
            background: 'rgba(0,227,9,0.9)', color: '#0a0a14', display: 'flex', alignItems: 'center', gap: '0.3rem',
            backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <FiShield size={12} /> Verified Shop
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1rem' }}>

        {/* Shop Header */}
        <div className="shop-header" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginTop: '-50px', position: 'relative', zIndex: 5, marginBottom: '1.5rem' }}>
          
          {/* Shop Avatar */}
          <div className="shop-avatar" style={{ flexShrink: 0 }}>
            <div style={{
              width: 90, height: 90, borderRadius: 20, border: `4px solid ${bgColor}`,
              background: `linear-gradient(135deg, #8b5cf6, #a855f7)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '2rem', overflow: 'hidden',
              boxShadow: darkMode ? '0 10px 28px rgba(0,0,0,0.5)' : '0 10px 28px rgba(0,0,0,0.15)'
            }}>
              {shop.poster_url ? (
                <img src={shop.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (shop.shop_name || 'S')[0]?.toUpperCase()
              )}
            </div>
          </div>

          {/* Shop Info */}
          <div style={{ flex: 1, paddingBottom: '0.3rem', minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              <h1 className="shop-name" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800 }}>{shop.shop_name}</h1>
              {shop.is_verified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 600, color: accent, background: 'rgba(0,227,9,0.1)', padding: '0.15rem 0.5rem', borderRadius: 8 }}>
                  <FiCheck size={10} /> Verified
                </span>
              )}
              {ownerBadges.slice(0, 3).map((badge, i) => (
                <badge.icon key={i} size={15} style={{ color: badge.color }} title={badge.label} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.7rem', color: textMuted }}>
              {shop.category && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(139,92,246,0.1)', padding: '0.15rem 0.5rem', borderRadius: 8, color: '#a855f7', fontWeight: 500 }}>
                  <FiGrid size={10} /> {shop.category}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <FiPackage size={10} /> {products.length} products
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <FiCalendar size={10} /> Since {shop.created_at ? new Date(shop.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Contact Button Desktop */}
          <button onClick={handleContactOwner} className="contact-btn-desktop"
            style={{
              padding: '0.5rem 1.2rem', borderRadius: 12, border: `1px solid ${borderColor}`,
              background: cardBg, backdropFilter: 'blur(12px)', color: textColor,
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              whiteSpace: 'nowrap', transition: 'all 0.2s', marginBottom: '0.3rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = textColor; }}>
            <FiMessageSquare size={14} /> Contact Shop
          </button>
        </div>

        {/* Contact Button Mobile */}
        <button onClick={handleContactOwner} className="contact-btn-mobile"
          style={{
            width: '100%', padding: '0.55rem', borderRadius: 12, border: `1px solid ${accent}40`,
            background: 'rgba(0,227,9,0.06)', color: accent,
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            display: 'none', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            marginBottom: '1rem'
          }}>
          <FiMessageSquare size={14} /> Contact Shop Owner
        </button>

        {/* Back Link */}
        <Link to="/shops" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: textMuted,
          textDecoration: 'none', fontSize: '0.75rem', marginBottom: '1.2rem', transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.color = accent}
          onMouseLeave={e => e.currentTarget.style.color = textMuted}>
          <FiArrowLeft size={14} /> Back to Shops
        </Link>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${borderColor}`, marginBottom: '1.5rem', overflowX: 'auto' }}>
          {[
            { key: 'products', label: 'Products', icon: FiGrid, count: products.length },
            { key: 'about', label: 'About', icon: FiInfo },
            { key: 'owner', label: 'Owner', icon: FiUser },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="tab-btn"
              style={{
                padding: '0.6rem 1rem', border: 'none', background: 'transparent',
                color: activeTab === tab.key ? accent : textMuted,
                borderBottom: activeTab === tab.key ? `2px solid ${accent}` : '2px solid transparent',
                fontSize: '0.78rem', fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                transition: 'all 0.2s', flexShrink: 0
              }}>
              <tab.icon size={14} /> {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: '0.55rem', background: activeTab === tab.key ? 'rgba(0,227,9,0.15)' : 'rgba(255,255,255,0.05)', padding: '0.08rem 0.35rem', borderRadius: 6, marginLeft: '0.15rem' }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div style={{ paddingBottom: '3rem', animation: 'slideUp 0.3s ease' }}>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}` }}>
                <FiPackage size={40} style={{ color: textMuted, opacity: 0.3, marginBottom: '0.8rem' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Products Yet</h3>
                <p style={{ fontSize: '0.72rem', color: textMuted, marginTop: '0.3rem' }}>This shop hasn't listed any products yet.</p>
              </div>
            ) : (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                {products.map(product => (
                  <div key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="product-card"
                    style={{ background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 14, border: `1px solid ${borderColor}`, overflow: 'hidden', cursor: 'pointer', boxShadow: darkMode ? '0 3px 12px rgba(0,0,0,0.15)' : '0 3px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ aspectRatio: '1/1', background: darkMode ? '#0d0d1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', position: 'relative' }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
                      ) : (
                        <FiPackage size={32} style={{ color: textMuted, opacity: 0.2 }} />
                      )}
                      {product.is_negotiable && (
                        <span style={{ position: 'absolute', top: 6, left: 6, padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 600, background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>NEG</span>
                      )}
                      <span style={{ position: 'absolute', top: 6, right: 6, padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700, background: product.status === 'active' ? accent : 'rgba(239,68,68,0.8)', color: product.status === 'active' ? '#0a0a14' : 'white' }}>
                        {product.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ padding: '0.6rem 0.7rem' }}>
                      <h4 style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem' }}>{product.name}</h4>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: accent }}>{formatPrice(product.price)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.55rem', color: textMuted }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><FiEye size={9} /> {product.views_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><FiHeart size={9} /> {product.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="shop-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '3rem', animation: 'fadeIn 0.3s ease' }}>
            
            {/* Description */}
            <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.5rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                <FiInfo size={15} /> About the Shop
              </h3>
              <p style={{ fontSize: '0.78rem', color: textMuted, lineHeight: 1.7 }}>
                {shop.description || 'No description provided for this shop.'}
              </p>
              
              {/* Verified Badge in About */}
              {shop.is_verified && (
                <div style={{ marginTop: '1rem', padding: '0.5rem 0.8rem', borderRadius: 10, background: 'rgba(0,227,9,0.06)', border: '1px solid rgba(0,227,9,0.12)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiCheck size={16} style={{ color: '#0a0a14' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: accent }}>Verified Shop</p>
                    <p style={{ fontSize: '0.65rem', color: textMuted }}>This shop has been verified by GuraNeza</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact & Details */}
            <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.5rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                <FiUser size={15} /> Shop Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {shop.category && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiGrid size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Category:</span>
                    <span style={{ fontWeight: 500, color: '#a855f7' }}>{shop.category}</span>
                  </div>
                )}
                {shop.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiMapPin size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Location:</span>
                    <span style={{ fontWeight: 500 }}>{shop.location}</span>
                  </div>
                )}
                {shop.phone_numbers?.length > 0 && shop.phone_numbers.map((phone, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiPhone size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Phone {i + 1}:</span>
                    <a href={`tel:${phone}`} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>{phone}</a>
                  </div>
                ))}
                {shop.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiMail size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Email:</span>
                    <a href={`mailto:${shop.email}`} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>{shop.email}</a>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <FiCalendar size={13} style={{ color: accent, flexShrink: 0 }} />
                  <span style={{ color: textMuted }}>Created:</span>
                  <span style={{ fontWeight: 500 }}>{new Date(shop.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <FiClock size={13} style={{ color: accent, flexShrink: 0 }} />
                  <span style={{ color: textMuted }}>Total Products:</span>
                  <span style={{ fontWeight: 600, color: accent }}>{products.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OWNER TAB */}
        {activeTab === 'owner' && shop.owner && (
          <div className="shop-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '3rem', animation: 'fadeIn 0.3s ease' }}>
            
            {/* Owner Profile Card */}
            <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.5rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                <FiUser size={15} /> Shop Owner
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accent}, #22c55e)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0a0a14', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {shop.owner.profile_picture_url ? (
                    <img src={shop.owner.profile_picture_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    (shop.owner.display_name || 'O')[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{shop.owner.display_name}</h4>
                  <p style={{ fontSize: '0.65rem', color: textMuted, marginTop: '0.15rem' }}>
                    {shop.owner.subscription_plan?.name || 'Free'} Plan
                  </p>
                </div>
              </div>
              
              {/* Owner Badges */}
              {ownerBadges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.8rem' }}>
                  {ownerBadges.map((badge, i) => (
                    <span key={i} style={{
                      padding: '0.3rem 0.55rem', borderRadius: 10, fontSize: '0.62rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.2rem',
                      background: `${badge.color}10`, border: `1px solid ${badge.color}22`, color: badge.color
                    }}>
                      <badge.icon size={12} /> {badge.label}
                    </span>
                  ))}
                </div>
              )}

              <button onClick={handleContactOwner}
                style={{
                  width: '100%', padding: '0.55rem', borderRadius: 10, border: `1px solid ${accent}40`,
                  background: 'rgba(0,227,9,0.06)', color: accent, fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,227,9,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,227,9,0.06)'}>
                <FiMessageSquare size={14} /> Chat with Owner
              </button>
            </div>

            {/* Owner Details Card */}
            <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.5rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                <FiInfo size={15} /> Owner Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <FiCalendar size={13} style={{ color: accent, flexShrink: 0 }} />
                  <span style={{ color: textMuted }}>Member since:</span>
                  <span style={{ fontWeight: 500 }}>{shop.owner.created_at ? new Date(shop.owner.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                </div>
                {shop.owner.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiMapPin size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Location:</span>
                    <span style={{ fontWeight: 500 }}>{shop.owner.location}</span>
                  </div>
                )}
                {shop.owner.phone_numbers?.length > 0 && shop.owner.phone_numbers.map((phone, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiPhone size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Phone {i + 1}:</span>
                    <a href={`tel:${phone}`} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>{phone}</a>
                  </div>
                ))}
                {shop.owner.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <FiMail size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: textMuted }}>Email:</span>
                    <a href={`mailto:${shop.owner.email}`} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>{shop.owner.email}</a>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <FiClock size={13} style={{ color: accent, flexShrink: 0 }} />
                  <span style={{ color: textMuted }}>Products listed:</span>
                  <span style={{ fontWeight: 600, color: accent }}>{products.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <FiShoppingBag size={13} style={{ color: accent, flexShrink: 0 }} />
                  <span style={{ color: textMuted }}>Plan:</span>
                  <span style={{ fontWeight: 500, color: accent }}>{shop.owner.subscription_plan?.name || 'Free'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopDetail;