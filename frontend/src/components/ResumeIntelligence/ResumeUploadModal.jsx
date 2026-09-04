import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2, Image, Sparkles } from 'lucide-react';

const ResumeUploadModal = ({ isOpen, onClose, onUploadSuccess, isReplacing = false }) => {
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Only PDF resume files are accepted.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedPhoto = e.target.files[0];
      if (!selectedPhoto.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, WebP).');
        return;
      }
      setPhoto(selectedPhoto);
      setPhotoPreview(URL.createObjectURL(selectedPhoto));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !photo) {
      setError('Please select a resume PDF to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload Resume PDF
      if (file) {
        setStatusMessage('Parsing resume with AI Resume Intelligence...');
        const formData = new FormData();
        formData.append('resume', file);

        const res = await axios.post('/api/resume/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          setStatusMessage('Resume structured profile created!');
        }
      }

      // 2. Upload Profile Photo if provided
      if (photo) {
        setStatusMessage('Uploading profile picture...');
        const photoData = new FormData();
        photoData.append('photo', photo);

        await axios.post('/api/resume/photo', photoData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setLoading(false);
      if (onUploadSuccess) onUploadSuccess();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to extract resume data. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border dark:border-dark-border mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-purple-light dark:bg-dark-purple/20 border border-brand-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-charcoal dark:text-dark-text font-outfit">
                {isReplacing ? 'Replace Resume & Update Profile' : 'Upload Resume & Profile Photo'}
              </h3>
              <p className="text-xs text-brand-slate dark:text-dark-muted">
                Extracts skills, projects, and generates your customized interview
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-brand-slate hover:text-brand-charcoal dark:text-dark-muted dark:hover:text-dark-text rounded-xl hover:bg-brand-surface dark:hover:bg-dark-bg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PDF Drag and Drop Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-slate dark:text-dark-muted mb-2">
              Resume Document (PDF only, max 10MB)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-purple bg-brand-purple-light/40 dark:bg-dark-purple/10'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10'
                  : 'border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple bg-brand-surface/40 dark:bg-dark-bg/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-brand-charcoal dark:text-dark-text truncate max-w-[280px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-brand-slate dark:text-dark-muted">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple flex items-center justify-center mb-3">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-semibold text-brand-charcoal dark:text-dark-text">
                    Drag and drop your PDF resume here, or <span className="text-brand-purple dark:text-dark-purple underline">browse</span>
                  </p>
                  <p className="text-xs text-brand-slate dark:text-dark-muted mt-1">
                    Supports single-page & multi-page technical resumes
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Optional Profile Photo Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-slate dark:text-dark-muted mb-2">
              Profile Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple bg-brand-surface dark:bg-dark-bg flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Image size={22} className="text-brand-slate group-hover:text-brand-purple transition-colors" />
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-brand-slate dark:text-dark-muted">
                <p className="font-semibold text-brand-charcoal dark:text-dark-text">
                  {photo ? photo.name : 'Upload your avatar or professional photo'}
                </p>
                <p className="text-[11px] mt-0.5">PNG, JPG or WebP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-bg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!file && !photo)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-purple-glow transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{statusMessage || 'Extracting Resume...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>{isReplacing ? 'Update Profile' : 'Extract & Save Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResumeUploadModal;
