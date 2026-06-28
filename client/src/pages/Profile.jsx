import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiX,
  FiCamera, FiImage, FiPackage, FiShoppingBag, FiHeart, FiEye,
  FiAward, FiStar, FiShield, FiZap, FiInfo, FiClock, FiPlus, FiGrid
} from 'react-icons/fi';

function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [myProducts, setMyProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [editData, setEditData] = useState({
    display_name: '', phone_numbers: '', phone_numbers_2: '', location: '', bio: '',
  });

  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const picInputRef = useRef(null);
  const posterInputRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
    fetchMyProducts();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      const p = res.data.user;
      setProfile(p);
      setEditData({
        display_name: p?.display_name || '',
        phone_numbers: p?.phone_numbers?.[0] || '',
        phone_numbers_2: p?.phone_numbers?.[1] || '',
        location: p?.location || '',
        bio: p?.bio || '',
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMyProducts = async () => {
    try { const res = await api.get('/products/my/products'); setMyProducts(res.data.products || []); } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const phoneNumbers = [];
      if (editData.phone_numbers?.trim()) phoneNumbers.push(editData.phone_numbers.trim());
      if (editData.phone_numbers_2?.trim()) phoneNumbers.push(editData.phone_numbers_2.trim());
      
      const updates = {
        display_name: editData.display_name?.trim() || '',
        phone_numbers: phoneNumbers,
        location: editData.location?.trim() || '',
        bio: editData.bio?.trim() || '',
      };
      
      const res = await api.put('/users/profile', updates);
      setProfile(res.data.user);
      if (setUser) setUser(res.data.user);
      setEditing(false);
      showMessage('Profile updated!', 'success');
    } catch (e) {
      showMessage(e.response?.data?.message || 'Error updating profile', 'error');
    } finally { setSaving(false); }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('folder', 'guraneza/profiles');
      const uploadRes = await api.post('/upload/single', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data.image?.url || uploadRes.data.imageUrl;
      if (url) {
        await api.put('/users/profile-picture', { profile_picture_url: url });
        setProfile(prev => ({ ...prev, profile_picture_url: url }));
        if (setUser) setUser(prev => ({ ...prev, profile_picture_url: url }));
        showMessage('Profile picture updated!', 'success');
      }
    } catch { showMessage('Error uploading picture', 'error'); }
    finally { setUploadingPic(false); if (picInputRef.current) picInputRef.current.value = ''; }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('folder', 'guraneza/posters');
      const uploadRes = await api.post('/upload/single', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data.image?.url || uploadRes.data.imageUrl;
      if (url) {
        await api.put('/users/poster', { poster_url: url });
        setProfile(prev => ({ ...prev, poster_url: url }));
        if (setUser) setUser(prev => ({ ...prev, poster_url: url }));
        showMessage('Cover updated!', 'success');
      }
    } catch { showMessage('Error uploading cover', 'error'); }
    finally { setUploadingPoster(false); if (posterInputRef.current) posterInputRef.current.value = ''; }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const formatPrice = (p) => {
    try { return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(p); }
    catch { return Number(p).toLocaleString() + ' RWF'; }
  };

  const getBadges = () => {
    if (!profile?.subscription_plan) return [];
    const plan = profile.subscription_plan;
    const badges = [];
    if (plan.badge_verified_seller) badges.push({ label: 'Verified Seller', icon: FiShield, color: '#00E309' });
    if (plan.badge_verified_product) badges.push({ label: 'Verified Product', icon: FiAward, color: '#3b82f6' });
    if (plan.badge_verified_shop) badges.push({ label: 'Verified Shop', icon: FiStar, color: '#8b5cf6' });
    if (plan.badge_vip) badges.push({ label: 'VIP', icon: FiZap, color: '#eab308' });
    return badges;
  };

  const badges = getBadges();

  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.95)';
  const accent = '#00E309';
  const inputBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: bgColor }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgColor, color: textColor }}>
        <div style={{ textAlign: 'center' }}>
          <FiUser size={48} style={{ color: textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Profile Not Found</h2>
          <button onClick={() => navigate('/home')} style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: 12, background: accent, color: '#0a0a14', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Go Home</button>
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
        .tab-btn::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:${accent};transform:scaleX(0);transition:transform 0.2s}
        .tab-btn:hover::after{transform:scaleX(1)}
        .stat-card{transition:all 0.25s}
        .stat-card:hover{transform:translateY(-3px)}
        .product-card{transition:all 0.2s}
        .product-card:hover{transform:translateY(-4px)}
        @media(max-width:768px){
          .profile-layout{grid-template-columns:1fr!important}
          .cover-section{height:130px!important}
          .avatar-wrapper{margin-top:-40px!important;gap:0.8rem!important}
          .avatar-img{width:75px!important;height:75px!important;font-size:1.5rem!important}
          .name-text{font-size:1.15rem!important}
          .edit-btn-desktop{display:none!important}
          .edit-btn-mobile{display:flex!important}
          .products-grid{grid-template-columns:repeat(2,1fr)!important;gap:0.5rem!important}
          .contact-card{padding:1rem!important}
          .stat-grid{grid-template-columns:repeat(3,1fr)!important;gap:0.4rem!important}
          .tab-label{font-size:0.72rem!important}
          .cover-upload-btn{padding:0.3rem 0.6rem!important;font-size:0.6rem!important;bottom:8px!important;right:8px!important;border-radius:14px!important}
        }
        @media(min-width:769px){
          .edit-btn-mobile{display:none!important}
          .edit-btn-desktop{display:flex!important}
        }
      `}</style>

      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: messageType === 'success' ? 'rgba(0,227,9,0.15)' : 'rgba(239,68,68,0.15)',
          backdropFilter: 'blur(20px)', borderRadius: 14, padding: '10px 20px',
          border: `1px solid ${messageType === 'success' ? 'rgba(0,227,9,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: messageType === 'success' ? accent : '#ef4444',
          fontSize: '0.8rem', fontWeight: 500, animation: 'fadeIn 0.3s ease',
          boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
        }}>
          {messageType === 'success' ? '✓' : '✕'} {message}
        </div>
      )}

      {/* Cover Section */}
      <div className="cover-section" style={{
        width: '100%', height: 220, position: 'relative', overflow: 'hidden',
        background: darkMode ? '#0d0d1a' : '#e2e8f0'
      }}>
        {profile.poster_url ? (
          <img src={profile.poster_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}18, #22c55e12, ${accent}08)` }} />
        )}
        
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: `linear-gradient(to top, ${bgColor}, transparent)`
        }} />

        {/* Cover Upload Button - Small and compact */}
        <button
          onClick={() => posterInputRef.current?.click()}
          disabled={uploadingPoster}
          className="cover-upload-btn"
          style={{
            position: 'absolute', bottom: 10, right: 10,
            padding: '0.35rem 0.7rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
            color: 'white', fontSize: '0.65rem', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
        >
          <FiCamera size={12} />
          {uploadingPoster ? '...' : 'Cover'}
        </button>

        <input ref={posterInputRef} type="file" accept="image/*" onChange={handlePosterUpload} style={{ display: 'none' }} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Profile Header */}
        <div className="avatar-wrapper" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginTop: '-50px', position: 'relative', zIndex: 5, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="avatar-img" style={{
              width: 100, height: 100, borderRadius: '50%', border: `4px solid ${bgColor}`,
              background: `linear-gradient(135deg, ${accent}, #22c55e)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0a0a14', fontWeight: 700, fontSize: '2rem', overflow: 'hidden',
              boxShadow: darkMode ? '0 10px 28px rgba(0,0,0,0.5)' : '0 10px 28px rgba(0,0,0,0.15)'
            }}>
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile.display_name || '?')[0]?.toUpperCase()
              )}
            </div>
            <button
              onClick={() => picInputRef.current?.click()}
              disabled={uploadingPic}
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 30, height: 30, borderRadius: '50%', border: `3px solid ${bgColor}`,
                background: accent, color: '#0a0a14', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
              <FiCamera size={13} />
            </button>
            <input ref={picInputRef} type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ display: 'none' }} />
          </div>

          {/* Name + Info */}
          <div style={{ flex: 1, paddingBottom: '0.3rem', minWidth: 150 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <h1 className="name-text" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>{profile.display_name}</h1>
              {badges.slice(0, 2).map((badge, i) => (
                <badge.icon key={i} size={15} style={{ color: badge.color }} title={badge.label} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.68rem', color: textMuted }}>
              <span style={{
                fontSize: '0.58rem', fontWeight: 600, color: accent,
                background: darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.06)',
                padding: '0.12rem 0.4rem', borderRadius: 8
              }}>
                {profile.subscription_plan?.name || 'Free'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><FiPackage size={10} /> {profile.products_count || 0}</span>
              <span>{profile.role === 'admin' ? 'Admin' : 'Member'}</span>
            </div>
          </div>

          {/* Edit Button Desktop */}
          <button onClick={() => setEditing(!editing)} className="edit-btn-desktop"
            style={{
              padding: '0.45rem 1rem', borderRadius: 10, border: `1px solid ${borderColor}`,
              background: editing ? 'transparent' : cardBg, backdropFilter: 'blur(12px)',
              color: editing ? textMuted : textColor, fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
              whiteSpace: 'nowrap', transition: 'all 0.2s', marginBottom: '0.3rem'
            }}>
            {editing ? <><FiX size={13} /> Cancel</> : <><FiEdit2 size={13} /> Edit</>}
          </button>
        </div>

        {/* Edit Button Mobile - Full width below header */}
        <button onClick={() => setEditing(!editing)} className="edit-btn-mobile"
          style={{
            width: '100%', padding: '0.5rem', borderRadius: 10, border: `1px solid ${borderColor}`,
            background: editing ? 'transparent' : cardBg, backdropFilter: 'blur(12px)',
            color: editing ? textMuted : textColor, fontSize: '0.75rem', fontWeight: 600,
            cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            marginBottom: '1rem'
          }}>
          {editing ? <><FiX size={13} /> Cancel Editing</> : <><FiEdit2 size={13} /> Edit Profile</>}
        </button>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${borderColor}`, marginBottom: '1.5rem', overflowX: 'auto' }}>
          {[
            { key: 'profile', label: 'Profile', icon: FiUser },
            { key: 'products', label: 'Products', icon: FiGrid, count: myProducts.length },
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
              <tab.icon size={14} />
              <span className="tab-label">{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{ fontSize: '0.55rem', background: activeTab === tab.key ? 'rgba(0,227,9,0.15)' : 'rgba(255,255,255,0.05)', padding: '0.08rem 0.35rem', borderRadius: 6, marginLeft: '0.15rem' }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', paddingBottom: '3rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Contact Card */}
              <div className="contact-card" style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.3rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                  <FiInfo size={15} /> Contact
                </h3>

                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {[
                      { label: 'Name', value: editData.display_name, key: 'display_name' },
                      { label: 'Phone 1', value: editData.phone_numbers, key: 'phone_numbers', placeholder: '+250 7XX XXX XXX' },
                      { label: 'Phone 2', value: editData.phone_numbers_2, key: 'phone_numbers_2', placeholder: 'Optional' },
                      { label: 'Location', value: editData.location, key: 'location', placeholder: 'Kigali, Rwanda' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: '0.6rem', color: textMuted, marginBottom: '0.2rem', display: 'block' }}>{field.label}</label>
                        <input type="text" value={field.value} placeholder={field.placeholder || ''}
                          onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = accent}
                          onBlur={e => e.target.style.borderColor = borderColor}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: '0.6rem', color: textMuted, marginBottom: '0.2rem', display: 'block' }}>Bio</label>
                      <textarea value={editData.bio} rows={2} placeholder="About yourself..."
                        onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: '0.75rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', minHeight: 60 }}
                        onFocus={e => e.target.style.borderColor = accent}
                        onBlur={e => e.target.style.borderColor = borderColor}
                      />
                    </div>
                    <button onClick={handleSave} disabled={saving}
                      style={{ padding: '0.55rem', borderRadius: 10, border: 'none', background: accent, color: '#0a0a14', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', opacity: saving ? 0.6 : 1 }}>
                      <FiSave size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <ContactRow icon={FiMail} label="Email" value={profile.email} isLink={`mailto:${profile.email}`} accent={accent} textMuted={textMuted} />
                    {profile.phone_numbers?.length > 0 ? (
                      profile.phone_numbers.map((phone, i) => (
                        <ContactRow key={i} icon={FiPhone} label={`Phone ${i + 1}`} value={phone} isLink={`tel:${phone}`} accent={accent} textMuted={textMuted} />
                      ))
                    ) : (
                      <ContactRow icon={FiPhone} label="Phone" value="Not added" accent={textMuted} textMuted={textMuted} muted />
                    )}
                    <ContactRow icon={FiMapPin} label="Location" value={profile.location || 'Not set'} accent={profile.location ? accent : textMuted} textMuted={textMuted} muted={!profile.location} />
                    <ContactRow icon={FiCalendar} label="Joined" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} accent={accent} textMuted={textMuted} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* About */}
              <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.3rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                  <FiUser size={15} /> About
                </h3>
                <p style={{ fontSize: '0.75rem', color: textMuted, lineHeight: 1.6 }}>
                  {profile.bio || 'No bio yet. Click Edit to add one.'}
                </p>
              </div>

              {/* Badges */}
              <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.3rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
                  <FiAward size={15} /> Badges
                </h3>
                {badges.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {badges.map((badge, i) => (
                      <span key={i} style={{ padding: '0.3rem 0.55rem', borderRadius: 10, fontSize: '0.62rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', background: `${badge.color}10`, border: `1px solid ${badge.color}22`, color: badge.color }}>
                        <badge.icon size={12} /> {badge.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => navigate('/subscriptions')}
                    style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: `1px solid ${accent}40`, background: 'rgba(0,227,9,0.06)', color: accent, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <FiStar size={11} /> Upgrade Plan
                  </button>
                )}
              </div>

              {/* Stats */}
              <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.3rem', boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.6rem', color: accent }}>Stats</h3>
                <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <StatBox icon={FiPackage} value={profile.products_count || 0} label="Products" accent={accent} darkMode={darkMode} textMuted={textMuted} textColor={textColor} />
                  <StatBox icon={FiHeart} value={myProducts.reduce((sum, p) => sum + (p.likes_count || 0), 0)} label="Likes" accent="#ef4444" darkMode={darkMode} textMuted={textMuted} textColor={textColor} />
                  <StatBox icon={FiEye} value={myProducts.reduce((sum, p) => sum + (p.views_count || 0), 0)} label="Views" accent="#3b82f6" darkMode={darkMode} textMuted={textMuted} textColor={textColor} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB - 2 columns on mobile */}
        {activeTab === 'products' && (
          <div style={{ paddingBottom: '3rem', animation: 'slideUp 0.3s ease' }}>
            {myProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}` }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,227,9,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                  <FiPackage size={24} style={{ color: accent }} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>No Products Yet</h3>
                <p style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '1rem' }}>Start selling on GuraNeza</p>
                <button onClick={() => navigate('/sell')}
                  style={{ padding: '0.5rem 1.5rem', borderRadius: 12, border: 'none', background: accent, color: '#0a0a14', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FiPlus size={14} /> Sell Product
                </button>
              </div>
            ) : (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '0.8rem' }}>
                {myProducts.map(product => (
                  <div key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="product-card"
                    style={{ background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 14, border: `1px solid ${borderColor}`, overflow: 'hidden', cursor: 'pointer', boxShadow: darkMode ? '0 3px 12px rgba(0,0,0,0.15)' : '0 3px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ aspectRatio: '1/1', background: darkMode ? '#0d0d1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', position: 'relative' }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
                      ) : (
                        <FiPackage size={30} style={{ color: textMuted, opacity: 0.2 }} />
                      )}
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        padding: '0.1rem 0.35rem', borderRadius: 6, fontSize: '0.5rem', fontWeight: 700,
                        background: product.status === 'active' ? accent : 'rgba(239,68,68,0.8)',
                        color: product.status === 'active' ? '#0a0a14' : 'white'
                      }}>
                        {product.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ padding: '0.55rem 0.6rem' }}>
                      <h4 style={{ fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem' }}>{product.name}</h4>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: accent }}>{formatPrice(product.price)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', fontSize: '0.52rem', color: textMuted }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><FiEye size={8} /> {product.views_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><FiHeart size={8} /> {product.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function ContactRow({ icon: Icon, label, value, isLink, accent, textMuted, muted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
      <Icon size={13} style={{ color: accent, flexShrink: 0 }} />
      <span style={{ color: textMuted, minWidth: 55, fontSize: '0.65rem' }}>{label}:</span>
      {isLink ? (
        <a href={isLink} style={{ color: muted ? textMuted : '#00E309', textDecoration: 'none', fontWeight: 500, wordBreak: 'break-all', fontSize: '0.7rem' }}>
          {value}
        </a>
      ) : (
        <span style={{ fontWeight: 500, color: muted ? textMuted : 'inherit', fontSize: '0.7rem' }}>{value}</span>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, value, label, accent, darkMode, textMuted, textColor }) {
  return (
    <div className="stat-card" style={{
      textAlign: 'center', padding: '0.5rem 0.3rem',
      background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      borderRadius: 10
    }}>
      <Icon size={16} style={{ color: accent, marginBottom: '0.2rem' }} />
      <p style={{ fontSize: '1rem', fontWeight: 700, color: textColor }}>{value.toLocaleString()}</p>
      <p style={{ fontSize: '0.52rem', color: textMuted, marginTop: '0.05rem' }}>{label}</p>
    </div>
  );
}

export default Profile;