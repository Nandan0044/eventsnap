import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">ES</span>
          <span className="logo-text">EventSnap</span>
        </Link>

        <div className="navbar-actions">
          <Link to="/join" className="btn btn-ghost btn-sm">Join Event</Link>
          {user ? (
            <div className="navbar-user" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-username">{user.name.split(' ')[0]}</span>
              {menuOpen && (
                <div className="navbar-dropdown">
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link to="/create-event" onClick={() => setMenuOpen(false)}>Create Event</Link>
                  <hr />
                  <button onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
