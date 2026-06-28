import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    const token = localStorage.getItem('guraneza_token');
    if (!token) return;
    try {
      const [chatRes, notifRes, cartRes] = await Promise.all([
        api.get('/chats/unread-count'),
        api.get('/notifications/unread-count'),
        api.get('/cart')
      ]);
      setUnreadChats(chatRes.data.unread_count || 0);
      setUnreadNotifications(notifRes.data.unread_count || 0);
      setCartCount(cartRes.data.cart_items?.length || 0);
    } catch (e) {
      console.log('Count fetch error:', e.message);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('guraneza_token');
    if (token) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 5000); // Check every 5 seconds
      
      // Listen for cart updates from other parts of the app
      const handleCartUpdate = () => fetchUnreadCounts();
      window.addEventListener('cartUpdated', handleCartUpdate);
      window.addEventListener('storage', handleCartUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('cartUpdated', handleCartUpdate);
        window.removeEventListener('storage', handleCartUpdate);
      };
    }
  }, [fetchUnreadCounts]);

  return (
    <NotificationContext.Provider value={{ 
      unreadChats, 
      unreadNotifications,
      cartCount,
      setUnreadChats,
      setUnreadNotifications,
      setCartCount,
      refreshCounts: fetchUnreadCounts 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}