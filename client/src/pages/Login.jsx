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
    completeProfile: "Complete Your Profile",
    completeProfileDesc: "Add more details to help buyers and sellers connect with you.",
    phoneNumber: "Phone Number",
    phoneNumberPlaceholder: "e.g., +250 7XX XXX XXX",
    location: "Location",
    locationPlaceholder: "e.g., Kigali, Rwanda",
    bio: "Bio",
    bioPlaceholder: "Tell us a bit about yourself...",
    saveProfile: "Save Profile",
    skipForNow: "Skip for now",
    backToHome: "Back to Home",
    errorConnecting: "Error connecting to server.",
    language: "Language",
    addDetails: "Add Details",
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
    completeProfile: "Complétez Votre Profil",
    completeProfileDesc: "Ajoutez plus de détails pour aider les acheteurs et vendeurs.",
    phoneNumber: "Numéro de Téléphone",
    phoneNumberPlaceholder: "ex: +250 7XX XXX XXX",
    location: "Adresse",
    locationPlaceholder: "ex: Kigali, Rwanda",
    bio: "Bio",
    bioPlaceholder: "Parlez-nous de vous...",
    saveProfile: "Enregistrer",
    skipForNow: "Passer",
    backToHome: "Retour à l'Accueil",
    errorConnecting: "Erreur de connexion.",
    language: "Langue",
    addDetails: "Ajouter Détails",
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
    completeProfile: "Uzuza Umwirondoro Wawe",
    completeProfileDesc: "Ongeramo ibindi kugira ngo abaguzi n'abagurisha bagere kuri wewe.",
    phoneNumber: "Numero ya Telefoni",
    phoneNumberPlaceholder: "urugero: +250 7XX XXX XXX",
    location: "Aho Uherereye",
    locationPlaceholder: "urugero: Kigali, Rwanda",
    bio: "Bio",
    bioPlaceholder: "Tubwire bike kuri wowe...",
    saveProfile: "Bika Umwirondoro",
    skipForNow: "Reka by'igihe",
    backToHome: "Subira Ahabanza",
    errorConnecting: "Ikosa mu guhuza.",
    language: "Ururimi",
    addDetails: "Ongeraho Ibindi",
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
  
  const [activeForm, setActiveForm] = useState('login');
  const [profileData, setProfileData] = useState({ phone_numbers: '', location: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleGoogleLogin = async () => {
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

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    setProfileSuccess('');
    try {
      const updates = {};
      if (profileData.phone_numbers) updates.phone_numbers = [profileData.phone_numbers];
      if (profileData.location) updates.location = profileData.location;
      if (profileData.bio) updates.bio = profileData.bio;
      if (Object.keys(updates).length > 0) {
        await api.put('/users/profile', updates);
      }
      setProfileSuccess('Profile updated!');
      setTimeout(() => {
        setUser(prev => ({ ...prev, ...updates }));
        navigate('/home');
      }, 1500);
    } catch (e) {
      setError('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSkip = () => {
    if (currentUser) {
      setUser(currentUser);
      navigate('/home');
    }
  };

  useEffect(() => {
    const handleSession = async (session) => {
      if (!session?.user) return;
      setLoading(true);
      try {
        localStorage.setItem('guraneza_token', session.access_token);
        const response = await api.post('/auth/callback', {
          access_token: session.access_token,
          user: { id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata }
        });
        if (response.data.user) {
          setCurrentUser(response.data.user);
          setUser(response.data.user);
          if (response.data.is_new_user) setActiveForm('profile');
          else navigate('/home');
        }
      } catch (error) {
        setError(t("errorConnecting"));
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') handleSession(session);
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
        @keyframes slideLeft{from{transform:translateX(0);opacity:1}to{transform:translateX(-120%);opacity:0}}
        @keyframes slideRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @media (max-width: 480px) {
          .login-card { max-width: 100% !important; }
          .login-banner { height: 120px !important; }
          .login-title { font-size: 1.1rem !important; }
          .login-subtitle { font-size: 0.7rem !important; }
          .login-btn { padding: 0.65rem !important; font-size: 0.78rem !important; }
          .login-input { padding: 0.5rem 0.7rem !important; font-size: 0.75rem !important; }
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
      <div className="login-card" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>
        
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
          <div className="login-banner" style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
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

          {/* Form Container */}
          <div style={{ position: 'relative', minHeight: 360 }}>
            
            {/* LOGIN FORM */}
            <div className="login-padding" style={{ 
              padding: '1.8rem 1.8rem 1.5rem', textAlign: 'center',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeForm === 'login' ? 'translateX(0)' : 'translateX(-120%)',
              opacity: activeForm === 'login' ? 1 : 0,
              position: activeForm === 'login' ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0
            }}>
              <div style={{ marginBottom: '.6rem' }}>
                <img src={logo} alt="GuraNeza" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              </div>

              <h1 className="login-title" style={{ fontSize: '1.3rem', fontWeight: 700, color: textColor, marginBottom: '.2rem' }}>{t("welcomeBack")}</h1>
              <p className="login-subtitle" style={{ fontSize: '.75rem', color: textMuted, fontWeight: 300, marginBottom: '1.2rem' }}>{t("signInToContinue")}</p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '.5rem .8rem', marginBottom: '.8rem', fontSize: '.65rem', color: '#ef4444' }}>{error}</div>
              )}

              <button onClick={handleGoogleLogin} disabled={loading}
                className="login-btn"
                style={{ width: '100%', padding: '.75rem', borderRadius: 16, border: 'none', background: accentColor, color: '#0a0a14', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginBottom: '.7rem', opacity: loading ? 0.6 : 1 }}
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

              <button onClick={handleGoogleLogin} disabled={loading}
                className="login-btn"
                style={{ width: '100%', padding: '.75rem', borderRadius: 16, border: `1px solid ${btnOutlineBorder}`, background: glassBg, backdropFilter: 'blur(12px)', color: textColor, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginBottom: '.7rem', opacity: loading ? 0.6 : 1 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = accentColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = btnOutlineBorder; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("dontHaveAccount")} - {t("createAccount")}
              </button>

              <button onClick={() => setActiveForm('profile')}
                style={{ background: 'transparent', border: 'none', color: textMuted, fontSize: '0.65rem', cursor: 'pointer', marginTop: '.2rem', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}
              >
                {t("addDetails")} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* PROFILE FORM */}
            <div className="login-padding" style={{ 
              padding: '1.8rem 1.8rem 1.5rem', textAlign: 'center',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeForm === 'profile' ? 'translateX(0)' : 'translateX(120%)',
              opacity: activeForm === 'profile' ? 1 : 0,
              position: activeForm === 'profile' ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0
            }}>
              <div style={{ marginBottom: '.6rem' }}>
                <img src={logo} alt="GuraNeza" style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              </div>

              <h2 className="login-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: textColor, marginBottom: '.2rem' }}>{t("completeProfile")}</h2>
              <p className="login-subtitle" style={{ fontSize: '.7rem', color: textMuted, fontWeight: 300, marginBottom: '1rem' }}>{t("completeProfileDesc")}</p>

              {profileSuccess && (
                <div style={{ background: 'rgba(0,227,9,0.1)', border: '1px solid rgba(0,227,9,0.2)', borderRadius: 10, padding: '.4rem .8rem', marginBottom: '.7rem', fontSize: '.65rem', color: accentColor }}>{profileSuccess}</div>
              )}

              <div style={{ textAlign: 'left', marginBottom: '.7rem' }}>
                <label style={{ fontSize: '.65rem', fontWeight: 600, color: textColor, marginBottom: '.25rem', display: 'block' }}>{t("phoneNumber")}</label>
                <input type="text" value={profileData.phone_numbers} onChange={e => setProfileData(p => ({ ...p, phone_numbers: e.target.value }))} placeholder={t("phoneNumberPlaceholder")}
                  className="login-input"
                  style={{ width: '100%', padding: '.6rem .8rem', borderRadius: 12, border: `1px solid ${borderColor}`, background: glassBg, color: textColor, fontSize: '.8rem', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '.7rem' }}>
                <label style={{ fontSize: '.65rem', fontWeight: 600, color: textColor, marginBottom: '.25rem', display: 'block' }}>{t("location")}</label>
                <input type="text" value={profileData.location} onChange={e => setProfileData(p => ({ ...p, location: e.target.value }))} placeholder={t("locationPlaceholder")}
                  className="login-input"
                  style={{ width: '100%', padding: '.6rem .8rem', borderRadius: 12, border: `1px solid ${borderColor}`, background: glassBg, color: textColor, fontSize: '.8rem', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '.8rem' }}>
                <label style={{ fontSize: '.65rem', fontWeight: 600, color: textColor, marginBottom: '.25rem', display: 'block' }}>{t("bio")}</label>
                <textarea value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} placeholder={t("bioPlaceholder")} rows={2}
                  className="login-input"
                  style={{ width: '100%', padding: '.5rem .8rem', borderRadius: 12, border: `1px solid ${borderColor}`, background: glassBg, color: textColor, fontSize: '.8rem', outline: 'none', resize: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="login-btn"
                style={{ width: '100%', padding: '.65rem', borderRadius: 14, border: 'none', background: accentColor, color: '#0a0a14', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', marginBottom: '.5rem', opacity: savingProfile ? 0.6 : 1 }}
              >
                {savingProfile ? 'Saving...' : t("saveProfile")}
              </button>

              <button onClick={handleSkip}
                className="login-btn"
                style={{ width: '100%', padding: '.55rem', borderRadius: 14, border: 'none', background: 'transparent', color: textMuted, fontSize: '.65rem', fontWeight: 500, cursor: 'pointer', marginBottom: '.25rem' }}
              >
                {t("skipForNow")} →
              </button>

              <button onClick={() => setActiveForm('login')}
                style={{ background: 'transparent', border: 'none', color: textMuted, fontSize: '0.6rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.2rem' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> {t("backToHome")}
              </button>
            </div>
          </div>
        </div>

        {/* Terms - with spacing */}
        <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem', fontSize: '.55rem', color: textMuted, fontWeight: 300, padding: '0 0.5rem' }}>
          {t("termsText")}
        </p>
      </div>
    </div>
  );
}

export default Login;