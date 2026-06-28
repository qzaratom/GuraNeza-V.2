import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiShoppingCart, FiMessageSquare, FiMapPin, FiClock, FiUser, FiPackage, FiArrowLeft,
  FiHeart, FiEye, FiShare2, FiPhone, FiMail, FiChevronLeft, FiChevronRight,
  FiX, FiAward, FiStar, FiShield, FiZap, FiInfo, FiCalendar, FiGrid, FiDollarSign, FiTag, FiLayers, FiCheckCircle
} from 'react-icons/fi';

function ImageViewer({ images, currentIndex, onClose, onNext, onPrev }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
        <FiX size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button onClick={onPrev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            <FiChevronLeft size={26} />
          </button>
          <button onClick={onNext} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            <FiChevronRight size={26} />
          </button>
        </>
      )}
      <img src={images[currentIndex]} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
      <div style={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{currentIndex + 1} / {images.length}</div>
    </div>
  );
}

function ProductDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [sellerInfo, setSellerInfo] = useState(null);

  useEffect(() => { if (id) { fetchProduct(); recordView(); } window.scrollTo(0, 0); }, [id]);

  const recordView = async () => { try { const r = await api.post(`/products/${id}/view`); setViewsCount(r.data.views || 0); } catch {} };
  
  const fetchProduct = async () => {
    try {
      const r = await api.get(`/products/${id}`);
      setProduct(r.data.product);
      setLikesCount(r.data.product?.likes_count || 0);
      setViewsCount(r.data.product?.views_count || 0);
      if (r.data.product?.seller_id) fetchSellerInfo(r.data.product.seller_id);
      if (r.data.product?.category) fetchRelated(r.data.product.category, r.data.product.id);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  
  const fetchSellerInfo = async (sid) => { try { const r = await api.get(`/users/${sid}`); setSellerInfo(r.data.user); } catch {} };
  
  const fetchRelated = async (cat, pid) => { try { const r = await api.get(`/products?category=${encodeURIComponent(cat)}&limit=10`); setRelatedProducts((r.data.products || []).filter(p => p.id !== pid)); } catch {} };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (product.stock_quantity < 1) { showToast('Product is out of stock', 'error'); return; }
    
    setAddingToCart(true);
    try {
      await api.post('/cart', { product_id: product.id, quantity });
      showToast('Added to cart successfully!', 'success');
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (e) {
      const msg = e.response?.data?.message || 'Error adding to cart';
      showToast(msg, 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContact = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const r = await api.post('/chats', { participant_id: product.seller_id, chat_type: 'user', initial_message: `Hi! I'm interested in: "${product.name}" - ${fmt(product.price)}` });
      navigate('/chats', { state: { openChatId: r.data.chat.id } });
    } catch { navigate('/chats'); }
  };

  const handleLike = async () => { if (!user) { navigate('/login'); return; } setLiked(!liked); setLikesCount(p => liked ? p - 1 : p + 1); try { await api.post(`/products/${id}/like`); } catch {} };
  
  const handleShare = async () => { const url = window.location.href; if (navigator.share) { try { await navigator.share({ title: product?.name, url }); } catch {} } else { await navigator.clipboard.writeText(url); showToast('Link copied!', 'success'); } };
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };
  
  const fmt = (p) => { try { return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(p); } catch { return Number(p).toLocaleString() + ' RWF'; } };

  const getBadges = () => {
    const plan = sellerInfo?.subscription_plan;
    if (!plan) return [];
    const b = [];
    if (plan.badge_verified_seller) b.push({ k: 'vs', l: 'Verified Seller', i: FiShield, c: '#00E309', bg: 'rgba(0,227,9,0.12)', bd: 'rgba(0,227,9,0.25)' });
    if (plan.badge_verified_product) b.push({ k: 'vp', l: 'Verified Products', i: FiAward, c: '#3b82f6', bg: 'rgba(59,130,246,0.12)', bd: 'rgba(59,130,246,0.25)' });
    if (plan.badge_verified_shop) b.push({ k: 'vsh', l: 'Verified Shop', i: FiStar, c: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', bd: 'rgba(139,92,246,0.25)' });
    if (plan.badge_vip) b.push({ k: 'vip', l: 'VIP Member', i: FiZap, c: '#eab308', bg: 'rgba(234,179,8,0.12)', bd: 'rgba(234,179,8,0.25)' });
    return b;
  };
  const badges = getBadges();

  const bg = darkMode ? '#0a0a14' : '#f8fafc';
  const tc = darkMode ? 'white' : '#1a1a2e';
  const tm = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const bc = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cbg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.95)';
  const ac = '#00E309';
  const abg = darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,227,9,0.06)';
  const shadow = darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.05)';

  if (loading) {
    return <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh',background:bg }}><div style={{ width:40,height:40,border:`3px solid ${bc}`,borderTopColor:ac,borderRadius:'50%',animation:'spin 0.6s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  }
  if (!product) {
    return <div style={{ minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',background:bg,color:tc }}><div style={{ textAlign:'center' }}><FiPackage size={56} style={{ color:tm,opacity:0.3,marginBottom:'1rem' }} /><h2 style={{ fontSize:'1.4rem',fontWeight:700 }}>Product Not Found</h2><Link to="/products" style={{ display:'inline-block',marginTop:'1rem',padding:'0.55rem 1.5rem',borderRadius:14,background:ac,color:'#0a0a14',textDecoration:'none',fontWeight:600,fontSize:'0.85rem' }}>Browse Products</Link></div></div>;
  }

  const sellerName = sellerInfo?.display_name || product.seller?.display_name || 'Unknown';
  const planName = sellerInfo?.subscription_plan?.name || 'Free';

  return (
    <div style={{ minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",color:tc,background:bg,padding:'1.2rem 1rem',position:'relative',overflow:'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
        .badge-hover{transition:all 0.2s}.badge-hover:hover{transform:translateY(-2px)}
        .btn-hover{transition:all 0.2s}
        .card-hover{transition:all 0.25s}
        .card-hover:hover{transform:translateY(-3px);box-shadow:${darkMode?'0 8px 28px rgba(0,0,0,0.35)':'0 8px 28px rgba(0,0,0,0.08)'}}
        .scroll-x::-webkit-scrollbar{height:3px}.scroll-x::-webkit-scrollbar-track{background:transparent}.scroll-x::-webkit-scrollbar-thumb{background:${bc};border-radius:3px}
        .toast-enter{animation:slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)}
        @media(max-width:768px){.pg{grid-template-columns:1fr!important;gap:1.2rem!important}}
      `}</style>

      {showViewer && product.images?.length > 0 && <ImageViewer images={product.images} currentIndex={selectedImage} onClose={()=>setShowViewer(false)} onPrev={()=>setSelectedImage(p=>p>0?p-1:product.images.length-1)} onNext={()=>setSelectedImage(p=>p<product.images.length-1?p+1:0)} />}

      {/* Slide-in Toast Notification from the RIGHT */}
      {toast && (
        <div key={toast.id} className="toast-enter"
          style={{
            position:'fixed',top:80,right:20,zIndex:999,
            background:toast.type==='success'?'rgba(0,227,9,0.12)':'rgba(239,68,68,0.12)',
            backdropFilter:'blur(24px)',borderRadius:14,padding:'14px 20px',
            border:`1px solid ${toast.type==='success'?'rgba(0,227,9,0.3)':'rgba(239,68,68,0.3)'}`,
            fontSize:'0.82rem',fontWeight:500,color:toast.type==='success'?ac:'#ef4444',
            boxShadow:darkMode?'0 8px 32px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.1)',
            display:'flex',alignItems:'center',gap:'0.5rem',maxWidth:380,
            transition:'all 0.3s'
          }}>
          {toast.type === 'success' ? (
            <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(0,227,9,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <FiCheckCircle size={15} style={{ color:ac }}/>
            </div>
          ) : (
            <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(239,68,68,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <FiX size={15} style={{ color:'#ef4444' }}/>
            </div>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{ maxWidth:1050,margin:'0 auto' }}>
        
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.2rem',flexWrap:'wrap',gap:'0.5rem' }}>
          <Link to="/products" style={{ display:'inline-flex',alignItems:'center',gap:'0.35rem',color:tm,textDecoration:'none',fontSize:'0.78rem',transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color=ac} onMouseLeave={e=>e.currentTarget.style.color=tm}>
            <FiArrowLeft size={14}/>Back to Products
          </Link>
          <div style={{ display:'flex',alignItems:'center',gap:'0.8rem',fontSize:'0.68rem',color:tm }}>
            <span style={{ display:'flex',alignItems:'center',gap:'0.2rem' }}><FiEye size={12}/>{viewsCount.toLocaleString()} views</span>
            <span style={{ display:'flex',alignItems:'center',gap:'0.2rem' }}><FiHeart size={12} style={{ color:liked?'#ef4444':tm }}/>{likesCount.toLocaleString()} likes</span>
          </div>
        </div>

        <div className="pg" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2.5rem',marginBottom:'2.5rem' }}>
          
          {/* LEFT - Images */}
          <div>
            <div style={{ width:'100%',aspectRatio:'1/1',borderRadius:20,overflow:'hidden',background:darkMode?'#0d0d1a':'#f1f5f9',border:`1px solid ${bc}`,cursor:product.images?.length>0?'pointer':'default',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:shadow }}
              onClick={()=>product.images?.length>0&&setShowViewer(true)}>
              {product.images?.[selectedImage] ? (
                <img src={product.images[selectedImage]} alt={product.name} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'1rem' }} />
              ) : (
                <FiPackage size={64} style={{ color:tm,opacity:0.1 }} />
              )}
              {product.images?.length > 1 && (
                <div style={{ position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',borderRadius:10,padding:'4px 10px',fontSize:'0.55rem',color:'white',display:'flex',alignItems:'center',gap:'0.2rem' }}>
                  <FiEye size={10}/>{selectedImage+1}/{product.images.length}
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="scroll-x" style={{ display:'flex',gap:'0.5rem',marginTop:'0.6rem',overflowX:'auto',paddingBottom:'0.2rem' }}>
                {product.images.map((img,i)=>(
                  <button key={i} onClick={e=>{e.stopPropagation();setSelectedImage(i)}} 
                    style={{ width:56,height:56,borderRadius:10,overflow:'hidden',border:selectedImage===i?`2px solid ${ac}`:'2px solid transparent',cursor:'pointer',flexShrink:0,opacity:selectedImage===i?1:0.5,background:darkMode?'#0d0d1a':'#f1f5f9',padding:'0.3rem',transition:'all 0.2s' }}
                    onMouseEnter={e=>{if(selectedImage!==i)e.currentTarget.style.opacity='0.8'}}
                    onMouseLeave={e=>{if(selectedImage!==i)e.currentTarget.style.opacity='0.5'}}>
                    <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'contain' }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Product Info */}
          <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
            
            <div style={{ display:'flex',flexWrap:'wrap',gap:'0.35rem' }}>
              <span style={{ padding:'0.3rem 0.7rem',borderRadius:16,fontSize:'0.62rem',fontWeight:700,background:ac,color:'#0a0a14',display:'flex',alignItems:'center',gap:'0.2rem' }}>
                {product.product_type==='shop'?<><FiStar size={10}/>Shop Product</>:<><FiUser size={10}/>Individual Seller</>}
              </span>
              {product.category && <span style={{ padding:'0.3rem 0.7rem',borderRadius:16,fontSize:'0.62rem',fontWeight:600,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',color:'#3b82f6',display:'flex',alignItems:'center',gap:'0.2rem' }}><FiGrid size={10}/>{product.category}</span>}
              {product.is_negotiable && <span style={{ padding:'0.3rem 0.7rem',borderRadius:16,fontSize:'0.62rem',fontWeight:600,background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.2)',color:'#eab308',display:'flex',alignItems:'center',gap:'0.2rem' }}><FiDollarSign size={10}/>Negotiable</span>}
              {product.status==='sold' && <span style={{ padding:'0.3rem 0.7rem',borderRadius:16,fontSize:'0.62rem',fontWeight:700,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444' }}>SOLD OUT</span>}
            </div>

            {badges.length > 0 && (
              <div style={{ display:'flex',flexWrap:'wrap',gap:'0.4rem' }}>
                {badges.map(b=>(
                  <span key={b.k} className="badge-hover" style={{ padding:'0.35rem 0.65rem',borderRadius:10,fontSize:'0.6rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.25rem',background:b.bg,border:`1.5px solid ${b.bd}`,color:b.c,whiteSpace:'nowrap' }}>
                    <b.i size={11}/>{b.l}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'0.5rem' }}>
              <h1 style={{ fontSize:'clamp(1.2rem,2.5vw,1.55rem)',fontWeight:800,lineHeight:1.25,flex:1 }}>{product.name}</h1>
              <div style={{ display:'flex',gap:'0.3rem',flexShrink:0 }}>
                <button onClick={handleLike} className="btn-hover" title="Like"
                  style={{ width:38,height:38,borderRadius:10,border:`1px solid ${bc}`,background:liked?'rgba(239,68,68,0.08)':'transparent',color:liked?'#ef4444':tm,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=liked?'#ef4444':ac}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=bc}}>
                  <FiHeart size={16} fill={liked?'#ef4444':'none'}/>
                </button>
                <button onClick={handleShare} className="btn-hover" title="Share"
                  style={{ width:38,height:38,borderRadius:10,border:`1px solid ${bc}`,background:'transparent',color:tm,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.color=ac}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=bc;e.currentTarget.style.color=tm}}>
                  <FiShare2 size={16}/>
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize:'1.8rem',fontWeight:800,color:ac }}>{fmt(product.price)}</span>
              {product.is_negotiable && <span style={{ fontSize:'0.65rem',color:'#eab308',marginLeft:'0.5rem',fontWeight:500 }}>(Negotiable)</span>}
              <div style={{ display:'flex',alignItems:'center',gap:'0.35rem',marginTop:'0.35rem' }}>
                <div style={{ width:7,height:7,borderRadius:'50%',background:product.stock_quantity>0?ac:'#ef4444' }}/>
                <span style={{ fontSize:'0.7rem',color:tm }}>{product.stock_quantity>0?`${product.stock_quantity} in stock`:'Out of stock'}</span>
              </div>
            </div>

            <div style={{ background:cbg,backdropFilter:'blur(16px)',borderRadius:16,border:`1px solid ${bc}`,padding:'1.2rem',boxShadow:shadow }}>
              <h3 style={{ fontSize:'0.78rem',fontWeight:700,marginBottom:'0.5rem',color:ac,display:'flex',alignItems:'center',gap:'0.3rem' }}><FiInfo size={14}/>Description</h3>
              <p style={{ fontSize:'0.75rem',color:tm,lineHeight:1.65,whiteSpace:'pre-wrap' }}>{product.description||'No description provided.'}</p>
            </div>

            <div style={{ display:'flex',alignItems:'center',gap:'0.8rem' }}>
              <span style={{ fontSize:'0.7rem',fontWeight:600 }}>Quantity:</span>
              <div style={{ display:'flex',alignItems:'center',border:`1px solid ${bc}`,borderRadius:10,overflow:'hidden' }}>
                <button onClick={()=>setQuantity(Math.max(1,quantity-1))} className="btn-hover"
                  style={{ width:32,height:32,border:'none',background:'transparent',color:tc,cursor:'pointer',fontSize:'0.9rem' }}
                  onMouseEnter={e=>e.currentTarget.style.background=abg}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>−</button>
                <span style={{ width:34,textAlign:'center',fontWeight:600,fontSize:'0.75rem' }}>{quantity}</span>
                <button onClick={()=>setQuantity(Math.min(product.stock_quantity,quantity+1))} className="btn-hover"
                  style={{ width:32,height:32,border:'none',background:'transparent',color:tc,cursor:'pointer',fontSize:'0.9rem' }}
                  onMouseEnter={e=>e.currentTarget.style.background=abg}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>+</button>
              </div>
            </div>

            <div style={{ display:'flex',gap:'0.6rem' }}>
              <button onClick={handleAddToCart} disabled={addingToCart||product.stock_quantity<1} className="btn-hover"
                style={{ flex:1,padding:'0.75rem',borderRadius:14,border:'none',background:product.stock_quantity<1?'rgba(255,255,255,0.05)':ac,color:product.stock_quantity<1?tm:'#0a0a14',fontSize:'0.82rem',fontWeight:700,cursor:product.stock_quantity<1?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.35rem',opacity:addingToCart?0.6:1 }}
                onMouseEnter={e=>{if(product.stock_quantity>0&&!addingToCart)e.currentTarget.style.opacity='0.85'}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1'}}>
                <FiShoppingCart size={15}/>{addingToCart?'Adding...':product.stock_quantity<1?'Out of Stock':'Add to Cart'}
              </button>
              <button onClick={handleContact} className="btn-hover"
                style={{ flex:1,padding:'0.75rem',borderRadius:14,border:`1px solid ${bc}`,background:cbg,color:tc,fontSize:'0.82rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.35rem' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.color=ac}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=bc;e.currentTarget.style.color=tc}}>
                <FiMessageSquare size={15}/>Chat Seller
              </button>
            </div>

            {/* SELLER INFO CARD */}
            <div style={{ background:cbg,backdropFilter:'blur(20px)',borderRadius:18,border:`1px solid ${bc}`,padding:'1.5rem',boxShadow:shadow }}>
              <h3 style={{ fontSize:'0.82rem',fontWeight:700,marginBottom:'1rem',color:ac,display:'flex',alignItems:'center',gap:'0.3rem' }}><FiUser size={15}/>Seller Information</h3>
              
              <div style={{ display:'flex',alignItems:'center',gap:'0.8rem',marginBottom:'1rem',paddingBottom:'1rem',borderBottom:`1px solid ${bc}` }}>
                <div style={{ width:48,height:48,borderRadius:'50%',background:`linear-gradient(135deg,${ac},#22c55e)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#0a0a14',fontWeight:700,fontSize:'1.1rem',flexShrink:0 }}>{(sellerName||'?')[0]}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'0.4rem',flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700,fontSize:'0.85rem' }}>{sellerName}</span>
                    <span style={{ fontSize:'0.55rem',fontWeight:600,color:ac,background:abg,padding:'0.15rem 0.4rem',borderRadius:7,border:`1px solid ${ac}25` }}>{planName} Plan</span>
                  </div>
                  <p style={{ fontSize:'0.65rem',color:tm,marginTop:'0.15rem',lineHeight:1.4 }}>{sellerInfo?.bio||'No bio available'}</p>
                </div>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem 1rem',marginBottom:badges.length>0?'0.8rem':0 }}>
                <D icon={FiMapPin} v={sellerInfo?.location||product.seller?.location||'Not specified'} ac={ac} tm={tm} />
                <D icon={FiCalendar} v={sellerInfo?.created_at?`Since ${new Date(sellerInfo.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}`:'N/A'} ac={ac} tm={tm} />
                {sellerInfo?.phone_numbers?.[0] ? <D icon={FiPhone} v={sellerInfo.phone_numbers[0]} ac={ac} tm={tm} l={`tel:${sellerInfo.phone_numbers[0]}`} /> : <D icon={FiPhone} v="No phone" ac={tm} tm={tm} m />}
                {sellerInfo?.email ? <D icon={FiMail} v={sellerInfo.email} ac={ac} tm={tm} l={`mailto:${sellerInfo.email}`} /> : <D icon={FiMail} v="No email" ac={tm} tm={tm} m />}
                <D icon={FiClock} v={`Listed ${new Date(product.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`} ac={ac} tm={tm} />
                <D icon={FiLayers} v={`${product.stock_quantity} available`} ac={ac} tm={tm} />
              </div>

              {badges.length > 0 && (
                <div style={{ paddingTop:'0.8rem',borderTop:`1px solid ${bc}` }}>
                  <p style={{ fontSize:'0.62rem',fontWeight:700,color:tm,marginBottom:'0.5rem',textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',gap:'0.25rem' }}><FiAward size={11} style={{ color:ac }}/>Seller Badges</p>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:'0.4rem' }}>
                    {badges.map(b=><span key={b.k} className="badge-hover" style={{ padding:'0.35rem 0.6rem',borderRadius:10,fontSize:'0.58rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.25rem',background:b.bg,border:`1.5px solid ${b.bd}`,color:b.c }}><b.i size={11}/>{b.l}</span>)}
                  </div>
                </div>
              )}

              <button onClick={handleContact} className="btn-hover"
                style={{ width:'100%',marginTop:'0.8rem',padding:'0.5rem',borderRadius:12,border:`1px solid ${ac}35`,background:abg,color:ac,fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.3rem' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,227,9,0.12)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=abg}}>
                <FiMessageSquare size={13}/>Chat with Seller
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ paddingBottom:'2.5rem' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.8rem' }}>
              <h2 style={{ fontSize:'1rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.3rem' }}><FiGrid size={15} style={{ color:ac }}/>More in <span style={{ color:ac }}>{product.category}</span></h2>
              <span style={{ fontSize:'0.6rem',color:tm }}>{relatedProducts.length} products</span>
            </div>
            <div className="scroll-x" style={{ display:'flex',gap:'0.6rem',overflowX:'auto',paddingBottom:'0.3rem',scrollSnapType:'x mandatory' }}>
              {relatedProducts.map(rp=>(
                <Link key={rp.id} to={`/products/${rp.id}`} className="card-hover"
                  style={{ minWidth:155,maxWidth:155,background:cbg,backdropFilter:'blur(12px)',borderRadius:14,border:`1px solid ${bc}`,overflow:'hidden',textDecoration:'none',color:tc,flexShrink:0,scrollSnapAlign:'start' }}>
                  <div style={{ aspectRatio:'1/1',background:darkMode?'#0d0d1a':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',padding:'0.4rem' }}>
                    {rp.images?.[0]?<img src={rp.images[0]} alt="" style={{ width:'100%',height:'100%',objectFit:'contain' }} loading="lazy"/>:<FiPackage size={26} style={{ color:tm,opacity:0.12 }}/>}
                  </div>
                  <div style={{ padding:'0.45rem 0.55rem' }}>
                    <h4 style={{ fontSize:'0.65rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{rp.name}</h4>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'0.2rem' }}>
                      <span style={{ fontSize:'0.65rem',fontWeight:700,color:ac }}>{fmt(rp.price)}</span>
                      <span style={{ display:'flex',alignItems:'center',gap:'0.1rem',fontSize:'0.48rem',color:tm }}><FiEye size={7}/>{rp.views_count||0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function D({ icon: Icon, v, ac, tm, l, m }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.65rem',color:m?tm:tm }}>
      <Icon size={11} style={{ color:m?tm:ac,flexShrink:0 }}/>
      {l ? <a href={l} style={{ color:ac,textDecoration:'none',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{v}</a> : <span style={{ whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{v}</span>}
    </div>
  );
}

export default ProductDetail;