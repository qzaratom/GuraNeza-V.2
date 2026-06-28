import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiUsers, FiCreditCard, 
  FiFileText, FiFlag, FiArrowLeft, FiShoppingBag, 
  FiChevronLeft, FiChevronRight, FiX, FiMenu
} from 'react-icons/fi';
import logo from '../../assets/logo.png';

function AdminSidebar({ user }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  // Update main content margin
  useEffect(() => {
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent && !isMobile) {
      mainContent.style.marginLeft = collapsed ? '68px' : '250px';
    }
  }, [collapsed, isMobile]);

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Products' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/shops', icon: FiShoppingBag, label: 'Shops' },
    { path: '/admin/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
    { path: '/admin/requests', icon: FiFileText, label: 'Requests' },
    { path: '/admin/reports', icon: FiFlag, label: 'Reports' },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sidebarWidth = collapsed && !isMobile ? 68 : 250;

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: 10, left: 10, zIndex: 200,
            width: 38, height: 38, borderRadius: 10,
            background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}
        >
          <FiMenu size={18} />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? (mobileOpen ? 250 : 0) : sidebarWidth,
        height: '100vh',
        background: '#0d0d1a',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'fixed', top: 0, left: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: isMobile && mobileOpen ? '4px 0 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        
        {/* Brand Header */}
        <div style={{
          padding: collapsed && !isMobile ? '1.2rem 0.5rem' : '1.3rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: 60, transition: 'all 0.3s ease'
        }}>
          <Link to="/home" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', overflow: 'hidden'
          }}>
            <img src={logo} alt="GuraNeza" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
            {(collapsed && !isMobile) ? null : (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.2 }}>
                  <span style={{ color: '#00E309' }}>GuraNeza</span>
                </h2>
                <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Panel</p>
              </div>
            )}
          </Link>
          
          {/* Desktop collapse button */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#00E309'; e.currentTarget.style.borderColor = 'rgba(0,227,9,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {collapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: collapsed && !isMobile ? '0.5rem 0.3rem' : '0.5rem 0.5rem',
          transition: 'all 0.3s ease'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {menuItems.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (isMobile) setMobileOpen(false);
                    }}
                    title={(collapsed && !isMobile) ? item.label : ''}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: collapsed && !isMobile ? '0' : '0.55rem',
                      padding: collapsed && !isMobile ? '0.55rem 0' : '0.55rem 0.7rem',
                      borderRadius: 8,
                      background: active ? 'rgba(0,227,9,0.1)' : 'transparent',
                      color: active ? '#00E309' : 'rgba(255,255,255,0.6)',
                      textDecoration: 'none', fontSize: '0.75rem', fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    <item.icon size={16} style={{ flexShrink: 0 }} />
                    {(collapsed && !isMobile) ? null : <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed && !isMobile ? '0.5rem' : '0.7rem',
          transition: 'all 0.3s ease'
        }}>
          {/* User Info */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed && !isMobile ? '0' : '0.5rem',
              padding: collapsed && !isMobile ? '0.4rem 0' : '0.45rem 0.6rem',
              marginBottom: '0.5rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#00E309', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontWeight: 700, fontSize: '0.6rem', flexShrink: 0
              }}>
                {user.display_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              {(collapsed && !isMobile) ? null : (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.display_name || 'Admin'}
                  </p>
                  <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email || ''}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Back to site */}
          <Link
            to="/home"
            title={(collapsed && !isMobile) ? 'Back to GuraNeza' : ''}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              gap: collapsed && !isMobile ? '0' : '0.45rem',
              padding: collapsed && !isMobile ? '0.4rem 0' : '0.45rem 0.6rem',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
              fontSize: '0.68rem', fontWeight: 500,
              transition: 'all 0.15s', whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00E309'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <FiArrowLeft size={13} style={{ flexShrink: 0 }} />
            {(collapsed && !isMobile) ? null : <span>Back to GuraNeza</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;