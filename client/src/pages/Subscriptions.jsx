import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { FiClock, FiSend, FiX, FiMessageSquare, FiRefreshCw, FiTrash2, FiCheck, FiAlertTriangle, FiThumbsUp } from 'react-icons/fi';

const CheckIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>);
const XIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const CrownIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#eab308" stroke="#1a1a2e" strokeWidth="1"><path d="M2 6l4 8h12l4-8-4.5 4.5L12 4 6.5 10.5 2 6zM4 19h16v2H4z"/></svg>);
const PackageIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>);

// Confirmation Modal
function ConfirmModal({ isOpen, title, message, icon: Icon, iconColor, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
      <div style={{ background: '#1a1a2e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: 420, overflow: 'hidden', animation: 'modalIn 0.2s ease' }}>
        <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${iconColor}15`, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Icon size={28} style={{ color: iconColor }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '0.8rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.8rem', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', background: loading ? 'rgba(255,255,255,0.05)' : confirmColor, color: loading ? 'rgba(255,255,255,0.3)' : (confirmColor === '#ef4444' ? 'white' : '#000'), fontSize: '0.8rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Processing...' : confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// Toast Notification
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const styles = {
    success: { bg: 'rgba(0,227,9,0.1)', border: 'rgba(0,227,9,0.2)', color: '#00E309', icon: FiCheck },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', icon: FiX },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', icon: FiRefreshCw },
  };
  const s = styles[type] || styles.info;
  const Icon = s.icon;
  return (
    <div style={{ padding: '0.7rem 1rem', borderRadius: 10, marginBottom: '1rem', background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '0.78rem', animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={12} style={{ color: type === 'error' ? 'white' : '#000' }} /></div>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: s.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', flexShrink: 0 }}>✕</button>
    </div>
  );
}

function Subscriptions({ user }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  // Module switcher
  const [activeModule, setActiveModule] = useState('plans'); // 'plans' or 'requests'
  
  // Plans
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // My Requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  
  // Toast
  const [toast, setToast] = useState({ message: '', type: 'info' });
  
  // Cancel modal
  const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null, planName: '' });
  const [cancellingId, setCancellingId] = useState(null);

  const features = [
    { key: 'badge_verified_seller', label: 'Verified Seller Badge' },
    { key: 'badge_verified_product', label: 'Verified Product Badge' },
    { key: 'badge_verified_shop', label: 'Verified Shop Badge' },
    { key: 'badge_vip', label: 'VIP Badge' },
  ];

  useEffect(() => {
    fetchPlans();
    fetchPaymentCode();
    if (user) fetchMyRequests();
  }, [user]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 5000);
  };

  const fetchPlans = async () => {
    try { const res = await api.get('/subscriptions/plans'); setPlans(res.data.plans || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPaymentCode = async () => {
    try { const res = await api.get('/subscriptions/admin/payment-code'); setPaymentCode(res.data.payment_code || ''); }
    catch (e) { console.log('Could not fetch payment code'); }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try { const res = await api.get('/subscriptions/my-requests'); setMyRequests(res.data.requests || []); }
    catch (e) { console.error(e); }
    finally { setLoadingRequests(false); }
  };

  const handleUpgradeClick = (plan) => {
    if (!user) { navigate('/login'); return; }
    setSelectedPlan(plan);
    setConfirmed(false);
    setShowModal(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      await api.post('/subscriptions/upgrade', { plan_id: selectedPlan.id });
      showToast(`Request for ${selectedPlan.name} plan submitted successfully!`, 'success');
      setConfirmed(true);
      fetchMyRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting request', 'error');
    } finally { setSubscribing(false); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
    setConfirmed(false);
  };

  const openCancelModal = (requestId, planName) => {
    setCancelModal({ isOpen: true, requestId, planName });
  };

  const handleCancelRequest = async () => {
    const { requestId } = cancelModal;
    setCancellingId(requestId);
    try {
      await api.delete(`/subscriptions/admin/requests/${requestId}`);
      showToast('Request cancelled successfully', 'info');
      setCancelModal({ isOpen: false, requestId: null, planName: '' });
      fetchMyRequests();
    } catch (e) {
      showToast('Failed to cancel request', 'error');
    } finally { setCancellingId(null); }
  };

  const isCurrentPlan = (planId) => user?.subscription_plan_id === planId;

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)', color: '#eab308', label: 'Pending' },
      approved: { bg: 'rgba(0,227,9,0.12)', border: 'rgba(0,227,9,0.25)', color: '#00E309', label: 'Approved' },
      rejected: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', label: 'Rejected' },
    };
    const s = styles[status] || styles.pending;
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>{s.label}</span>;
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.9)';
  const accent = '#00E309';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, maxWidth: 1280, margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,227,9,0.4)}50%{box-shadow:0 0 0 12px rgba(0,227,9,0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .plan-card{transition:all 0.3s ease}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,0.4)!important}
        .plan-card.vip:hover{border-color:#eab308!important;box-shadow:0 16px 40px rgba(234,179,8,0.15)!important}
        @media(max-width:768px){.plans-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        title="Cancel Request"
        message={`Are you sure you want to cancel your request for the ${cancelModal.planName} plan? This action cannot be undone.`}
        icon={FiAlertTriangle}
        iconColor="#ef4444"
        confirmLabel="Cancel Request"
        confirmColor="#ef4444"
        onConfirm={handleCancelRequest}
        onCancel={() => setCancelModal({ isOpen: false, requestId: null, planName: '' })}
        loading={!!cancellingId}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem', color: textColor }}>
          Choose Your <span style={{ color: accent }}>Plan</span>
        </h1>
        <p style={{ color: textMuted, fontSize: '0.85rem', maxWidth: 500, margin: '0 auto', fontWeight: 300 }}>
          Unlock powerful features and grow your business with GuraNeza
        </p>
      </div>

      {/* 24hr Note */}
      <div style={{
        textAlign: 'center', padding: '0.7rem 1rem', borderRadius: 14, marginBottom: '1.5rem',
        background: darkMode ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)',
        border: `1px solid ${darkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'}`,
        maxWidth: 550, margin: '0 auto 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'
      }}>
        <FiClock size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <p style={{ fontSize: '0.72rem', color: '#3b82f6', margin: 0, fontWeight: 500 }}>
          Subscription requests are processed within <strong>24 hours</strong>. Keep connected via chat for updates.
        </p>
      </div>

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Current Plan Banner */}
      {user?.subscription_plan && (
        <div style={{
          textAlign: 'center', padding: '0.6rem 1.5rem', borderRadius: 40, marginBottom: '1.5rem',
          background: 'rgba(0,227,9,0.08)', border: '1px solid rgba(0,227,9,0.15)',
          width: 'fit-content', margin: '0 auto 1.5rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: textMuted }}>Current Plan: </span>
          <span style={{ fontWeight: 700, color: accent, fontSize: '0.9rem' }}>{user.subscription_plan.name}</span>
          <span style={{ fontSize: '0.7rem', color: textMuted, marginLeft: '0.5rem' }}>({user.subscription_status})</span>
        </div>
      )}

      {/* Module Switcher Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button onClick={() => setActiveModule('plans')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: 12, border: 'none', background: activeModule === 'plans' ? accent : 'rgba(255,255,255,0.05)', color: activeModule === 'plans' ? '#000' : textMuted, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
          <PackageIcon /> Subscription Plans
        </button>
        <button onClick={() => setActiveModule('requests')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: 12, border: 'none', background: activeModule === 'requests' ? accent : 'rgba(255,255,255,0.05)', color: activeModule === 'requests' ? '#000' : textMuted, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
          <FiRefreshCw size={15} /> My Requests
          {myRequests.length > 0 && <span style={{ background: activeModule === 'requests' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.65rem' }}>{myRequests.length}</span>}
        </button>
      </div>

      {/* ============================================ */}
      {/* MY REQUESTS MODULE */}
      {/* ============================================ */}
      {activeModule === 'requests' && (
        <div style={{ animation: 'fadeInUp 0.3s ease', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiRefreshCw size={16} style={{ color: accent }} />
              My Requests
            </h2>
            <button onClick={fetchMyRequests} title="Refresh"
              style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiRefreshCw size={12} />
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <div style={{ width: 22, height: 22, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : myRequests.length === 0 ? (
            <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '2.5rem', textAlign: 'center', color: textMuted }}>
              <FiRefreshCw size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>No subscription requests yet</p>
              <p style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>Switch to Plans tab to request an upgrade</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myRequests.map(request => (
                <div key={request.id} style={{
                  background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 14,
                  border: `1px solid ${borderColor}`, padding: '0.8rem 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>
                      {(request.plan?.name || 'P')[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.78rem' }}>{request.plan?.name || 'N/A'} Plan</p>
                      <p style={{ fontSize: '0.6rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiClock size={10} /> {formatDate(request.requested_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: accent }}>
                      {request.plan?.price_rwf ? request.plan.price_rwf.toLocaleString() + ' RWF' : ''}
                    </span>
                    {getStatusBadge(request.status)}
                    
                    {request.status === 'pending' && (
                      <>
                        <button onClick={() => navigate('/chats')} title="Check chat"
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiMessageSquare size={13} />
                        </button>
                        <button onClick={() => openCancelModal(request.id, request.plan?.name || 'Plan')} title="Cancel request"
                          disabled={cancellingId === request.id}
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cancellingId === request.id ? 0.5 : 1 }}>
                          <FiTrash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* PLANS MODULE */}
      {/* ============================================ */}
      {activeModule === 'plans' && (
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.2rem', alignItems: 'stretch', animation: 'fadeInUp 0.3s ease' }}>
          {plans.map((plan, index) => {
            const current = isCurrentPlan(plan.id);
            const isFree = plan.price_rwf === 0;

            return (
              <div key={plan.id}
                className={`plan-card ${plan.badge_vip ? 'vip' : ''}`}
                style={{
                  background: plan.badge_vip ? 'rgba(234,179,8,0.06)' : cardBg,
                  backdropFilter: 'blur(16px)', borderRadius: 20, padding: '1.6rem', textAlign: 'center',
                  border: current ? `2px solid ${accent}` : plan.badge_vip ? '2px solid rgba(234,179,8,0.3)' : `1px solid ${borderColor}`,
                  position: 'relative',
                  animation: `fadeInUp 0.4s ease ${index * 0.08}s both`,
                  boxShadow: current ? '0 0 30px rgba(0,227,9,0.15)' : darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {current && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#0a0a14', padding: '0.3rem 1.2rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', animation: 'pulse 2s infinite', whiteSpace: 'nowrap' }}>
                    Current Plan
                  </div>
                )}
                {plan.badge_vip && (
                  <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}><CrownIcon /></div>
                )}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: plan.badge_vip ? '#eab308' : textColor, margin: `${plan.badge_vip || current ? '1.2rem 0 0.5rem' : '0 0 0.5rem'}` }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: accent, marginBottom: '0.1rem' }}>{Number(plan.price_rwf).toLocaleString()} RWF</div>
                <div style={{ fontSize: '0.65rem', color: textMuted, marginBottom: '1.2rem' }}>/month</div>
                <div style={{ padding: '0.6rem', borderRadius: 12, background: darkMode ? 'rgba(0,227,9,0.06)' : 'rgba(0,227,9,0.04)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <PackageIcon />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: accent }}>{plan.max_products === -1 ? 'Unlimited' : plan.max_products} Products</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.2rem', textAlign: 'left', padding: '0 0.3rem', flex: 1 }}>
                  {features.map(feature => (
                    <div key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                      {plan[feature.key] ? <span style={{ color: accent }}><CheckIcon /></span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}><XIcon /></span>}
                      <span style={{ color: plan[feature.key] ? textColor : textMuted, fontWeight: plan[feature.key] ? 400 : 300 }}>{feature.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleUpgradeClick(plan)} disabled={current}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 25, border: current ? `1px solid ${accent}` : 'none', background: current ? 'transparent' : isFree ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : accent, color: current ? accent : isFree ? textColor : '#0a0a14', fontSize: '0.8rem', fontWeight: 700, cursor: current ? 'default' : 'pointer', transition: 'all 0.2s', marginTop: 'auto' }}
                  onMouseEnter={(e) => { if (!current) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                  onMouseLeave={(e) => { if (!current) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
                  {current ? 'Current Plan' : isFree ? 'Get Started Free' : 'Upgrade Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Note */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '1rem 1.5rem', background: darkMode ? 'rgba(0,227,9,0.04)' : 'rgba(0,227,9,0.03)', borderRadius: 14, border: `1px solid ${darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,227,9,0.06)'}`, fontSize: '0.75rem', color: textMuted, maxWidth: 600, margin: '2.5rem auto 0' }}>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          After requesting an upgrade, the admin will contact you via chat within <strong style={{ color: accent }}>24 hours</strong> to complete the payment. All prices are in Rwandan Francs (RWF).
        </p>
      </div>

      {/* ============================================ */}
      {/* UPGRADE CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showModal && selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
          <div style={{ background: darkMode ? '#1a1a2e' : 'white', borderRadius: 20, border: `1px solid ${borderColor}`, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: `1px solid ${borderColor}` }}>
              <h2 style={{ color: textColor, fontSize: '1.1rem', fontWeight: 700 }}>{confirmed ? 'Request Submitted!' : 'Confirm Upgrade'}</h2>
              <button onClick={handleCloseModal} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              {!confirmed ? (
                <>
                  <div style={{ marginBottom: '1.2rem' }}>
                    {selectedPlan.badge_vip && <div style={{ marginBottom: '0.5rem' }}><CrownIcon /></div>}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: selectedPlan.badge_vip ? '#eab308' : textColor }}>{selectedPlan.name} Plan</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: accent, marginTop: '0.3rem' }}>{selectedPlan.price_rwf.toLocaleString()} RWF<span style={{ fontSize: '0.7rem', color: textMuted }}>/month</span></p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '0.8rem 1rem', marginBottom: '1rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: textColor, marginBottom: '0.5rem' }}>What you'll get:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: textMuted }}><CheckIcon /> {selectedPlan.max_products === -1 ? 'Unlimited' : selectedPlan.max_products} products</div>
                      {features.filter(f => selectedPlan[f.key]).map(f => <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: textMuted }}><CheckIcon /> {f.label}</div>)}
                    </div>
                  </div>
                  {paymentCode && (
                    <div style={{ background: 'rgba(0,227,9,0.05)', borderRadius: 12, padding: '0.8rem 1rem', marginBottom: '1rem', border: '1px solid rgba(0,227,9,0.1)' }}>
                      <p style={{ fontSize: '0.6rem', color: textMuted, marginBottom: '0.25rem' }}>Payment Code</p>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: accent, letterSpacing: '0.05em' }}>{paymentCode}</p>
                      <p style={{ fontSize: '0.6rem', color: textMuted, marginTop: '0.25rem' }}>Use this code via mobile money</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', marginBottom: '1rem' }}>
                    <FiClock size={14} style={{ color: '#3b82f6' }} />
                    <p style={{ fontSize: '0.65rem', color: '#3b82f6', margin: 0 }}>Processed within <strong>24 hours</strong></p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleCloseModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 25, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleConfirmRequest} disabled={subscribing} style={{ flex: 1, padding: '0.6rem', borderRadius: 25, border: 'none', background: accent, color: '#0a0a14', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <FiSend size={14} />{subscribing ? 'Sending...' : 'Confirm'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '1rem 0' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,227,9,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                      <FiCheck size={28} style={{ color: accent }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: textColor, marginBottom: '0.4rem' }}>Request Submitted!</h3>
                    <p style={{ fontSize: '0.78rem', color: textMuted, lineHeight: 1.5, marginBottom: '0.8rem' }}>
                      Your upgrade request for <strong style={{ color: textColor }}>{selectedPlan.name}</strong> has been sent.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', padding: '0.5rem', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', marginBottom: '1rem' }}>
                      <FiClock size={13} style={{ color: '#3b82f6' }} />
                      <p style={{ fontSize: '0.65rem', color: '#3b82f6', margin: 0 }}>Check chats within <strong>24 hours</strong></p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleCloseModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 25, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                      <button onClick={() => { handleCloseModal(); navigate('/chats'); }} style={{ flex: 1, padding: '0.6rem', borderRadius: 25, border: 'none', background: accent, color: '#0a0a14', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <FiMessageSquare size={14} /> Go to Chats
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;