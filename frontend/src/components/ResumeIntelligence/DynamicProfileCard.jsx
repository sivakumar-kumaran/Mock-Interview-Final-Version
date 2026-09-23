import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Code,
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
  Copy,
  CheckCheck,
  BookOpen,
  Briefcase,
  HelpCircle,
  GraduationCap,
  RefreshCw,
  Cpu,
  Compass
} from 'lucide-react';

const DynamicProfileCard = ({ profile, user, onReplaceResume, onProfileUpdated }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [copiedPitch, setCopiedPitch] = useState(false);
  const photoInputRef = useRef(null);

  if (!profile) return null;

  const basic = profile.basicDetails || {};
  const skills = profile.skills || {};
  const summaryReport = profile.summaryReport || {};

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

  // Delete Resume
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

  // Re-Analyze Resume
  const handleReanalyzeResume = async () => {
    try {
      setReanalyzing(true);
      const res = await axios.post('/api/resume/re-analyze');
      if (res.data.success && onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err) {
      console.error('Failed to re-analyze resume:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  // Photo Upload
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

  // Copy 30-sec pitch to clipboard
  const handleCopyPitch = () => {
    const pitchText = summaryReport.professionalSummary || profile.summary || '';
    if (pitchText) {
      navigator.clipboard.writeText(pitchText);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2500);
    }
  };

  // Cross-category deduplication ensuring no skill appears twice anywhere in the profile
  const globalSeenSkills = new Set();
  const dedupeSkillsAcrossAll = (arr) => {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const item of arr) {
      if (!item || typeof item !== 'string') continue;
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !globalSeenSkills.has(lower)) {
        globalSeenSkills.add(lower);
        out.push(trimmed);
      }
    }
    return out;
  };

  const categorizedSkills = [
    {
      name: 'Languages',
      icon: Code,
      iconColor: 'text-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40',
      skills: dedupeSkillsAcrossAll(summaryReport.technicalSkills?.languages || skills.technical || [])
    },
    {
      name: 'Core CS Fundamentals',
      icon: BookOpen,
      iconColor: 'text-teal-500',
      badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 hover:border-teal-500/40',
      skills: dedupeSkillsAcrossAll(summaryReport.technicalSkills?.coreCS || [])
    },
    {
      name: 'Frameworks & Web / Backend',
      icon: Layers,
      iconColor: 'text-purple-500',
      badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:border-purple-500/40',
      skills: dedupeSkillsAcrossAll([
        ...(summaryReport.technicalSkills?.backend || []),
        ...(summaryReport.technicalSkills?.frontend || []),
        ...(skills.frameworks || [])
      ])
    },
    {
      name: 'Databases & Storage',
      icon: Database,
      iconColor: 'text-blue-500',
      badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:border-blue-500/40',
      skills: dedupeSkillsAcrossAll(summaryReport.technicalSkills?.databases || skills.databases || [])
    },
    {
      name: 'AI / ML & Advanced Tech',
      icon: Cpu,
      iconColor: 'text-rose-500',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:border-rose-500/40',
      skills: dedupeSkillsAcrossAll(summaryReport.technicalSkills?.aiMl || [])
    },
    {
      name: 'Tools & Platforms',
      icon: Wrench,
      iconColor: 'text-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:border-amber-500/40',
      skills: dedupeSkillsAcrossAll(summaryReport.technicalSkills?.tools || skills.tools || [])
    }
  ].filter(cat => cat.skills.length > 0);

  const totalSkillsCount = categorizedSkills.reduce((sum, cat) => sum + cat.skills.length, 0);

  const projectsList = summaryReport.projects || (profile.projects || []).map(p => ({
    title: p.name,
    description: p.summary,
    techStack: p.technologies || [],
    features: p.highlights || [],
    advancedConcepts: p.advancedConcepts || [],
    interviewOneLiner: `Developed ${p.name}.`
  }));

  const trainingList = summaryReport.experienceAndTraining || (profile.experience || []).map(e => ({
    title: e.role,
    organization: e.company,
    details: [e.description || 'Hands-on practical development'],
    conceptsLearned: e.conceptsLearned || [],
    interviewOneLiner: `Completed ${e.role} at ${e.company}.`
  }));

  const likelyQuestions = summaryReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];
  const achievements = summaryReport.achievements || profile.achievements || [];
  const certifications = summaryReport.certifications || profile.certifications || [];
  const educationList = summaryReport.education || profile.education || [];
  const areasOfInterest = summaryReport.areasOfInterest || profile.areasOfInterest || [];

  const hasEducation = educationList.length > 0;
  const hasAchievements = achievements.length > 0;
  const hasCertifications = certifications.length > 0;
  const hasAreasOfInterest = areasOfInterest.length > 0;
  const hasAdditionalSection = hasEducation || hasAchievements || hasCertifications || hasAreasOfInterest;
  const profSummaryText = summaryReport.professionalSummary || profile.summary;

  const currentAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div className="space-y-8">
      
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
                This will remove your parsed skills, summary report, and structured candidate profile. You can upload a new PDF resume anytime.
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

      {/* Main Candidate Header Card */}
      <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 relative space-y-6">
        
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-brand-border dark:border-dark-border">
          
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
              
              {(displayEmail || displayPhone) && (
                <p className="text-xs text-brand-slate dark:text-dark-muted">
                  {[displayEmail, displayPhone].filter(Boolean).join(' • ')}
                </p>
              )}

              {/* User Links / Hyperlinks Bar */}
              {(githubLink || linkedinLink || portfolioLink || leetcodeLink) && (
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
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
                </div>
              )}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleReanalyzeResume}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:opacity-90 text-xs font-bold shadow-purple-glow transition-all disabled:opacity-50"
              title="Re-run AI analysis and regenerate summary report"
            >
              <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} />
              <span>{reanalyzing ? 'Analyzing Resume...' : 'Re-Analyze with AI'}</span>
            </button>

            <a
              href="https://resume-analyzer-eight-sigma.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-surface dark:bg-dark-bg border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:border-brand-purple text-xs font-semibold transition-all shadow-sm"
              title="Open External Resume Analyzer Tool"
            >
              <ExternalLink size={13} />
              <span>Analyzer Tool</span>
            </a>

            <button
              onClick={onReplaceResume}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:border-brand-purple hover:bg-brand-surface dark:hover:bg-dark-bg text-xs font-semibold transition-all shadow-sm"
            >
              <UploadCloud size={13} />
              <span>Replace Resume</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all shadow-sm"
              title="Delete uploaded resume"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>        {/* Extracted Skills Badges (Neat Grid) */}
        {categorizedSkills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
                <Code size={18} className="text-brand-purple dark:text-dark-purple" />
                <span>Extracted Technical Skills & Proficiencies ({totalSkillsCount})</span>
              </div>
              <span className="text-xs text-brand-slate dark:text-dark-muted font-medium">
                Extracted from resume
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorizedSkills.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2 hover:border-brand-purple/40 transition-colors"
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
              ))}
            </div>
          </div>
        )}

      </div>

      {/* AI Resume Summarization & Analysis Report - Landing Page Style */}
      <div className="space-y-8">

        {/* Section 1: Professional Summary */}
        {profSummaryText && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple flex items-center justify-center font-bold text-sm">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <Sparkles size={18} className="text-brand-purple" />
                    <span>Professional Summary</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Key overview and career background extracted from your resume.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyPitch}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-brand-border dark:border-dark-border text-xs font-semibold text-brand-charcoal dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-bg hover:border-brand-purple transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                {copiedPitch ? (
                  <>
                    <CheckCheck size={14} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-brand-purple/5 via-brand-blue/5 to-brand-cyan/5 border border-brand-purple/20 dark:border-dark-purple/30">
              <p className="text-sm sm:text-base text-brand-charcoal dark:text-dark-text leading-relaxed font-medium">
                "{profSummaryText}"
              </p>
            </div>
          </section>
        )}

        {/* Section 2: Projects & Architecture Breakdown */}
        {projectsList.length > 0 && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-dark-blue/20 text-brand-blue dark:text-dark-blue flex items-center justify-center font-bold text-sm">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <Layers size={18} className="text-brand-blue" />
                    <span>Projects & Architecture Deep Dive ({projectsList.length})</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Technical architecture, features, and key algorithms implemented in your projects
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {projectsList.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-3 hover:border-brand-blue/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Project {idx + 1}</span>
                        <h4 className="text-sm sm:text-base font-bold text-brand-charcoal dark:text-dark-text leading-snug">
                          {proj.title || proj.name}
                        </h4>
                      </div>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {/* Tech Stack */}
                    {(proj.techStack || proj.technologies || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">Tech Stack:</span>
                        <div className="flex flex-wrap gap-1">
                          {(proj.techStack || proj.technologies).map((t, ti) => (
                            <span
                              key={ti}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advanced Concepts */}
                    {(proj.advancedConcepts || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">Advanced Concepts Used:</span>
                        <div className="flex flex-wrap gap-1">
                          {proj.advancedConcepts.map((c, ci) => (
                            <span
                              key={ci}
                              className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {(proj.features || proj.highlights || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">Features:</span>
                        <ul className="space-y-0.5 text-[11px] text-brand-slate dark:text-dark-muted list-disc list-inside">
                          {(proj.features || proj.highlights).slice(0, 3).map((f, fi) => (
                            <li key={fi} className="line-clamp-1">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Interview One-Liner */}
                  {proj.interviewOneLiner && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs mt-2">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">💬 Interview One-Liner:</span>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">"{proj.interviewOneLiner}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Industrial Training & Work Experience */}
        {trainingList.length > 0 && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 dark:bg-dark-cyan/20 text-brand-cyan dark:text-dark-cyan flex items-center justify-center font-bold text-sm">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <Briefcase size={18} className="text-brand-cyan" />
                    <span>Industrial Training & Work Experience ({trainingList.length})</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Corporate internships, industrial programs, and domain knowledge
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {trainingList.map((tr, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-brand-charcoal dark:text-dark-text">
                        {tr.title}
                      </h4>
                      <p className="text-xs font-semibold text-brand-purple dark:text-dark-purple">
                        {tr.organization}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold self-start">
                      Industrial Training
                    </span>
                  </div>

                  {(tr.details || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">What You Did:</span>
                      <ul className="space-y-1 text-xs text-brand-slate dark:text-dark-muted list-disc list-inside">
                        {tr.details.map((d, di) => (
                          <li key={di}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(tr.conceptsLearned || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">Concepts Mastered:</span>
                      <div className="flex flex-wrap gap-1">
                        {tr.conceptsLearned.map((c, ci) => (
                          <span
                            key={ci}
                            className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-semibold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {tr.interviewOneLiner && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">💬 Interview One-Liner:</span>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">"{tr.interviewOneLiner}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Most Likely Interview Questions */}
        {likelyQuestions.length > 0 && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <HelpCircle size={18} className="text-amber-500" />
                    <span>Most Likely Interview Questions From Your Resume</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    The AI generates dynamic interview questions targeting these exact topics and project concepts
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {likelyQuestions.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="p-5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-purple"></span>
                    <h4 className="text-xs sm:text-sm font-bold text-brand-charcoal dark:text-dark-text">
                      {group.category}
                    </h4>
                  </div>

                  <ul className="space-y-2 text-xs text-brand-slate dark:text-dark-muted">
                    {(group.questions || []).map((q, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-brand-border/60 dark:border-dark-border/60">
                        <HelpCircle size={14} className="text-brand-purple shrink-0 mt-0.5" />
                        <span className="text-brand-charcoal dark:text-dark-text font-medium leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Education, Certifications, Achievements & Areas of Interest */}
        {hasAdditionalSection && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <GraduationCap size={18} className="text-emerald-500" />
                    <span>Education, Certifications, Achievements & Areas of Interest</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Academic qualifications, verified credentials, and specialized engineering tracks
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
              
              {/* Education */}
              {hasEducation && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <GraduationCap size={15} className="text-brand-purple" />
                    <span>Education</span>
                  </div>
                  <div className="space-y-2">
                    {educationList.map((ed, ei) => (
                      <div key={ei} className="text-xs pb-1 border-b border-brand-border/40 last:border-0 last:pb-0">
                        <p className="font-bold text-brand-charcoal dark:text-dark-text">{ed.degree}</p>
                        <p className="text-[11px] text-brand-slate dark:text-dark-muted">{ed.institution}</p>
                        <div className="flex gap-2 text-[10px] text-brand-purple font-semibold mt-0.5">
                          <span>{ed.year}</span>
                          {ed.score && <span>• {ed.score}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {hasAchievements && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <Award size={15} className="text-amber-500" />
                    <span>Achievements</span>
                  </div>
                  <div className="space-y-1.5">
                    {achievements.map((ach, ai) => (
                      <div key={ai} className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-brand-border/60 text-xs font-medium text-brand-charcoal dark:text-dark-text">
                        {ach}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {hasCertifications && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <FileCheck size={15} className="text-emerald-500" />
                    <span>Certifications</span>
                  </div>
                  <div className="space-y-1.5">
                    {certifications.map((cert, ci) => (
                      <div key={ci} className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-brand-border/60 text-xs font-medium text-brand-charcoal dark:text-dark-text">
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas of Interest */}
              {hasAreasOfInterest && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <Compass size={15} className="text-blue-500" />
                    <span>Areas of Interest</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {areasOfInterest.map((aoi, aii) => (
                      <span
                        key={aii}
                        className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold"
                      >
                        {aoi}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

      </div>

    </div>
  );
};

export default DynamicProfileCard;
