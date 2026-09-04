import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Cpu, HelpCircle, FileText, Settings, Award, AlertCircle, TrendingUp, Calendar, ChevronRight, Sparkles, UploadCloud, Clock, CheckCircle2, Lock } from 'lucide-react';
import Toast from '../components/Toast';
import ResumeUploadModal from '../components/ResumeIntelligence/ResumeUploadModal';
import DynamicProfileCard from '../components/ResumeIntelligence/DynamicProfileCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [resumeProfile, setResumeProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReplacingResume, setIsReplacingResume] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Get user profile statistics
      const profileRes = await axios.get('/api/user/profile');
      if (profileRes.data.success) {
        setStats(profileRes.data.data.stats);
      }

      // 2. Get recent interviews
      const historyRes = await axios.get('/api/interview/history');
      if (historyRes.data.success) {
        setRecentInterviews(historyRes.data.data.slice(0, 3));
      }

      // 3. Get Resume Profile
      const resumeRes = await axios.get('/api/resume/profile');
      if (resumeRes.data.success) {
        setResumeProfile(resumeRes.data.data);
      }

      // 4. Get Resume Interview Eligibility
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

  // --- CHART CONFIGURATIONS ---

  const gridColor = isDark ? '#334155' : '#F1F5F9';
  const tickColor = isDark ? '#94A3B8' : '#475569';
  const tooltipBg = isDark ? '#1E293B' : '#0F172A';
  const tooltipBorder = isDark ? '#475569' : '#E2E8F0';

  // 1. Performance Trend Line Chart
  const trendData = {
    labels: stats?.performanceTrend?.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Interview Score (%)',
        data: stats?.performanceTrend?.map(item => item.score) || [],
        fill: true,
        borderColor: isDark ? '#A78BFA' : '#7C3AED', // Dark purple vs brand purple
        backgroundColor: isDark ? 'rgba(167, 139, 250, 0.05)' : 'rgba(124, 58, 237, 0.05)',
        tension: 0.3,
        pointBackgroundColor: '#6366F1', // Electric Blue
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Outfit', size: 14 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: { font: { family: 'Outfit' }, color: tickColor }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Outfit' }, color: tickColor }
      }
    }
  };

  // 2. Topic-wise Performance Bar Chart
  const topicLabels = stats?.topicPerformance?.map(item => item.topic) || [];
  const topicScores = stats?.topicPerformance?.map(item => item.avgScore) || [];

  const topicData = {
    labels: topicLabels,
    datasets: [
      {
        label: 'Average Score (%)',
        data: topicScores,
        backgroundColor: isDark ? '#818CF8' : '#6366F1', // Indigo bar in dark mode, blue in light
        borderRadius: 8,
        barThickness: 24,
      }
    ]
  };

  const topicOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: { font: { family: 'Outfit' }, color: tickColor }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Outfit' }, color: tickColor }
      }
    }
  };

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

  // Fallback default statistics when database is empty / offline
  const displayStats = stats || {
    totalInterviews: 0,
    averageScore: 0,
    highestScore: 0,
    bestTopic: 'N/A',
    weakestTopic: 'N/A',
    topicPerformance: [],
    performanceTrend: []
  };

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
                  <span>Upload Resume PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Interviews */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300">
          <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Total Mock Exams</p>
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{displayStats.totalInterviews}</span>
            <span className="px-2.5 py-1 rounded-full bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple text-[10px] font-bold">Sessions</span>
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300">
          <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Average Score</p>
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{displayStats.averageScore}%</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Global Avg</span>
          </div>
        </div>

        {/* Card 3: Highest Score */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300">
          <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Highest Score</p>
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{displayStats.highestScore}%</span>
            <span className="px-2.5 py-1 rounded-full bg-brand-glowBlue dark:bg-dark-blue/20 text-brand-blue dark:text-dark-blue text-[10px] font-bold">Best Record</span>
          </div>
        </div>

        {/* Card 4: Target Area */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300">
          <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Focus Topic</p>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-brand-charcoal dark:text-dark-text font-outfit truncate">{displayStats.bestTopic}</span>
            <span className="text-[10px] text-brand-slate dark:text-dark-muted">Weakest: {displayStats.weakestTopic}</span>
          </div>
        </div>

      </div>

      {/* Navigation Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        
        <Link to="/practice" className="flex items-center gap-4 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border p-5 rounded-2xl hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium dark:hover:shadow-neon-purple transition-all">
          <div className="w-10 h-10 rounded-xl bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-none mb-1">Practice Pool</h4>
            <p className="text-xs text-brand-slate dark:text-dark-muted">Self-paced questions</p>
          </div>
        </Link>

        <Link to="/interview/setup" className="flex items-center gap-4 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border p-5 rounded-2xl hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium dark:hover:shadow-neon-purple transition-all">
          <div className="w-10 h-10 rounded-xl bg-brand-glowBlue dark:bg-dark-blue/20 flex items-center justify-center text-brand-blue dark:text-dark-blue shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-none mb-1">AI Simulator</h4>
            <p className="text-xs text-brand-slate dark:text-dark-muted">Graded interview exam</p>
          </div>
        </Link>

        <Link to="/history" className="flex items-center gap-4 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border p-5 rounded-2xl hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium dark:hover:shadow-neon-purple transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-none mb-1">History Log</h4>
            <p className="text-xs text-brand-slate dark:text-dark-muted">Past transcripts & reviews</p>
          </div>
        </Link>

        <Link to="/profile" className="flex items-center gap-4 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border p-5 rounded-2xl hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium dark:hover:shadow-neon-purple transition-all">
          <div className="w-10 h-10 rounded-xl bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-none mb-1">Settings</h4>
            <p className="text-xs text-brand-slate dark:text-dark-muted">Edit profile details</p>
          </div>
        </Link>

      </div>



      {/* Recent Interviews Panel */}
      <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-outfit font-extrabold text-lg text-brand-charcoal dark:text-dark-text">Recent Mock Assessments</h3>
          <Link to="/history" className="text-xs font-bold text-brand-purple dark:text-dark-purple hover:underline flex items-center gap-0.5">
            <span>View All Logs</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {recentInterviews.length > 0 ? (
            recentInterviews.map((interview) => (
              <div
                key={interview._id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border border-brand-border dark:border-dark-border bg-brand-surface dark:bg-dark-surface hover:border-brand-purple dark:hover:border-dark-purple transition-all gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple font-outfit font-bold">
                    {interview.score}%
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-snug">{interview.topic} Mock Interview</h4>
                    <div className="flex gap-3 text-xs text-brand-slate dark:text-dark-muted mt-0.5">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(interview.date).toLocaleDateString()}</span>
                      <span className="capitalize">Difficulty: {interview.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                    interview.status === 'terminated' 
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                  }`}>
                    {interview.status === 'terminated' ? 'Terminated (Integrity)' : 'Completed'}
                  </span>
                  
                  <Link
                    to={`/interview/feedback/${interview._id}`}
                    className="px-4 py-2 text-xs font-bold text-white bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover rounded-xl shadow-premium dark:shadow-neon-purple transition-all"
                  >
                    View Report Card
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-brand-slate dark:text-dark-muted bg-brand-surface dark:bg-dark-surface rounded-2xl border border-dashed border-brand-border dark:border-dark-border">
              No interview logs recorded. Choose a topic and difficulty above to launch your first exam.
            </div>
          )}
        </div>

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
