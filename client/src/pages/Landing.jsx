import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import videoGif from '../assets/video.gif';
import { 
  FiSearch, FiStar, FiShield, FiCheck, FiDollarSign, FiClock, FiEye, FiHeart,
  FiMapPin, FiArrowRight
} from 'react-icons/fi';

const translations = {
  en: {
    marketplace: "Rwanda's #1 Marketplace",
    heroTitle: "Buy & Sell", heroTitleSpan: "Anything", heroTitleEnd: "in Rwanda",
    heroDesc: "The safest way to buy and sell in Rwanda. Join thousands already trading on GuraNeza.",
    startSelling: "Start Selling Now", browseProducts: "Browse Products",
    users: "Users", products: "Products", shops: "Shops",
    searchPlaceholder: "Search products, sellers...",
    featuredProducts: "Featured Products",
    noProducts: "No products yet", noMatch: "No products match",
    tryAdjusting: "Try adjusting your search or filters",
    viewAll: "View All Products",
    ctaTitle: "Ready to", ctaTitleSpan: "Sell?",
    ctaDesc: "Join thousands of Rwandans already using GuraNeza.",
    createAccount: "Create Free Account",
    signIn: "Sign In", getStarted: "Get Started",
    negotiable: "Negotiable", fixed: "Fixed", noDescription: "No description",
    shop: "Shop", indiv: "Indiv",
  },
  fr: {
    marketplace: "Place de Marché #1 du Rwanda",
    heroTitle: "Achetez & Vendez", heroTitleSpan: "Tout", heroTitleEnd: "au Rwanda",
    heroDesc: "Le moyen le plus sûr d'acheter et de vendre au Rwanda.",
    startSelling: "Commencer à Vendre", browseProducts: "Parcourir",
    users: "Utilisateurs", products: "Produits", shops: "Boutiques",
    searchPlaceholder: "Rechercher produits, vendeurs...",
    featuredProducts: "Produits Vedettes",
    noProducts: "Aucun produit", noMatch: "Aucun résultat",
    tryAdjusting: "Essayez d'ajuster vos filtres",
    viewAll: "Voir Tout",
    ctaTitle: "Prêt à", ctaTitleSpan: "Vendre?",
    ctaDesc: "Rejoignez des milliers de Rwandais sur GuraNeza.",
    createAccount: "Créer un Compte",
    signIn: "Connexion", getStarted: "Commencer",
    negotiable: "Négociable", fixed: "Fixe", noDescription: "Pas de description",
    shop: "Boutique", indiv: "Indiv",
  },
  rw: {
    marketplace: "Isoko #1 mu Rwanda",
    heroTitle: "Gura & Gurisha", heroTitleSpan: "Icyo", heroTitleEnd: "mu Rwanda",
    heroDesc: "Uburyo bwizewe bwo kugura no kugurisha mu Rwanda.",
    startSelling: "Tangira Kugurisha", browseProducts: "Reba Ibicuruzwa",
    users: "Abakoresha", products: "Ibicuruzwa", shops: "Amaduka",
    searchPlaceholder: "Shakisha ibicuruzwa, abagurisha...",
    featuredProducts: "Ibicuruzwa Byiza",
    noProducts: "Nta bicuruzwa", noMatch: "Nta byahuye",
    tryAdjusting: "Gerageza guhindura ibyiciro",
    viewAll: "Reba Byose",
    ctaTitle: "Witeguye", ctaTitleSpan: "Kugurisha?",
    ctaDesc: "Ifatanye n'abantu benshi bo mu Rwanda kuri GuraNeza.",
    createAccount: "Fungura Konti",
    signIn: "Injira", getStarted: "Tangira",
    negotiable: "Birahuzwa", fixed: "Birakomeye", noDescription: "Nta bisobanuro",
    shop: "Iduka", indiv: "Ku Giti",
  },
};

// Priority score for sorting by subscription plan
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

