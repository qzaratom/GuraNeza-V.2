import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import api from './lib/api';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Chats from './pages/Chats';
import Notifications from './pages/Notifications';
import Subscriptions from './pages/Subscriptions';
import Tickets from './pages/Tickets';
import Sell from './pages/Sell';
import MyProducts from './pages/MyProducts';
import Admin from './pages/Admin';
import logo from './assets/logo.png';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { fetchUserFromBackend(session.user); }
      else { setUser(null); localStorage.removeItem('guraneza_token'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { await fetchUserFromBackend(session.user); }
      else { setLoading(false); }
    } catch (error) { setLoading(false); }
  };

  const fetchUserFromBackend = async (authUser) => {
    try {
      const token = authUser.access_token || (await supabase.auth.getSession()).data.session?.access_token;
      if (token) localStorage.setItem('guraneza_token', token);
      const response = await api.get(`/auth/refresh/${authUser.id}`);
      if (response.data.user) setUser(response.data.user);
    } catch (error) { if (error.response?.status === 404) setUser(null); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0a0a14' : '#ffffff' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, animation: 'spin 2.5s linear infinite' }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#00E309" strokeWidth="1.5" strokeDasharray="180 100" strokeLinecap="round" opacity="0.6"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: darkMode ? 'white' : '#1a1a2e', letterSpacing: '0.06em' }}>GURANEZA</h1>
          <p style={{ fontSize: '0.75rem', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontWeight: 300, marginTop: 4 }}>BuySmart</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0a0a14' : '#f8fafc', transition: 'background 0.3s' }}>
        <Navbar user={user} setUser={setUser} />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            
            {/* Protected Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/products/:id" element={<ProductDetail user={user} />} />
            <Route path="/my-products" element={<MyProducts user={user} />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/shops/:id" element={<ShopDetail />} />
            <Route path="/cart" element={<Cart user={user} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/chats" element={<Chats user={user} />} />
            <Route path="/notifications" element={<Notifications user={user} />} />
            <Route path="/subscriptions" element={<Subscriptions user={user} />} />
            <Route path="/tickets" element={<Tickets user={user} />} />
            <Route path="/sell" element={<Sell user={user} />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={<Admin user={user} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;