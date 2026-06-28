import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiSend, FiMessageSquare, FiClock, FiCheck, FiX, 
  FiAlertCircle, FiHelpCircle, FiSearch, FiChevronDown,
  FiFileText, FiUser
} from 'react-icons/fi';

// Predefined ticket topics for suggestions
const predefinedTopics = [
  { topic: 'Account Issues', message: 'I need help with my account settings or login.' },
  { topic: 'Payment Problem', message: 'I have an issue with a payment or subscription.' },
  { topic: 'Product Listing', message: 'I need help listing a product or managing my listings.' },
  { topic: 'Order Issue', message: 'I have a problem with an order I placed or received.' },
  { topic: 'Report a User', message: 'I want to report a user for inappropriate behavior.' },
  { topic: 'Technical Bug', message: 'I found a bug or technical issue on the platform.' },
  { topic: 'Feature Request', message: 'I have a suggestion for a new feature.' },
  { topic: 'General Inquiry', message: 'I have a general question about GuraNeza.' },
  { topic: 'Shop Setup', message: 'I need help setting up or managing my shop.' },
  { topic: 'Privacy Concern', message: 'I have a concern about privacy or data.' },
];

function Tickets({ user }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  // Form state
  const [topicInput, setTopicInput] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  
  const suggestionsRef = useRef(null);
  const topicInputRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyTickets();
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchMyTickets = async () => {
    try {
      const res = await api.get('/tickets/my-tickets');
      setMyTickets(res.data.tickets || []);
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTopicChange = (e) => {
    const value = e.target.value;
    setTopicInput(value);
    
    if (value.trim()) {
      const filtered = predefinedTopics.filter(t => 
        t.topic.toLowerCase().includes(value.toLowerCase()) ||
        t.message.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredTopics(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredTopics(predefinedTopics);
      setShowSuggestions(false);
    }
  };

  const selectTopic = (topic) => {
    setTopicInput(topic.topic);
    if (!messageText) {
      setMessageText(topic.message);
    }
    setShowSuggestions(false);
  };

  const selectPredefinedTopic = (topic) => {
    setTopicInput(topic.topic);
    setMessageText(topic.message);
    setShowSuggestions(false);
    setShowNewTicket(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topicInput.trim()) {
      setErrorMsg('Please enter a topic');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    if (!messageText.trim()) {
      setErrorMsg('Please enter a message');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    
    try {
      await api.post('/tickets', {
        topic: topicInput.trim(),
        message: messageText.trim()
      });
      
      setSuccessMsg('Ticket submitted successfully! Admin will respond soon.');
      setTopicInput('');
      setMessageText('');
      setShowNewTicket(false);
      fetchMyTickets();
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Error submitting ticket');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)', color: '#eab308', label: 'Open' },
      in_progress: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#3b82f6', label: 'In Progress' },
      resolved: { bg: 'rgba(0,227,9,0.12)', border: 'rgba(0,227,9,0.25)', color: '#00E309', label: 'Resolved' },
      closed: { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.25)', color: '#6b7280', label: 'Closed' },
    };
    const s = styles[status] || styles.open;
    return (
      <span style={{ padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.55rem', fontWeight: 600, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.9)';
  const accent = '#00E309';

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiHelpCircle size={20} style={{ color: accent }} />
          Help & Support
        </h1>
        <p style={{ color: textMuted, fontSize: '0.8rem', marginTop: '0.2rem' }}>
          Submit a ticket and our team will respond as soon as possible
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '0.6rem 1rem', borderRadius: 12, marginBottom: '1rem', background: 'rgba(0,227,9,0.1)', border: '1px solid rgba(0,227,9,0.2)', color: accent, fontSize: '0.78rem', animation: 'fadeInUp 0.3s ease' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.6rem 1rem', borderRadius: 12, marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.78rem', animation: 'fadeInUp 0.3s ease' }}>
          {errorMsg}
        </div>
      )}

      {/* ============================================ */}
      {/* NEW TICKET FORM */}
      {/* ============================================ */}
      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.2rem', marginBottom: '1.5rem' }}>
        
        {!showNewTicket ? (
          <>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiFileText size={16} style={{ color: accent }} />
              Create a New Ticket
            </h2>
            <p style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '1rem' }}>
              Select a topic below or write your own custom message
            </p>

            {/* Predefined Topics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              {predefinedTopics.slice(0, 6).map((topic, i) => (
                <button key={i} onClick={() => selectPredefinedTopic(topic)}
                  style={{
                    padding: '0.6rem 0.8rem', borderRadius: 12, border: `1px solid ${borderColor}`,
                    background: 'rgba(255,255,255,0.02)', color: textColor,
                    fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = 'rgba(0,227,9,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{topic.topic}</div>
                  <div style={{ fontSize: '0.6rem', color: textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.message}</div>
                </button>
              ))}
            </div>

            <button onClick={() => setShowNewTicket(true)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 12, border: `1px dashed ${borderColor}`, background: 'transparent', color: accent, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,227,9,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              Write Custom Message
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiFileText size={16} style={{ color: accent }} />
              New Ticket
            </h2>

            {/* Topic Input with Suggestions */}
            <div style={{ position: 'relative', marginBottom: '0.8rem' }} ref={suggestionsRef}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: textColor, display: 'block', marginBottom: '0.3rem' }}>
                Topic *
              </label>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
                <input
                  ref={topicInputRef}
                  type="text"
                  value={topicInput}
                  onChange={handleTopicChange}
                  onFocus={() => { if (filteredTopics.length > 0 || topicInput === '') setShowSuggestions(true); }}
                  placeholder="e.g., Account Issues, Payment Problem..."
                  style={{
                    width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.2rem', borderRadius: 12,
                    border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.03)',
                    color: textColor, fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: darkMode ? '#1a1a2e' : 'white', borderRadius: 12,
                  border: `1px solid ${borderColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  maxHeight: 200, overflowY: 'auto', marginTop: '0.3rem'
                }}>
                  {(topicInput ? filteredTopics : predefinedTopics).map((topic, i) => (
                    <div key={i} onClick={() => selectTopic(topic)}
                      style={{
                        padding: '0.55rem 0.8rem', cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,227,9,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ fontWeight: 600, fontSize: '0.72rem', color: textColor }}>{topic.topic}</div>
                      <div style={{ fontSize: '0.6rem', color: textMuted, marginTop: '0.1rem' }}>{topic.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Textarea */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: textColor, display: 'block', marginBottom: '0.3rem' }}>
                Message *
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Describe your issue or feedback in detail..."
                rows={4}
                style={{
                  width: '100%', padding: '0.6rem 0.8rem', borderRadius: 12,
                  border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.03)',
                  color: textColor, fontSize: '0.78rem', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => { setShowNewTicket(false); setTopicInput(''); setMessageText(''); }}
                style={{ flex: 1, padding: '0.6rem', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ flex: 1, padding: '0.6rem', borderRadius: 12, border: 'none', background: accent, color: '#0a0a14', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <FiSend size={14} />
                {submitting ? 'Sending...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ============================================ */}
      {/* MY TICKETS */}
      {/* ============================================ */}
      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, padding: '1.2rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiMessageSquare size={16} style={{ color: accent }} />
          My Tickets
          <span style={{ fontSize: '0.65rem', color: textMuted, fontWeight: 400 }}>({myTickets.length})</span>
        </h2>

        {loadingTickets ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : myTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: textMuted }}>
            <FiMessageSquare size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.8rem' }}>No tickets yet</p>
            <p style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>Submit a ticket above to get help</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {myTickets.map(ticket => (
              <div key={ticket.id} style={{
                background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                border: `1px solid ${borderColor}`, padding: '0.7rem 0.9rem',
                transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <h3 style={{ fontSize: '0.78rem', fontWeight: 600 }}>{ticket.topic}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: textMuted, lineHeight: 1.4 }}>{ticket.message}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.6rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                      <FiClock size={10} /> {formatDate(ticket.created_at)}
                    </p>
                    {ticket.admin_response && (
                      <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: 8, background: 'rgba(0,227,9,0.04)', border: '1px solid rgba(0,227,9,0.08)', fontSize: '0.62rem', color: accent, maxWidth: 200 }}>
                        <strong>Response:</strong> {ticket.admin_response}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: '3rem' }} />
    </div>
  );
}

export default Tickets;