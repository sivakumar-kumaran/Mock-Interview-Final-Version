import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, TrendingUp, Sparkles, CheckCircle2, Clock, Calendar, PlusCircle } from 'lucide-react';

const ResumeVersionHistory = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersionHistory();
  }, []);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/resume/versions');
      if (res.data.success) {
        setVersions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching resume version history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl animate-pulse">
        <div className="h-6 w-48 bg-brand-surface dark:bg-dark-bg rounded-lg mb-4" />
        <div className="h-20 bg-brand-surface dark:bg-dark-bg rounded-2xl" />
      </div>
    );
  }

  if (versions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-border dark:border-dark-border mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-cyan/10 dark:bg-dark-cyan/20 text-brand-cyan dark:text-dark-cyan flex items-center justify-center">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit">
              Resume Version History & Skill Growth
            </h3>
            <p className="text-xs text-brand-slate dark:text-dark-muted">
              Tracking skill evolution and profile milestones across uploads
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <TrendingUp size={14} />
          <span>{versions.length} Version{versions.length > 1 ? 's' : ''} Logged</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border dark:before:bg-dark-border">
        {versions.map((ver, index) => {
          const isLatest = index === 0;
          const uploadDate = new Date(ver.uploadedAt || ver.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div key={ver._id || index} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                  isLatest
                    ? 'bg-brand-purple dark:bg-dark-purple border-white dark:border-dark-card shadow-purple-glow ring-4 ring-brand-purple/20'
                    : 'bg-white dark:bg-dark-bg border-brand-slate dark:border-dark-muted'
                }`}
              />

              {/* Version Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-brand-surface/60 dark:bg-dark-bg/60 border border-brand-border/80 dark:border-dark-border/80 hover:border-brand-purple/50 dark:hover:border-dark-purple/50 transition-all">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-outfit font-bold text-sm text-brand-charcoal dark:text-dark-text">
                      Version {ver.versionNumber}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-purple text-white text-[10px] font-bold">
                        Active Profile
                      </span>
                    )}
                    <span className="text-xs text-brand-slate dark:text-dark-muted font-normal">
                      ({ver.resumeFileName || 'Resume.pdf'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-brand-slate dark:text-dark-muted">
                    <Calendar size={13} />
                    <span>{uploadDate}</span>
                  </div>
                </div>

                {/* Target Role & Snapshot Stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-brand-slate dark:text-dark-muted mb-3">
                  <span>Role: <strong className="text-brand-charcoal dark:text-dark-text">{ver.targetRole || 'Full Stack Developer'}</strong></span>
                  <span>•</span>
                  <span>{ver.skills?.length || 0} Total Skills</span>
                  <span>•</span>
                  <span>{ver.projectsCount || 0} Projects</span>
                  <span>•</span>
                  <span>{ver.experienceCount || 0} Experience items</span>
                </div>

                {/* New Skills Unlocked in this Version */}
                {(ver.skillsAddedSinceLastVersion || []).length > 0 && (
                  <div className="mt-2 pt-2.5 border-t border-brand-border/60 dark:border-dark-border/60">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                      <PlusCircle size={13} />
                      <span>New Skills Added in this version:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ver.skillsAddedSinceLastVersion.map((skill, si) => (
                        <span
                          key={si}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          +{skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ResumeVersionHistory;
