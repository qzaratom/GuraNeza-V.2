import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

function Terms() {
  const { darkMode } = useTheme();
  const accentColor = '#00E309';
  const bgColor = darkMode ? '#0a0a14' : '#f8fafc';
  const cardBg = darkMode ? 'rgba(26,26,46,0.75)' : 'rgba(255,255,255,0.95)';
  const textColor = darkMode ? 'white' : '#1a1a2e';
  const textMuted = darkMode ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.58)';
  const borderColor = darkMode ? 'rgba(0,227,9,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <main style={{ minHeight: '100vh', background: bgColor, color: textColor, padding: '2rem 1rem 4rem', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', color: textMuted, textDecoration: 'none', fontSize: '.75rem', marginBottom: '2rem' }}>
          <span aria-hidden="true">&#8592;</span> Back to sign in
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.5rem' }}>
          <img src={logo} alt="GuraNeza" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', lineHeight: 1.1 }}>Terms &amp; Privacy</h1>
            <p style={{ margin: '.35rem 0 0', color: accentColor, fontSize: '.7rem', fontWeight: 600 }}>GuraNeza BuySmart</p>
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 18, padding: 'clamp(1.2rem, 4vw, 2.2rem)', boxShadow: darkMode ? '0 20px 50px rgba(0,0,0,.25)' : '0 12px 35px rgba(0,0,0,.06)' }}>
          <p style={{ color: textMuted, fontSize: '.78rem', lineHeight: 1.7, marginTop: 0 }}>
            These short terms explain the main rules for using GuraNeza. By creating an account or continuing to use the service, you agree to follow them.
          </p>

          <section>
            <h2>1. Using GuraNeza</h2>
            <p>GuraNeza connects buyers and sellers in Rwanda. You must provide accurate information, keep your account secure, and use the service lawfully. You are responsible for activity made through your account.</p>
          </section>
          <section>
            <h2>2. Listings and transactions</h2>
            <p>Sellers must publish honest descriptions, accurate prices, and lawful products. Buyers and sellers are responsible for discussing payment, delivery, returns, and other transaction details. GuraNeza does not become the owner of listed goods or a party to private transactions.</p>
          </section>
          <section>
            <h2>3. Safety and prohibited use</h2>
            <p>Do not post illegal, stolen, unsafe, misleading, abusive, or infringing content. Do not scam, impersonate others, manipulate listings, collect personal information improperly, or interfere with the platform. We may remove content or restrict accounts that break these rules.</p>
          </section>
          <section>
            <h2>4. Content and intellectual property</h2>
            <p>You keep ownership of content you submit, but allow GuraNeza to display it for operating and promoting the marketplace. The GuraNeza name, interface, and service materials may not be copied or used without permission.</p>
          </section>
          <section id="privacy">
            <h2>5. Privacy</h2>
            <p>We collect information needed to provide accounts, listings, communication, security, and support. We use it to operate and improve GuraNeza, prevent abuse, and meet legal obligations. We do not sell personal information. You can contact us about your account information or privacy concerns.</p>
          </section>
          <section>
            <h2>6. Changes and availability</h2>
            <p>We may update these terms as GuraNeza grows. We may also modify or pause features for maintenance, safety, or legal reasons. Continued use after an update means you accept the revised terms.</p>
          </section>
          <section>
            <h2>7. Contact</h2>
            <p style={{ marginBottom: 0 }}>For questions about these terms or privacy, contact us at <a href="mailto:guraneza@gmail.com" style={{ color: accentColor }}>guraneza@gmail.com</a>.</p>
          </section>
        </div>

        <p style={{ textAlign: 'center', color: textMuted, fontSize: '.65rem', margin: '1.2rem 0 0' }}>Last updated: August 2026</p>
      </div>
      <style>{`section + section{margin-top:1.35rem}h2{font-size:1rem;margin:0 0 .45rem;color:${textColor}}section p{font-size:.78rem;line-height:1.7;color:${textMuted};margin:0}`}</style>
    </main>
  );
}

export default Terms;
