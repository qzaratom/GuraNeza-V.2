import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FiSearch, FiDownload, FiTrash2, FiEdit2, FiUser, FiShield, FiAlertCircle, FiX } from 'react-icons/fi';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [plans, setPlans] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ display_name: '', email: '', role: 'user', subscription_plan_id: '', subscription_status: 'free', is_blocked: false });
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); fetchPlans(); }, []);
  useEffect(() => { filterUsers(); }, [users, search, roleFilter, statusFilter]);

  const fetchPlans = async () => { try { const r = await api.get('/subscriptions/plans'); setPlans(r.data.plans || []); } catch {} };
  const fetchUsers = async () => { try { const r = await api.get('/users'); setUsers(r.data.users || []); } catch {} finally { setLoading(false); } };

  const filterUsers = () => {
    let f = [...users];
    if (search.trim()) { const t = search.toLowerCase(); f = f.filter(u => (u.display_name || '').toLowerCase().includes(t) || (u.email || '').toLowerCase().includes(t)); }
    if (roleFilter !== 'all') f = f.filter(u => u.role === roleFilter);
    if (statusFilter === 'blocked') f = f.filter(u => u.is_blocked);
    else if (statusFilter !== 'all') f = f.filter(u => u.subscription_status === statusFilter && !u.is_blocked);
    setFilteredUsers(f);
  };

  const showMsg = (msg, type = 'success') => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(''), 4000); };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ display_name: user.display_name || '', email: user.email || '', role: user.role || 'user', subscription_plan_id: user.subscription_plan_id || '', subscription_status: user.subscription_status || 'free', is_blocked: user.is_blocked || false });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      if (editForm.role !== editingUser.role) await api.put(`/users/${editingUser.id}/role`, { role: editForm.role });
      await api.put('/users/profile', { user_id: editingUser.id, display_name: editForm.display_name, email: editForm.email, subscription_plan_id: editForm.subscription_plan_id || null, subscription_status: editForm.subscription_status, is_blocked: editForm.is_blocked });
      showMsg('User updated successfully'); setShowEditModal(false); fetchUsers();
    } catch (err) { showMsg(err.response?.data?.message || 'Error updating user', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try { await api.delete(`/users/${deleteConfirm.id}`); showMsg(`User "${deleteConfirm.name}" deleted`); setDeleteConfirm(null); fetchUsers(); }
    catch { showMsg('Error deleting user', 'error'); }
    finally { setDeleting(false); }
  };

  const exportCSV = () => {
    const rows = filteredUsers.map(u => [u.display_name || '', u.email || '', u.role, u.subscription_plan?.name || 'Free', u.is_blocked ? 'Blocked' : u.subscription_status, u.products_count || 0, new Date(u.created_at).toLocaleDateString()]);
    let csv = 'Name,Email,Role,Plan,Status,Products,Joined\n'; rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `guraneza_users_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    showMsg('Users exported');
  };

  const accent = '#00E309';
  const borderColor = 'rgba(255,255,255,0.06)';
  const cardBg = 'rgba(26,26,46,0.5)';

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:'3rem' }}><div style={{ width:28,height:28,border:`2px solid ${borderColor}`,borderTopColor:accent,borderRadius:'50%',animation:'spin 0.7s linear infinite' }} /></div>;

  const getStatus = (user) => {
    if (user.is_blocked) return { bg:'rgba(239,68,68,0.12)', color:'#f87171', label:'Blocked' };
    const s = { free:{ bg:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', label:'Free' }, active:{ bg:'rgba(34,197,94,0.12)', color:'#4ade80', label:'Active' }, pending:{ bg:'rgba(234,179,8,0.12)', color:'#facc15', label:'Pending' }, expired:{ bg:'rgba(239,68,68,0.12)', color:'#f87171', label:'Expired' } };
    return s[user.subscription_status] || s.free;
  };

  return (
    <div style={{ color:'white' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='white' strokeWidth='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:26px!important}
        select option{background:#1a1a2e;color:white}
        .table-wrap{overflow-x:auto;border-radius:14px;border:1px solid ${borderColor}}
        .table-wrap::-webkit-scrollbar{height:5px}.table-wrap::-webkit-scrollbar-track{background:rgba(0,0,0,0.1)}.table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        tr:hover td{background:rgba(255,255,255,0.012)}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem',fontWeight:800,margin:0 }}>User Management</h1>
          <p style={{ color:'rgba(255,255,255,0.4)',fontSize:'0.72rem',margin:'0.1rem 0 0' }}>{filteredUsers.length} users</p>
        </div>
        <button onClick={exportCSV} style={{ padding:'0.4rem 0.85rem',borderRadius:8,border:'1px solid rgba(34,197,94,0.25)',background:'rgba(34,197,94,0.06)',color:'#4ade80',cursor:'pointer',fontSize:'0.7rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.35rem',whiteSpace:'nowrap' }}>
          <FiDownload size={13} /> Export CSV
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ padding:'0.45rem 0.9rem',borderRadius:8,marginBottom:'0.7rem',fontSize:'0.7rem',animation:'fadeIn 0.2s ease',
          background:messageType==='success'?'rgba(0,227,9,0.06)':'rgba(239,68,68,0.06)',
          border:`1px solid ${messageType==='success'?'rgba(0,227,9,0.12)':'rgba(239,68,68,0.12)'}`,
          color:messageType==='success'?accent:'#f87171' }}>{message}</div>
      )}

      {/* Filters */}
      <div style={{ display:'flex',alignItems:'center',gap:'0.35rem',marginBottom:'0.8rem',flexWrap:'wrap',background:cardBg,padding:'0.45rem 0.7rem',borderRadius:10,border:`1px solid ${borderColor}` }}>
        <div style={{ position:'relative',flex:'1 1 160px',maxWidth:240 }}>
          <FiSearch style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)',fontSize:'0.75rem' }} />
          <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%',padding:'0.4rem 0.5rem 0.4rem 1.7rem',borderRadius:6,border:`1px solid ${borderColor}`,background:'rgba(255,255,255,0.02)',color:'white',fontSize:'0.7rem',outline:'none',boxSizing:'border-box' }} />
        </div>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ padding:'0.4rem 0.6rem',borderRadius:6,border:`1px solid ${borderColor}`,background:'rgba(255,255,255,0.02)',color:'white',fontSize:'0.7rem',outline:'none',cursor:'pointer',minWidth:100 }}>
          <option value="all">All Roles</option><option value="user">User</option><option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'0.4rem 0.6rem',borderRadius:6,border:`1px solid ${borderColor}`,background:'rgba(255,255,255,0.02)',color:'white',fontSize:'0.7rem',outline:'none',cursor:'pointer',minWidth:110 }}>
          <option value="all">All Status</option><option value="free">Free</option><option value="active">Active</option><option value="pending">Pending</option><option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ background:cardBg,backdropFilter:'blur(16px)' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',minWidth:880,fontSize:'0.75rem' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${borderColor}`,background:'rgba(0,0,0,0.2)' }}>
              <th style={thStyle}>User</th>
              <th style={{...thStyle,width:80}}>Role</th>
              <th style={{...thStyle,width:90}}>Plan</th>
              <th style={{...thStyle,width:90}}>Status</th>
              <th style={{...thStyle,width:70,textAlign:'center'}}>Products</th>
              <th style={{...thStyle,width:90}}>Joined</th>
              <th style={{...thStyle,width:80,textAlign:'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const st = getStatus(user);
              return (
                <tr key={user.id} style={{ borderBottom:`1px solid ${borderColor}` }}>
                  {/* User cell */}
                  <td style={tdStyle}>
                    <div style={{ display:'flex',alignItems:'center',gap:'0.4rem' }}>
                      <div style={{ width:30,height:30,borderRadius:'50%',background:user.role==='admin'?'rgba(168,85,247,0.18)':'rgba(0,227,9,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:user.role==='admin'?'#c084fc':accent,fontWeight:700,fontSize:'0.65rem',flexShrink:0 }}>
                        {(user.display_name||'?')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600,fontSize:'0.72rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{user.display_name||'Unknown'}</div>
                        <div style={{ color:'rgba(255,255,255,0.3)',fontSize:'0.6rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td style={tdStyle}>
                    <span style={{ padding:'0.15rem 0.5rem',borderRadius:14,fontSize:'0.6rem',fontWeight:600,whiteSpace:'nowrap',
                      background:user.role==='admin'?'rgba(168,85,247,0.12)':'rgba(255,255,255,0.03)',
                      color:user.role==='admin'?'#c084fc':'rgba(255,255,255,0.55)' }}>
                      {user.role}
                    </span>
                  </td>
                  {/* Plan */}
                  <td style={{...tdStyle,fontWeight:500,fontSize:'0.68rem'}}>{user.subscription_plan?.name||'Free'}</td>
                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={{ padding:'0.15rem 0.5rem',borderRadius:14,fontSize:'0.6rem',fontWeight:600,whiteSpace:'nowrap',background:st.bg,color:st.color }}>{st.label}</span>
                  </td>
                  {/* Products */}
                  <td style={{...tdStyle,textAlign:'center',fontWeight:600,color:accent,fontSize:'0.7rem'}}>{user.products_count||0}</td>
                  {/* Joined */}
                  <td style={{...tdStyle,color:'rgba(255,255,255,0.35)',fontSize:'0.65rem'}}>
                    {new Date(user.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </td>
                  {/* Actions */}
                  <td style={{...tdStyle,textAlign:'center'}}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'0.25rem' }}>
                      <button onClick={()=>openEdit(user)} style={actBtn('#3b82f6')} title="Edit"><FiEdit2 size={12} /></button>
                      <button onClick={()=>setDeleteConfirm({id:user.id,name:user.display_name||user.email})} style={actBtn('#ef4444')} title="Delete"><FiTrash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length===0 && (
              <tr><td colSpan={7} style={{ textAlign:'center',padding:'2.5rem',color:'rgba(255,255,255,0.2)',fontSize:'0.78rem' }}>
                <FiUser size={22} style={{marginBottom:'0.4rem',opacity:0.25}} /><div>No users found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{ background:'#15152a',borderRadius:16,padding:'1.3rem',maxWidth:420,width:'90%',border:'1px solid rgba(255,255,255,0.06)',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',maxHeight:'85vh',overflowY:'auto',animation:'modalIn 0.2s ease' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.8rem' }}>
              <div><h2 style={{ fontSize:'1rem',fontWeight:700,margin:0 }}>Edit User</h2><p style={{ color:'rgba(255,255,255,0.35)',fontSize:'0.6rem',margin:'0.05rem 0 0' }}>{editingUser?.display_name}</p></div>
              <button onClick={()=>setShowEditModal(false)} style={{ width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'rgba(255,255,255,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><FiX size={13} /></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'0.65rem' }}>
              <div><label style={lbl}>Display Name</label><input type="text" value={editForm.display_name} onChange={e=>setEditForm(p=>({...p,display_name:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={editForm.email} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} style={inp} /></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem' }}>
                <div><label style={lbl}>Role</label><select value={editForm.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))} style={sel}><option value="user">User</option><option value="admin">Admin</option></select></div>
                <div><label style={lbl}>Plan</label><select value={editForm.subscription_plan_id} onChange={e=>setEditForm(p=>({...p,subscription_plan_id:e.target.value}))} style={sel}><option value="">None (Free)</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem' }}>
                <div><label style={lbl}>Status</label><select value={editForm.subscription_status} onChange={e=>setEditForm(p=>({...p,subscription_status:e.target.value}))} style={sel}><option value="free">Free</option><option value="active">Active</option><option value="pending">Pending</option><option value="expired">Expired</option></select></div>
                <div style={{ display:'flex',alignItems:'flex-end',paddingBottom:'0.15rem' }}>
                  <label style={{ display:'flex',alignItems:'center',gap:'0.35rem',cursor:'pointer',color:'white',fontSize:'0.7rem',userSelect:'none' }}>
                    <input type="checkbox" checked={editForm.is_blocked} onChange={e=>setEditForm(p=>({...p,is_blocked:e.target.checked}))} style={{ width:15,height:15,accentColor:accent,cursor:'pointer' }} />
                    <FiAlertCircle size={12} style={{color:'#f87171'}} /> Block
                  </label>
                </div>
              </div>
              <div style={{ display:'flex',gap:'0.4rem',paddingTop:'0.35rem',borderTop:`1px solid ${borderColor}` }}>
                <button onClick={saveEdit} disabled={saving} style={{ flex:1,padding:'0.5rem',borderRadius:8,border:'none',background:saving?'rgba(0,227,9,0.4)':accent,color:'#000',fontWeight:700,fontSize:'0.7rem',cursor:saving?'not-allowed':'pointer' }}>{saving?'Saving...':'Save'}</button>
                <button onClick={()=>setShowEditModal(false)} style={{ padding:'0.5rem 1rem',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'white',fontWeight:500,fontSize:'0.7rem',cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{ background:'#15152a',borderRadius:16,padding:'1.4rem',maxWidth:380,width:'90%',border:'1px solid rgba(255,255,255,0.06)',boxShadow:'0 24px 64px rgba(0,0,0,0.6)',animation:'modalIn 0.2s ease',textAlign:'center' }}>
            <div style={{ width:44,height:44,borderRadius:'50%',background:'rgba(239,68,68,0.08)',border:'2px solid rgba(239,68,68,0.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 0.7rem' }}>
              <FiTrash2 size={20} style={{color:'#ef4444'}} />
            </div>
            <h3 style={{ fontSize:'0.95rem',fontWeight:700,color:'white',margin:'0 0 0.3rem' }}>Delete User?</h3>
            <p style={{ color:'rgba(255,255,255,0.5)',fontSize:'0.7rem',margin:'0 0 0.15rem',lineHeight:1.4 }}>
              Are you sure you want to delete <strong style={{color:'white'}}>"{deleteConfirm.name}"</strong>?
            </p>
            <p style={{ color:'rgba(239,68,68,0.6)',fontSize:'0.6rem',margin:'0 0 1rem' }}>This action cannot be undone. All user data will be permanently removed.</p>
            <div style={{ display:'flex',gap:'0.4rem' }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ flex:1,padding:'0.5rem',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'rgba(255,255,255,0.5)',fontWeight:500,fontSize:'0.7rem',cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1.5,padding:'0.5rem',borderRadius:8,border:'none',background:'#ef4444',color:'white',fontWeight:600,fontSize:'0.7rem',cursor:deleting?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.25rem',opacity:deleting?0.6:1 }}>
                <FiTrash2 size={12} />{deleting?'Deleting...':'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign:'left',padding:'0.5rem 0.6rem',color:'rgba(255,255,255,0.3)',fontSize:'0.55rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap' };
const tdStyle = { padding:'0.45rem 0.6rem',verticalAlign:'middle' };
const actBtn = (color) => ({ width:28,height:28,borderRadius:6,border:'none',background:`${color}15`,color,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' });
const lbl = { display:'block',fontSize:'0.6rem',fontWeight:600,marginBottom:'0.2rem',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.03em' };
const inp = { width:'100%',padding:'0.45rem 0.6rem',borderRadius:7,border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)',color:'white',fontSize:'0.7rem',outline:'none',boxSizing:'border-box' };
const sel = { ...inp, cursor:'pointer' };

export default UserManagement;