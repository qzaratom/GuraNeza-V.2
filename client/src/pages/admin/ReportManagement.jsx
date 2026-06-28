import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  FiCheck, FiX, FiMessageSquare, FiClock, FiRefreshCw,
  FiUser, FiFileText, FiAlertCircle, FiSend, FiChevronDown, FiFlag
} from 'react-icons/fi';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? 'rgba(0,227,9,0.12)' : type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)';
  const border = type === 'success' ? 'rgba(0,227,9,0.25)' : type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)';
  const color = type === 'success' ? '#00E309' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 500, padding: '12px 18px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color, fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(16px)', animation: 'slideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 380 }}>
      {type === 'success' ? <FiCheck size={16} /> : type === 'error' ? <FiAlertCircle size={16} /> : <FiRefreshCw size={16} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', padding: 0 }}><FiX size={14} /></button>
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#1a1a2e', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 400, overflow: 'hidden', animation: 'modalIn 0.2s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '1.8rem 1.5rem 1.2rem', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${confirmColor}15`, border: `1px solid ${confirmColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FiAlertCircle size={24} style={{ color: confirmColor }} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem' }}>{title}</h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '0.7rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.7rem', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', background: loading ? 'rgba(255,255,255,0.05)' : confirmColor, color: loading ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '0.78rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Processing...' : confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function ReportManagement() {
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [responseText, setResponseText] = useState({});
  const [showResponseInput, setShowResponseInput] = useState({});
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => { fetchTickets(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type, id: Date.now() }); };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets/admin/all');
      setTickets(res.data.tickets || []);
    } catch (e) { console.error('Error fetching tickets:', e); showToast('Failed to load tickets', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setProcessingId(ticketId);
    try {
      const response = responseText[ticketId] || '';
      await api.put(`/tickets/${ticketId}/status`, {
        status: newStatus,
        admin_response: response || undefined
      });
      showToast(`Ticket ${newStatus.replace('_', ' ')}!`);
      setShowResponseInput(prev => ({ ...prev, [ticketId]: false }));
      setResponseText(prev => ({ ...prev, [ticketId]: '' }));
      setConfirmAction(null);
      fetchTickets();
    } catch (e) { showToast('Error updating ticket', 'error'); }
    finally { setProcessingId(null); }
  };

  const handleOpenChat = (userId) => {
    navigate('/chats', { state: { openUserId: userId } });
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', label: 'Open' },
      in_progress: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'In Progress' },
      resolved: { bg: 'rgba(0,227,9,0.1)', color: '#00E309', label: 'Resolved' },
      closed: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Closed' },
    };
    const s = styles[status] || styles.open;
    return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredTickets = activeTab === 'all' ? tickets : tickets.filter(t => t.status === activeTab);

  const borderColor = 'rgba(255,255,255,0.06)';
  const cardBg = 'rgba(26,26,46,0.5)';
  const accent = '#00E309';
  const textMuted = 'rgba(255,255,255,0.5)';
  const abg = 'rgba(0,227,9,0.1)';

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: 'white' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .header-row{flex-direction:column!important;align-items:flex-start!important;gap:0.8rem!important}
          .tab-row{flex-wrap:wrap!important}
          .ticket-row{flex-direction:column!important;align-items:flex-start!important}
          .action-row{flex-direction:column!important;width:100%!important}
          .action-row button{width:100%!important;justify-content:center!important}
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.id} />}

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || 'Confirm Action'}
        message={confirmAction?.message || 'Are you sure?'}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        confirmColor={confirmAction?.confirmColor || '#00E309'}
        onConfirm={() => confirmAction && handleUpdateStatus(confirmAction.ticketId, confirmAction.newStatus)}
        onCancel={() => setConfirmAction(null)}
        loading={!!processingId}
      />

      {/* Header */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiFlag size={18} style={{ color: accent }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.4rem)', fontWeight: 700, margin: 0 }}>Reports & Tickets</h1>
            <p style={{ color: textMuted, fontSize: '0.72rem', margin: '0.1rem 0 0' }}>{tickets.length} total tickets</p>
          </div>
        </div>
        <div className="tab-row" style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.35rem 0.8rem', borderRadius: 14, border: 'none',
                background: activeTab === tab ? accent : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#000' : textMuted,
                fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}>
              {tab.replace('_', ' ')}
            </button>
          ))}
          <button onClick={fetchTickets} title="Refresh"
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiRefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FiFileText size={18} style={{ color: accent }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Help Tickets</h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: textMuted }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <FiFileText size={22} style={{ opacity: 0.4, color: accent }} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No {activeTab !== 'all' ? activeTab.replace('_', ' ') : ''} tickets</p>
            <p style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>Tickets submitted by users will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filteredTickets.map(ticket => {
              const isExpanded = expandedTicket === ticket.id;
              return (
                <div key={ticket.id} style={{
                  background: 'rgba(255,255,255,0.02)', borderRadius: 14,
                  border: `1px solid ${borderColor}`, padding: '0.9rem 1rem',
                  transition: 'all 0.15s'
                }}>
                  
                  {/* Top Row */}
                  <div className="ticket-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 180 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>
                        {(ticket.user?.display_name || '?')[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.78rem', margin: 0 }}>{ticket.user?.display_name || 'Unknown'}</p>
                        <p style={{ fontSize: '0.6rem', color: textMuted, margin: 0 }}>{ticket.user?.email}</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 100 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.78rem', margin: 0 }}>{ticket.topic}</p>
                      <div style={{ marginTop: '0.3rem' }}>{getStatusBadge(ticket.status)}</div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                      <p style={{ fontSize: '0.6rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end', margin: 0 }}>
                        <FiClock size={10} /> {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Expandable Message */}
                  <div onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    style={{ 
                      padding: '0.5rem 0.7rem', borderRadius: 8, 
                      background: 'rgba(255,255,255,0.02)', 
                      marginBottom: '0.5rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                    <FiChevronDown size={12} style={{ color: textMuted, marginTop: '0.15rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                    <p style={{ 
                      fontSize: '0.7rem', color: textMuted, lineHeight: 1.4, margin: 0,
                      display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : 2, 
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {ticket.message}
                    </p>
                  </div>

                  {/* Admin Response */}
                  {ticket.admin_response && (
                    <div style={{ padding: '0.5rem 0.7rem', borderRadius: 8, background: abg, border: '1px solid rgba(0,227,9,0.1)', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.65rem', color: accent, fontWeight: 500, margin: 0 }}>Response: {ticket.admin_response}</p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="action-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    
                    <div style={{ flex: 1, minWidth: 180 }}>
                      {showResponseInput[ticket.id] ? (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <input type="text" value={responseText[ticket.id] || ''}
                            onChange={(e) => setResponseText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Type a response..."
                            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.7rem', outline: 'none' }} />
                          <button onClick={() => setShowResponseInput(prev => ({ ...prev, [ticket.id]: false }))}
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.05)', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiX size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowResponseInput(prev => ({ ...prev, [ticket.id]: true }))}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.15s' }}>
                          <FiSend size={10} /> Add Response
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => handleOpenChat(ticket.user_id)} title="Open Chat"
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(59,130,246,0.2)`, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        <FiMessageSquare size={14} />
                      </button>

                      {ticket.status === 'open' && (
                        <button onClick={() => setConfirmAction({ ticketId: ticket.id, newStatus: 'in_progress', title: 'Start Working?', message: 'Mark this ticket as in progress?', confirmLabel: 'Start', confirmColor: '#3b82f6' })}
                          disabled={processingId === ticket.id}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Start
                        </button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <button onClick={() => setConfirmAction({ ticketId: ticket.id, newStatus: 'resolved', title: 'Resolve Ticket?', message: 'Mark this ticket as resolved?', confirmLabel: 'Resolve', confirmColor: accent })}
                          disabled={processingId === ticket.id}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: 'none', background: accent, color: '#000', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                          <FiCheck size={12} /> Resolve
                        </button>
                      )}
                      {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                        <button onClick={() => setConfirmAction({ ticketId: ticket.id, newStatus: 'closed', title: 'Close Ticket?', message: 'Are you sure you want to close this ticket?', confirmLabel: 'Close', confirmColor: '#ef4444' })}
                          disabled={processingId === ticket.id}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Close
                        </button>
                      )}
                      {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                        <button onClick={() => setConfirmAction({ ticketId: ticket.id, newStatus: 'open', title: 'Reopen Ticket?', message: 'Reopen this ticket?', confirmLabel: 'Reopen', confirmColor: '#eab308' })}
                          disabled={processingId === ticket.id}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textMuted, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportManagement;