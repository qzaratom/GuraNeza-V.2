import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import videoGif from '../assets/video.gif';

const translations = {
  en: {
    welcomeBack: "Welcome Back",
    signInToContinue: "Sign in to access your GuraNeza account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign In",
    dontHaveAccount: "Don't have an account?",
    createAccount: "Create Account",
    or: "or",
    termsText: "By continuing, you agree to our Terms of Service and Privacy Policy",
    signingIn: "Signing you in...",
    editProfileNote: "After signing in, you can edit your phone number, location, and bio from your profile page.",
    backToHome: "Back to Home",
    errorConnecting: "Error connecting to server.",
    accountNotFound: "No GuraNeza account was found for this Google account. Please choose Create Account.",
    language: "Language",
    viewProfile: "View Profile",
  },
  fr: {
    welcomeBack: "Bon Retour",
    signInToContinue: "Connectez-vous pour accéder à votre compte GuraNeza",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    signIn: "Se Connecter",
    dontHaveAccount: "Vous n'avez pas de compte?",
    createAccount: "Créer un Compte",
    or: "ou",
    termsText: "En continuant, vous acceptez nos Conditions.",
    signingIn: "Connexion en cours...",
    editProfileNote: "Après connexion, modifiez votre téléphone, adresse et bio depuis votre profil.",
    backToHome: "Retour à l'Accueil",
    errorConnecting: "Erreur de connexion.",
    accountNotFound: "Aucun compte GuraNeza n'a été trouvé pour ce compte Google. Choisissez Créer un Compte.",
    language: "Langue",
    viewProfile: "Voir Profil",
  },
  rw: {
    welcomeBack: "Murakaza Neza",
    signInToContinue: "Injira kugira ngo ubone konti yawe",
    alreadyHaveAccount: "Ufite konti?",
    signIn: "Injira",
    dontHaveAccount: "Nta konti ufite?",
    createAccount: "Fungura Konti",
    or: "cyangwa",
    termsText: "Ukomeje, wemera Amabwiriza yacu.",
    signingIn: "Turakwinjiza...",
    editProfileNote: "Nyuma yo kwinjira, uhindure nimero, aho uherereye na bio bivuye kuri paji yawe.",
    backToHome: "Subira Ahabanza",
    errorConnecting: "Ikosa mu guhuza.",
    accountNotFound: "Nta konti ya GuraNeza yabonetse kuri iyi konti ya Google. Hitamo Fungura Konti.",
    language: "Ururimi",
    viewProfile: "Reba Umwirondoro",
  },
};

