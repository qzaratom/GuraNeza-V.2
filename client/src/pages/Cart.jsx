import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { 
  FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiPackage,
  FiMessageSquare, FiShoppingBag, FiChevronRight
} from 'react-icons/fi';

function Cart({ user }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCartItems(res.data.cart_items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    try {
      await api.put(`/cart/${itemId}`, { quantity: newQty });
      setCartItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQty } : item
      ));
    } catch (e) {
      showToast('Error updating quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId, productName) => {
    try {
      await api.delete(`/cart/${itemId}`);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      showToast(`Removed "${productName}" from cart`);
    } catch (e) {
      showToast('Error removing item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Remove all items from cart?')) return;
    try {
      await api.delete('/cart');
      setCartItems([]);
      showToast('Cart cleared');
    } catch (e) {
      showToast('Error clearing cart');
    }
  };

  const handleContactSeller = async (product) => {
    try {
      await api.post('/chats', {
        participant_id: product.seller_id,
        chat_type: 'user',
        initial_message: `Hi! I'm interested in your product: "${product.name}" - ${formatPrice(product.price)}`
      });
      navigate('/chats');
    } catch { navigate('/chats'); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const formatPrice = (p) => {
    try { return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(p); }
    catch { return Number(p).toLocaleString() + ' RWF'; }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    if (item.product?.status === 'active') {
      return sum + (item.product.price * item.quantity);
    }
    return sum;
  }, 0);
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeItems = cartItems.filter(item => item.product?.status === 'active');

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
        .cart-item{transition:all 0.25s;animation:slideIn 0.3s ease}
        .cart-item:hover{border-color:${ac}40!important}
        .btn-hover{transition:all 0.2s}
        .btn-hover:hover{opacity:0.85;transform:translateY(-1px)}
        .qty-btn{transition:all 0.15s}
        .qty-btn:hover{background:${darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)'}!important}
        @media(max-width:768px){
          .cart-layout{grid-template-columns:1fr!important}
          .cart-item-content{flex-direction:column!important;align-items:flex-start!important}
          .cart-item-image{width:100%!important;height:180px!important}
          .summary-card{position:static!important}
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:999,background:cbg,backdropFilter:'blur(24px)',borderRadius:14,padding:'10px 22px',border:`1px solid ${bc}`,fontSize:'0.8rem',fontWeight:500,animation:'fadeInUp 0.3s ease',color:tc,whiteSpace:'nowrap',boxShadow:shadow }}>{toast}</div>
      )}

      <div style={{ maxWidth:1000,margin:'0 auto' }}>
        
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem',flexWrap:'wrap',gap:'0.8rem' }}>
          <div>
            <h1 style={{ fontSize:'1.6rem',fontWeight:800,display:'flex',alignItems:'center',gap:'0.5rem' }}>
              <div style={{ width:42,height:42,borderRadius:12,background:'rgba(0,227,9,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <FiShoppingCart size={20} style={{ color:ac }}/>
              </div>
              Shopping Cart
              {totalItems > 0 && (
                <span style={{ fontSize:'0.65rem',fontWeight:700,background:ac,color:'#0a0a14',padding:'0.25rem 0.7rem',borderRadius:20,marginLeft:'0.4rem' }}>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
            <p style={{ fontSize:'0.78rem',color:tm,marginTop:'0.3rem',marginLeft:'0.3rem' }}>
              {activeItems.length > 0 ? 'Review your items before contacting sellers' : 'Your cart is empty'}
            </p>
          </div>
          
          <div style={{ display:'flex',gap:'0.5rem' }}>
            <Link to="/products" style={{ padding:'0.5rem 1rem',borderRadius:10,border:`1px solid ${bc}`,background:cbg,color:tc,textDecoration:'none',fontSize:'0.72rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.3rem',whiteSpace:'nowrap',transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=ac}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=bc}}>
              <FiArrowLeft size={14}/> Continue Shopping
            </Link>
            {cartItems.length > 0 && (
              <button onClick={handleClearCart} className="btn-hover"
                style={{ padding:'0.5rem 1rem',borderRadius:10,border:`1px solid ${bc}`,background:'transparent',color:'#ef4444',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem',whiteSpace:'nowrap' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.background='rgba(239,68,68,0.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=bc;e.currentTarget.style.background='transparent'}}>
                <FiTrash2 size={14}/> Clear Cart
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div style={{ textAlign:'center',padding:'5rem 2rem',background:cbg,backdropFilter:'blur(16px)',borderRadius:20,border:`1px solid ${bc}`,boxShadow:shadow }}>
            <div style={{ width:80,height:80,borderRadius:'50%',background:'rgba(0,227,9,0.06)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem' }}>
              <FiShoppingCart size={36} style={{ color:ac,opacity:0.7 }}/>
            </div>
            <h3 style={{ fontSize:'1.1rem',fontWeight:700,marginBottom:'0.5rem' }}>Your Cart is Empty</h3>
            <p style={{ fontSize:'0.8rem',color:tm,maxWidth:400,margin:'0 auto',lineHeight:1.5,marginBottom:'1.5rem' }}>
              Browse products and add items to your cart. When you're ready, contact sellers to make a purchase.
            </p>
            <Link to="/products" className="btn-hover"
              style={{ display:'inline-flex',alignItems:'center',gap:'0.4rem',padding:'0.65rem 1.8rem',borderRadius:14,border:'none',background:ac,color:'#0a0a14',textDecoration:'none',fontSize:'0.85rem',fontWeight:700 }}>
              <FiShoppingBag size={16}/> Browse Products
            </Link>
          </div>
        ) : (
          <div className="cart-layout" style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:'1.5rem',alignItems:'start' }}>
            
            {/* Cart Items List */}
            <div style={{ display:'flex',flexDirection:'column',gap:'0.6rem' }}>
              {cartItems.map((item, index) => {
                const product = item.product;
                const isActive = product?.status === 'active';
                
                return (
                  <div key={item.id} className="cart-item"
                    style={{
                      background:cbg,backdropFilter:'blur(16px)',borderRadius:16,
                      border:`1px solid ${bc}`,overflow:'hidden',
                      boxShadow:shadow,opacity:isActive?1:0.5,
                      animationDelay:`${index*0.06}s`
                    }}>
                    
                    {/* Item Content */}
                    <div className="cart-item-content" style={{ display:'flex',gap:'1rem',padding:'0.8rem' }}>
                      
                      {/* Product Image */}
                      <Link to={`/products/${product?.id}`} className="cart-item-image"
                        style={{ width:120,height:120,borderRadius:12,overflow:'hidden',background:darkMode?'#0d0d1a':'#f1f5f9',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${bc}` }}>
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'0.4rem' }} />
                        ) : (
                          <FiPackage size={32} style={{ color:tm,opacity:0.2 }}/>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
                        <div>
                          <Link to={`/products/${product?.id}`} style={{ textDecoration:'none',color:tc }}>
                            <h3 style={{ fontSize:'0.82rem',fontWeight:700,marginBottom:'0.2rem',transition:'color 0.2s' }}
                              onMouseEnter={e=>e.currentTarget.style.color=ac}
                              onMouseLeave={e=>e.currentTarget.style.color=tc}>
                              {product?.name || 'Product unavailable'}
                            </h3>
                          </Link>
                          {product?.seller?.display_name && (
                            <p style={{ fontSize:'0.65rem',color:tm,display:'flex',alignItems:'center',gap:'0.2rem' }}>
                              <FiShoppingBag size={10}/> {product.seller.display_name}
                            </p>
                          )}
                          {!isActive && (
                            <span style={{ display:'inline-block',marginTop:'0.3rem',padding:'0.12rem 0.5rem',borderRadius:6,fontSize:'0.55rem',fontWeight:700,background:'rgba(239,68,68,0.1)',color:'#ef4444' }}>
                              {product?.status === 'sold' ? 'SOLD' : 'UNAVAILABLE'}
                            </span>
                          )}
                        </div>

                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem' }}>
                          {/* Quantity Controls */}
                          {isActive && (
                            <div style={{ display:'flex',alignItems:'center',gap:'0.15rem',border:`1px solid ${bc}`,borderRadius:8,overflow:'hidden' }}>
                              <button onClick={()=>handleUpdateQuantity(item.id,item.quantity-1)} className="qty-btn"
                                disabled={updating===item.id || item.quantity<=1}
                                style={{ width:30,height:30,border:'none',background:'transparent',color:tc,cursor:item.quantity<=1?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',opacity:item.quantity<=1?0.3:1 }}>
                                <FiMinus size={12}/>
                              </button>
                              <span style={{ width:32,textAlign:'center',fontWeight:600,fontSize:'0.72rem',opacity:updating===item.id?0.5:1 }}>
                                {updating===item.id?'...':item.quantity}
                              </span>
                              <button onClick={()=>handleUpdateQuantity(item.id,item.quantity+1)} className="qty-btn"
                                disabled={updating===item.id}
                                style={{ width:30,height:30,border:'none',background:'transparent',color:tc,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem' }}>
                                <FiPlus size={12}/>
                              </button>
                            </div>
                          )}

                          <div style={{ display:'flex',alignItems:'center',gap:'0.6rem' }}>
                            <span style={{ fontSize:'0.85rem',fontWeight:700,color:ac }}>
                              {product ? formatPrice(product.price * item.quantity) : 'N/A'}
                            </span>
                            {isActive && (
                              <span style={{ fontSize:'0.6rem',color:tm }}>
                                ({formatPrice(product?.price)} each)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display:'flex',gap:'0.4rem',marginTop:'0.4rem' }}>
                          {isActive && (
                            <button onClick={()=>handleContactSeller(product)} className="btn-hover"
                              style={{ padding:'0.35rem 0.8rem',borderRadius:8,border:`1px solid ${bc}`,background:'transparent',color:tc,fontSize:'0.65rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem',whiteSpace:'nowrap' }}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.color=ac}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=bc;e.currentTarget.style.color=tc}}>
                              <FiMessageSquare size={11}/> Contact Seller
                            </button>
                          )}
                          <button onClick={()=>handleRemove(item.id,product?.name)} className="btn-hover"
                            style={{ padding:'0.35rem 0.8rem',borderRadius:8,border:`1px solid ${bc}`,background:'transparent',color:tm,fontSize:'0.65rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem',whiteSpace:'nowrap' }}
                            onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.borderColor='#ef4444'}}
                            onMouseLeave={e=>{e.currentTarget.style.color=tm;e.currentTarget.style.borderColor=bc}}>
                            <FiTrash2 size={11}/> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Card */}
            <div className="summary-card" style={{ position:'sticky',top:80 }}>
              <div style={{ background:cbg,backdropFilter:'blur(20px)',borderRadius:18,border:`1px solid ${bc}`,padding:'1.5rem',boxShadow:shadow }}>
                <h3 style={{ fontSize:'0.9rem',fontWeight:700,marginBottom:'1.2rem',display:'flex',alignItems:'center',gap:'0.3rem' }}>
                  <FiShoppingCart size={16} style={{ color:ac }}/> Order Summary
                </h3>
                
                <div style={{ display:'flex',flexDirection:'column',gap:'0.6rem',marginBottom:'1.2rem',paddingBottom:'1rem',borderBottom:`1px solid ${bc}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:tm }}>
                    <span>Active Items</span>
                    <span style={{ fontWeight:600,color:tc }}>{activeItems.length}</span>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:tm }}>
                    <span>Total Quantity</span>
                    <span style={{ fontWeight:600,color:tc }}>{totalItems}</span>
                  </div>
                </div>

                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem' }}>
                  <span style={{ fontSize:'0.85rem',fontWeight:700 }}>Subtotal</span>
                  <span style={{ fontSize:'1.3rem',fontWeight:800,color:ac }}>{formatPrice(subtotal)}</span>
                </div>

                <p style={{ fontSize:'0.65rem',color:tm,textAlign:'center',marginBottom:'0.8rem',lineHeight:1.4 }}>
                  Contact sellers individually to arrange payment and delivery
                </p>

                <button onClick={()=>navigate('/products')} className="btn-hover"
                  style={{ width:'100%',padding:'0.65rem',borderRadius:12,border:'none',background:ac,color:'#0a0a14',fontSize:'0.8rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.35rem' }}>
                  <FiShoppingBag size={15}/> Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;