function Landing() {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({ users: 0, products: 0, shops: 0 });
  const [displayedStats, setDisplayedStats] = useState({ users: 0, products: 0, shops: 0 });
  const [lang, setLang] = useState(() => localStorage.getItem("guraneza_language") || "en");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const langLabels = { en: "EN", fr: "FR", rw: "RW" };

  useEffect(() => { const h = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  const changeLanguage = (l) => { setLang(l); localStorage.setItem("guraneza_language", l); setLangOpen(false); };

  useEffect(() => { if (isLoading) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [isLoading]);

  const ac = '#00E309';
  const bg = darkMode ? '#0a0a14' : '#f8fafc';
  const cbg = darkMode ? 'rgba(26,26,46,0.6)' : 'rgba(255,255,255,0.95)';
  const shadow = darkMode ? '0 6px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)';
  const tc = darkMode ? 'white' : '#1a1a2e';
  const tm = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const bc = darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,0,0,0.06)';
  const navBg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.9)';
  const heroBg = darkMode ? '#0a0a14' : '#f1f5f9';
  const heroOverlay = darkMode ? 'linear-gradient(180deg, rgba(10,10,20,0.55) 0%, rgba(10,10,20,0.85) 80%, rgba(10,10,20,0.95) 100%)' : 'linear-gradient(180deg, rgba(241,245,249,0.4) 0%, rgba(241,245,249,0.8) 80%, rgba(248,250,252,0.95) 100%)';
  const loadingBg = darkMode ? '#0a0a14' : '#ffffff';
  const loadingTc = darkMode ? 'white' : '#1a1a2e';
  const loadingTm = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => { fetchData(); const timer = setTimeout(() => setIsLoading(false), 2000); return () => clearTimeout(timer); }, []);

const fetchData = async () => {
    try {
      // Fetch products
      const productsRes = await api.get('/products?limit=50&sort_by=newest');
      let rawProducts = productsRes.data?.products || [];
      
      // SORT BY SUBSCRIPTION PRIORITY
      rawProducts.sort((a, b) => {
        const priorityA = getPlanPriority(a.seller);
        const priorityB = getPlanPriority(b.seller);
        if (priorityB !== priorityA) return priorityB - priorityA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setProducts(rawProducts);

      // Fetch stats from PUBLIC endpoint
      try {
        const statsRes = await api.get('/public/stats');
        if (statsRes.data?.success && statsRes.data?.stats) {
          const { users, products, shops } = statsRes.data.stats;
          console.log('Public Stats:', { users, products, shops });
          setStats({ users, products, shops });
        }
      } catch (e) {
        console.log('Public stats error:', e.message);
        // Fallback
        setStats({ 
          users: 0, 
          products: productsRes.data?.total || rawProducts.length, 
          shops: 0 
        });
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    const total = stats.users + stats.products + stats.shops;
    if (total === 0) { setDisplayedStats(stats); return; }
    let step = 0; const steps = 30, dur = 1500;
    const ti = setInterval(() => { 
      step++; const p = step / steps; 
      setDisplayedStats({ users: Math.round(stats.users * p), products: Math.round(stats.products * p), shops: Math.round(stats.shops * p) }); 
      if (step >= steps) { setDisplayedStats({ ...stats }); clearInterval(ti); } 
    }, dur / steps);
    return () => clearInterval(ti);
  }, [isLoading, stats]);

  const allCategories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const filteredProducts = useMemo(() => { let f = products; if (selectedCategory !== 'All') f = f.filter(p => p.category === selectedCategory); if (searchTerm.trim()) { const term = searchTerm.toLowerCase(); f = f.filter(p => (p.name || '').toLowerCase().includes(term) || ((p.seller?.display_name || '')).toLowerCase().includes(term)); } return f; }, [products, searchTerm, selectedCategory]);

  const getTimeAgo = (d) => { if (!d) return ''; const s = Math.floor((new Date() - new Date(d)) / 1000); if (s < 60) return 'Just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; };
  const fmt = (p) => Number(p).toLocaleString();

  const handleProductClick = (e, productId) => {
    e.preventDefault();
    const token = localStorage.getItem('guraneza_token');
    if (token) { navigate(`/products/${productId}`); } else { navigate('/login'); }
  };

  const getSellerBadges = (seller, productType) => {
    if (!seller?.subscription_plan) return [];
    const plan = seller.subscription_plan;
    const badges = [];
    if (plan.badge_vip) badges.push({ type: 'vip', label: 'VIP', icon: FiStar, bg: '#eab308' });
    if (plan.badge_verified_seller) badges.push({ type: 'verified_seller', label: 'Verified Seller', icon: FiShield, bg: '#3b82f6' });
    if (plan.badge_verified_product) badges.push({ type: 'verified_product', label: 'Verified Product', icon: FiCheck, bg: '#22c55e' });
    if (plan.badge_verified_shop && productType === 'shop') badges.push({ type: 'verified_shop', label: 'Verified Shop', icon: FiShield, bg: '#a855f7' });
    return badges;
  };

  const floatingBags = useMemo(() => [...Array(15)].map((_, i) => ({ left: `${Math.random() * 95}%`, delay: `${Math.random() * 4}s`, duration: `${3 + Math.random() * 5}s`, size: 10 + Math.random() * 16, opacity: darkMode ? 0.05 : 0.06 })), [darkMode]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: bg, fontFamily: "'Inter',system-ui,sans-serif", color: tc, transition: 'background 0.3s, color 0.3s' }}>
      
      <style>{`
        @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.07}95%{opacity:.07}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .badge-circle{transition:all 0.2s}.badge-circle:hover{transform:scale(1.15)}
        .badge-tooltip{position:absolute;left:22px;top:50%;transform:translateY(-50%);padding:3px 8px;border-radius:5px;font-size:0.5rem;font-weight:700;white-space:nowrap;opacity:0;visibility:hidden;transition:all 0.15s;pointer-events:none;z-index:20}
        .badge-wrapper:hover .badge-tooltip{opacity:1!important;visibility:visible!important}
        .card-hover{transition:all 0.25s}.card-hover:hover{transform:translateY(-3px);box-shadow:${darkMode?'0 8px 28px rgba(0,0,0,0.35)':'0 8px 28px rgba(0,0,0,0.08)'}}
        .si::placeholder{color:${darkMode?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)'}}
        @media(max-width:640px){.ht{font-size:2.2rem!important}.hd{font-size:.95rem!important}.pg{grid-template-columns:repeat(2,1fr)!important;gap:.5rem!important}.sr{gap:1.5rem!important}.sn{font-size:1.5rem!important}.hide-mobile{display:none!important}.hero-btns-mobile{display:flex!important;flex-direction:column!important;gap:.5rem!important;align-items:center!important}}
        @media(min-width:641px){.pg2{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important;gap:1rem!important}.hero-btns-mobile{display:none!important}}
      `}</style>

      {/* Loading */}
      {isLoading && (
        <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:loadingBg }}>
          <div style={{ position:'relative',textAlign:'center',zIndex:1 }}>
            <div style={{ position:'relative',width:100,height:100,margin:'0 auto 20px' }}>
              <svg viewBox="0 0 100 100" style={{ position:'absolute',inset:0,animation:'spin 2.5s linear infinite' }}><circle cx="50" cy="50" r="46" fill="none" stroke="#00E309" strokeWidth="1.5" strokeDasharray="180 100" strokeLinecap="round" opacity="0.6"/></svg>
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}><img src={logo} alt="" style={{ width:44,height:44,objectFit:'contain' }}/></div>
            </div>
            <h1 style={{ fontSize:'1.5rem',fontWeight:800,color:loadingTc,letterSpacing:'0.06em' }}>GURANEZA</h1>
            <p style={{ fontSize:'0.8rem',color:loadingTm,fontWeight:300,marginTop:4 }}>BuySmart</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header style={{ position:'sticky',top:0,zIndex:100,background:navBg,backdropFilter:'blur(20px)',borderBottom:`1px solid ${bc}`,boxShadow:darkMode?'0 4px 20px rgba(0,0,0,.3)':'0 2px 12px rgba(0,0,0,.04)' }}>
        <div style={{ maxWidth:1280,margin:'0 auto',padding:'.5rem 1rem',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link to="/" style={{ display:'flex',alignItems:'center',gap:'.5rem',textDecoration:'none',color:tc }}>
            <img src={logo} alt="GuraNeza" style={{ width:30,height:30,objectFit:'contain' }}/>
            <span style={{ fontWeight:650,fontSize:'1rem' }}>GuraNeza <span style={{ color:ac,fontWeight:300 }}>| BuySmart</span></span>
          </Link>
          <div style={{ display:'flex',alignItems:'center',gap:'.4rem' }}>
            <div ref={langRef} style={{ position:'relative' }}>
              <button onClick={(e)=>{e.stopPropagation();setLangOpen(!langOpen)}} style={{ display:'flex',alignItems:'center',gap:'.3rem',padding:'.35rem .5rem',border:`1px solid ${darkMode?'rgba(255,255,255,.15)':'rgba(0,0,0,.15)'}`,borderRadius:8,background:'transparent',cursor:'pointer',fontSize:'.65rem',fontWeight:600,color:tc }}>{langLabels[lang]}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></button>
              {langOpen&&(<div style={{ position:'absolute',top:'calc(100% + .3rem)',right:0,minWidth:90,background:cbg,backdropFilter:'blur(16px)',boxShadow:'0 8px 24px rgba(0,0,0,.3)',borderRadius:12,padding:'.3rem 0',zIndex:20,border:`1px solid ${bc}` }}>{Object.entries(langLabels).map(([code,label])=>(<div key={code} onClick={()=>changeLanguage(code)} style={{ padding:'.4rem 1rem',cursor:'pointer',fontSize:'.65rem',color:lang===code?ac:tc,fontWeight:lang===code?600:400 }}>{label} {lang===code&&'✓'}</div>))}</div>)}
            </div>
            <button onClick={toggleTheme} style={{ width:36,height:36,borderRadius:'50%',border:`1px solid ${darkMode?'rgba(255,255,255,.15)':'rgba(0,0,0,.12)'}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:tc }}>
              {darkMode?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2"/></svg>:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>}
            </button>
            <Link to="/login" className="hide-mobile" style={{ padding:'.35rem 1rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:20,color:tc,fontSize:'.75rem',fontWeight:500,textDecoration:'none',whiteSpace:'nowrap' }}>{t("signIn")}</Link>
            <Link to="/login" className="hide-mobile" style={{ padding:'.35rem 1rem',border:'none',borderRadius:20,color:'#0a0a14',fontSize:'.75rem',fontWeight:600,textDecoration:'none',background:ac,whiteSpace:'nowrap' }}>{t("getStarted")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position:'relative',minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:heroBg }}>
        <div style={{ position:'absolute',inset:0 }}><img src={videoGif} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',opacity:darkMode?0.45:0.18 }}/><div style={{ position:'absolute',inset:0,background:heroOverlay }}/></div>
        <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>{floatingBags.map((bag,i)=>(<div key={i} style={{ position:'absolute',left:bag.left,bottom:'-30px',animation:`bagRise ${bag.duration} linear infinite`,animationDelay:bag.delay,opacity:bag.opacity }}><svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode?"white":"#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}</div>
        <div style={{ position:'relative',zIndex:10,textAlign:'center',padding:'2.5rem 1rem',maxWidth:750 }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:'.5rem',padding:'.3rem .9rem',borderRadius:24,border:`1px solid ${darkMode?'rgba(0,227,9,.2)':'rgba(0,227,9,.15)'}`,background:darkMode?'rgba(0,227,9,.05)':'rgba(0,227,9,.04)',marginBottom:'1.2rem' }}><div style={{ width:6,height:6,borderRadius:'50%',background:ac }}/><span style={{ fontSize:'.7rem',color:ac,fontWeight:500,letterSpacing:'.1em',textTransform:'uppercase' }}>{t("marketplace")}</span></div>
          <h1 className="ht" style={{ fontSize:'clamp(2.2rem,5vw,4rem)',fontWeight:800,lineHeight:1.1,marginBottom:'.8rem' }}>{t("heroTitle")}<br/><span style={{ color:ac }}>{t("heroTitleSpan")}</span> {t("heroTitleEnd")}</h1>
          <p className="hd" style={{ fontSize:'1rem',color:tm,maxWidth:550,margin:'0 auto 2rem',fontWeight:300,lineHeight:1.6 }}>{t("heroDesc")}</p>
          <div className="hide-mobile" style={{ display:'flex',gap:'.6rem',justifyContent:'center',flexWrap:'wrap' }}>
            <Link to="/login" style={{ padding:'.6rem 1.8rem',border:'none',borderRadius:24,color:'#0a0a14',fontSize:'.85rem',fontWeight:600,textDecoration:'none',background:ac }}>{t("startSelling")}</Link>
            <Link to="/products" style={{ padding:'.6rem 1.8rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:24,color:tc,fontSize:'.85rem',fontWeight:500,textDecoration:'none' }}>{t("browseProducts")}</Link>
          </div>
          <div className="sr" style={{ display:'flex',gap:'2rem',justifyContent:'center',marginTop:'2rem',flexWrap:'wrap' }}>
            <div style={{ textAlign:'center',minWidth:65 }}><div className="sn" style={{ fontSize:'1.6rem',fontWeight:700,color:ac }}>{displayedStats.users.toLocaleString()}</div><div style={{ fontSize:'.6rem',color:tm,letterSpacing:'.1em',textTransform:'uppercase',marginTop:'.1rem' }}>{t("users")}</div></div>
            <div style={{ textAlign:'center',minWidth:65 }}><div className="sn" style={{ fontSize:'1.6rem',fontWeight:700,color:ac }}>{displayedStats.products.toLocaleString()}</div><div style={{ fontSize:'.6rem',color:tm,letterSpacing:'.1em',textTransform:'uppercase',marginTop:'.1rem' }}>{t("products")}</div></div>
            <div style={{ textAlign:'center',minWidth:65 }}><div className="sn" style={{ fontSize:'1.6rem',fontWeight:700,color:ac }}>{displayedStats.shops.toLocaleString()}</div><div style={{ fontSize:'.6rem',color:tm,letterSpacing:'.1em',textTransform:'uppercase',marginTop:'.1rem' }}>{t("shops")}</div></div>
          </div>
          <div className="hero-btns-mobile" style={{ display:'none',marginTop:'2rem' }}>
            <Link to="/login" style={{ padding:'.6rem 1.8rem',border:'none',borderRadius:24,color:'#0a0a14',fontSize:'.85rem',fontWeight:600,textDecoration:'none',background:ac,display:'inline-block',width:'80%',maxWidth:'280px' }}>{t("startSelling")}</Link>
            <Link to="/products" style={{ padding:'.6rem 1.8rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:24,color:tc,fontSize:'.85rem',fontWeight:500,textDecoration:'none',display:'inline-block',width:'80%',maxWidth:'280px' }}>{t("browseProducts")}</Link>
          </div>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'30%',background:`linear-gradient(to bottom, transparent, ${bg})`,zIndex:5,pointerEvents:'none' }}/>
      </section>

      {/* Products Section */}
      <section style={{ position:'relative',zIndex:10,maxWidth:1280,margin:'0 auto',padding:'0 1rem' }}>
        <div style={{ margin:'0 -1rem',padding:'.6rem 1rem',position:'sticky',top:52,zIndex:90 }}>
          <div style={{ background:darkMode?'rgba(20,20,35,0.5)':'rgba(255,255,255,0.6)',backdropFilter:'blur(24px)',borderRadius:18,border:`1px solid ${darkMode?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.06)'}`,padding:'.5rem 1rem',boxShadow:darkMode?'0 8px 32px rgba(0,0,0,0.4)':'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex',gap:'.3rem',alignItems:'center' }}>
              <FiSearch size={16} style={{ color:ac }}/>
              <input type="text" placeholder={t("searchPlaceholder")} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="si" style={{ flex:1,border:'none',background:'transparent',fontSize:'.85rem',padding:'.45rem 0',outline:'none',color:tc }}/>
            </div>
          </div>
        </div>

        <div style={{ display:'flex',gap:'.4rem',padding:'.5rem 0',flexWrap:'wrap' }}>
          {allCategories.slice(0,12).map(cat=>(
            <button key={cat} onClick={()=>setSelectedCategory(cat)} style={{ padding:'.4rem .9rem',borderRadius:20,border:`1px solid ${selectedCategory===cat?'transparent':darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`,background:selectedCategory===cat?ac:darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',color:selectedCategory===cat?'#0a0a14':tc,fontSize:'.7rem',fontWeight:selectedCategory===cat?700:500,cursor:'pointer',whiteSpace:'nowrap',transition:'all .2s' }}>{cat}</button>
          ))}
        </div>

        <div style={{ marginBottom:'1rem',marginTop:'.5rem' }}>
          <h2 style={{ fontSize:'1.3rem',fontWeight:700 }}>{t("featuredProducts")}</h2>
          <div style={{ width:40,height:3,background:ac,borderRadius:2,marginTop:'.3rem' }}/>
        </div>

        <div style={{ paddingBottom:'2rem' }}>
          {filteredProducts.length === 0 ? (
            <div className="pg pg2" style={{ display:'grid',gap:'1rem' }}>
              <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'3rem 1.5rem',color:tm,background:cbg,borderRadius:18,border:`1px solid ${bc}`,boxShadow:shadow }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="1.5" style={{ margin:'0 auto .8rem',opacity:.6 }}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <h3>{products.length===0?t("noProducts"):t("noMatch")}</h3>
                <p style={{ fontSize:'.75rem',marginTop:'.3rem' }}>{t("tryAdjusting")}</p>
              </div>
            </div>
          ) : (
            <div className="pg pg2" style={{ display:'grid' }}>
              {filteredProducts.map(p=>{
                const sellerBadges = getSellerBadges(p.seller, p.product_type);
                return (
                  <div key={p.id} onClick={(e) => handleProductClick(e, p.id)} className="card-hover" style={{ background:cbg,backdropFilter:'blur(16px)',borderRadius:16,border:`1px solid ${bc}`,overflow:'hidden',display:'flex',flexDirection:'column',textDecoration:'none',color:tc,boxShadow:shadow,cursor:'pointer' }}>
                    <div style={{ position:'relative',width:'100%',aspectRatio:'1/1',background:darkMode?'#0d0d1a':'#f1f5f9',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {p.images?.[0]?<img src={p.images[0]} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} loading="lazy"/>:<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={tm} strokeWidth="1"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
                      {sellerBadges.length > 0 && (
                        <div style={{ position:'absolute',top:6,left:6,display:'flex',flexDirection:'column',gap:'4px',zIndex:2 }}>
                          {sellerBadges.map((badge,i)=>(
                            <div key={i} className="badge-wrapper" style={{ position:'relative',display:'inline-flex' }}>
                              <div className="badge-circle" style={{ width:22,height:22,borderRadius:'50%',background:badge.bg,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }}><badge.icon size={11} style={{ color:badge.label==='VIP'?'#000':'white' }}/></div>
                              <span className="badge-tooltip" style={{ background:badge.bg,color:badge.label==='VIP'?'#000':'white' }}>{badge.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ position:'absolute',bottom:6,left:6,padding:'3px 7px',borderRadius:6,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',color:'rgba(255,255,255,0.85)',fontSize:'0.48rem',fontWeight:500,display:'flex',alignItems:'center',gap:'3px',zIndex:2 }}><FiClock size={8}/>{getTimeAgo(p.created_at)}</div>
                    </div>
                    <div style={{ padding:'10px',flex:1,display:'flex',flexDirection:'column' }}>
                      <h3 style={{ fontWeight:600,fontSize:'0.78rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:'4px' }}>{p.name}</h3>
                      <div style={{ color:tm,fontSize:'0.6rem',lineHeight:1.3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:'1.5rem',maxHeight:'1.5rem',marginBottom:'6px' }}>{p.description||t("noDescription")}</div>
                      <div style={{ display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'6px' }}>
                        <span style={{ padding:'3px 7px',borderRadius:6,fontSize:'0.48rem',fontWeight:700,background:ac,color:'#0a0a14' }}>{p.product_type==='shop'?t("shop"):t("indiv")}</span>
                        {p.is_negotiable&&<span style={{ padding:'3px 7px',borderRadius:6,fontSize:'0.48rem',fontWeight:600,border:'1px solid rgba(234,179,8,0.3)',background:'rgba(234,179,8,0.1)',color:'#eab308',display:'flex',alignItems:'center',gap:'2px' }}><FiDollarSign size={8}/>{t("negotiable")}</span>}
                      </div>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'6px',borderTop:`1px dashed ${bc}`,marginTop:'auto' }}>
                        <span style={{ fontWeight:700,fontSize:'0.82rem',color:ac }}>{fmt(p.price)} RWF</span>
                        <span style={{ display:'flex',alignItems:'center',gap:'3px',fontSize:'0.5rem',color:tm }}><FiEye size={9}/>{p.views_count||0}<FiHeart size={9} style={{ marginLeft:'2px' }}/>{p.likes_count||0}</span>
                      </div>
                    </div>
                    <div style={{ background:darkMode?'rgba(0,0,0,0.15)':'rgba(0,0,0,0.02)',borderTop:`1px solid ${bc}`,padding:'6px 10px',fontSize:'0.5rem' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:4,fontWeight:600,fontSize:'0.6rem' }}>
                        <div style={{ width:14,height:14,borderRadius:'50%',background:`linear-gradient(135deg, ${ac}, #22c55e)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.4rem',fontWeight:700,color:'#0a0a14',flexShrink:0 }}>{(p.seller?.display_name||"U")[0]}</div>
                        {p.seller?.display_name||"Unknown"}
                      </div>
                      {p.seller?.location&&<div style={{ display:'flex',alignItems:'center',gap:2,color:tm,fontSize:'0.46rem',marginTop:2 }}><FiMapPin size={8}/>{p.seller.location}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ textAlign:'center',marginTop:'1.5rem' }}>
            <Link to="/products" style={{ display:'inline-flex',alignItems:'center',gap:'.4rem',padding:'.6rem 2rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.12)'}`,borderRadius:22,color:tc,fontSize:'.8rem',fontWeight:500,textDecoration:'none' }}>{t("viewAll")}<FiArrowRight size={14}/></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative',zIndex:10,padding:'2.5rem 1rem',background:darkMode?'rgba(26,26,46,0.4)':'rgba(255,255,255,0.8)',backdropFilter:'blur(16px)',borderTop:`1px solid ${bc}`,textAlign:'center' }}>
        <h2 style={{ fontSize:'1.6rem',fontWeight:700,marginBottom:'.5rem' }}>{t("ctaTitle")} <span style={{ color:ac }}>{t("ctaTitleSpan")}</span></h2>
        <p style={{ color:tm,fontSize:'.85rem',marginBottom:'1.2rem',fontWeight:300 }}>{t("ctaDesc")}</p>
        <Link to="/login" style={{ padding:'.6rem 2.2rem',border:'none',borderRadius:24,color:'#0a0a14',fontSize:'.9rem',fontWeight:600,textDecoration:'none',background:ac,display:'inline-block' }}>{t("createAccount")}</Link>
      </section>
    </div>
  );
}

export default Landing;