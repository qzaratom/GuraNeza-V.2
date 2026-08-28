import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import bannerImage from '../assets/barner.png';
import { 
  FiSearch, FiStar, FiShield, FiCheck, FiDollarSign, FiClock, FiEye, FiHeart,
  FiMapPin, FiArrowRight, FiPackage, FiShoppingBag
} from 'react-icons/fi';

const translations = {
  en: {
    marketplace: "Rwanda's #1 Marketplace",
    heroTitle: "Buy & Sell", heroTitleSpan: "Anything", heroTitleEnd: "in Rwanda",
    heroDesc: "Buy Smart. Sell Easy.",
    startSelling: "Start Selling Now", browseProducts: "Browse Products", howToSell: "How to sell?",
    users: "Users", products: "Products", shops: "Shops",
    searchPlaceholder: "Search products, sellers...",
    featuredProducts: "Featured Products",
    noProducts: "No products yet", noMatch: "No products match",
    tryAdjusting: "Try adjusting your search or filters",
    viewAll: "View All Products",
    ctaTitle: "Ready to", ctaTitleSpan: "Sell?",
    ctaDesc: "Create an account. Start buying and selling today.",
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
    ctaDesc: "Créez un compte. Commencez à acheter et vendre aujourd'hui.",
    howToSell: "Comment vendre?",
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
    ctaDesc: "Fungura konti. Tangira kugura no kugurisha uyu munsi.",
    howToSell: "Wagurisha ute?",
    createAccount: "Fungura Konti",
    signIn: "Injira", getStarted: "Tangira",
    negotiable: "Birahuzwa", fixed: "Birakomeye", noDescription: "Nta bisobanuro",
    shop: "Iduka", indiv: "Ku Giti",
  },
};

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

