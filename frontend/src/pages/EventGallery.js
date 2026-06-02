import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import './EventGallery.css';

// Persistent session ID for guest likes
const getSessionId = () => {
  let id = localStorage.getItem('es_session');
  if (!id) { id = uuidv4(); localStorage.setItem('es_session', id); }
  return id;
};

function PhotoCard({ photo, onLike, onFlag, onDelete, isOrganiser, sessionId }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const liked = photo.likes?.includes(sessionId);

  return (
    <div className="photo-card">
      <div className="photo-img-wrap">
        {!imgLoaded && <div className="photo-skeleton" />}
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={`by ${photo.uploadedBy?.name}`}
          className={`photo-img ${imgLoaded ? 'loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
          onClick={() => window.open(photo.url, '_blank')}
        />
        <div className="photo-overlay">
          <button className={`photo-like-btn ${liked ? 'liked' : ''}`} onClick={() => onLike(photo._id)}>
            {liked ? '❤️' : '🤍'} {photo.likeCount || 0}
          </button>
          <a href={photo.url} download target="_blank" rel="noreferrer" className="photo-dl-btn" title="Download">⬇</a>
        </div>
        {photo.isNew && <span className="photo-new-badge">New</span>}
      </div>
      <div className="photo-meta">
        <div className="avatar" style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}>
          {photo.uploadedBy?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="photo-uploader">{photo.uploadedBy?.name}</span>
        <div className="photo-meta-actions">
          <button className="photo-action-btn" onClick={() => onFlag(photo._id)} title="Flag photo">🚩</button>
          {isOrganiser && (
            <button className="photo-action-btn danger" onClick={() => onDelete(photo._id)} title="Delete">🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ event, uploaderName, onUploaded }) {
  const { user } = useAuth();
  const [name, setName] = useState(uploaderName || user?.name || '');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((accepted) => setFiles(accepted), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 20, maxSize: 20 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!name.trim()) return toast.error('Enter your name');
    if (!files.length) return toast.error('Select at least one photo');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('eventId', event._id);
      formData.append('uploaderName', name);
      files.forEach(f => formData.append('photos', f));
      await api.post('/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`);
      setFiles([]);
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-panel">
      {!user && (
        <div className="form-group">
          <label className="form-label">Your name</label>
          <input className="form-input" placeholder="e.g. Ananya Sharma"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
      )}
      <div {...getRootProps()} className={`upload-drop ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <div className="upload-preview-grid">
            {files.map((f, i) => (
              <div key={i} className="upload-preview-item">
                <img src={URL.createObjectURL(f)} alt={f.name} />
              </div>
            ))}
          </div>
        ) : (
          <div className="upload-drop-inner">
            <span className="upload-icon">📷</span>
            <p>Drop photos here or <span>browse</span></p>
            <small>Up to 20 photos, max 20 MB each</small>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <p className="upload-count">{files.length} photo{files.length !== 1 ? 's' : ''} selected</p>
      )}
      <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 12 }}
        onClick={handleUpload} disabled={uploading || !files.length}>
        {uploading ? <><span className="spinner" /> Uploading…</> : 'Upload photos →'}
      </button>
    </div>
  );
}

export default function EventGallery() {
  const { id } = useParams();
  const { user } = useAuth();
  const sessionId = getSessionId();

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [tab, setTab] = useState('gallery'); // gallery | upload | qr
  const [filter, setFilter] = useState('all');
  const [liveCount, setLiveCount] = useState(0);

  // Real-time socket
  useSocket(id, {
    onNewPhoto: (photo) => {
      setPhotos(prev => [{ ...photo, isNew: true }, ...prev]);
      setLiveCount(c => c + 1);
      toast('📸 New photo added!', { icon: '🎉' });
    },
    onPhotoLiked: ({ photoId, likeCount }) => {
      setPhotos(prev => prev.map(p => p._id === photoId ? { ...p, likeCount } : p));
    },
    onPhotoDeleted: ({ photoId }) => {
      setPhotos(prev => prev.filter(p => p._id !== photoId));
    },
  });

  // Load event + photos
  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, phRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/photos/event/${id}?sort=${sort}`),
        ]);
        setEvent(evRes.data.event);
        setPhotos(phRes.data.photos);
      } catch {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, sort]);

  const isOrganiser = user && event && event.organiser?._id?.toString() === user._id?.toString();

  const handleLike = async (photoId) => {
    try {
      const { data } = await api.post(`/photos/${photoId}/like`, { sessionId });
      setPhotos(prev => prev.map(p => p._id === photoId
        ? { ...p, likeCount: data.likeCount, likes: data.liked ? [...(p.likes || []), sessionId] : (p.likes || []).filter(x => x !== sessionId) }
        : p));
    } catch { toast.error('Failed to like'); }
  };

  const handleFlag = async (photoId) => {
    if (!window.confirm('Report this photo?')) return;
    await api.post(`/photos/${photoId}/flag`);
    toast.success('Photo reported');
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Delete this photo permanently?')) return;
    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      toast.success('Photo deleted');
    } catch { toast.error('Delete failed'); }
  };

  const contributors = [...new Set(photos.map(p => p.uploadedBy?.name).filter(Boolean))];
  const displayPhotos = filter === 'all' ? photos : photos.filter(p => p.uploadedBy?.name === filter);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!event) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text2)' }}>Event not found.</div>;

  const shareUrl = window.location.href;

  return (
    <div className="gallery-page page-enter">
      {/* Event header */}
      <div className="gallery-header" style={event.coverImage?.url ? { '--cover': `url(${event.coverImage.url})` } : {}}>
        {event.coverImage?.url && <div className="gallery-header-bg" />}
        <div className="container">
          <div className="gallery-header-inner">
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-accent">#{event.code}</span>
                {liveCount > 0 && <span className="badge badge-green">🟢 {liveCount} new live</span>}
              </div>
              <h1 className="gallery-event-name">{event.name}</h1>
              <p className="gallery-event-meta">
                📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {event.organiser && <> · by {event.organiser.name}</>}
              </p>
            </div>
            <div className="gallery-stats">
              <div className="stat-card">
                <div className="stat-label">Photos</div>
                <div className="stat-value">{photos.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">People</div>
                <div className="stat-value">{contributors.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Likes</div>
                <div className="stat-value">{photos.reduce((a, p) => a + (p.likeCount || 0), 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="gallery-tabs-bar">
        <div className="container gallery-tabs-inner">
          <div className="gallery-tabs">
            {['gallery', 'upload', 'qr'].map(t => (
              <button key={t} className={`gallery-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'gallery' ? '🖼 Gallery' : t === 'upload' ? '⬆ Upload' : '📲 Share QR'}
              </button>
            ))}
          </div>
          {isOrganiser && (
            <Link to={`/event/${id}/analytics`} className="btn btn-ghost btn-sm">📊 Analytics</Link>
          )}
        </div>
      </div>

      <div className="container gallery-body">
        {/* Gallery tab */}
        {tab === 'gallery' && (
          <>
            <div className="gallery-controls">
              <div className="gallery-filters">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                  All ({photos.length})
                </button>
                {contributors.map(c => (
                  <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
                    {c} ({photos.filter(p => p.uploadedBy?.name === c).length})
                  </button>
                ))}
              </div>
              <select className="form-input sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="popular">Most liked</option>
              </select>
            </div>

            {displayPhotos.length === 0 ? (
              <div className="gallery-empty">
                <span>📷</span>
                <p>No photos yet — be the first to upload!</p>
                <button className="btn btn-primary" onClick={() => setTab('upload')}>Upload photos</button>
              </div>
            ) : (
              <div className="photo-grid">
                {displayPhotos.map(photo => (
                  <PhotoCard key={photo._id} photo={photo} onLike={handleLike}
                    onFlag={handleFlag} onDelete={handleDelete}
                    isOrganiser={isOrganiser} sessionId={sessionId} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Upload tab */}
        {tab === 'upload' && (
          <div className="upload-tab">
            <h2>Upload your photos</h2>
            <p>Photos appear in the gallery instantly for everyone.</p>
            <UploadPanel event={event} onUploaded={() => setTab('gallery')} />
          </div>
        )}

        {/* QR tab */}
        {tab === 'qr' && (
          <div className="qr-tab">
            <h2>Share this event</h2>
            <p>Show this QR at the venue. Anyone who scans it can upload photos.</p>
            <div className="qr-card card">
              <QRCodeSVG value={shareUrl} size={220} fgColor="#f0f0f5" bgColor="transparent" level="H" />
              <div className="qr-code-text">{event.code}</div>
              <p className="qr-url">{shareUrl}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary"
                  onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}>
                  Copy link
                </button>
                <button className="btn btn-primary"
                  onClick={() => { navigator.clipboard.writeText(event.code); toast.success('Code copied!'); }}>
                  Copy code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
