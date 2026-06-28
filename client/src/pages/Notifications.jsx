import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiBell, FiCheck, FiTrash2, FiPackage, FiMessageSquare, FiUser,
  FiShoppingCart, FiCreditCard, FiFlag, FiHeart, FiEye, FiStar,
  FiClock, FiArrowRight, FiInbox, FiCheckCircle, FiX
} from 'react-icons/fi';

const notificationIcons = {
  welcome: FiStar, login: FiUser, profile_update: FiUser, role_update: FiUser,
  new_product: FiPackage, product_deleted: FiPackage, product_sold: FiPackage,
  new_chat: FiMessageSquare, new_message: FiMessageSquare, chat_deleted: FiMessageSquare,
  cart_added: FiShoppingCart, cart_removed: FiShoppingCart, cart_cleared: FiShoppingCart,
  subscription_request: FiCreditCard, subscription_update: FiCreditCard,
  subscription_approved: FiCreditCard, subscription_rejected: FiCreditCard,
  subscription_requested: FiCreditCard,
  new_ticket: FiFlag, ticket_status: FiFlag, ticket_reply: FiFlag, ticket_created: FiFlag,
  shop_created: FiPackage, shop_updated: FiPackage, shop_deleted: FiPackage, shop_verification: FiPackage,
  like: FiHeart, view: FiEye,
};

const notificationColors = {
  welcome: '#eab308', login: '#22c55e', profile_update: '#3b82f6', role_update: '#a855f7',
  new_product: '#00E309', product_deleted: '#ef4444', product_sold: '#f59e0b',
  new_chat: '#8b5cf6', new_message: '#8b5cf6', chat_deleted: '#ef4444',
  cart_added: '#f97316', cart_removed: '#ef4444', cart_cleared: '#ef4444',
  subscription_request: '#ec4899', subscription_update: '#ec4899',
  subscription_approved: '#22c55e', subscription_rejected: '#ef4444', subscription_requested: '#ec4899',
  new_ticket: '#f59e0b', ticket_status: '#3b82f6', ticket_reply: '#8b5cf6', ticket_created: '#f59e0b',
  shop_created: '#a855f7', shop_updated: '#3b82f6', shop_deleted: '#ef4444', shop_verification: '#22c55e',
  like: '#ef4444', view: '#3b82f6',
};

