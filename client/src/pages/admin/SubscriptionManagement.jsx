import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

const CheckIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>);
const XIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const CrownIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#eab308" stroke="#1a1a2e" strokeWidth="1"><path d="M2 6l4 8h12l4-8-4.5 4.5L12 4 6.5 10.5 2 6zM4 19h16v2H4z"/></svg>);
const PackageIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>);
const EditIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);

function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditPlan, setShowEditPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price_rwf: 0, max_products: 0, badge_verified_seller: false, badge_verified_product: false, badge_verified_shop: false, badge_vip: false, is_active: true });
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [planFormError, setPlanFormError] = useState('');
  const [planFormSuccess, setPlanFormSuccess] = useState('');
  const [message, setMessage] = useState('');

  const features = [
    { key: 'badge_verified_seller', label: 'Verified Seller Badge' },
    { key: 'badge_verified_product', label: 'Verified Product Badge' },
    { key: 'badge_verified_shop', label: 'Verified Shop Badge' },
    { key: 'badge_vip', label: 'VIP Badge' },
  ];

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data.plans || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleEditPlan = (plan) => {
    setPlanForm({
      name: plan.name,
      price_rwf: plan.price_rwf,
      max_products: plan.max_products,
      badge_verified_seller: plan.badge_verified_seller,
      badge_verified_product: plan.badge_verified_product,
      badge_verified_shop: plan.badge_verified_shop,
      badge_vip: plan.badge_vip,
      is_active: plan.is_active,
    });
    setShowEditPlan(plan);
    setPlanFormError('');
    setPlanFormSuccess('');
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    setPlanFormLoading(true);
    setPlanFormError('');
    try {
      await api.put(`/subscriptions/admin/plans/${showEditPlan.id}`, planForm);
      setPlanFormSuccess('Plan updated!');
      setTimeout(() => {
        setShowEditPlan(null);
        setPlanFormSuccess('');
        fetchPlans();
      }, 1500);
    } catch (err) {
      setPlanFormError(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setPlanFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#00E309', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .plan-card{transition:all 0.3s ease}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,0.4)!important}
        .plan-card.vip:hover{border-color:#eab308!important;box-shadow:0 16px 40px rgba(234,179,8,0.15)!important}
        .toggle-track{transition:all 0.2s ease}
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Subscription Plans</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Manage plans - click Edit to change any plan details</p>
      </div>

      {message && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: 'rgba(0,227,9,0.15)', backdropFilter: 'blur(16px)', borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(0,227,9,0.3)', color: '#00E309', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <CheckIcon /> {message}
        </div>
      )}

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
        {plans.map((plan) => (
          <div key={plan.id}
            className={`plan-card ${plan.badge_vip ? 'vip' : ''}`}
            style={{
              background: plan.badge_vip ? 'rgba(234,179,8,0.06)' : 'rgba(26,26,46,0.5)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              padding: '1.6rem',
              textAlign: 'center',
              border: plan.badge_vip ? '2px solid rgba(234,179,8,0.3)' : '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              cursor: 'default'
            }}>
            
            {plan.badge_vip && (
              <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}>
                <CrownIcon />
              </div>
            )}

            <h3 style={{
              fontSize: '1.1rem', fontWeight: 700,
              color: plan.badge_vip ? '#eab308' : 'white',
              margin: `${plan.badge_vip ? '1.5rem 0 0.5rem' : '0 0 0.5rem'}`
            }}>
              {plan.name}
            </h3>

            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00E309', marginBottom: '0.1rem' }}>
              {Number(plan.price_rwf).toLocaleString()} RWF
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.2rem' }}>/month</div>

            <div style={{
              padding: '0.6rem', borderRadius: 12,
              background: 'rgba(0,227,9,0.06)',
              marginBottom: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
            }}>
              <PackageIcon />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00E309' }}>
                {plan.max_products === -1 ? 'Unlimited' : plan.max_products} Products
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.2rem', textAlign: 'left', padding: '0 0.3rem' }}>
              {features.map(feature => (
                <div key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                  {plan[feature.key] ? (
                    <span style={{ color: '#00E309', display: 'flex', alignItems: 'center' }}><CheckIcon /></span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}><XIcon /></span>
                  )}
                  <span style={{
                    color: plan[feature.key] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                    fontWeight: plan[feature.key] ? 400 : 300
                  }}>
                    {feature.label}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.is_active ? '#00E309' : '#ef4444', margin: '0 2px' }} />
                <span style={{ color: plan.is_active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <button onClick={() => handleEditPlan(plan)}
              style={{
                width: '100%', padding: '0.55rem', borderRadius: 25,
                border: '1px solid rgba(0,227,9,0.2)',
                background: 'rgba(0,227,9,0.06)',
                color: '#00E309', fontSize: '0.72rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,227,9,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,227,9,0.06)'; }}>
              <EditIcon /> Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {showEditPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{
            background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(24px)',
            borderRadius: 24, padding: '2rem', maxWidth: 480, width: '90%',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <EditIcon /> Edit {showEditPlan.name} Plan
              </h2>
              <button onClick={() => { setShowEditPlan(null); setPlanFormError(''); }}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XIcon />
              </button>
            </div>

            {planFormError && <div style={{ marginBottom: '1rem', padding: '0.7rem 1rem', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 12, color: '#ff4444', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><XIcon /> {planFormError}</div>}
            {planFormSuccess && <div style={{ marginBottom: '1rem', padding: '0.7rem 1rem', background: 'rgba(0,227,9,0.06)', border: '1px solid rgba(0,227,9,0.2)', borderRadius: 12, color: '#00E309', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckIcon /> {planFormSuccess}</div>}

            <form onSubmit={handleUpdatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.3rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Plan Name</label>
                <input type="text" value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter plan name"
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem', color: 'white', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.3rem', color: 'white', textTransform: 'uppercase' }}>Price (RWF)</label>
                  <input type="number" value={planForm.price_rwf} onChange={e => setPlanForm(p => ({ ...p, price_rwf: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem', color: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.3rem', color: 'white', textTransform: 'uppercase' }}>Product Limit</label>
                  <input type="number" value={planForm.max_products} onChange={e => setPlanForm(p => ({ ...p, max_products: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem', color: 'white', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Feature Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Features</label>
                {features.map(item => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 1rem', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setPlanForm(p => ({ ...p, [item.key]: !p[item.key] }))}
                      className="toggle-track"
                      style={{
                        width: 44, height: 24, borderRadius: 20,
                        background: planForm[item.key] ? '#00E309' : 'rgba(255,255,255,0.15)',
                        border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                        transition: 'all 0.2s ease'
                      }}>
                      <div style={{
                        position: 'absolute', top: 2,
                        left: planForm[item.key] ? 22 : 2,
                        width: 20, height: 20, borderRadius: '50%',
                        background: planForm[item.key] ? '#000' : 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                ))}
                {/* Active Toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 1rem', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>Active Plan</span>
                  <button
                    type="button"
                    onClick={() => setPlanForm(p => ({ ...p, is_active: !p.is_active }))}
                    className="toggle-track"
                    style={{
                      width: 44, height: 24, borderRadius: 20,
                      background: planForm.is_active ? '#00E309' : 'rgba(255,255,255,0.15)',
                      border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                      transition: 'all 0.2s ease'
                    }}>
                    <div style={{
                      position: 'absolute', top: 2,
                      left: planForm.is_active ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: planForm.is_active ? '#000' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.7rem', paddingTop: '0.5rem' }}>
                <button type="submit" disabled={planFormLoading}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 14, border: 'none', background: planFormLoading ? 'rgba(0,227,9,0.4)' : '#00E309', color: '#000', fontWeight: 700, fontSize: '0.85rem', cursor: planFormLoading ? 'not-allowed' : 'pointer' }}>
                  {planFormLoading ? 'Saving...' : 'Update Plan'}
                </button>
                <button type="button" onClick={() => { setShowEditPlan(null); setPlanFormError(''); }}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagement;