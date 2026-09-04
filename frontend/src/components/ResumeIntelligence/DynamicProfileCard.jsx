import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Briefcase,
  Code,
  FolderGit2,
  GraduationCap,
  Sparkles,
  Check,
  UploadCloud,
  ExternalLink,
  Award,
  Trash2,
  AlertTriangle,
  Loader2,
  Camera,
  Globe,
  Github,
  Linkedin,
  Terminal,
  FileCheck,
  Database,
  Layers,
  Wrench,
  Cpu
} from 'lucide-react';

const DynamicProfileCard = ({ profile, user, onReplaceResume, onProfileUpdated }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const photoInputRef = useRef(null);

  if (!profile) return null;

  const handleDeleteResume = async () => {
    try {
      setDeleting(true);
      const res = await axios.delete('/api/resume/profile');
      if (res.data.success) {
        setShowDeleteConfirm(false);
        if (onProfileUpdated) onProfileUpdated();
      }
    } catch (err) {
      console.error('Failed to delete resume profile:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }

      try {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('photo', file);

        const res = await axios.post('/api/resume/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          setAvatarPreview(res.data.data.avatarUrl);
          if (onProfileUpdated) onProfileUpdated();
        }
      } catch (err) {
        console.error('Failed to upload photo:', err);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const basic = profile.basicDetails || {};
  const skills = profile.skills || {};
  
  // Clean Candidate Name & Email
  const displayName = (basic.fullName && basic.fullName !== 'Candidate Profile') 
    ? basic.fullName 
    : (user?.name || 'Candidate');

  const displayEmail = (basic.email && basic.email !== 'candidate@mockwithsiva.com') 
    ? basic.email 
    : (user?.email || '');

  const displayPhone = (basic.phone && !basic.phone.includes('9876543210')) 
    ? basic.phone 
    : '';

  // User Profile Links
  const githubLink = basic.github || '';
  const linkedinLink = basic.linkedin || '';
  const portfolioLink = basic.portfolio || '';
  const leetcodeLink = basic.leetcode || '';

  // Categorized Skills Processing
  const dedupeSkills = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const out = [];
    for (const item of arr) {
      if (!item || typeof item !== 'string') continue;
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !seen.has(lower)) {
        seen.add(lower);
        out.push(trimmed);
      }
    }
    return out;
  };

  const categorizedSkills = [
    {
      name: 'Languages & Core',
      icon: Code,
      iconColor: 'text-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40',
      skills: dedupeSkills(skills.technical)
    },
    {
      name: 'Frameworks & Libraries',
      icon: Layers,
      iconColor: 'text-purple-500',
      badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:border-purple-500/40',
      skills: dedupeSkills(skills.frameworks)
    },
    {
      name: 'Databases & Storage',
      icon: Database,
      iconColor: 'text-blue-500',
      badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:border-blue-500/40',
      skills: dedupeSkills(skills.databases)
    },
    {
      name: 'Tools & Platforms',
      icon: Wrench,
      iconColor: 'text-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:border-amber-500/40',
      skills: dedupeSkills(skills.tools)
    },
    {
      name: 'Soft Skills & Practices',
      icon: Check,
      iconColor: 'text-teal-500',
      badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 hover:border-teal-500/40',
      skills: dedupeSkills(skills.softSkills)
    }
  ].filter(cat => cat.skills.length > 0);

  const totalSkillsCount = categorizedSkills.reduce((sum, cat) => sum + cat.skills.length, 0);

  // Deduplicate projects
  const seenProjects = new Set();
  const uniqueProjects = [];
  for (const proj of (profile.projects || [])) {
    if (proj && proj.name) {
      const key = proj.name.trim().toLowerCase();
      if (!seenProjects.has(key)) {
        seenProjects.add(key);
        uniqueProjects.push(proj);
      }
    }
  }

  const currentAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 relative">
      
      {/* Hidden File Input for Photo Upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-outfit text-brand-charcoal dark:text-dark-text mb-2">
                Delete Uploaded Resume?
              </h3>
              <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed">
                This will remove your parsed skills, projects, and structured candidate profile. You can upload a new PDF resume anytime.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text font-semibold text-xs hover:bg-brand-surface dark:hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteResume}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-brand-border dark:border-dark-border">
        
        {/* User Info & Avatar */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative group cursor-pointer shrink-0" onClick={() => photoInputRef.current?.click()} title="Click to upload profile photo">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-purple dark:border-dark-purple shadow-md group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue text-white flex items-center justify-center font-outfit font-extrabold text-2xl shadow-purple-glow group-hover:scale-105 transition-transform">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              {uploadingPhoto ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            </div>

            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white dark:border-dark-card shadow-sm" title="Upload Photo">
              <Camera size={11} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-charcoal dark:text-dark-text font-outfit">
                {displayName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple text-xs font-semibold">
                Active Profile
              </span>
            </div>
            
            <p className="text-xs text-brand-slate dark:text-dark-muted">
              {displayEmail} {displayPhone ? `• ${displayPhone}` : ''}
            </p>

            {/* User Links / Hyperlinks Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {githubLink && (
                <a
                  href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors border border-slate-300 dark:border-slate-700"
                  title="Visit GitHub Profile"
                >
                  <Github size={12} />
                  <span>GitHub</span>
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              )}

              {linkedinLink && (
                <a
                  href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-xs font-medium transition-colors border border-blue-200 dark:border-blue-800"
                  title="Visit LinkedIn Profile"
                >
                  <Linkedin size={12} />
                  <span>LinkedIn</span>
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              )}

              {portfolioLink && (
                <a
                  href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800"
                  title="Visit Portfolio Website"
                >
                  <Globe size={12} />
                  <span>Portfolio</span>
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              )}

              {leetcodeLink && (
                <a
                  href={leetcodeLink.startsWith('http') ? leetcodeLink : `https://${leetcodeLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-300 text-xs font-medium transition-colors border border-amber-200 dark:border-amber-800"
                  title="Visit LeetCode Profile"
                >
                  <Terminal size={12} />
                  <span>LeetCode</span>
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              )}

              {/* AI-Assigned Role Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
                <Sparkles size={12} className="text-emerald-500 animate-pulse" />
                <span>AI-Assigned Role: <strong className="text-brand-charcoal dark:text-white font-extrabold">{profile.targetRole || 'Full Stack Developer'}</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons: Resume Analyzer + Upload Photo + Replace Resume + Delete Resume */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="https://resume-analyzer-eight-sigma.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-purple/10 to-brand-blue/10 border border-brand-purple/30 dark:border-dark-purple/40 text-brand-purple dark:text-dark-purple hover:bg-brand-purple-light/50 text-xs font-semibold transition-all shadow-sm"
            title="Open Resume Analyzer Tool"
          >
            <ExternalLink size={14} />
            <span>Resume Analyzer Tool</span>
          </a>

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:border-brand-purple hover:bg-brand-surface dark:hover:bg-dark-bg text-xs font-semibold transition-all shadow-sm"
            title="Upload or change profile avatar photo"
          >
            <Camera size={14} />
            <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
          </button>

          <button
            onClick={onReplaceResume}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:border-brand-purple hover:bg-brand-surface dark:hover:bg-dark-bg text-xs font-semibold transition-all shadow-sm"
          >
            <UploadCloud size={14} />
            <span>Replace Resume</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all shadow-sm"
            title="Delete uploaded resume"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Grid: Skills, Projects, Experience, Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* 1. Extracted Skills (Organized by Category) */}
        <div className="lg:col-span-1 space-y-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
            <Code size={18} className="text-brand-purple dark:text-dark-purple" />
            <span>Extracted Skills ({totalSkillsCount})</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {categorizedSkills.length > 0 ? (
              categorizedSkills.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-brand-surface/50 dark:bg-dark-bg/50 border border-brand-border dark:border-dark-border space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <cat.icon size={13} className={cat.iconColor} />
                      <span className="text-brand-charcoal dark:text-dark-text font-bold text-[11px] uppercase tracking-wider">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-border/40 dark:bg-dark-border/60 text-brand-slate dark:text-dark-muted">
                      {cat.skills.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className={`px-2 py-0.5 rounded-lg border text-xs font-medium transition-colors ${cat.badgeClass}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-slate dark:text-dark-muted">No skills parsed from resume.</p>
            )}
          </div>
        </div>

        {/* 2. Extracted Projects with Hyperlinks */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
            <FolderGit2 size={18} className="text-brand-blue dark:text-dark-blue" />
            <span>Projects ({uniqueProjects.length})</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {uniqueProjects.length > 0 ? (
              uniqueProjects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-brand-surface/50 dark:bg-dark-bg/50 border border-brand-border dark:border-dark-border space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-brand-charcoal dark:text-dark-text leading-tight">
                      {proj.name}
                    </p>
                    
                    {/* Project Hyperlinks */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-slate-800 text-white hover:bg-brand-purple transition-colors"
                          title="Open GitHub Repository"
                        >
                          <Github size={12} />
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-brand-blue/20 text-brand-blue dark:text-dark-blue hover:bg-brand-blue hover:text-white transition-colors"
                          title="Open Live Project"
                        >
                          <Globe size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Tech Tags */}
                  {(proj.technologies || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.technologies.map((t, ti) => (
                        <span
                          key={ti}
                          className="px-1.5 py-0.5 rounded bg-brand-blue/10 dark:bg-dark-blue/20 text-brand-blue dark:text-dark-blue text-[10px] font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bullet Highlights */}
                  {(proj.highlights || []).length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-brand-slate dark:text-dark-muted list-disc list-inside">
                      {proj.highlights.slice(0, 3).map((hl, hli) => (
                        <li key={hli} className="line-clamp-2 leading-relaxed">
                          {hl}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    proj.summary && (
                      <p className="text-[11px] text-brand-slate dark:text-dark-muted line-clamp-2">
                        {proj.summary}
                      </p>
                    )
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-slate dark:text-dark-muted">No projects listed in resume.</p>
            )}
          </div>
        </div>

        {/* 3. Experience, Internships & Certifications */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Experience Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
              <Briefcase size={18} className="text-brand-cyan dark:text-dark-cyan" />
              <span>Experience & Internships ({profile.experience?.length || 0})</span>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {(profile.experience || []).length > 0 ? (
                profile.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-brand-surface/50 dark:bg-dark-bg/50 border border-brand-border dark:border-dark-border space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-brand-charcoal dark:text-dark-text">
                        {exp.role}
                      </p>
                      {exp.isInternship && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                          Internship
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-purple dark:text-dark-purple font-semibold">
                      {exp.company}
                    </p>
                    <p className="text-[10px] text-brand-slate dark:text-dark-muted">
                      {exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`}
                    </p>
                    {exp.description && (
                      <p className="text-[11px] text-brand-slate dark:text-dark-muted line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-2xl bg-brand-surface/40 dark:bg-dark-bg/40 border border-brand-border dark:border-dark-border">
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Fresh Graduate / Academic Training Portfolio
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Certifications Section */}
          <div className="space-y-3 pt-2 border-t border-brand-border dark:border-dark-border">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
              <Award size={18} className="text-amber-500" />
              <span>Certifications & Achievements ({profile.certifications?.length || 0})</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {(profile.certifications || []).length > 0 ? (
                profile.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-brand-surface/40 dark:bg-dark-bg/40 border border-brand-border dark:border-dark-border text-xs text-brand-charcoal dark:text-dark-text font-medium"
                  >
                    <FileCheck size={14} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{cert}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brand-slate dark:text-dark-muted">No certifications detected.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DynamicProfileCard;