function Notifications({ user }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=100');
      setNotifications(res.data.notifications || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('All marked as read');
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted');
    } catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      showToast('All notifications cleared');
    } catch (e) { console.error(e); }
  };

  const handleClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id, { stopPropagation: () => {} });
    }
    
    const refId = notification.reference_id;
    const refType = notification.reference_type;
    const type = notification.type;
    
    if (refType === 'product' && refId) navigate(`/products/${refId}`);
    else if (refType === 'chat' && refId) navigate('/chats');
    else if (refType === 'subscription' || type.includes('subscription')) navigate('/subscriptions');
    else if (refType === 'ticket' || refType === 'help_ticket' || type.includes('ticket')) navigate('/tickets');
    else if (refType === 'shop' && refId) navigate(`/shops/${refId}`);
    else if (type.includes('cart')) navigate('/cart');
    else if (type.includes('message') || type.includes('chat')) navigate('/chats');
    else if (type.includes('profile')) navigate('/profile');
    else navigate('/home');
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const getTimeAgo = (d) => {
    if (!d) return '';
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    if (s < 604800) return `${Math.floor(s/86400)}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const bg = darkMode ? '#0a0a14' : '#f8fafc';
  const tc = darkMode ? 'white' : '#1a1a2e';
  const tm = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const bc = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cbg = darkMode ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.95)';
  const ac = '#00E309';
  const shadow = darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.05)';

  if (loading) {
    return (
      <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh',background:bg }}>
        <div style={{ width:44,height:44,border:`3px solid ${bc}`,borderTopColor:ac,borderRadius:'50%',animation:'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",color:tc,background:bg,padding:'1.5rem 1rem' }}>
      
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .notif-item{transition:all 0.2s;animation:slideIn 0.35s ease}
        .notif-item:hover{background:${darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'}!important}
        .btn-hover{transition:all 0.2s}
        .btn-hover:hover{opacity:0.8;transform:translateY(-1px)}
        .action-btn{transition:all 0.2s}
        .action-btn:hover{transform:scale(1.15)}
        @media(max-width:768px){
          .header-row{flex-direction:column!important;align-items:flex-start!important;gap:1rem!important}
          .notif-content{flex-direction:column!important}
          .notif-actions{flex-direction:row!important;gap:0.4rem!important}
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:999,background:cbg,backdropFilter:'blur(24px)',borderRadius:14,padding:'10px 22px',border:`1px solid ${bc}`,fontSize:'0.8rem',fontWeight:500,animation:'fadeInUp 0.3s ease',color:tc,whiteSpace:'nowrap',boxShadow:shadow }}>{toast}</div>
      )}

      <div style={{ maxWidth:820,margin:'0 auto' }}>
        
        {/* Header Section */}
        <div className="header-row" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem' }}>
          <div>
            <h1 style={{ fontSize:'1.6rem',fontWeight:800,display:'flex',alignItems:'center',gap:'0.5rem' }}>
              <div style={{ width:42,height:42,borderRadius:12,background:'rgba(0,227,9,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <FiBell size={20} style={{ color:ac }}/>
              </div>
              Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize:'0.65rem',fontWeight:700,background:ac,color:'#0a0a14',padding:'0.25rem 0.7rem',borderRadius:20,marginLeft:'0.4rem' }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ fontSize:'0.78rem',color:tm,marginTop:'0.3rem',marginLeft:'0.3rem' }}>Stay updated with all your activities across GuraNeza</p>
          </div>
          
          <div style={{ display:'flex',gap:'0.5rem' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-hover"
                style={{ padding:'0.5rem 1rem',borderRadius:10,border:`1px solid ${bc}`,background:cbg,backdropFilter:'blur(12px)',color:ac,fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem',whiteSpace:'nowrap',boxShadow:shadow }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ac}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=bc}}>
                <FiCheckCircle size={15}/>Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleDeleteAll} className="btn-hover"
                style={{ padding:'0.5rem 1rem',borderRadius:10,border:`1px solid ${bc}`,background:'transparent',color:'#ef4444',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem',whiteSpace:'nowrap' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.background='rgba(239,68,68,0.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=bc;e.currentTarget.style.background='transparent'}}>
                <FiTrash2 size={15}/>Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display:'flex',gap:'0',borderBottom:`1px solid ${bc}`,marginBottom:'1.8rem' }}>
          {[
            { key:'all',label:'All Notifications',count:notifications.length },
            { key:'unread',label:'Unread',count:unreadCount },
            { key:'read',label:'Read',count:notifications.length-unreadCount },
          ].map(tab=>(
            <button key={tab.key} onClick={()=>setFilter(tab.key)} className="btn-hover"
              style={{
                padding:'0.65rem 1.2rem',border:'none',background:'transparent',
                color:filter===tab.key?ac:tm,borderBottom:filter===tab.key?`2px solid ${ac}`:'2px solid transparent',
                fontSize:'0.78rem',fontWeight:filter===tab.key?600:400,cursor:'pointer',
                display:'flex',alignItems:'center',gap:'0.35rem',whiteSpace:'nowrap',transition:'all 0.2s'
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ fontSize:'0.55rem',fontWeight:700,background:filter===tab.key?'rgba(0,227,9,0.15)':'rgba(255,255,255,0.06)',padding:'0.1rem 0.45rem',borderRadius:10 }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign:'center',padding:'4rem 2rem',background:cbg,backdropFilter:'blur(16px)',borderRadius:20,border:`1px solid ${bc}`,boxShadow:shadow }}>
            <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(0,227,9,0.06)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.2rem' }}>
              {filter === 'unread' ? <FiCheckCircle size={32} style={{ color:ac }}/> : <FiInbox size={32} style={{ color:ac }}/>}
            </div>
            <h3 style={{ fontSize:'1.05rem',fontWeight:700,marginBottom:'0.4rem' }}>
              {filter === 'all' ? 'No Notifications Yet' : filter === 'unread' ? 'All Caught Up!' : 'No Read Notifications'}
            </h3>
            <p style={{ fontSize:'0.78rem',color:tm,maxWidth:350,margin:'0 auto',lineHeight:1.5 }}>
              {filter === 'all' ? 'Your notifications from across GuraNeza will appear here.' : filter === 'unread' ? 'You have no unread notifications.' : 'Notifications you mark as read will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:'0.5rem',paddingBottom:'2.5rem' }}>
            {filteredNotifications.map((notif,index) => {
              const Icon = notificationIcons[notif.type] || FiBell;
              const color = notificationColors[notif.type] || ac;
              const isUnread = !notif.is_read;
              
              return (
                <div key={notif.id} className="notif-item"
                  onClick={()=>handleClick(notif)}
                  style={{
                    background:isUnread?cbg:'transparent',backdropFilter:isUnread?'blur(16px)':'none',
                    borderRadius:16,border:`1px solid ${isUnread?bc:'transparent'}`,
                    padding:'1rem 1.2rem',cursor:'pointer',
                    display:'flex',alignItems:'flex-start',gap:'0.9rem',
                    boxShadow:isUnread?shadow:'none',position:'relative',
                    animationDelay:`${index*0.04}s`
                  }}>
                  
                  {/* Unread indicator line */}
                  {isUnread && (
                    <div style={{ position:'absolute',left:0,top:'20%',bottom:'20%',width:3,background:ac,borderRadius:'0 3px 3px 0' }}/>
                  )}

                  {/* Icon */}
                  <div style={{
                    width:44,height:44,borderRadius:13,background:`${color}12`,
                    border:`1px solid ${color}28`,display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0,marginTop:'0.1rem'
                  }}>
                    <Icon size={20} style={{ color }}/>
                  </div>

                  {/* Content */}
                  <div className="notif-content" style={{ flex:1,minWidth:0,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'0.8rem' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.2rem' }}>
                        <h4 style={{ fontSize:'0.82rem',fontWeight:isUnread?700:600,color:tc }}>
                          {notif.title}
                        </h4>
                        {isUnread && <div style={{ width:7,height:7,borderRadius:'50%',background:ac,flexShrink:0 }}/>}
                      </div>
                      {notif.message && (
                        <p style={{ fontSize:'0.72rem',color:tm,lineHeight:1.45 }}>
                          {notif.message}
                        </p>
                      )}
                      <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.4rem',flexWrap:'wrap' }}>
                        <span style={{ fontSize:'0.55rem',color:tm,background:'rgba(255,255,255,0.03)',padding:'0.12rem 0.45rem',borderRadius:6,textTransform:'capitalize',display:'flex',alignItems:'center',gap:'0.15rem' }}>
                          {notif.type?.replace(/_/g,' ')}
                        </span>
                        <span style={{ fontSize:'0.55rem',color:tm,display:'flex',alignItems:'center',gap:'0.15rem' }}>
                          <FiClock size={9}/>{getTimeAgo(notif.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="notif-actions" style={{ display:'flex',flexDirection:'column',gap:'0.35rem',flexShrink:0 }}>
                      {isUnread && (
                        <button onClick={(e)=>handleMarkRead(notif.id,e)} className="action-btn" title="Mark as read"
                          style={{ width:32,height:32,borderRadius:8,border:`1px solid ${bc}`,background:'transparent',color:ac,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:actionLoading===notif.id?0.5:1 }}
                          disabled={actionLoading===notif.id}
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,227,9,0.08)';e.currentTarget.style.borderColor=ac}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=bc}}>
                          <FiCheck size={14}/>
                        </button>
                      )}
                      <button onClick={(e)=>handleDelete(notif.id,e)} className="action-btn" title="Delete"
                        style={{ width:32,height:32,borderRadius:8,border:`1px solid ${bc}`,background:'transparent',color:tm,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                        onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.background='rgba(239,68,68,0.06)'}}
                        onMouseLeave={e=>{e.currentTarget.style.color=tm;e.currentTarget.style.borderColor=bc;e.currentTarget.style.background='transparent'}}>
                        <FiTrash2 size={13}/>
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();handleClick(notif)}} className="action-btn" title="Go to"
                        style={{ width:32,height:32,borderRadius:8,border:`1px solid ${bc}`,background:'transparent',color:ac,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,227,9,0.08)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                        <FiArrowRight size={13}/>
                      </button>
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

export default Notifications;