function Login({ setUser }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState(() => localStorage.getItem("guraneza_language") || "en");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const authIntentRef = useRef(localStorage.getItem('guraneza_auth_intent') || 'signin');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const langLabels = { en: "EN", fr: "FR", rw: "RW" };

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const changeLanguage = (l) => { setLang(l); localStorage.setItem("guraneza_language", l); setLangOpen(false); };

  const accentColor = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const cardBg = darkMode ? 'rgba(26,26,46,0.75)' : 'rgba(255,255,255,0.95)';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,0,0,0.08)';
  const glassBg = darkMode ? 'rgba(20,20,35,0.5)' : 'rgba(255,255,255,0.6)';
  const loadingBg = darkMode ? '#0a0a14' : '#ffffff';
  const loadingTextColor = darkMode ? 'white' : '#1a1a2e';
  const loadingTextMuted = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const btnOutlineBorder = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  const cardShadow = darkMode ? '0 0 60px rgba(0,227,9,0.08), 0 20px 60px rgba(0,0,0,0.5)' : '0 0 40px rgba(0,227,9,0.06), 0 20px 60px rgba(0,0,0,0.1)';

  const floatingBags = [...Array(10)].map((_, i) => ({
    left: `${Math.random() * 95}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${3 + Math.random() * 5}s`,
    size: 8 + Math.random() * 12,
    opacity: darkMode ? 0.04 : 0.04
  }));

  const handleGoogleLogin = async (intent) => {
    authIntentRef.current = intent;
    localStorage.setItem('guraneza_auth_intent', intent);
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSession = async (session) => {
    if (!session?.user) return;
    setLoading(true);
    try {
      localStorage.setItem('guraneza_token', session.access_token);
      const response = await api.post('/auth/callback', {
        access_token: session.access_token,
        intent: authIntentRef.current,
        user: { id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata }
      });
      if (response.data.user) {
        localStorage.removeItem('guraneza_auth_intent');
        setUser(response.data.user);
        // DIRECT TO HOME PAGE - no profile form
        navigate('/home');
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.code === 'ACCOUNT_NOT_FOUND') {
        await supabase.auth.signOut();
        localStorage.removeItem('guraneza_auth_intent');
        setError(t("accountNotFound"));
      } else {
        setError(error.response?.data?.message || t("errorConnecting"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-login if already signed in on this browser
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        handleSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: loadingBg }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {floatingBags.map((bag, i) => (
            <div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}>
              <svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1, padding: '1rem' }}>
          <style>{`@keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.06}95%{opacity:.06}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto 14px' }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, animation: 'spin 2.5s linear infinite' }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#00E309" strokeWidth="1.5" strokeDasharray="180 100" strokeLinecap="round" opacity="0.6"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: loadingTextColor }}>GURANEZA</h1>
          <p style={{ fontSize: '0.7rem', color: loadingTextMuted, fontWeight: 300, marginTop: 4 }}>{t("signingIn")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgColor, fontFamily: "'Inter',system-ui,sans-serif", position: 'relative', overflow: 'hidden', transition: 'background 0.3s', padding: '1rem' }}>
      
      <style>{`
        @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.05}95%{opacity:.05}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @media (max-width: 480px) {
          .login-card { max-width: 100% !important; }
          .login-banner { height: 100px !important; }
          .login-title { font-size: 1.1rem !important; }
          .login-subtitle { font-size: 0.7rem !important; }
          .login-btn { padding: 0.65rem !important; font-size: 0.78rem !important; }
          .login-padding { padding: 1.2rem 1.2rem 1rem !important; }
        }
      `}</style>

      {/* Floating bags */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingBags.map((bag, i) => (
          <div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}>
            <svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg>
          </div>
        ))}
      </div>

      {/* Main container */}
      <div className="login-card" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, margin: '1.5rem auto' }}>
        
        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', color: textMuted, textDecoration: 'none', fontSize: '0.7rem' }}
            onMouseEnter={e => e.currentTarget.style.color = accentColor}
            onMouseLeave={e => e.currentTarget.style.color = textMuted}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {t("backToHome")}
          </Link>
        </div>

        {/* Card with shadow */}
        <div style={{ 
          background: cardBg, backdropFilter: 'blur(24px)', borderRadius: 24, border: `1px solid ${borderColor}`, 
          overflow: 'hidden', boxShadow: cardShadow, position: 'relative'
        }}>
          
          {/* GIF Banner with blur transition */}
          <div className="login-banner" style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
            <img src={videoGif} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ 
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%',
              background: darkMode 
                ? 'linear-gradient(to bottom, transparent 30%, rgba(26,26,46,0.3) 50%, rgba(26,26,46,0.7) 75%, rgba(26,26,46,0.95) 100%)' 
                : 'linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.7) 75%, rgba(255,255,255,0.95) 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backdropFilter: 'blur(8px)', maskImage: 'linear-gradient(to top, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)' }} />
            
            {/* Language Switcher */}
            <div ref={langRef} style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
              <button onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }} style={{ display: 'flex', alignItems: 'center', gap: '.25rem', padding: '.25rem .45rem', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 600, color: 'white' }}>
                {langLabels[lang]}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {langOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + .25rem)', right: 0, minWidth: 80, background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,.3)', borderRadius: 10, padding: '.2rem 0', zIndex: 20, border: `1px solid ${borderColor}` }}>
                  {Object.entries(langLabels).map(([code, label]) => (
                    <div key={code} onClick={() => changeLanguage(code)} style={{ padding: '.35rem .8rem', cursor: 'pointer', fontSize: '0.6rem', color: lang === code ? accentColor : 'white', fontWeight: lang === code ? 600 : 400 }}>{label} {lang === code && '✓'}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LOGIN FORM */}
          <div className="login-padding" style={{ padding: '1.15rem 1.45rem 1rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '.35rem' }}>
              <img src={logo} alt="GuraNeza" style={{ width: 32, height: 32, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            </div>

            <h1 className="login-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: textColor, marginBottom: '.15rem' }}>{t("welcomeBack")}</h1>
            <p className="login-subtitle" style={{ fontSize: '.68rem', color: textMuted, fontWeight: 300, marginBottom: '.85rem' }}>{t("signInToContinue")}</p>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '.5rem .8rem', marginBottom: '.8rem', fontSize: '.65rem', color: '#ef4444' }}>{error}</div>
            )}

            {/* Sign In Button */}
            <button onClick={() => handleGoogleLogin('signin')} disabled={loading}
              className="login-btn"
              style={{ width: '100%', padding: '.62rem', borderRadius: 14, border: 'none', background: accentColor, color: '#0a0a14', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginBottom: '.55rem', opacity: loading ? 0.6 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#0a0a14" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#0a0a14" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#0a0a14" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#0a0a14" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("alreadyHaveAccount")} - {t("signIn")}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', margin: '.7rem 0' }}>
              <div style={{ flex: 1, height: 1, background: borderColor }} />
              <span style={{ fontSize: '.55rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '.1em' }}>{t("or")}</span>
              <div style={{ flex: 1, height: 1, background: borderColor }} />
            </div>

            {/* Create Account Button */}
            <button onClick={() => handleGoogleLogin('signup')} disabled={loading}
              className="login-btn"
              style={{ width: '100%', padding: '.62rem', borderRadius: 14, border: `1px solid ${btnOutlineBorder}`, background: glassBg, backdropFilter: 'blur(12px)', color: textColor, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginBottom: '.55rem', opacity: loading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = accentColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = btnOutlineBorder; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("dontHaveAccount")} - {t("createAccount")}
            </button>

            {/* Edit Profile Note */}
            <div style={{ 
              background: darkMode ? 'rgba(0,227,9,0.04)' : 'rgba(0,227,9,0.03)', 
              border: `1px solid ${darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.08)'}`, 
              borderRadius: 12, padding: '0.65rem 0.85rem', marginTop: '0.6rem' 
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: accentColor, marginBottom: '0.2rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.3rem' }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
                {t("viewProfile")}
              </div>
              <p style={{ fontSize: '0.6rem', color: textMuted, fontWeight: 300, lineHeight: 1.4, margin: 0 }}>
                {t("editProfileNote")}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem', fontSize: '.55rem', color: textMuted, fontWeight: 300, padding: '0 0.5rem' }}>
          By continuing, you agree to our{' '}
          <Link to="/terms" style={{ color: accentColor, textDecoration: 'none' }}>Terms of Service</Link>{' '}
          and{' '}
          <Link to="/terms#privacy" style={{ color: accentColor, textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
