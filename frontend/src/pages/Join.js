import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Join.css';

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(params.get('code') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('code')) handleJoin(params.get('code'));
  }, []);

  const handleJoin = async (c = code) => {
    if (!c.trim()) return toast.error('Enter an event code');
    setLoading(true);
    try {
      const { data } = await api.get(`/events/join/${c.trim()}`);
      navigate(`/event/${data.event._id}`);
    } catch {
      toast.error('Event not found or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-page page-enter">
      <div className="container-sm">
        <div className="join-header">
          <h1>Join event</h1>
          <p>Enter the code your organiser shared with you.</p>
        </div>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Event code</label>
            <input
              className="form-input join-code-input"
              placeholder="e.g. A1B2C3D4"
              value={code}
              maxLength={8}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
            onClick={() => handleJoin()} disabled={loading || !code.trim()}>
            {loading ? <span className="spinner" /> : 'Join event →'}
          </button>
        </div>
      </div>
    </div>
  );
}