// Skeleton Card for landing page
function SkeletonLandingCard({ darkMode }) {
  const shimmerBg = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const shimmerBg2 = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.04)';
  const borderColor = darkMode ? 'rgba(0,227,9,0.06)' : 'rgba(0,0,0,0.06)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.6)' : 'rgba(255,255,255,0.95)';

  return (
    <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ aspectRatio: '1/1', background: shimmerBg, animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '10px', flex: 1 }}>
        <div style={{ width: '80%', height: 14, borderRadius: 4, background: shimmerBg, marginBottom: 8, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ width: '100%', height: 10, borderRadius: 4, background: shimmerBg2, marginBottom: 4, animation: 'shimmer 1.5s infinite', animationDelay: '0.2s' }} />
        <div style={{ width: '60%', height: 10, borderRadius: 4, background: shimmerBg2, marginBottom: 10, animation: 'shimmer 1.5s infinite', animationDelay: '0.3s' }} />
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <div style={{ width: 40, height: 18, borderRadius: 6, background: shimmerBg, animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: 50, height: 18, borderRadius: 6, background: shimmerBg, animation: 'shimmer 1.5s infinite', animationDelay: '0.15s' }} />
        </div>
        <div style={{ borderTop: `1px dashed ${darkMode ? 'rgba(0,227,9,0.06)' : 'rgba(0,0,0,0.06)'}`, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 70, height: 16, borderRadius: 4, background: shimmerBg, animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: 40, height: 10, borderRadius: 4, background: shimmerBg2, animation: 'shimmer 1.5s infinite', animationDelay: '0.2s' }} />
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${darkMode ? 'rgba(0,227,9,0.06)' : 'rgba(0,0,0,0.06)'}`, padding: '6px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: shimmerBg, animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: 80, height: 10, borderRadius: 4, background: shimmerBg2, animation: 'shimmer 1.5s infinite', animationDelay: '0.1s' }} />
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
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
  const loadingBg = darkMode ? '#0a0a14' : '#ffffff';
  const loadingTc = darkMode ? 'white' : '#1a1a2e';
  const loadingTm = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => { 
    fetchData(); 
    const startedAt = Date.now();
    const duration = 3600;
    const timer = setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - startedAt) / duration) * 100));
      if (progress >= 100) { setIsLoading(false); clearInterval(timer); }
    }, 40);
    return () => clearInterval(timer); 
  }, []);

  const fetchData = async () => {
    setProductsLoading(true);
    try {
      const productsRes = await api.get('/products?limit=50&sort_by=newest');
      let rawProducts = productsRes.data?.products || [];
      
      rawProducts.sort((a, b) => {
        const priorityA = getPlanPriority(a.seller);
        const priorityB = getPlanPriority(b.seller);
        if (priorityB !== priorityA) return priorityB - priorityA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setProducts(rawProducts);

      try {
        const statsRes = await api.get('/public/stats');
        if (statsRes.data?.success && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
      } catch (e) {
        setStats({ users: 0, products: productsRes.data?.total || rawProducts.length, shops: 0 });
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setProductsLoading(false);
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

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: bg, fontFamily: "'Inter',system-ui,sans-serif", color: tc, transition: 'background 0.3s, color 0.3s' }}>
      
      <style>{`
        @keyframes loadingReveal{0%{opacity:0;transform:scale(0)}55%{opacity:1;transform:scale(1.04)}75%,100%{opacity:1;transform:scale(1)}}
        @keyframes loadingLogo{0%{opacity:0;transform:scale(0)}20%{opacity:1;transform:scale(1.04)}78%{opacity:1;transform:scale(1)}100%{opacity:1;transform:scale(30)}}
        @keyframes loadingProgress{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
        @keyframes shimmer{0%{opacity:0.3}50%{opacity:0.7}100%{opacity:0.3}}
        .badge-circle{transition:all 0.2s}.badge-circle:hover{transform:scale(1.15)}
        .badge-tooltip{position:absolute;left:22px;top:50%;transform:translateY(-50%);padding:3px 8px;border-radius:5px;font-size:0.5rem;font-weight:700;white-space:nowrap;opacity:0;visibility:hidden;transition:all 0.15s;pointer-events:none;z-index:20}
        .badge-wrapper:hover .badge-tooltip{opacity:1!important;visibility:visible!important}
        .card-hover{transition:all 0.25s}.card-hover:hover{transform:translateY(-3px);border-color:${ac}!important;box-shadow:0 8px 28px rgba(0,227,9,0.22)!important}
        .search-heading{position:relative;width:max-content;max-width:100%;margin-left:auto!important;margin-right:auto!important;color:${tc};letter-spacing:.01em}.search-heading::after{content:'';display:block;width:76px;height:3px;margin:.35rem auto 0;border-radius:3px;background:linear-gradient(90deg,transparent,${ac},transparent);opacity:0;transform:scaleX(0);transition:opacity .2s,transform .2s}.search-heading:hover::after{opacity:1;transform:scaleX(1)}
        .search-heading-accent{color:${ac}}
        .search-field{border-color:${ac}!important;transition:border-color .2s,box-shadow .2s}.search-field:hover,.search-field:focus-within{box-shadow:0 0 0 3px rgba(0,227,9,0.1),0 8px 24px rgba(0,227,9,0.18)!important}
        .green-hover{transition:transform .2s,background-color .2s,border-color .2s,box-shadow .2s,color .2s}.green-hover:hover{transform:translateY(-2px);border-color:${ac}!important;box-shadow:0 6px 18px rgba(0,227,9,0.2)!important;background-color:${darkMode?'rgba(0,227,9,0.12)':'rgba(0,227,9,0.08)'}!important}
        .green-hover-solid:hover{background-color:#18f326!important;color:#0a0a14!important}
        @keyframes floatBag{0%{transform:translate3d(0,110vh,0) rotate(-12deg);opacity:0}12%{opacity:.08}50%{transform:translate3d(14px,35vh,0) rotate(8deg)}88%{opacity:.08}100%{transform:translate3d(-10px,-25vh,0) rotate(-6deg);opacity:0}}
        .floating-bag{position:absolute;color:${ac};opacity:0;pointer-events:none;animation:floatBag 14s linear infinite}
        .loading-reveal{animation:loadingReveal 2.8s cubic-bezier(.22,1,.36,1) both;transform-origin:center}
        .si::placeholder{color:${darkMode?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)'}}
        @media(max-width:640px){.ht{font-size:2.2rem!important}.hd{font-size:.95rem!important}.pg{grid-template-columns:repeat(2,1fr)!important;gap:.5rem!important}.sr{gap:1.5rem!important}.sn{font-size:1.5rem!important}.hide-mobile{display:none!important}.hero-btns-mobile{display:flex!important;flex-direction:column!important;gap:.5rem!important;align-items:center!important}.intro-row{align-items:center!important}.intro-copy{text-align:center!important}.banner-actions{width:min(100%,330px)!important;margin:.75rem auto 0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:stretch!important;justify-content:center!important;gap:.55rem!important}.banner-actions a{width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:.5rem .35rem!important;font-size:.62rem!important;white-space:nowrap!important;text-align:center!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.25rem!important}.banner-actions .start-selling-action{grid-column:1/-1!important;grid-row:1!important;justify-self:center!important;width:min(74%,220px)!important}.banner-actions .browse-action{grid-column:1!important;grid-row:2!important}.banner-actions .how-to-sell-action{grid-column:2!important;grid-row:2!important}.marketplace-row{justify-content:center!important}.search-heading{font-size:1.15rem!important;text-align:center!important;margin-bottom:.55rem!important}.search-tools>div{padding:.65rem .75rem .8rem!important}.search-tools input{font-size:.8rem!important}.category-actions{justify-content:flex-start!important;gap:.3rem!important;padding-top:.55rem!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}.category-actions::-webkit-scrollbar{display:none!important}.category-actions button{flex:0 0 auto!important;padding:.3rem .6rem!important;font-size:.62rem!important}}
        @media(min-width:1101px){.pg2{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:1rem!important}}
        @media(min-width:801px) and (max-width:1100px){.pg2{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:1rem!important}}
        @media(min-width:641px) and (max-width:800px){.pg2{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.75rem!important}.hero-btns-mobile{display:none!important}}
        @media(max-width:640px){.pg2{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.6rem!important}}
        @media(max-width:760px){.intro-row{flex-direction:column!important;align-items:flex-start!important}.intro-actions{justify-content:flex-start!important}}
        @media(max-width:640px){.banner-content{padding:2.5rem 1.25rem 4rem!important}.banner-actions{width:100%!important}.banner-actions a{flex:1!important;text-align:center!important}}
      `}</style>

      <div aria-hidden="true" style={{ position:'absolute',inset:0,overflow:'hidden',zIndex:0,pointerEvents:'none' }}>
        <FiShoppingBag className="floating-bag" size={170} style={{ top:'14%',left:'5%' }}/>
        <FiShoppingBag className="floating-bag" size={110} style={{ top:'42%',right:'8%',animationDelay:'-3s' }}/>
        <FiShoppingBag className="floating-bag" size={140} style={{ top:'72%',left:'12%',animationDelay:'-5s' }}/>
        <FiShoppingBag className="floating-bag" size={90} style={{ top:'88%',right:'18%',animationDelay:'-1s' }}/>
      </div>

      {/* Loading Screen */}
      {isLoading && (
        <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:loadingBg }}>
          <div style={{ position:'relative',textAlign:'center',zIndex:1 }}>
            <div style={{ position:'relative',width:150,height:150,margin:'0 auto -4px' }}>
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}><img src={logo} alt="" style={{ width:120,height:120,objectFit:'contain',animation:'loadingLogo 3.6s cubic-bezier(.22,1,.36,1) both' }}/></div>
            </div>
            <h1 className="loading-reveal" style={{ fontSize:'1.65rem',fontWeight:800,color:loadingTc,letterSpacing:'0.06em',margin:0 }}>GURA<span style={{ color:ac }}>NEZA</span></h1>
            <p className="loading-reveal" style={{ fontSize:'0.8rem',color:loadingTm,fontWeight:300,margin:'6px 0 18px' }}>BuySmart</p>
            <div aria-hidden="true" style={{ width:116,height:3,margin:'0 auto',borderRadius:3,background:darkMode?'rgba(255,255,255,.12)':'rgba(0,0,0,.1)',overflow:'hidden' }}>
              <div style={{ width:'100%',height:'100%',borderRadius:3,background:ac,transformOrigin:'left',animation:'loadingProgress 2.8s cubic-bezier(.22,1,.36,1) both' }} />
            </div>
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
              <button className="green-hover" onClick={(e)=>{e.stopPropagation();setLangOpen(!langOpen)}} style={{ display:'flex',alignItems:'center',gap:'.3rem',padding:'.35rem .5rem',border:`1px solid ${darkMode?'rgba(255,255,255,.15)':'rgba(0,0,0,.15)'}`,borderRadius:8,background:'transparent',cursor:'pointer',fontSize:'.65rem',fontWeight:600,color:tc }}>{langLabels[lang]}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></button>
              {langOpen&&(<div style={{ position:'absolute',top:'calc(100% + .3rem)',right:0,minWidth:90,background:cbg,backdropFilter:'blur(16px)',boxShadow:'0 8px 24px rgba(0,0,0,.3)',borderRadius:12,padding:'.3rem 0',zIndex:20,border:`1px solid ${bc}` }}>{Object.entries(langLabels).map(([code,label])=>(<div key={code} onClick={()=>changeLanguage(code)} style={{ padding:'.4rem 1rem',cursor:'pointer',fontSize:'.65rem',color:lang===code?ac:tc,fontWeight:lang===code?600:400 }}>{label} {lang===code&&'✓'}</div>))}</div>)}
            </div>
            <button className="green-hover" onClick={toggleTheme} style={{ width:36,height:36,borderRadius:'50%',border:`1px solid ${darkMode?'rgba(255,255,255,.15)':'rgba(0,0,0,.12)'}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:tc }}>
              {darkMode?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>}
            </button>
            <Link to="/login" className="hide-mobile green-hover" style={{ padding:'.35rem 1rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:20,color:tc,fontSize:'.75rem',fontWeight:500,textDecoration:'none',whiteSpace:'nowrap' }}>{t("signIn")}</Link>
            <Link to="/login" className="hide-mobile green-hover green-hover-solid" style={{ padding:'.35rem 1rem',border:'none',borderRadius:20,color:'#0a0a14',fontSize:'.75rem',fontWeight:600,textDecoration:'none',background:ac,whiteSpace:'nowrap' }}>{t("getStarted")}</Link>
          </div>
        </div>
      </header>

      {/* Discovery */}
      <section style={{ position:'relative',width:'100%',backgroundImage:`linear-gradient(90deg, ${darkMode?'rgba(10,10,20,.88)':'rgba(248,250,252,.82)'}, ${darkMode?'rgba(10,10,20,.58)':'rgba(248,250,252,.58)'}), url(${bannerImage})`,backgroundSize:'cover',backgroundPosition:'center',padding:'0',overflow:'hidden' }}>
        <div className="banner-content" style={{ position:'relative',zIndex:2,maxWidth:1280,margin:'0 auto',padding:'3.5rem 1rem 4rem' }}>
          <div className="intro-row" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:'2rem' }}>
            <div className="intro-copy">
              <h1 className="ht" style={{ fontSize:'clamp(2.2rem,5vw,4rem)',fontWeight:800,lineHeight:1.1,marginBottom:'.8rem' }}>{t("heroTitle")}<br/><span style={{ color:ac }}>{t("heroTitleSpan")}</span> {t("heroTitleEnd")}</h1>
              <p className="hd" style={{ fontSize:'1rem',color:tm,maxWidth:550,margin:0,fontWeight:300,lineHeight:1.6 }}>{t("heroDesc")}</p>
            </div>
            <div className="intro-actions banner-actions" style={{ display:'flex',gap:'.6rem',justifyContent:'center',flexWrap:'wrap',flexShrink:0 }}>
              <Link to="/login" className="green-hover browse-action" style={{ padding:'.6rem 1.8rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:24,color:tc,fontSize:'.85rem',fontWeight:500,textDecoration:'none' }}>{t("browseProducts")}</Link>
              <Link to="/login" className="green-hover green-hover-solid start-selling-action" style={{ padding:'.6rem 1.8rem',border:'none',borderRadius:24,color:'#0a0a14',fontSize:'.85rem',fontWeight:600,textDecoration:'none',background:ac }}>{t("startSelling")}</Link>
              <Link to="/sell" className="green-hover how-to-sell-action" style={{ padding:'.6rem 1.8rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)'}`,borderRadius:24,color:tc,fontSize:'.85rem',fontWeight:500,textDecoration:'none' }}>{t("howToSell")}</Link>
            </div>
          </div>
        </div>
        <div aria-hidden="true" style={{ position:'absolute',zIndex:1,left:0,right:0,bottom:0,height:110,background:`linear-gradient(to bottom, transparent, ${bg})`,pointerEvents:'none' }}/>
      </section>

      <div className="search-tools" style={{ position:'sticky',top:49,zIndex:90,width:'100%',maxWidth:1280,margin:'0 auto',padding:'.35rem 1rem .75rem',background:`linear-gradient(to bottom, ${bg}, ${bg}cc, transparent)`,border:'none',boxShadow:'none' }}>
        <div style={{ margin:'0 auto',background:'transparent' }}>
          <h2 className="search-heading" style={{ textAlign:'center',fontSize:'1.35rem',fontWeight:750,margin:'0 0 .55rem',color:tc }}><span className="search-heading-accent">Hey!</span>, What are you searching for?</h2>
          <div className="search-field" style={{ display:'flex',width:'100%',gap:'.45rem',alignItems:'center',background:cbg,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',borderRadius:16,border:`1px solid ${bc}`,padding:'.65rem 1rem',boxShadow:shadow }}>
            <FiSearch size={17} style={{ color:ac,flexShrink:0 }}/><input type="text" placeholder="Search products..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="si" style={{ flex:1,border:'none',background:'transparent',fontSize:'.8rem',padding:'.25rem 0',outline:'none',color:tc }}/>
          </div>
          <div className="category-actions" style={{ display:'flex',gap:'.45rem',padding:'.45rem 0 0',flexWrap:'nowrap',overflowX:'auto',overflowY:'hidden' }}>
            {allCategories.slice(0,12).map(cat=>(<button className="green-hover" key={cat} onClick={()=>setSelectedCategory(cat)} style={{ padding:'.4rem .95rem',borderRadius:20,border:`1px solid ${selectedCategory===cat?'transparent':darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`,background:selectedCategory===cat?ac:cbg,color:selectedCategory===cat?'#0a0a14':tc,fontSize:'.68rem',fontWeight:selectedCategory===cat?700:500,cursor:'pointer',whiteSpace:'nowrap',transition:'all .2s',boxShadow:shadow }}>{cat}</button>))}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section style={{ position:'relative',zIndex:10,maxWidth:1280,margin:'0 auto',padding:'0 1rem' }}>
        <div style={{ marginBottom:'1rem',marginTop:'.5rem' }}>
          <h2 style={{ fontSize:'1.3rem',fontWeight:700 }}>{t("featuredProducts")}</h2>
          <div style={{ width:40,height:3,background:ac,borderRadius:2,marginTop:'.3rem' }}/>
        </div>

        <div style={{ paddingBottom:'2rem' }}>
          {productsLoading ? (
            <div className="pg pg2" style={{ display:'grid',gap:'1rem' }}>
              {[...Array(8)].map((_, i) => <SkeletonLandingCard key={i} darkMode={darkMode} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="pg pg2" style={{ display:'grid',gap:'1rem' }}>
              <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'3rem 1.5rem',color:tm,background:cbg,borderRadius:18,border:`1px solid ${bc}`,boxShadow:shadow }}>
                <FiPackage size={36} style={{ margin:'0 auto .8rem',opacity:.6,color:ac }} />
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
                      {p.images?.[0]?<img src={p.images[0]} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} loading="lazy"/>:<FiPackage size={44} style={{ color:tm,opacity:0.15 }}/>}
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
            <Link to="/login" className="green-hover" style={{ display:'inline-flex',alignItems:'center',gap:'.4rem',padding:'.6rem 2rem',border:`1px solid ${darkMode?'rgba(255,255,255,.2)':'rgba(0,0,0,.12)'}`,borderRadius:22,color:tc,fontSize:'.8rem',fontWeight:500,textDecoration:'none' }}>{t("viewAll")}<FiArrowRight size={14}/></Link>
          </div>
          <div className="sr" style={{ display:'flex',gap:'3rem',justifyContent:'center',marginTop:'2rem',paddingTop:'1rem',borderTop:`1px solid ${bc}`,flexWrap:'wrap' }}>
            {[['users',displayedStats.users],['products',displayedStats.products],['shops',displayedStats.shops]].map(([key,value])=><div key={key} style={{ textAlign:'center',minWidth:80 }}><div className="sn" style={{ fontSize:'1.5rem',fontWeight:700,color:ac }}>{value.toLocaleString()}</div><div style={{ fontSize:'.6rem',color:tm,letterSpacing:'.1em',textTransform:'uppercase',marginTop:'.1rem' }}>{t(key)}</div></div>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative',zIndex:10,padding:'2.5rem 1rem',background:darkMode?'rgba(26,26,46,0.4)':'rgba(255,255,255,0.8)',backdropFilter:'blur(16px)',borderTop:`1px solid ${bc}`,textAlign:'center' }}>
        <h2 style={{ fontSize:'1.6rem',fontWeight:700,marginBottom:'.5rem' }}>{t("ctaTitle")} <span style={{ color:ac }}>{t("ctaTitleSpan")}</span></h2>
        <p style={{ color:tm,fontSize:'.85rem',marginBottom:'1.2rem',fontWeight:300 }}>{t("ctaDesc")}</p>
        <Link to="/login" className="green-hover green-hover-solid" style={{ padding:'.6rem 2.2rem',border:'none',borderRadius:24,color:'#0a0a14',fontSize:'.9rem',fontWeight:600,textDecoration:'none',background:ac,display:'inline-block' }}>{t("createAccount")}</Link>
      </section>
    </div>
  );
}

export default Landing;
