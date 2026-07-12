import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { HelpCircle, ChevronRight, AlertTriangle, ShieldCheck, Play, ArrowLeft, Cpu, Brain, BookOpen, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';

const InterviewSetup = () => {
  const { user } = useAuth();
  const { startNewInterview } = useInterview();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [mode, setMode] = useState(null); // null = not chosen, 'ai' or 'practice'
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch topics list
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axios.get('/api/topics');
        if (res.data.success) {
          setTopics(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedTopic(res.data.data[0].title);
          }
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setToast({ message: 'Failed to load interview topics from database.', type: 'warning' });
      }
    };

    fetchTopics();
  }, []);

  const handleStart = async () => {
    if (!selectedTopic || !difficulty || !mode) {
      setToast({ message: 'Please select mode, topic and difficulty', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await startNewInterview(selectedTopic, difficulty, mode);
    setLoading(false);

    if (res.success) {
      navigate('/interview/active');
    } else {
      setToast({ message: res.message || 'Failed to start interview', type: 'error' });
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

        <div className="max-w-2xl w-full space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple text-sm font-semibold mb-4">
              <Cpu size={16} />
              <span>Interview Mode</span>
            </div>
            <h1 className="font-outfit font-extrabold text-3xl md:text-4xl text-brand-charcoal dark:text-dark-text mb-3">
              Choose Your Interview Style
            </h1>
            <p className="text-brand-slate dark:text-dark-muted max-w-lg mx-auto">
              Select how you want to practice. Both modes provide AI-powered evaluation and detailed feedback reports.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* AI Interview Mode */}
            <button
              onClick={() => setMode('ai')}
              className="group text-left bg-white dark:bg-dark-card border-2 border-brand-border dark:border-dark-border rounded-3xl p-8 hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white mb-5 shadow-purple-glow group-hover:scale-105 transition-transform">
                <Brain size={26} />
              </div>
              <h3 className="font-outfit font-bold text-xl text-brand-charcoal dark:text-dark-text mb-2">AI Interview</h3>
              <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed mb-4">
                Full simulation with AI interviewer avatar, webcam monitoring, and strict integrity rules.
              </p>
              <ul className="space-y-2 text-xs text-brand-slate dark:text-dark-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple dark:bg-dark-purple"></span>
                  AI-curated questions from database
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple dark:bg-dark-purple"></span>
                  Full-screen with integrity tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple dark:bg-dark-purple"></span>
                  Gemini AI evaluation & scoring
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-brand-purple dark:text-dark-purple font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Select AI Mode</span>
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Practice Mode */}
            <button
              onClick={() => setMode('practice')}
              className="group text-left bg-white dark:bg-dark-card border-2 border-brand-border dark:border-dark-border rounded-3xl p-8 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-premium-hover dark:hover:shadow-dark-premium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-5 shadow-cyan-glow group-hover:scale-105 transition-transform">
                <BookOpen size={26} />
              </div>
              <h3 className="font-outfit font-bold text-xl text-brand-charcoal dark:text-dark-text mb-2">Practice Mode</h3>
              <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed mb-4">
                Relaxed practice environment. No webcam or integrity tracking — just focus on improving your answers.
              </p>
              <ul className="space-y-2 text-xs text-brand-slate dark:text-dark-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  Questions from question bank
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  No fullscreen or tab restriction
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  AI evaluation & report stored
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Select Practice Mode</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
          <span>Change Mode</span>
        </button>
        <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
          <Cpu className="text-brand-purple dark:text-dark-purple" size={32} />
          <span>{mode === 'ai' ? 'AI Interview Simulator' : 'Practice Interview'}</span>
        </h1>
        <p className="text-brand-slate dark:text-dark-muted text-sm">
          {mode === 'ai'
            ? 'Configure your topic and difficulty to start a full AI-monitored mock interview.'
            : 'Select your topic and difficulty for a relaxed practice session with AI evaluation.'}
        </p>
      </div>

      {!showRules ? (
        /* Configuration Stage */
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card space-y-6 relative z-10 glass-panel">
          
          <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
            Interview Configuration
          </h3>

          <div className="space-y-5">
            {/* Mode Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                mode === 'ai'
                  ? 'bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              }`}>
                {mode === 'ai' ? '🤖 AI Interview Mode' : '📖 Practice Mode'}
              </span>
            </div>

            {/* Topic Select */}
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
