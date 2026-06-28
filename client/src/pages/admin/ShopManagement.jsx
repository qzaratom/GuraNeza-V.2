import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FiSearch, FiTrash2, FiEye, FiDownload, FiShield } from 'react-icons/fi';

function ShopManagement() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops?limit=200');
      setShops(res.data.shops || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type = 'success') => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(''), 4000); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/shops/${deleteConfirm.id}`);
      showMsg(`Shop "${deleteConfirm.name}" deleted successfully`, 'success');
      setDeleteConfirm(null);
      fetchShops();
    } catch (err) { showMsg('Error deleting shop', 'error'); }
  };

  const getVerificationStatus = (shop) => {
    const plan = shop.owner?.subscription_plan;
    if (plan?.badge_verified_shop) {
      return { label: 'Verified Shop', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa' };
    }
    return { label: 'Unverified', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' };
  };

  const exportCSV = () => {
    const rows = filteredShops.map(s => [
      s.shop_name || '', s.owner?.display_name || '', s.owner?.email || '',
      s.category || '', s.location || '', s.phone_numbers?.[0] || '',
      s.email || '', getVerificationStatus(s).label,
      new Date(s.created_at).toLocaleDateString()
    ]);
    let csv = 'Shop Name,Owner,Owner Email,Category,Location,Phone,Email,Status,Created\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `guraneza_shops_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    showMsg('Shops exported successfully');
  };

  const filteredShops = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase())
  );

  const accent = '#00E309';
  const borderColor = 'rgba(255,255,255,0.06)';
  const cardBg = 'rgba(26,26,46,0.5)';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Shop Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{filteredShops.length} shops found</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input type="text" placeholder="Search shops..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.8rem 0.5rem 2rem', borderRadius: 10, border: `1px solid ${borderColor}`, background: cardBg, color: 'white', fontSize: '0.75rem', outline: 'none', width: 220 }} />
          </div>
          <button onClick={exportCSV}
            style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#4ade80', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}>
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: '0.6rem 1rem', borderRadius: 12, marginBottom: '1rem', 
          background: messageType === 'success' ? 'rgba(0,227,9,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${messageType === 'success' ? 'rgba(0,227,9,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: messageType === 'success' ? accent : '#ef4444',
          fontSize: '0.8rem', animation: 'fadeIn 0.2s ease'
        }}>
          {message}
        </div>
      )}

      <div style={{ background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 16, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
                <th style={thStyle}>Shop</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map(shop => {
                const vStatus = getVerificationStatus(shop);
                return (
                  <tr key={shop.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,227,9,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {shop.poster_url ? <img src={shop.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem' }}>🏪</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.shop_name}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', margin: 0 }}>{shop.description?.substring(0, 45) || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,227,9,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '0.5rem', fontWeight: 700 }}>
                          {(shop.owner?.display_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>{shop.owner?.display_name || 'Unknown'}</span>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', margin: 0 }}>{shop.owner?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.6rem', background: 'rgba(0,227,9,0.1)', color: accent, whiteSpace: 'nowrap' }}>{shop.category || 'N/A'}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>{shop.location || 'N/A'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                      {shop.phone_numbers?.[0] && <div style={{ marginBottom: '2px' }}>📞 {shop.phone_numbers[0]}</div>}
                      {shop.email && <div>✉ {shop.email}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600,
                        background: vStatus.bg, border: `1px solid ${vStatus.border}`,
                        color: vStatus.color, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                      }}>
                        <FiShield size={10} /> {vStatus.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
                      {new Date(shop.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <button onClick={() => window.open(`/shops/${shop.id}`, '_blank')} title="View Shop"
                          style={actionBtn('#60a5fa')}>
                          <FiEye size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: shop.id, name: shop.shop_name })} title="Delete Shop"
                          style={actionBtn('#ef4444')}>
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredShops.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No shops found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '1.8rem', maxWidth: 420, width: '90%', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'modalIn 0.2s ease', textAlign: 'center' }}>
            
            {/* Warning Icon */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <FiTrash2 size={24} style={{ color: '#ef4444' }} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem' }}>Delete Shop?</h3>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: '0 0 0.3rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'white' }}>"{deleteConfirm.name}"</strong>?
            </p>
            <p style={{ color: 'rgba(239,68,68,0.8)', fontSize: '0.7rem', margin: '0 0 1.5rem' }}>
              This action cannot be undone. All data associated with this shop will be permanently removed.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Cancel
              </button>
              <button onClick={handleDelete}
                style={{ flex: 1.5, padding: '0.65rem', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
                <FiTrash2 size={14} /> Delete Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '0.7rem 0.8rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.6rem 0.8rem', verticalAlign: 'middle' };
const actionBtn = (color) => ({ width: 30, height: 30, borderRadius: 7, border: 'none', background: `${color}18`, color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' });

export default ShopManagement;