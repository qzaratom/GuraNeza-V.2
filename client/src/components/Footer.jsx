import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMail, FiPhone } from 'react-icons/fi';
import { FaTiktok, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import linkupLogo from '../assets/linkup.png';

function Footer() {
  const location = useLocation();
  const { darkMode } = useTheme();
  
  if (location.pathname.startsWith('/admin')) return null;
  
  const accentColor = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#ffffff';
  const borderColor = darkMode ? 'rgba(0,227,9,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const iconBg = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const iconBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const shadow = darkMode ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -2px 12px rgba(0,0,0,0.04)';

  return (
    <footer style={{ 
      background: bgColor, 
      borderTop: `1px solid ${borderColor}`, 
      boxShadow: shadow,
      transition: 'all 0.3s ease',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      <style>{`
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1.5rem !important; }
          .footer-bottom { padding-bottom: 5rem !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem 1rem' }}>
        
        <div className="footer-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2rem', 
          marginBottom: '1.5rem' 
        }}>
          
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <img src={logo} alt="GuraNeza" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: textColor }}>
                Gura<span style={{ color: accentColor }}>Neza</span>
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: textMuted, fontWeight: 300, lineHeight: 1.6, marginBottom: '0.6rem' }}>
              Rwanda's trusted marketplace. Connecting buyers and sellers across the nation.
            </p>
            <span style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 600, letterSpacing: '0.04em' }}>
              BuySmart Application
            </span>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: textColor, marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { to: '/products', label: 'Browse Products' },
                { to: '/shops', label: 'Shops' },
                { to: '/subscriptions', label: 'Subscription Plans' },
                { to: '/login', label: 'Get Started' },
                { to: '/tickets', label: 'Help & Support' },
              ].map((link, i) => (
                <Link key={i} to={link.to} style={{ fontSize: '0.75rem', color: textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = accentColor}
                  onMouseLeave={e => e.target.style.color = textMuted}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: textColor, marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <a href="tel:+250795583674" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = accentColor}
                onMouseLeave={e => e.target.style.color = textMuted}>
                <FiPhone style={{ color: accentColor, fontSize: '0.85rem', flexShrink: 0 }} />
                +250 795 583 674
              </a>
              <a href="mailto:guraneza@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = accentColor}
                onMouseLeave={e => e.target.style.color = textMuted}>
                <FiMail style={{ color: accentColor, fontSize: '0.85rem', flexShrink: 0 }} />
                guraneza@gmail.com
              </a>
              <p style={{ fontSize: '0.65rem', color: textMuted, marginTop: '0.2rem' }}>Kigali, Rwanda</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: textColor, marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Follow Us
            </h4>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {[
                { href: "https://tiktok.com/@guraneza", icon: FaTiktok },
                { href: "https://x.com/guraneza", icon: FaXTwitter },
                { href: "https://instagram.com/guraneza", icon: FaInstagram },
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, transition: 'all 0.2s ease', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = '#0a0a14'; e.currentTarget.style.borderColor = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.background = iconBg; e.currentTarget.style.color = textMuted; e.currentTarget.style.borderColor = iconBorder; }}>
                  <social.icon style={{ fontSize: '0.9rem' }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom" style={{ 
          borderTop: `1px solid ${borderColor}`, 
          paddingTop: '0.8rem',
          paddingBottom: '0.5rem',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          gap: '0.6rem', 
          fontSize: '0.7rem', 
          color: textMuted 
        }}>
          <span>&copy; 2026 GuraNeza. All rights reserved.</span>
          
          {/* LinkUp */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>A</span>
            <a href="https://www.LinkUp.com" target="_blank" rel="noopener noreferrer" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = accentColor}
              onMouseLeave={e => e.target.style.color = textMuted}>
              <img src={linkupLogo} alt="LinkUp" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>LinkUp</span>
            </a>
            <span>product</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;