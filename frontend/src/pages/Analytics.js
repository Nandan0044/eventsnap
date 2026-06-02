import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Analytics.css';

export default function Analytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, anRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/events/${id}/analytics`),
        ]);
        setEvent(evRes.data.event);
        setData(anRes.data.analytics);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!data) return <div style={{ padding: '3rem', textAlign: 'center' }}>No data found.</div>;

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`, uploads: data.uploadsPerHour[h] || 0,
  }));

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="analytics-page page-enter">
      <div className="container">
        <div className="analytics-header">
          <Link to={`/event/${id}`} className="btn btn-ghost btn-sm">← Back to gallery</Link>
          <div style={{ marginTop: '1rem' }}>
            <h1>Analytics</h1>
            {event && <p style={{ color: 'var(--text2)', marginTop: 4 }}>{event.name}</p>}
          </div>
        </div>

        {/* Stat cards */}
        <div className="analytics-stats">
          {[
            { label: 'Total photos', value: data.totalPhotos },
            { label: 'Total likes', value: data.totalLikes },
            { label: 'Contributors', value: data.uniqueContributors },
            { label: 'Storage used', value: formatBytes(data.totalStorage) },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Upload activity */}
        <div className="card analytics-chart-card">
          <h2 className="analytics-section-title">Upload activity by hour</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fill: '#606078', fontSize: 11 }}
                tickFormatter={(v) => v.split(':')[0]} interval={2} />
              <YAxis tick={{ fill: '#606078', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: 'var(--text2)' }} itemStyle={{ color: 'var(--accent2)' }}
              />
              <Bar dataKey="uploads" radius={[4, 4, 0, 0]}>
                {hourData.map((entry, index) => (
                  <Cell key={index} fill={entry.uploads > 0 ? '#7c5cfc' : '#2a2a32'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-grid-2">
          {/* Top contributors */}
          <div className="card">
            <h2 className="analytics-section-title">Top contributors</h2>
            {data.topContributors.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>No uploads yet</p>
            ) : (
              <div className="contributors-list">
                {data.topContributors.map((c, i) => (
                  <div key={c.name} className="contributor-row">
                    <span className="contributor-rank">#{i + 1}</span>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="contributor-name">{c.name}</span>
                    <span className="contributor-count badge badge-accent">{c.count} photos</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most liked */}
          <div className="card">
            <h2 className="analytics-section-title">Most liked photos</h2>
            {data.mostLiked.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>No likes yet</p>
            ) : (
              <div className="liked-list">
                {data.mostLiked.map((photo, i) => (
                  <div key={photo._id} className="liked-row">
                    <span className="contributor-rank">#{i + 1}</span>
                    {photo.thumbnailUrl ? (
                      <img src={photo.thumbnailUrl} alt="" className="liked-thumb" />
                    ) : <div className="liked-thumb" style={{ background: 'var(--surface)' }} />}
                    <div className="liked-info">
                      <span className="contributor-name">{photo.uploadedBy?.name}</span>
                      <span className="contributor-count" style={{ color: 'var(--pink)' }}>❤️ {photo.likeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
