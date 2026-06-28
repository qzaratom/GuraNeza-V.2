import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './admin/AdminSidebar';
import AdminDashboard from './admin/AdminDashboard';
import ProductManagement from './admin/ProductManagement';
import UserManagement from './admin/UserManagement';
import ShopManagement from './admin/ShopManagement';
import SubscriptionManagement from './admin/SubscriptionManagement';
import RequestManagement from './admin/RequestManagement';
import ReportManagement from './admin/ReportManagement';

function Admin({ user }) {
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '60vh', padding: '1rem', textAlign: 'center',
        background: '#0a0a14'
      }}>
        <div>
          <div style={{ 
            width: 60, height: 60, borderRadius: '50%', 
            background: 'rgba(239,68,68,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1rem' 
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginBottom: '0.3rem' }}>Access Denied</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a14',
      display: 'flex'
    }}>
      
      {/* Sidebar */}
      <AdminSidebar user={user} />

      {/* Main Content */}
      <div 
        className="admin-main-content"
        style={{
          flex: 1,
          marginLeft: '250px',
          padding: '1.5rem',
          minHeight: '100vh',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%'
        }}
      >
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="shops" element={<ShopManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="requests" element={<RequestManagement />} />
          <Route path="reports" element={<ReportManagement />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-main-content {
            margin-left: 0 !important;
            padding: 1rem !important;
            padding-top: 3.5rem !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Admin;