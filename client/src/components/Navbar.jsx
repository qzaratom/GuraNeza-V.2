import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import logo from '../assets/logo.png';
import { 
  FiHome, FiShoppingBag, FiPlus, FiPackage, FiTrendingUp,
  FiBell, FiMessageSquare, FiShoppingCart, FiSettings,
  FiHelpCircle, FiChevronDown, FiLogOut, FiUser,
  FiX, FiSun, FiMoon, FiChevronRight
} from 'react-icons/fi';

const translations = {
  en: {
    home: "Home", shops: "Shops", sell: "Sell", myProducts: "My Products",
    upgrade: "Upgrade Plan", admin: "Admin", support: "Support",
    viewProfile: "View Profile", logout: "Logout", language: "Language",
    notifications: "Notifications", chats: "Chats", cart: "Cart",
    signIn: "Sign In", getStarted: "Get Started", menu: "Menu",
    openMenu: "Open Menu",
  },
  fr: {
    home: "Accueil", shops: "Boutiques", sell: "Vendre", myProducts: "Mes Produits",
    upgrade: "Améliorer", admin: "Admin", support: "Support",
    viewProfile: "Voir Profil", logout: "Déconnexion", language: "Langue",
    notifications: "Notifications", chats: "Messages", cart: "Panier",
    signIn: "Connexion", getStarted: "Commencer", menu: "Menu",
    openMenu: "Ouvrir Menu",
  },
  rw: {
    home: "Ahabanza", shops: "Amaduka", sell: "Gurisha", myProducts: "Ibicuruzwa Byanjye",
    upgrade: "Zamura", admin: "Admin", support: "Ubufasha",
    viewProfile: "Reba Umwirondoro", logout: "Sohoka", language: "Ururimi",
    notifications: "Amatangazo", chats: "Ubutumwa", cart: "Igitebo",
    signIn: "Injira", getStarted: "Tangira", menu: "Ibikubiyemo",
    openMenu: "Fungura Menu",
  },
};

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const { unreadChats, unreadNotifications, cartCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("guraneza_language") || "en");
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
  const profileRef = useRef(null);
  const langRef = useRef(null);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const langLabels = { en: "EN", fr: "FR", rw: "RW" };
  const changeLanguage = (l) => { setLang(l); localStorage.setItem("guraneza_language", l); setLangOpen(false); };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1025);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/admin')) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('guraneza_token');
    setUser(null);
    setProfileOpen(false);
    setSidebarOpen(false);
    navigate('/');
  };

  const accentColor = '#00E309';
  const navBg = darkMode ? 'rgba(10,10,20,0.85)' : 'rgba(255,255,255,0.92)';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const hoverBg = darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,227,9,0.06)';
  const dropdownBg = darkMode ? 'rgba(20,20,35,0.98)' : 'rgba(255,255,255,0.98)';
  const floatingBg = darkMode ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.9)';
  const sidebarBg = darkMode ? 'rgba(10,10,22,0.98)' : 'rgba(255,255,255,0.98)';

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const closeAll = () => { setSidebarOpen(false); setProfileOpen(false); };

  const navStyle = {
    position: 'sticky', top: 0, zIndex: 100,
    background: navBg, backdropFilter: 'blur(24px)',
    borderBottom: `1px solid ${borderColor}`,
    boxShadow: darkMode ? '0 2px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
    width: '100%'
  };

  const badgeStyle = {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 12,
    background: '#ef4444',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '0 4px',
    border: '2px solid ' + (darkMode ? '#0a0a14' : 'white'),
  };

  const mobileBadgeStyle = {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 10,
    background: '#ef4444',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.5rem',
    fontWeight: 700,
    padding: '0 3px',
    border: '2px solid ' + (darkMode ? '#0a0a14' : 'white'),
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes badgePop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .sidebar-overlay { animation: fadeIn 0.3s ease; }
        .sidebar-panel { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .badge-anim { animation: badgePop 0.3s ease; }
      `}</style>

      {/* ============ DESKTOP NAVBAR ============ */}
      {!isMobile && (
        <nav style={navStyle}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: textColor, flexShrink: 0 }}>
              <img src={logo} alt="GuraNeza" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              <span style={{ fontWeight: 650, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>GuraNeza <span style={{ color: accentColor, fontWeight: 300 }}>| BuySmart</span></span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              {[{ path: '/home', icon: FiHome, label: t("home") }, { path: '/shops', icon: FiShoppingBag, label: t("shops") }, ...(user ? [{ path: '/sell', icon: FiPlus, label: t("sell") }, { path: '/my-products', icon: FiPackage, label: t("myProducts") }] : []), { path: '/subscriptions', icon: FiTrendingUp, label: t("upgrade") }].map((item, i) => (
                <Link key={i} to={item.path} onMouseEnter={() => setHoveredNav(item.path)} onMouseLeave={() => setHoveredNav(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', borderRadius: 10, background: isActive(item.path) ? `${accentColor}18` : hoveredNav === item.path ? hoverBg : 'transparent', color: isActive(item.path) ? accentColor : textColor, fontWeight: isActive(item.path) ? 600 : 400, fontSize: '0.78rem', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', transform: hoveredNav === item.path ? 'translateY(-1px)' : 'translateY(0)' }}>
                  <item.icon size={14} /><span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0 }}>
              {user ? (
                <>
                  <Link to="/chats" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive('/chats') ? `${accentColor}18` : 'transparent', color: isActive('/chats') ? accentColor : textColor, textDecoration: 'none', transition: 'all 0.2s', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive('/chats') ? `${accentColor}18` : 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <FiMessageSquare size={18} />
                    {unreadChats > 0 && <span className="badge-anim" style={badgeStyle}>{unreadChats > 99 ? '99+' : unreadChats}</span>}
                  </Link>

                  {/* CART ICON WITH BADGE */}
                  <Link to="/cart" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive('/cart') ? `${accentColor}18` : 'transparent', color: isActive('/cart') ? accentColor : textColor, textDecoration: 'none', transition: 'all 0.2s', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive('/cart') ? `${accentColor}18` : 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <FiShoppingCart size={18} />
                    {cartCount > 0 && <span className="badge-anim" style={badgeStyle}>{cartCount > 99 ? '99+' : cartCount}</span>}
                  </Link>

                  <Link to="/notifications" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive('/notifications') ? `${accentColor}18` : 'transparent', color: isActive('/notifications') ? accentColor : textColor, textDecoration: 'none', transition: 'all 0.2s', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive('/notifications') ? `${accentColor}18` : 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <FiBell size={18} />
                    {unreadNotifications > 0 && <span className="badge-anim" style={badgeStyle}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
                  </Link>

                  <Link to="/tickets" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive('/tickets') ? `${accentColor}18` : 'transparent', color: isActive('/tickets') ? accentColor : textColor, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive('/tickets') ? `${accentColor}18` : 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <FiHelpCircle size={18} />
                  </Link>

                  <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: textColor, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; }}>
                    {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                  </button>

                  {user.role === 'admin' && (
                    <Link to="/admin" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive('/admin') ? 'rgba(168,85,247,0.15)' : 'transparent', color: '#a855f7', textDecoration: 'none', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isActive('/admin') ? 'rgba(168,85,247,0.15)' : 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <FiSettings size={18} />
                    </Link>
                  )}

                  <div ref={langRef} style={{ position: 'relative' }}>
                    <button onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.5rem', borderRadius: 10, background: langOpen ? hoverBg : 'transparent', color: textColor, border: 'none', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700, transition: 'all 0.2s' }}>
                      {langLabels[lang]} <FiChevronDown size={10} />
                    </button>
                    {langOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 0.3rem)', right: 0, minWidth: 80, background: dropdownBg, backdropFilter: 'blur(20px)', borderRadius: 12, padding: '0.3rem 0', zIndex: 50, border: `1px solid ${borderColor}`, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
                        {Object.entries(langLabels).map(([code, label]) => (
                          <div key={code} onClick={() => changeLanguage(code)} style={{ padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.65rem', color: lang === code ? accentColor : textColor, fontWeight: lang === code ? 600 : 400, background: lang === code ? `${accentColor}10` : 'transparent' }}>{label} {lang === code && '✓'}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={profileRef} style={{ position: 'relative' }}>
                    <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.5rem', borderRadius: 24, border: `1px solid ${profileOpen ? accentColor : borderColor}`, background: profileOpen ? hoverBg : 'transparent', cursor: 'pointer', color: textColor, transition: 'all 0.2s' }}>
                      {user.profile_picture_url ? <img src={user.profile_picture_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a14', fontWeight: 700, fontSize: '0.7rem' }}>{user.display_name?.charAt(0) || '?'}</div>}
                      <FiChevronDown size={12} style={{ color: textMuted }} />
                    </button>
                    {profileOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 0.4rem)', right: 0, minWidth: 200, background: dropdownBg, backdropFilter: 'blur(20px)', borderRadius: 14, padding: '0.4rem 0', zIndex: 50, border: `1px solid ${borderColor}`, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '0.6rem 1rem', borderBottom: `1px solid ${borderColor}`, marginBottom: '0.3rem' }}><p style={{ fontWeight: 600, fontSize: '0.8rem', color: textColor }}>{user.display_name}</p><p style={{ fontSize: '0.6rem', color: textMuted }}>{user.email}</p></div>
                        {[{ path: '/profile', icon: FiUser, label: t("viewProfile") }, { path: '/subscriptions', icon: FiTrendingUp, label: t("upgrade") }].map((item, i) => (
                          <Link key={i} to={item.path} onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.72rem', color: textColor, textDecoration: 'none' }}><item.icon size={14} /> {item.label}</Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: '0.3rem', paddingTop: '0.3rem' }}>
                          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.72rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}><FiLogOut size={14} /> {t("logout")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ padding: '0.35rem 1rem', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 20, color: textColor, fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>{t("signIn")}</Link>
                  <Link to="/login" style={{ padding: '0.35rem 1rem', borderRadius: 20, color: '#0a0a14', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', background: accentColor }}>{t("getStarted")}</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ============ MOBILE TOP BAR ============ */}
      {isMobile && (
        <nav style={{ ...navStyle, padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', color: textColor, flexShrink: 0 }}>
            <img src={logo} alt="GuraNeza" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            <span style={{ fontWeight: 650, fontSize: '0.75rem' }}>GuraNeza <span style={{ color: accentColor, fontWeight: 300, fontSize: '0.65rem' }}>| BuySmart</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {user && (
              <>
                <Link to="/chats" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, textDecoration: 'none', position: 'relative' }}>
                  <FiMessageSquare size={18} />
                  {unreadChats > 0 && <span className="badge-anim" style={mobileBadgeStyle}>{unreadChats > 99 ? '99+' : unreadChats}</span>}
                </Link>
                <Link to="/notifications" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, textDecoration: 'none', position: 'relative' }}>
                  <FiBell size={18} />
                  {unreadNotifications > 0 && <span className="badge-anim" style={mobileBadgeStyle}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
                </Link>
              </>
            )}
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: textColor, cursor: 'pointer' }}>
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {user ? (
              <button onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', border: `1.5px solid ${borderColor}`, background: 'transparent', cursor: 'pointer', padding: '0.15rem 0.3rem', borderRadius: 20 }}>
                {user.profile_picture_url ? <img src={user.profile_picture_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 26, height: 26, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a14', fontWeight: 700, fontSize: '0.65rem' }}>{user.display_name?.charAt(0) || '?'}</div>}
                <FiChevronRight size={14} style={{ color: accentColor }} />
              </button>
            ) : (
              <Link to="/login" style={{ padding: '0.3rem 0.8rem', borderRadius: 16, color: '#0a0a14', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'none', background: accentColor, whiteSpace: 'nowrap' }}>{t("signIn")}</Link>
            )}
          </div>
        </nav>
      )}

      {/* ============ MOBILE SIDEBAR ============ */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeAll} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div className="sidebar-panel" style={{ position: 'fixed', top: 0, right: 0, width: 280, height: '100%', zIndex: 250, background: sidebarBg, backdropFilter: 'blur(20px)', borderLeft: `1px solid ${borderColor}`, boxShadow: '-4px 0 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1rem', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><p style={{ fontWeight: 600, fontSize: '0.85rem', color: textColor }}>{user?.display_name || t("menu")}</p>{user && <p style={{ fontSize: '0.65rem', color: textMuted }}>{user.email}</p>}</div>
              <button onClick={closeAll} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
              <div style={{ padding: '0.5rem 1rem' }}>
                <p style={{ fontSize: '0.6rem', color: textMuted, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("language")}</p>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {Object.entries(langLabels).map(([code, label]) => (
                    <button key={code} onClick={() => changeLanguage(code)} style={{ flex: 1, padding: '0.45rem', borderRadius: 8, border: lang === code ? `1px solid ${accentColor}` : `1px solid ${borderColor}`, background: lang === code ? `${accentColor}15` : 'transparent', color: lang === code ? accentColor : textColor, cursor: 'pointer', fontSize: '0.65rem', fontWeight: lang === code ? 600 : 400 }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${borderColor}`, margin: '0.5rem 0' }} />
              {[{ path: '/home', icon: FiHome, label: t("home") }, { path: '/shops', icon: FiShoppingBag, label: t("shops") }, ...(user ? [{ path: '/sell', icon: FiPlus, label: t("sell") }, { path: '/my-products', icon: FiPackage, label: t("myProducts") }] : []), { path: '/subscriptions', icon: FiTrendingUp, label: t("upgrade") }].map((item, i) => (
                <Link key={i} to={item.path} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', margin: '0 0.5rem', borderRadius: 10, color: isActive(item.path) ? accentColor : textColor, background: isActive(item.path) ? `${accentColor}10` : 'transparent', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}><item.icon size={16} /> {item.label}</Link>
              ))}
              {user && (
                <>
                  <div style={{ borderTop: `1px solid ${borderColor}`, margin: '0.5rem' }} />
                  {[{ path: '/notifications', icon: FiBell, label: t("notifications"), badge: unreadNotifications }, { path: '/chats', icon: FiMessageSquare, label: t("chats"), badge: unreadChats }, { path: '/cart', icon: FiShoppingCart, label: t("cart"), badge: cartCount }, { path: '/tickets', icon: FiHelpCircle, label: t("support") }, ...(user.role === 'admin' ? [{ path: '/admin', icon: FiSettings, label: t("admin"), color: '#a855f7' }] : [])].map((item, i) => (
                    <Link key={i} to={item.path} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', margin: '0 0.5rem', borderRadius: 10, color: item.color || textColor, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, position: 'relative' }}>
                      <item.icon size={16} /> {item.label}
                      {item.badge > 0 && <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 12, background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, padding: '0 4px' }}>{item.badge > 99 ? '99+' : item.badge}</span>}
                    </Link>
                  ))}
                </>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${borderColor}`, padding: '0.5rem' }}>
              {user ? (
                <>
                  <Link to="/profile" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: 10, color: textColor, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}><FiUser size={16} /> {t("viewProfile")}</Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: 10, width: '100%', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, textAlign: 'left' }}><FiLogOut size={16} /> {t("logout")}</button>
                </>
              ) : (
                <Link to="/login" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.7rem', borderRadius: 24, color: '#0a0a14', background: accentColor, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>{t("getStarted")}</Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============ MOBILE BOTTOM NAV ============ */}
      {user && isMobile && (
        <div style={{
          position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 150, background: floatingBg, backdropFilter: 'blur(20px)',
          borderRadius: 20, padding: '0.4rem 0.6rem',
          border: `1px solid ${borderColor}`,
          boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.15rem',
        }}>
          {[{ path: '/home', icon: FiHome, label: t("home") }, { path: '/shops', icon: FiShoppingBag, label: t("shops") }, { path: '/sell', icon: FiPlus, label: t("sell") }, { path: '/cart', icon: FiShoppingCart, label: t("cart"), badge: cartCount }, { path: '/chats', icon: FiMessageSquare, label: t("chats"), badge: unreadChats }].map((item, i) => (
            <Link key={i} to={item.path} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
              padding: '0.35rem 0.65rem', borderRadius: 14,
              background: isActive(item.path) ? `${accentColor}15` : 'transparent',
              color: isActive(item.path) ? accentColor : textColor,
              textDecoration: 'none', fontSize: '0.55rem',
              fontWeight: isActive(item.path) ? 600 : 500,
              transition: 'all 0.2s', minWidth: 44, position: 'relative'
            }}>
              <item.icon size={18} /><span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ position: 'absolute', top: -2, right: 2, minWidth: 16, height: 16, borderRadius: 10, background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, padding: '0 3px' }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default Navbar;