import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const FEATURES = [
  { icon: '⚡', title: 'Real-time gallery', desc: 'Photos appear instantly for everyone in the event — no refresh needed.' },
  { icon: '📷', title: 'Zero friction upload', desc: 'Guests upload by name only. No account, no app download.' },
  { icon: '🔗', title: 'QR code sharing', desc: 'One QR at the venue. Everyone scans and joins in seconds.' },
  { icon: '❤️', title: 'Likes & highlights', desc: 'Best moments float to the top. Auto-generated highlight page.' },
  { icon: '📊', title: 'Organiser analytics', desc: 'Upload heatmap, top contributors, peak activity times.' },
  { icon: '🛡️', title: 'Moderation tools', desc: 'Flag inappropriate photos. Organisers approve or delete.' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.trim()) navigate(`/join?code=${code.trim().toUpperCase()}`);
  };

  return (
    <div className="home page-enter">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
        </div>
        <div className="container">
          <div className="hero-badge badge badge-accent">📸 Share memories together</div>
          <h1 className="hero-title">
            Every photo,<br />
            <span className="hero-accent">in one place</span>
          </h1>
          <p className="hero-sub">
            Create an event, share a QR code, and watch photos pour in from everyone at the venue — in real time.
          </p>
          <div className="hero-cta">
            {user ? (
              <Link to="/create-event" className="btn btn-primary btn-lg">Create event</Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">Get started free</Link>
            )}
            <form className="hero-join" onSubmit={handleJoin}>
              <input
                className="form-input hero-join-input"
                placeholder="Enter event code…"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <button type="submit" className="btn btn-secondary">Join</button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <p className="section-label">Built for events that actually happen</p>
          <h2 className="section-title">Everything the organiser needs</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="cta-strip">
        <div className="container">
          <h2>Ready for your next event?</h2>
          <p>Free to use. No credit card. Deploy in minutes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: '1.5rem' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Create an account</Link>
                <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
