import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, UploadCloud, CheckCircle2, Lock, FileText, ChevronRight } from 'lucide-react';
import Toast from '../components/Toast';
import ResumeUploadModal from '../components/ResumeIntelligence/ResumeUploadModal';
import DynamicProfileCard from '../components/ResumeIntelligence/DynamicProfileCard';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [resumeProfile, setResumeProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReplacingResume, setIsReplacingResume] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Get Resume Profile
      const resumeRes = await axios.get('/api/resume/profile');
      if (resumeRes.data.success) {
        setResumeProfile(resumeRes.data.data);
      }

      // 2. Get Resume Interview Eligibility
      const eligRes = await axios.get('/api/interview/resume/eligibility');
      if (eligRes.data.success) {
        setEligibility(eligRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setToast({ message: 'Failed to retrieve dashboard analytics.', type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
        {/* Shimmer skeleton loading effect */}
        <div className="h-10 w-48 rounded-xl bg-gray-200 dark:bg-dark-card animate-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          <div className="h-80 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none relative bg-white dark:bg-dark-bg transition-colors duration-300">
      
      {/* Resume Intelligence Section (Placed at Top of Page) */}
      <section className="space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue text-white flex items-center justify-center shadow-purple-glow">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-charcoal dark:text-dark-text font-outfit">
                  Resume Intelligence & Profile
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
                  Version 2
                </span>
              </div>
              <p className="text-xs text-brand-slate dark:text-dark-muted">
                Extracts projects, skills, and feeds dynamic questions into your mock interviews
              </p>
            </div>
          </div>

          {/* Cooldown Status Badge */}
          {eligibility && (
            <div className="flex items-center gap-2">
              {eligibility.eligible ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Interview Ready ({eligibility.remainingWeekly}/2 this week)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  <Lock size={14} className="text-amber-500" />
                  <span>Locked: Unlocks in {eligibility.hoursRemaining || 72}h</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Profile or Upload CTA */}
        {resumeProfile ? (
          <div className="space-y-6">
            <DynamicProfileCard
              profile={resumeProfile}
              user={user}
              onReplaceResume={() => {
                setIsReplacingResume(true);
                setIsUploadModalOpen(true);
              }}
              onProfileUpdated={fetchDashboardData}
            />
          </div>
        ) : (
          <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-brand-purple/10 via-brand-blue/10 to-brand-cyan/10 border-2 border-dashed border-brand-purple/30 dark:border-dark-purple/40 text-center">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-purple dark:bg-dark-purple text-white flex items-center justify-center shadow-purple-glow">
                <UploadCloud size={30} />
              </div>
              <h3 className="text-2xl font-extrabold text-brand-charcoal dark:text-dark-text font-outfit">
                Unlock Resume-Based AI Interviews
              </h3>
              <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">
                Upload your resume PDF once. Our intelligent extractor analyzes your real projects, skills, frameworks, and work history to simulate a personalized technical & HR round.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsReplacingResume(false);
                    setIsUploadModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-bold text-sm shadow-purple-glow hover:translate-y-[-1px] transition-all"
                >
                  <UploadCloud size={18} />
                  <span>Upload or Paste Resume</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Bottom Link Banner: View History & Past Logs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-purple/10 via-brand-blue/10 to-emerald-500/10 border border-brand-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple flex items-center justify-center shrink-0 shadow-sm">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit">
              Interview History & Assessment Logs
            </h3>
            <p className="text-xs text-brand-slate dark:text-dark-muted">
              Access your completed interview session transcripts, detailed evaluations, and score reports.
            </p>
          </div>
        </div>

        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white text-xs font-bold shadow-purple-glow transition-all hover:translate-x-0.5 shrink-0"
        >
          <span>View History & Logs</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Resume Upload / Replace Modal */}
      <ResumeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchDashboardData}
        isReplacing={isReplacingResume}
      />
    </div>
  );
};

export default Dashboard;

