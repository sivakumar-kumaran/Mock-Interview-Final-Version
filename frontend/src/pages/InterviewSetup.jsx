import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { HelpCircle, ChevronRight, AlertTriangle, ShieldCheck, Play, ArrowLeft, Cpu, Brain, BookOpen, ArrowRight, Sparkles, FileText, Lock, CheckCircle2, UploadCloud } from 'lucide-react';
import Toast from '../components/Toast';
import ResumeUploadModal from '../components/ResumeIntelligence/ResumeUploadModal';

const InterviewSetup = () => {
  const { user } = useAuth();
  const { startNewInterview, startResumeInterview, checkResumeEligibility } = useInterview();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [mode, setMode] = useState(null); // 'resume', 'ai', 'practice'
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [resumeProfile, setResumeProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch topics list and resume profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/topics');
        if (res.data.success && res.data.data.length > 0) {
          setTopics(res.data.data);
          setSelectedTopic(res.data.data[0].title);
        }

        const profileRes = await axios.get('/api/resume/profile');
        if (profileRes.data.success && profileRes.data.data) {
          setResumeProfile(profileRes.data.data);
        }

        const eligRes = await axios.get('/api/interview/resume/eligibility');
        if (eligRes.data.success) {
          setEligibility(eligRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching setup data:', err);
      }
    };

    fetchData();
  }, []);

  const handleStart = async () => {
    if (!mode) {
      setToast({ message: 'Please select an interview style', type: 'error' });
      return;
    }

    setLoading(true);

    if (mode === 'resume') {
      if (!resumeProfile) {
        setLoading(false);
        setIsUploadModalOpen(true);
        return;
      }

      if (eligibility && !eligibility.eligible) {
        setLoading(false);
        setToast({ message: eligibility.message || 'Cooldown active for resume interviews', type: 'warning' });
        return;
      }

      const res = await startResumeInterview(difficulty);
      setLoading(false);

      if (res.success) {
        navigate('/interview/active');
      } else {
        setToast({ message: res.message || 'Failed to start resume interview', type: 'error' });
      }
    } else {
      // Version 1 (Topic-based) or Practice
      if (!selectedTopic || !difficulty) {
        setLoading(false);
        setToast({ message: 'Please select topic and difficulty', type: 'error' });
        return;
      }

      const res = await startNewInterview(selectedTopic, difficulty, mode);
      setLoading(false);

      if (res.success) {
        navigate('/interview/active');
      } else {
        setToast({ message: res.message || 'Failed to start interview', type: 'error' });
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-dark-bg px-4 py-16 transition-colors duration-300">
        <div className="bg-ambient-glow glow-purple"></div>
        <div className="bg-ambient-glow glow-blue"></div>
        <div className="max-w-md w-full bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card text-center space-y-6 relative z-10 glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple mx-auto animate-pulse">
            <Cpu size={32} />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Interview Simulator Locked</h2>
            <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">
              Please log in or create an account to start a full AI-monitored mock interview exam.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-sm transition-all shadow-premium"
          >
            <span>Sign In to Start</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Step 1: Mode Selection
  if (!mode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white dark:bg-dark-bg transition-colors duration-300 select-none relative">
        <div className="bg-ambient-glow glow-purple"></div>
        <div className="bg-ambient-glow glow-blue"></div>

        <div className="max-w-4xl w-full space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple text-sm font-semibold mb-4">
              <Sparkles size={16} />
              <span>Choose Interview Track</span>
            </div>
            <h1 className="font-outfit font-extrabold text-3xl md:text-4xl text-brand-charcoal dark:text-dark-text mb-3">
              Select Your Interview Format
            </h1>
            <p className="text-brand-slate dark:text-dark-muted max-w-xl mx-auto">
              Choose between personalized Resume-Based assessment or targeted technical track practice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Mode 1 (NEW!): Resume-Based AI Interview */}
            <button
              onClick={() => setMode('resume')}
              className="group text-left relative bg-white dark:bg-dark-card border-2 border-brand-purple dark:border-dark-purple rounded-3xl p-6 sm:p-7 hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                🚀 Version 2
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white mb-4 shadow-purple-glow group-hover:scale-105 transition-transform">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mb-1">
                  Resume-Based AI Interview
                </h3>
                <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed mb-4">
                  Tailored multi-stage interview generated from your resume, projects, skills, and target role. Includes live coding round!
                </p>

                <ul className="space-y-1.5 text-xs text-brand-slate dark:text-dark-muted">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                    <span>Projects & Tech Stack Deep Dive</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                    <span>Interactive Embedded Coding Round</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                    <span>8 Comprehensive Resume Metrics</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-brand-border dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-purple dark:text-dark-purple">
                  {resumeProfile ? `Ready (${resumeProfile.targetRole})` : 'Resume Upload Required'}
                </span>
                <ChevronRight size={16} className="text-brand-purple group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Mode 2: Topic-Based AI Interview (Version 1) */}
            <button
              onClick={() => setMode('ai')}
              className="group text-left bg-white dark:bg-dark-card border-2 border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-7 hover:border-brand-blue dark:hover:border-dark-blue hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center text-white mb-4 shadow-cyan-glow group-hover:scale-105 transition-transform">
                  <Brain size={22} />
                </div>
                <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mb-1">
                  Topic-Based Interview
                </h3>
                <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed mb-4">
                  Focused 5-question exam on a specific domain (Java, React, SQL, DSA, System Design, etc.).
                </p>

                <ul className="space-y-1.5 text-xs text-brand-slate dark:text-dark-muted">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                    <span>12 Specialized Topic Tracks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                    <span>Proctored Full-Screen Exam</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                    <span>Unlimited Free Practice</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-brand-border dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-blue dark:text-dark-blue">
                  Select Topic Track
                </span>
                <ChevronRight size={16} className="text-brand-blue group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Mode 3: Practice Mode */}
            <button
              onClick={() => setMode('practice')}
              className="group text-left bg-white dark:bg-dark-card border-2 border-brand-border dark:border-dark-border rounded-3xl p-6 sm:p-7 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-4 shadow-cyan-glow group-hover:scale-105 transition-transform">
                  <BookOpen size={22} />
                </div>
                <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mb-1">
                  Practice Mode
                </h3>
                <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed mb-4">
                  Relaxed, non-monitored prep. Ideal for answering questions at your own pace without full-screen restrictions.
                </p>

                <ul className="space-y-1.5 text-xs text-brand-slate dark:text-dark-muted">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Self-Paced Practice Questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>No Integrity Lockdowns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Instant AI Answer Feedback</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-brand-border dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Select Practice
                </span>
                <ChevronRight size={16} className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <ResumeUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={async () => {
            const profileRes = await axios.get('/api/resume/profile');
            if (profileRes.data.success) setResumeProfile(profileRes.data.data);
            const eligRes = await axios.get('/api/interview/resume/eligibility');
            if (eligRes.data.success) setEligibility(eligRes.data.data);
          }}
        />
      </div>
    );
  }

  // Step 2: Configuration + Rules
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 select-none space-y-8 relative bg-white dark:bg-dark-bg min-h-[80vh] transition-colors duration-300">
      <div className="bg-ambient-glow glow-blue"></div>

      <div>
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-2 text-sm text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Change Track</span>
        </button>
        <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
          <Sparkles className="text-brand-purple dark:text-dark-purple" size={32} />
          <span>
            {mode === 'resume'
              ? 'Resume-Based AI Interview'
              : mode === 'ai'
              ? 'AI Interview Simulator'
              : 'Practice Interview'}
          </span>
        </h1>
        <p className="text-brand-slate dark:text-dark-muted text-sm">
          {mode === 'resume'
            ? 'Personalized interview generated from your extracted projects, technical skills, and target role.'
            : mode === 'ai'
            ? 'Configure your topic and difficulty to start a full AI-monitored mock interview.'
            : 'Select your topic and difficulty for a relaxed practice session with AI evaluation.'}
        </p>
      </div>

      {!showRules ? (
        /* Configuration Stage */
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card space-y-6 relative z-10 glass-panel">
          
          <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
            {mode === 'resume' ? 'Candidate Profile & Parameters' : 'Interview Configuration'}
          </h3>

          <div className="space-y-5">
            {/* Mode Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                mode === 'resume'
                  ? 'bg-brand-purple text-white shadow-purple-glow'
                  : mode === 'ai'
                  ? 'bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              }`}>
                {mode === 'resume' ? '🚀 Resume Intelligence Mode' : mode === 'ai' ? '🤖 Topic AI Mode' : '📖 Practice Mode'}
              </span>

              {mode === 'resume' && eligibility && !eligibility.eligible && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  🔒 Cooldown Active ({eligibility.hoursRemaining || 72}h remaining)
                </span>
              )}
            </div>

            {/* Resume Mode Profile Preview */}
            {mode === 'resume' && (
              <div className="p-4 rounded-2xl bg-brand-surface/70 dark:bg-dark-bg/70 border border-brand-border dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider">
                    Target Role:
                  </span>
                  <span className="text-xs font-bold text-brand-purple dark:text-dark-purple">
                    {resumeProfile?.targetRole || user?.targetRole || 'Full Stack Developer'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-brand-slate dark:text-dark-muted block mb-1.5">
                    Skills Tested:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      ...(resumeProfile?.skills?.technical || ['Java', 'JavaScript', 'Python']),
                      ...(resumeProfile?.skills?.frameworks || ['React', 'Node.js', 'FastAPI']),
                      ...(resumeProfile?.skills?.databases || ['MongoDB', 'SQL'])
                    ].slice(0, 8).map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border text-[11px] font-medium text-brand-charcoal dark:text-dark-text">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {resumeProfile?.projects?.length > 0 && (
                  <div className="pt-2 border-t border-brand-border/60 dark:border-dark-border/60 text-xs text-brand-slate dark:text-dark-muted">
                    <span>Project Deep Dive: <strong>{resumeProfile.projects[0].name}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Topic Select (Only for Topic mode or Practice mode) */}
            {mode !== 'resume' && (
              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Select Topic Track</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text cursor-pointer transition-colors"
                >
                  {topics.map((t) => (
                    <option key={t._id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Difficulty Pick */}
            <div>
              <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-3">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-4">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      difficulty === level
                        ? 'bg-brand-purple dark:bg-dark-purple border-brand-purple dark:border-dark-purple text-white shadow-premium dark:shadow-neon-purple'
                        : 'bg-white dark:bg-dark-surface border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple text-brand-slate dark:text-dark-muted'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold shadow-premium dark:shadow-neon-purple transition-all hover:translate-y-[-1px] active:translate-y-0"
          >
            <span>Proceed to Rules</span>
            <ChevronRight size={16} />
          </button>

        </div>
      ) : (
        /* Integrity Rules Confirmation Stage */
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card space-y-6 relative z-10 glass-panel animate-slide-up">
          
          <div className="flex items-center gap-2 border-b border-brand-border dark:border-dark-border pb-3">
            <button
              onClick={() => setShowRules(false)}
              className="p-1.5 rounded-lg hover:bg-brand-surface dark:hover:bg-dark-cardHover text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text">
              {mode === 'ai' ? 'Integrity Safeguards Agreement' : 'Practice Session Guidelines'}
            </h3>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-bold mb-1">{mode === 'ai' ? 'CRITICAL ASSESSMENT SYSTEM ACTIVE' : 'PRACTICE SESSION RULES'}</p>
              {mode === 'ai'
                ? 'To simulate high-stakes hiring rounds, this exam includes strict integrity policies. Please read carefully.'
                : 'Practice mode is relaxed, but answers are still evaluated by AI. Read the guidelines below.'}
            </div>
          </div>

          <div className="space-y-4 text-xs text-brand-slate dark:text-dark-muted">
            
            {mode === 'ai' && (
              <>
                <div className="flex gap-3">
                  <ShieldCheck className="text-brand-purple dark:text-dark-purple shrink-0" size={16} />
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">Fullscreen Enforcement</h4>
                    <p>Starting the interview forces fullscreen mode. You must remain in fullscreen; exiting will restrict interactions and log warnings.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="text-brand-purple dark:text-dark-purple shrink-0" size={16} />
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">Tab & Window Focus Tracking</h4>
                    <p>Clicking away, opening new browser windows, or switching tabs logs an immediate integrity violation. Keep your eyes and cursor focused here.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="text-brand-purple dark:text-dark-purple shrink-0" size={16} />
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">Auto-Termination Policy</h4>
                    <p>You have exactly 3 violation warning logs. A third violation triggers immediate termination; the session closes and is automatically sent to the AI for grading.</p>
                  </div>
                </div>
              </>
            )}

            {mode === 'practice' && (
              <>
                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={16} />
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">No Integrity Restrictions</h4>
                    <p>Practice mode does not enforce fullscreen or track tab switches. Focus on improving your answers at your own pace.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={16} />
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">AI Evaluation Still Active</h4>
                    <p>Your answers are still evaluated by the Gemini AI engine. You'll receive detailed scoring and feedback at the end.</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <ShieldCheck className={`shrink-0 ${mode === 'ai' ? 'text-brand-purple dark:text-dark-purple' : 'text-emerald-500 dark:text-emerald-400'}`} size={16} />
              <div>
                <h4 className="font-bold text-brand-charcoal dark:text-dark-text mb-0.5">Timer & Speech Limits</h4>
                <p>Each of the 5 questions has a strict 3-minute limit. Speak into the microphone. You can edit the transcribed text before submit.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold shadow-premium transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none ${
              mode === 'ai'
                ? 'bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover dark:shadow-neon-purple'
                : 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                <span>{mode === 'ai' ? 'Agree & Start Simulated Exam' : 'Start Practice Session'}</span>
              </>
            )}
          </button>

        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InterviewSetup;
