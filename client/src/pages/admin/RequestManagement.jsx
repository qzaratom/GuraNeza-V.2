import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  FiSave, FiCheck, FiX, FiMessageSquare, FiCopy, FiRefreshCw, 
  FiClock, FiCreditCard, FiTrash2, FiEdit2, 
  FiStar, FiAlertTriangle,
  FiInfo, FiThumbsUp, FiThumbsDown, FiDownload, FiFileText
} from 'react-icons/fi';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.12)' : type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)';
  const border = type === 'success' ? 'rgba(0,227,9,0.25)' : type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)';
  const color = type === 'success' ? '#00E309' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 600, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'slideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' ? <FiCheck size={16} /> : type === 'error' ? <FiAlertTriangle size={16} /> : <FiInfo size={16} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, icon: Icon, iconColor, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#1a1a2e', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 420, overflow: 'hidden', animation: 'modalIn 0.2s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '1.8rem 1.5rem 1.2rem', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${iconColor}15`, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Icon size={24} style={{ color: iconColor }} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem' }}>{title}</h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '0.7rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.7rem', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', background: loading ? 'rgba(255,255,255,0.05)' : confirmColor, color: loading ? 'rgba(255,255,255,0.3)' : (confirmColor === '#ef4444' ? 'white' : '#000'), fontSize: '0.78rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Processing...' : confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function RequestManagement() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('requests');
  
  const [paymentCode, setPaymentCode] = useState('');
  const [newPaymentCode, setNewPaymentCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [toast, setToast] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', icon: FiInfo, iconColor: '#00E309', confirmLabel: '', confirmColor: '#00E309', onConfirm: () => {} });

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingPlan, setSavingPlan] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type, id: Date.now() }); };

  useEffect(() => {
    fetchPaymentCode();
    fetchRequests();
    fetchPlans();
  }, []);

  const fetchPaymentCode = async () => {
    try { const res = await api.get('/subscriptions/admin/payment-code'); const code = res.data.payment_code || ''; setPaymentCode(code); setNewPaymentCode(code); }
    catch (e) { console.error(e); }
  };

  const handleSavePaymentCode = async () => {
    if (!newPaymentCode.trim()) { showToast('Please enter a valid payment code', 'error'); return; }
    setSavingCode(true);
    try { await api.put('/subscriptions/admin/payment-code', { payment_code: newPaymentCode.trim() }); setPaymentCode(newPaymentCode.trim()); showToast('Payment code updated!', 'success'); }
    catch (e) { showToast('Failed to update payment code', 'error'); }
    finally { setSavingCode(false); }
  };

  const copyPaymentCode = () => { navigator.clipboard.writeText(paymentCode); showToast('Copied to clipboard!', 'success'); };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try { const res = await api.get('/subscriptions/admin/requests'); setRequests(res.data.requests || []); }
    catch (e) { console.error(e); }
    finally { setLoadingRequests(false); }
  };

  const handleApprove = async (requestId, userName, planName) => {
    setProcessingId(requestId);
    try {
      await api.put(`/subscriptions/admin/requests/${requestId}`, { status: 'approved', admin_response: `Approved! Your ${planName} plan is now active.` });
      showToast(`${userName}'s ${planName} plan approved!`, 'success');
      fetchRequests();
    } catch (e) { showToast('Failed to approve', 'error'); }
    finally { setProcessingId(null); setConfirmModal(p => ({ ...p, isOpen: false })); }
  };

  const handleReject = async (requestId, userName, planName) => {
    setProcessingId(requestId);
    try {
      await api.put(`/subscriptions/admin/requests/${requestId}`, { status: 'rejected', admin_response: 'Request declined.' });
      showToast(`${userName}'s request rejected`, 'info');
      fetchRequests();
    } catch (e) { showToast('Failed to reject', 'error'); }
    finally { setProcessingId(null); setConfirmModal(p => ({ ...p, isOpen: false })); }
  };

  const handleDelete = async (requestId, userName) => {
    setDeletingId(requestId);
    try { await api.delete(`/subscriptions/admin/requests/${requestId}`); showToast(`${userName}'s request deleted`, 'info'); fetchRequests(); }
    catch (e) { showToast('Failed to delete', 'error'); }
    finally { setDeletingId(null); setConfirmModal(p => ({ ...p, isOpen: false })); }
  };

  const handleOpenChat = () => { navigate('/chats'); };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try { const res = await api.get('/subscriptions/plans'); setPlans(res.data.plans || []); }
    catch (e) { console.error(e); }
    finally { setLoadingPlans(false); }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan.id);
    setEditData({ name: plan.name, price_rwf: plan.price_rwf, max_products: plan.max_products, badge_verified_seller: plan.badge_verified_seller, badge_verified_product: plan.badge_verified_product, badge_verified_shop: plan.badge_verified_shop, badge_vip: plan.badge_vip, is_active: plan.is_active });
  };

  const handleSavePlan = async (planId) => {
    setSavingPlan(true);
    try { await api.put(`/subscriptions/admin/plans/${planId}`, editData); showToast('Plan updated!', 'success'); setEditingPlan(null); fetchPlans(); }
    catch (e) { showToast('Failed to update plan', 'error'); }
    finally { setSavingPlan(false); }
  };

  const downloadExcel = () => {
    const rows = requests.map(r => [r.id, r.user?.display_name || '', r.user?.email || '', r.plan?.name || '', r.plan?.price_rwf || 0, r.payment_code || '', r.status, new Date(r.requested_at).toLocaleDateString(), r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : '', r.admin_response || '']);
    let csv = 'ID,User,Email,Plan,Price,Code,Status,Requested,Resolved,Response\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `requests_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast('Report downloaded!', 'success');
  };

  const getStatusBadge = (status) => {
    const styles = { pending: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', label: 'Pending' }, approved: { bg: 'rgba(0,227,9,0.1)', color: '#00E309', label: 'Approved' }, rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Rejected' } };
    const s = styles[status] || styles.pending;
    return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  const formatDate = (d) => { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const filteredRequests = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  const borderColor = 'rgba(255,255,255,0.06)';
  const cardBg = 'rgba(26,26,46,0.5)';
  const accent = '#00E309';
  const textMuted = 'rgba(255,255,255,0.5)';
  const textColor = 'white';
  const abg = 'rgba(0,227,9,0.1)';
  const inputBg = 'rgba(255,255,255,0.03)';

  const approvedRevenue = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.plan?.price_rwf || 0), 0);
  const pendingRevenue = requests.filter(r => r.status === 'pending').reduce((s, r) => s + (r.plan?.price_rwf || 0), 0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: 'white' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .header-row{flex-direction:column!important;align-items:flex-start!important;gap:0.8rem!important}
          .req-row{flex-direction:column!important;align-items:flex-start!important}
          .req-actions{width:100%!important;justify-content:flex-start!important}
          .stats-grid{grid-template-columns:1fr!important}
          .plans-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      <ConfirmModal {...confirmModal} loading={!!processingId || !!deletingId} onCancel={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />

      {/* Header */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiFileText size={18} style={{ color: accent }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.4rem)', fontWeight: 700, margin: 0 }}>Request Management</h1>
            <p style={{ color: textMuted, fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Manage payment codes, requests & plans</p>
          </div>
        </div>
        <button onClick={downloadExcel} style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.06)', color: '#4ade80', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
          <FiDownload size={13} /> Export
        </button>
      </div>

      {/* Module Switcher */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.2rem', background: 'rgba(20,20,40,0.75)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: '0.3rem', width: 'fit-content', border: `1px solid ${borderColor}` }}>
        <button onClick={() => setActiveModule('requests')} style={{ padding: '0.5rem 1.2rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, border: 'none', background: activeModule === 'requests' ? accent : 'transparent', color: activeModule === 'requests' ? '#000' : textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
          <FiRefreshCw size={14} /> Requests {requests.length > 0 && <span style={{ background: activeModule === 'requests' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.6rem' }}>{requests.length}</span>}
        </button>
        <button onClick={() => setActiveModule('plans')} style={{ padding: '0.5rem 1.2rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, border: 'none', background: activeModule === 'plans' ? accent : 'transparent', color: activeModule === 'plans' ? '#000' : textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
          <FiStar size={14} /> Plans
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
        <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${borderColor}`, padding: '0.9rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', color: textMuted, textTransform: 'uppercase', margin: 0 }}>Approved Revenue</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: accent, margin: '0.2rem 0' }}>{approvedRevenue.toLocaleString()} RWF</p>
        </div>
        <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${borderColor}`, padding: '0.9rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', color: textMuted, textTransform: 'uppercase', margin: 0 }}>Pending Revenue</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#eab308', margin: '0.2rem 0' }}>{pendingRevenue.toLocaleString()} RWF</p>
        </div>
        <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${borderColor}`, padding: '0.9rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', color: textMuted, textTransform: 'uppercase', margin: 0 }}>Total Requests</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6', margin: '0.2rem 0' }}>{requests.length}</p>
        </div>
      </div>

      {/* Payment Code */}
      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 14, border: `1px solid ${borderColor}`, padding: '1rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCreditCard size={15} style={{ color: accent }} /></div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Payment Code</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, display: 'flex', gap: '0.3rem' }}>
            <input type="text" value={newPaymentCode} onChange={(e) => setNewPaymentCode(e.target.value)} placeholder="e.g., *182*8*1*123456#"
              style={{ flex: 1, padding: '0.5rem 0.7rem', borderRadius: 10, border: `1px solid ${borderColor}`, background: inputBg, color: 'white', fontSize: '0.78rem', outline: 'none' }} />
            <button onClick={copyPaymentCode} title="Copy" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCopy size={13} /></button>
          </div>
          <button onClick={handleSavePaymentCode} disabled={savingCode}
            style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: accent, color: '#000', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <FiSave size={13} /> {savingCode ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* REQUESTS */}
      {activeModule === 'requests' && (
        <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 14, border: `1px solid ${borderColor}`, padding: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiRefreshCw size={15} style={{ color: accent }} /> Requests ({requests.length})</h2>
            <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
              {['all', 'pending', 'approved', 'rejected'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.3rem 0.7rem', borderRadius: 14, border: 'none', background: activeTab === tab ? accent : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#000' : textMuted, fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{tab}</button>
              ))}
              <button onClick={fetchRequests} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiRefreshCw size={11} /></button>
            </div>
          </div>

          {loadingRequests ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div style={{ width: 24, height: 24, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: textMuted }}><FiRefreshCw size={28} style={{ marginBottom: '0.4rem', opacity: 0.3 }} /><p style={{ fontSize: '0.8rem' }}>No {activeTab !== 'all' ? activeTab : ''} requests</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredRequests.map(req => (
                <div key={req.id} className="req-row" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${borderColor}`, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 180 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>{(req.user?.display_name || '?')[0]}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.78rem', margin: 0 }}>{req.user?.display_name || 'Unknown'}</p>
                      <p style={{ fontSize: '0.6rem', color: textMuted, margin: 0 }}>{req.user?.email}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 90 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.75rem', margin: 0 }}>{req.plan?.name || 'N/A'}</p>
                    <p style={{ fontSize: '0.65rem', color: accent, fontWeight: 600, margin: '0.15rem 0' }}>{req.plan?.price_rwf ? req.plan.price_rwf.toLocaleString() + ' RWF' : ''}</p>
                    <p style={{ fontSize: '0.55rem', color: textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', margin: 0 }}><FiClock size={9} /> {formatDate(req.requested_at)}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>{getStatusBadge(req.status)}</div>
                  <div className="req-actions" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => setConfirmModal({ isOpen: true, title: 'Approve Request', message: `Approve ${req.user?.display_name}'s ${req.plan?.name} plan?`, icon: FiThumbsUp, iconColor: accent, confirmLabel: 'Approve', confirmColor: accent, onConfirm: () => handleApprove(req.id, req.user?.display_name, req.plan?.name) })}
                          style={{ padding: '0.35rem 0.7rem', borderRadius: 8, border: 'none', background: accent, color: '#000', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Approve</button>
                        <button onClick={() => setConfirmModal({ isOpen: true, title: 'Reject Request', message: `Reject ${req.user?.display_name}'s ${req.plan?.name} plan?`, icon: FiThumbsDown, iconColor: '#ef4444', confirmLabel: 'Reject', confirmColor: '#ef4444', onConfirm: () => handleReject(req.id, req.user?.display_name, req.plan?.name) })}
                          style={{ padding: '0.35rem 0.7rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reject</button>
                      </>
                    )}
                    <button onClick={handleOpenChat} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiMessageSquare size={13} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Request', message: `Permanently delete ${req.user?.display_name}'s request?`, icon: FiAlertTriangle, iconColor: '#ef4444', confirmLabel: 'Delete', confirmColor: '#ef4444', onConfirm: () => handleDelete(req.id, req.user?.display_name) })}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLANS */}
      {activeModule === 'plans' && (
        <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 14, border: `1px solid ${borderColor}`, padding: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiStar size={15} style={{ color: accent }} /> Plans ({plans.length})</h2>
          {loadingPlans ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div style={{ width: 24, height: 24, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>
          ) : (
            <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
              {plans.map(plan => {
                const isEditing = editingPlan === plan.id;
                return (
                  <div key={plan.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${borderColor}`, padding: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      {isEditing ? (
                        <input type="text" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                          style={{ width: 80, padding: '0.3rem', borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }} />
                      ) : <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{plan.name}</h3>}
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSavePlan(plan.id)} disabled={savingPlan} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: accent, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiSave size={11} /></button>
                            <button onClick={() => setEditingPlan(null)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={11} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleEditPlan(plan)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={11} /></button>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <input type="number" value={editData.price_rwf} onChange={e => setEditData(p => ({ ...p, price_rwf: parseInt(e.target.value) || 0 }))}
                            style={{ width: 70, padding: '0.25rem', borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: 'white', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }} />
                          <span style={{ fontSize: '0.6rem', color: textMuted }}>RWF</span>
                        </div>
                      ) : <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{plan.price_rwf.toLocaleString()} <span style={{ fontSize: '0.6rem', color: textMuted, fontWeight: 400 }}>RWF</span></p>}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.6rem', color: textMuted }}>Products: </span>
                      {isEditing ? (
                        <input type="number" value={editData.max_products} onChange={e => setEditData(p => ({ ...p, max_products: parseInt(e.target.value) || 0 }))}
                          style={{ width: 60, padding: '0.2rem', borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: 'white', fontSize: '0.7rem', outline: 'none' }} />
                      ) : <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{plan.max_products === -1 ? 'Unlimited' : plan.max_products}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', paddingTop: '0.4rem', borderTop: `1px solid ${borderColor}` }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: plan.is_active ? accent : '#ef4444', marginTop: '0.3rem' }} />
                      <span style={{ fontSize: '0.6rem', color: textMuted }}>{plan.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RequestManagement;