import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../utils/api';
import './CreateEvent.css';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', date: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted) => {
    const file = accepted[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 5 * 1024 * 1024,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) return toast.error('Name and date are required');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('date', form.date);
      if (coverFile) formData.append('coverImage', coverFile);

      const { data } = await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Event created!');
      navigate(`/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page page-enter">
      <div className="container-sm">
        <div className="create-header">
          <h1>Create event</h1>
          <p>Fill in the details — a QR code will be generated automatically.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Event name *</label>
              <input className="form-input" placeholder="e.g. College Farewell 2026"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" placeholder="A short description (optional)"
                rows={3} style={{ resize: 'vertical' }}
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Event date *</label>
              <input className="form-input" type="date"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Cover image (optional)</label>
              <div {...getRootProps()} className={`cover-drop ${isDragActive ? 'active' : ''} ${coverPreview ? 'has-image' : ''}`}>
                <input {...getInputProps()} />
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="cover-preview" />
                ) : (
                  <div className="cover-drop-inner">
                    <span className="cover-drop-icon">🖼️</span>
                    <p>Drop cover image here or <span>browse</span></p>
                    <small>Max 5 MB</small>
                  </div>
                )}
              </div>
              {coverPreview && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                  Remove image
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Creating…</> : 'Create event →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
