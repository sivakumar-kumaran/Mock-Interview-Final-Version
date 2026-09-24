import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Code,
  Sparkles,
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
  Layers,
  Wrench,
  Copy,
  CheckCheck,
  Briefcase,
  HelpCircle,
  GraduationCap,
  RefreshCw,
  Compass,
  CheckCircle2
} from 'lucide-react';
import ResumeAnalyzingCard from './ResumeAnalyzingCard';

const DynamicProfileCard = ({ profile, user, onReplaceResume, onProfileUpdated }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeComplete, setReanalyzeComplete] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [copiedPitch, setCopiedPitch] = useState(false);
  const photoInputRef = useRef(null);

  if (!profile) return null;

  const basic = profile.basicDetails || {};
  const skills = profile.skills || {};
  const summaryReport = profile.summaryReport || {};

  // Clean Candidate Name & Email strictly from extracted data or user
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

  // Highlighted CGPA / Percentage
  const educationList = summaryReport.education || profile.education || [];
  const highlightedScore = basic.cgpaOrPercentage || summaryReport.cgpaOrPercentage || educationList[0]?.score || '';
  const primaryEdu = educationList.length > 0 ? educationList[0] : null;

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
      setReanalyzeComplete(false);
      const res = await axios.post('/api/resume/re-analyze');
      if (res.data.success) {
        setReanalyzing(false);
        setReanalyzeComplete(true);
      } else {
        setReanalyzing(false);
      }
    } catch (err) {
      console.error('Failed to re-analyze resume:', err);
      setReanalyzing(false);
      setReanalyzeComplete(false);
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

  // Copy Summary to clipboard
  const handleCopyPitch = () => {
    const pitchText = summaryReport.professionalSummary || profile.summary || '';
    if (pitchText) {
      navigator.clipboard.writeText(pitchText);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2500);
    }
  };

  // Strict Global Cross-Category Deduplication: No skill appears twice anywhere
  const globalSeenSkills = new Set();
  const dedupeSkills = (arr) => {
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

  // 3 distinct skill categories strictly adhering to requirements: Languages, Tech Stacks, Tools
  const categorizedSkills = [
    {
      name: 'Languages',
      icon: Code,
      iconColor: 'text-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40',
      skills: dedupeSkills(summaryReport.technicalSkills?.languages || skills.technical || [])
    },
    {
      name: 'Tech Stacks & Frameworks',
      icon: Layers,
      iconColor: 'text-purple-500',
      badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:border-purple-500/40',
      skills: dedupeSkills([
        ...(summaryReport.technicalSkills?.backend || []),
        ...(summaryReport.technicalSkills?.frontend || []),
        ...(summaryReport.technicalSkills?.databases || []),
        ...(skills.frameworks || []),
        ...(skills.databases || [])
      ])
    },
    {
      name: 'Tools & Platforms',
      icon: Wrench,
      iconColor: 'text-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:border-amber-500/40',
      skills: dedupeSkills(summaryReport.technicalSkills?.tools || skills.tools || [])
    }
  ].filter(cat => cat.skills.length > 0);

  const totalSkillsCount = categorizedSkills.reduce((sum, cat) => sum + cat.skills.length, 0);

  // Real Projects
  const projectsList = (summaryReport.projects && summaryReport.projects.length > 0)
    ? summaryReport.projects
    : (profile.projects || []).map(p => ({
        title: p.name,
        description: p.summary || '',
        techStack: p.technologies || [],
        features: p.highlights || [],
        githubUrl: p.githubUrl || '',
        liveUrl: p.liveUrl || ''
      }));

  // Real Internships & Experience (Only if candidate completed internship!)
  const internshipsList = (summaryReport.experienceAndTraining && summaryReport.experienceAndTraining.length > 0)
    ? summaryReport.experienceAndTraining
    : (profile.experience || []).filter(e => e.role || e.company);

  const hasCompletedInternship = internshipsList.length > 0;

  // Real Certifications
  const certifications = summaryReport.certifications?.length > 0 
    ? summaryReport.certifications 
    : (profile.certifications || []);
  const hasCertifications = certifications.length > 0;

  // Real Achievements
  const achievements = summaryReport.achievements?.length > 0 
    ? summaryReport.achievements 
    : (profile.achievements || []);
  const hasAchievements = achievements.length > 0;

  // Real Areas of Interest
  const areasOfInterest = summaryReport.areasOfInterest?.length > 0 
    ? summaryReport.areasOfInterest 
    : (profile.areasOfInterest || []);
  const hasAreasOfInterest = areasOfInterest.length > 0;

  // Real Likely Interview Questions
  const likelyQuestions = summaryReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];

  const profSummaryText = summaryReport.professionalSummary || profile.summary;
  const currentAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div className="space-y-8">

      {/* Low-confidence warning banner */}
      {profile.extractionLowConfidence && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-bold">AI analysis was unavailable during upload.</span>
            {' '}The resume was parsed with a basic text extractor, which may be less accurate for CGPA, skills, and projects.
            {' '}<button
              onClick={handleReanalyzeResume}
              className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              Click here to re-analyze with AI now.
            </button>
          </div>
        </div>
      )}

      
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
                This will remove your parsed skills, real project details, and structured profile. You can upload a new PDF resume anytime.
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
                  {profile.targetRole || 'Full Stack Developer'}
                </span>
              </div>
              
              {(displayEmail || displayPhone) && (
                <p className="text-xs text-brand-slate dark:text-dark-muted">
                  {[displayEmail, displayPhone].filter(Boolean).join(' • ')}
                </p>
              )}

              {/* Real Hyperlinks Bar (Only shown if links actually exist in resume) */}
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

          {/* Action Buttons: Clean & Internal Only */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleReanalyzeResume}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:opacity-90 text-xs font-bold shadow-purple-glow transition-all disabled:opacity-50"
              title="Re-run AI extraction directly from resume text"
            >
              <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} />
              <span>{reanalyzing ? 'Analyzing Resume...' : 'Re-Analyze with AI'}</span>
            </button>

            <button
              onClick={onReplaceResume}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text hover:border-brand-purple hover:bg-brand-surface dark:hover:bg-dark-bg text-xs font-semibold transition-all shadow-sm"
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
        </div>

        {/* 3. Languages, Tech Stacks & Tools Grid (Strictly Deduplicated) */}
        {categorizedSkills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal dark:text-dark-text font-outfit">
                <Code size={18} className="text-brand-purple dark:text-dark-purple" />
                <span>Languages, Tech Stacks & Tools ({totalSkillsCount})</span>
              </div>
              <span className="text-xs text-brand-slate dark:text-dark-muted font-medium">
                Extracted purely from resume • Zero duplicates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categorizedSkills.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2 hover:border-brand-purple/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <cat.icon size={14} className={cat.iconColor} />
                      <span className="text-brand-charcoal dark:text-dark-text font-bold text-[11px] uppercase tracking-wider">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-border/40 dark:bg-dark-border/60 text-brand-slate dark:text-dark-muted">
                      {cat.skills.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${cat.badgeClass}`}
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

      {/* Main Details Section */}
      <div className="space-y-8">

        {/* 2. Professional Summary & Highlighted CGPA / Percentage */}
        <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border dark:border-dark-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple flex items-center justify-center font-bold text-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                  <span>Professional Summary & Highlights</span>
                </h3>
                <p className="text-xs text-brand-slate dark:text-dark-muted">
                  Career profile and highlighted academic score extracted from your resume
                </p>
              </div>
            </div>

            {profSummaryText && (
              <button
                onClick={handleCopyPitch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border dark:border-dark-border text-xs font-semibold text-brand-charcoal dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-bg hover:border-brand-purple transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                {copiedPitch ? (
                  <>
                    <CheckCheck size={14} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Highlighted CGPA / Academic Score Banner */}
          {highlightedScore && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-brand-purple/10 border border-amber-500/30 dark:border-amber-400/30 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                    Highlighted Academic Score / CGPA
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-black text-brand-charcoal dark:text-dark-text font-outfit text-amber-600 dark:text-amber-400">
                      {highlightedScore}
                    </span>
                    {primaryEdu && (
                      <span className="text-xs text-brand-slate dark:text-dark-muted font-medium">
                        • {primaryEdu.degree} ({primaryEdu.institution}{primaryEdu.year ? `, ${primaryEdu.year}` : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold self-start sm:self-auto">
                Verified from Resume
              </span>
            </div>
          )}

          {/* Summary Text */}
          {profSummaryText && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-brand-purple/5 via-brand-blue/5 to-brand-cyan/5 border border-brand-purple/20 dark:border-dark-purple/30">
              <p className="text-sm sm:text-base text-brand-charcoal dark:text-dark-text leading-relaxed font-medium">
                "{profSummaryText}"
              </p>
            </div>
          )}
        </section>

        {/* 4. Projects Completed Section (Count, Title with Descriptions) */}
        {projectsList.length > 0 && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-dark-blue/20 text-brand-blue dark:text-dark-blue flex items-center justify-center font-bold text-sm">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <span>Projects Completed ({projectsList.length})</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Exact projects, descriptions, and technical stacks extracted from your resume
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
                        <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">
                          Project {idx + 1}
                        </span>
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
                        <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">
                          Technologies Used:
                        </span>
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

                    {/* Features / Highlights */}
                    {(proj.features || proj.highlights || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-brand-slate dark:text-dark-muted block mb-1">
                          Key Features:
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-brand-slate dark:text-dark-muted list-disc list-inside">
                          {(proj.features || proj.highlights).slice(0, 3).map((f, fi) => (
                            <li key={fi} className="line-clamp-2">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Project Links if available in resume */}
                  {(proj.githubUrl || proj.liveUrl) && (
                    <div className="flex gap-2 pt-2 border-t border-brand-border/40">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl.startsWith('http') ? proj.githubUrl : `https://${proj.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-brand-purple font-semibold hover:underline"
                        >
                          <Github size={11} />
                          <span>Code</span>
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl.startsWith('http') ? proj.liveUrl : `https://${proj.liveUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold hover:underline"
                        >
                          <Globe size={11} />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Completed Internship & Industrial Experience (ONLY shown if candidate completed internship!) */}
        {hasCompletedInternship && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 dark:bg-dark-cyan/20 text-brand-cyan dark:text-dark-cyan flex items-center justify-center font-bold text-sm">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <span>Internship & Practical Experience ({internshipsList.length})</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Completed internships, organizations, and verified hands-on work history
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {internshipsList.map((tr, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-brand-charcoal dark:text-dark-text">
                        {tr.title || tr.role}
                      </h4>
                      <p className="text-xs font-semibold text-brand-purple dark:text-dark-purple">
                        {tr.organization || tr.company}
                      </p>
                    </div>
                    {tr.duration && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold self-start">
                        {tr.duration}
                      </span>
                    )}
                  </div>

                  {tr.description && (
                    <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed">
                      {tr.description}
                    </p>
                  )}

                  {(tr.details || []).length > 0 && (
                    <ul className="space-y-1 text-xs text-brand-slate dark:text-dark-muted list-disc list-inside">
                      {tr.details.map((d, di) => (
                        <li key={di}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Certifications, Achievements & Areas of Interest (ONLY shown if present in resume!) */}
        {(hasCertifications || hasAchievements || hasAreasOfInterest) && (
          <section className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit flex items-center gap-2">
                    <span>Credentials, Achievements & Areas of Interest</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Verified qualifications and specializations extracted from your resume
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              
              {/* Certifications (Only if completed) */}
              {hasCertifications && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <FileCheck size={15} className="text-emerald-500" />
                    <span>Certifications ({certifications.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {certifications.map((cert, ci) => (
                      <div key={ci} className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-brand-border/60 text-xs font-medium text-brand-charcoal dark:text-dark-text">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements (Only if completed) */}
              {hasAchievements && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <Award size={15} className="text-amber-500" />
                    <span>Achievements ({achievements.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {achievements.map((ach, ai) => (
                      <div key={ai} className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-brand-border/60 text-xs font-medium text-brand-charcoal dark:text-dark-text">
                        <Award size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas of Interest (Only if present in resume) */}
              {hasAreasOfInterest && (
                <div className="p-4 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal dark:text-dark-text">
                    <Compass size={15} className="text-blue-500" />
                    <span>Areas of Interest ({areasOfInterest.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {areasOfInterest.map((aoi, aii) => (
                      <span
                        key={aii}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium"
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

        {/* Dynamic Interview Questions Tailored to Resume */}
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
                    <span>Dynamic Interview Questions From Your Resume</span>
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Questions generated strictly targeting your real projects and technical stacks
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

      </div>

      {/* Full screen Analyzing Card with Payment-Done symbol on completion */}
      {(reanalyzing || reanalyzeComplete) && (
        <ResumeAnalyzingCard
          isAnalyzing={reanalyzing}
          isComplete={reanalyzeComplete}
          onComplete={() => {
            setReanalyzeComplete(false);
            if (onProfileUpdated) onProfileUpdated();
          }}
        />
      )}

    </div>
  );
};

export default DynamicProfileCard;
