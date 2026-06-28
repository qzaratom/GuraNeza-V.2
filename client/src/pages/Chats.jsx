import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { FiSend, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';

function Chats({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchChats();
    const state = location.state;
    if (state?.openChatId) {
      openChat(state.openChatId);
      setShowSidebar(false);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChat) fetchMessages(activeChat.id, true);
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChat]);

  const fetchChats = async () => {
    try { const res = await api.get('/chats'); setChats(res.data.chats || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (chatId, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await api.get(`/chats/${chatId}`);
      setMessages(res.data.messages || []);
      setOtherUser(res.data.chat?.other_user || null);
    } catch (e) { console.error(e); }
    finally { if (!silent) setMessagesLoading(false); }
  };

  const openChat = async (chatId) => {
    setActiveChat({ id: chatId });
    await fetchMessages(chatId);
    if (isMobile) setShowSidebar(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    
    const tempMessage = {
      id: Date.now().toString(),
      chat_id: activeChat.id,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      temp: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    try {
      const res = await api.post(`/chats/${activeChat.id}/messages`, { content: tempMessage.content });
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data.chat_message : m));
      fetchChats();
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const getTimeAgo = (d) => {
    if (!d) return '';
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'Now';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    return Math.floor(s / 86400) + 'd';
  };

  const formatMessageTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = darkMode ? 'rgba(26,26,46,0.4)' : 'rgba(255,255,255,0.9)';
  const sidebarBg = darkMode ? '#0d0d1a' : '#f5f5f5';
  const accent = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const abg = darkMode ? 'rgba(0,227,9,0.1)' : 'rgba(0,227,9,0.06)';

  const floatingBags = [...Array(8)].map((_, i) => ({ left: `${Math.random() * 90}%`, delay: `${Math.random() * 4}s`, duration: `${4 + Math.random() * 5}s`, size: 10 + Math.random() * 10, opacity: 0.04 }));

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: textColor, background: bgColor, position: 'relative' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bagRise{0%{transform:translateY(0) rotate(0deg);opacity:0}5%{opacity:.05}95%{opacity:.05}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{opacity:0.3}50%{opacity:0.6}100%{opacity:0.3}}
        .msg-in{animation:fadeIn 0.2s ease}
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-track{background:transparent}
        .chat-scroll::-webkit-scrollbar-thumb{background:${borderColor};border-radius:4px}
        .sidebar-scroll::-webkit-scrollbar{width:3px}
        .sidebar-scroll::-webkit-scrollbar-track{background:transparent}
        .sidebar-scroll::-webkit-scrollbar-thumb{background:${borderColor};border-radius:3px}
      `}</style>

      {/* Floating bags */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingBags.map((bag, i) => (<div key={i} style={{ position: 'absolute', left: bag.left, bottom: '-30px', animation: `bagRise ${bag.duration} linear infinite`, animationDelay: bag.delay, opacity: bag.opacity }}><svg width={bag.size} height={bag.size} viewBox="0 0 24 24" fill={darkMode ? "white" : "#0a0a14"}><path d="M16 6l-2-3h-4L8 6H3v15h18V6h-5zM8.5 7l2-3h3l2 3H8.5zM5 19V8h2v11H5zm4 0V8h2v11H9zm4 0V8h2v11h-2zm4 0V8h2v11h-2z"/></svg></div>))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '1.2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiMessageSquare size={20} style={{ color: accent }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Messages</h1>
              <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0.1rem 0 0' }}>{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div style={{ 
          display: 'flex', 
          height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 220px)',
          minHeight: 450,
          borderRadius: 16, 
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          background: cardBg,
          backdropFilter: 'blur(16px)',
          boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          
          {/* SIDEBAR */}
          <div style={{ 
            width: isMobile ? '100%' : 320, 
            borderRight: isMobile ? 'none' : `1px solid ${borderColor}`, 
            display: showSidebar ? 'flex' : (isMobile ? 'none' : 'flex'), 
            flexDirection: 'column', 
            background: sidebarBg,
            flexShrink: 0
          }}>
            
            <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
                  <div style={{ width: 28, height: 28, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              ) : chats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: textMuted }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <FiMessageSquare size={22} style={{ opacity: 0.4, color: accent }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No conversations yet</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>Contact a seller from a product page to start chatting</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat.id)}
                    style={{
                      padding: '0.7rem 0.9rem', 
                      cursor: 'pointer',
                      background: activeChat?.id === chat.id ? abg : 'transparent',
                      borderLeft: activeChat?.id === chat.id ? `3px solid ${accent}` : '3px solid transparent',
                      borderBottom: `1px solid ${borderColor}`,
                      transition: 'all 0.15s',
                      display: 'flex', gap: '0.6rem', alignItems: 'center'
                    }}
                    onMouseEnter={e => { if (activeChat?.id !== chat.id) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'; }}
                    onMouseLeave={e => { if (activeChat?.id !== chat.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #22c55e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a14', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                      {(chat.other_user?.display_name || '?')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{chat.other_user?.display_name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.58rem', color: textMuted }}>{getTimeAgo(chat.last_message_at)}</span>
                      </div>
                      <p style={{ fontSize: '0.68rem', color: textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                        {chat.last_message || 'No messages yet'}
                      </p>
                    </div>
                    {chat.unread_count > 0 && (
                      <div style={{ minWidth: 20, height: 20, borderRadius: '50%', background: accent, color: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                        {chat.unread_count}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div style={{ 
            flex: 1, 
            display: (!showSidebar || !isMobile) ? 'flex' : 'none', 
            flexDirection: 'column', 
            background: bgColor 
          }}>
            
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div style={{ 
                  padding: '0.6rem 1rem', 
                  borderBottom: `1px solid ${borderColor}`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: sidebarBg
                }}>
                  {isMobile && (
                    <button onClick={() => { setShowSidebar(true); setActiveChat(null); }}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem' }}>
                      <FiArrowLeft size={18} />
                    </button>
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #22c55e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a14', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                    {(otherUser?.display_name || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>{otherUser?.display_name || 'Unknown'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {messagesLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                          <div style={{
                            width: `${60 + Math.random() * 30}%`,
                            height: `${30 + Math.random() * 20}px`,
                            borderRadius: i % 2 === 0 ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,227,9,0.06)',
                            animation: 'shimmer 1.5s infinite',
                            animationDelay: `${i * 0.15}s`
                          }} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: textMuted, marginTop: '3rem' }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                        <FiMessageSquare size={22} style={{ opacity: 0.3, color: accent }} />
                      </div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500 }}>No messages yet</p>
                      <p style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="msg-in" style={{ display: 'flex', justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '75%', 
                          padding: '0.5rem 0.7rem', 
                          borderRadius: msg.sender_id === user.id ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: msg.sender_id === user.id ? accent : (darkMode ? 'rgba(26,26,46,0.8)' : '#e8e8e8'),
                          color: msg.sender_id === user.id ? '#0a0a14' : textColor,
                          fontSize: '0.78rem', 
                          lineHeight: 1.45, 
                          wordBreak: 'break-word',
                          opacity: msg.temp ? 0.7 : 1,
                        }}>
                          <p style={{ margin: 0 }}>{msg.content}</p>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.15rem', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {msg.sender_id === user.id && !msg.temp && (
                              <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>{msg.is_read ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} style={{ 
                  padding: '0.6rem 0.8rem', 
                  borderTop: `1px solid ${borderColor}`, 
                  display: 'flex', 
                  gap: '0.5rem', 
                  alignItems: 'center', 
                  background: sidebarBg 
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ 
                      flex: 1, 
                      padding: '0.6rem 1rem', 
                      borderRadius: 20, 
                      border: `1px solid ${borderColor}`, 
                      background: cardBg, 
                      color: textColor, 
                      fontSize: '0.8rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = accent}
                    onBlur={e => e.currentTarget.style.borderColor = borderColor}
                  />
                  <button type="submit" disabled={!newMessage.trim()}
                    style={{ 
                      width: 38, 
                      height: 38, 
                      borderRadius: '50%', 
                      border: 'none', 
                      background: newMessage.trim() ? accent : 'rgba(255,255,255,0.05)', 
                      color: newMessage.trim() ? '#0a0a14' : textMuted, 
                      cursor: newMessage.trim() ? 'pointer' : 'default', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'all 0.2s', 
                      flexShrink: 0 
                    }}>
                    <FiSend size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: textMuted, padding: '1.5rem' }}>
                <div>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: abg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                    <FiMessageSquare size={28} style={{ opacity: 0.4, color: accent }} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: textColor, marginBottom: '0.3rem' }}>Your Messages</h3>
                  <p style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>Select a conversation from the sidebar<br />or contact a seller from a product page</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chats;