import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FiPackage, FiUsers, FiFileText, FiTrendingUp, FiActivity } from 'react-icons/fi';

function AdminDashboard() {
  const [stats, setStats] = useState({ totalProducts: 0, totalUsers: 0, pendingRequests: 0, openTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, usersRes, requestsRes, ticketsRes] = await Promise.all([
        api.get('/products?limit=1'),
        api.get('/users'),
        api.get('/subscriptions/admin/requests?status=pending'),
        api.get('/tickets/admin/all?status=open')
      ]);
      setStats({
        totalProducts: productsRes.data.total || 0,
        totalUsers: usersRes.data.users?.length || 0,
        pendingRequests: requestsRes.data.requests?.length || 0,
        openTickets: ticketsRes.data.tickets?.length || 0
      });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#00E309', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: FiFileText, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
    { label: 'Open Tickets', value: stats.openTickets, icon: FiTrendingUp, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,227,9,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiActivity size={18} style={{ color: '#00E309' }} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 2vw, 1.6rem)', fontWeight: 700, color: 'white', margin: 0 }}>Admin Dashboard</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', margin: 0 }}>Welcome to the GuraNeza admin panel. Monitor and manage your marketplace.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '0.9rem', 
        marginBottom: '1.5rem' 
      }}>
        {statCards.map((stat, index) => (
          <div key={index} style={{ 
            background: 'rgba(26,26,46,0.5)', 
            backdropFilter: 'blur(16px)', 
            borderRadius: 16, 
            border: '1px solid rgba(255,255,255,0.06)', 
            padding: '1.2rem 1.3rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', fontWeight: 500, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: '0.4rem 0 0', lineHeight: 1 }}>{stat.value.toLocaleString()}</p>
              </div>
              <div style={{ 
                width: 44, height: 44, borderRadius: 12, 
                background: stat.bg, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Overview Card */}
      <div style={{ 
        background: 'rgba(26,26,46,0.5)', 
        backdropFilter: 'blur(16px)', 
        borderRadius: 16, 
        border: '1px solid rgba(255,255,255,0.06)', 
        padding: '1.3rem 1.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem' }}>Quick Overview</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
          Use the sidebar to navigate and manage different sections of the platform. 
          Monitor products, users, subscription requests, and support tickets all from one place.
        </p>
        <div style={{ 
          display: 'flex', gap: '0.6rem', marginTop: '1rem', 
          flexWrap: 'wrap' 
        }}>
          {['Products', 'Users', 'Subscriptions', 'Requests', 'Reports'].map(item => (
            <span key={item} style={{
              padding: '0.3rem 0.8rem', borderRadius: 20,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 500
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stat-value { font-size: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;