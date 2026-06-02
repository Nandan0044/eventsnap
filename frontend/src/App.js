import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventGallery from './pages/EventGallery';
import Analytics from './pages/Analytics';
import Join from './pages/Join';

import './styles/global.css';

// Protected route — redirect to login if not authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Public-only route — redirect to dashboard if already logged in
function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/create-event" element={
          <ProtectedRoute><CreateEvent /></ProtectedRoute>
        } />

        {/* Public event pages — anyone with a link can view */}
        <Route path="/event/:id" element={<EventGallery />} />
        <Route path="/event/:id/analytics" element={
          <ProtectedRoute><Analytics /></ProtectedRoute>
        } />
        <Route path="/join" element={<Join />} />

        {/* Catch-all */}
        <Route path="*" element={
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text2)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404</h2>
            <p>Page not found.</p>
            <a href="/" style={{ color: 'var(--accent2)', marginTop: '1rem', display: 'inline-block' }}>← Go home</a>
          </div>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '0.5px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '10px',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
