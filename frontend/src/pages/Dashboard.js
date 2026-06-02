import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

function EventCard({ event, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isExpired = new Date(event.expiresAt) < new Date();

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${event._id}`);
      toast.success('Event deleted');
      onDelete(event._id);
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="event-card">
      {event.coverImage?.url ? (
        <div className="event-card-cover">
          <img src={event.coverImage.url} alt={event.name} />
        </div>
      ) : (
        <div className="event-card-cover event-card-cover-placeholder">
          <span>📸</span>
        </div>
      )}
      <div className="event-card-body">
        <div className="event-card-top">
          <h3 className="event-card-name">{event.name}</h3>
          <span className={`badge ${isExpired ? 'badge-red' : 'badge-green'}`}>
            {isExpired ? 'Expired' : 'Active'}
          </span>
        </div>
        <p className="event-card-meta">
          📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <div className="event-card-stats">
          <span>📸 {event.photoCount || 0} photos</span>
          <span className="event-code">#{event.code}</span>
        </div>
        <div className="event-card-actions">
          <Link to={`/event/${event._id}`} className="btn btn-secondary btn-sm">View gallery</Link>
          <Link to={`/event/${event._id}/analytics`} className="btn btn-ghost btn-sm">Analytics</Link>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/my')
      .then(({ data }) => setEvents(data.events))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setEvents(prev => prev.filter(e => e._id !== id));

  return (
    <div className="dashboard page-enter">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>My events</h1>
            <p style={{ color: 'var(--text2)', marginTop: 4 }}>
              {events.length} event{events.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <Link to="/create-event" className="btn btn-primary">+ New event</Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : events.length === 0 ? (
          <div className="dashboard-empty">
            <span>🎉</span>
            <h3>No events yet</h3>
            <p>Create your first event and start collecting memories.</p>
            <Link to="/create-event" className="btn btn-primary">Create event</Link>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <EventCard key={event._id} event={event} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
