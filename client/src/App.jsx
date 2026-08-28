import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import Terms from './pages/Terms';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AuthenticatedRedirect({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (pathname === '/' || pathname === '/login')) {
      navigate('/home', { replace: true });
    }
  }, [user, pathname, navigate]);

  return null;
}

function App() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);

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
    } catch (error) { }
  };

  const fetchUserFromBackend = async (authUser) => {
    try {
      const token = authUser.access_token || (await supabase.auth.getSession()).data.session?.access_token;
      if (token) localStorage.setItem('guraneza_token', token);
      const response = await api.get(`/auth/refresh/${authUser.id}`);
      if (response.data.user) setUser(response.data.user);
    } catch (error) { if (error.response?.status === 404) setUser(null); }
  };

  return (
    <Router>
      <ScrollToTop />
      <AuthenticatedRedirect user={user} />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0a0a14' : '#f8fafc', transition: 'background 0.3s' }}>
        <Navbar user={user} setUser={setUser} />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/terms" element={<Terms />} />
            
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