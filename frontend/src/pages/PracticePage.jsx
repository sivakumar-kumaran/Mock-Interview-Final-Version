import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle, ChevronRight, AlertCircle, ArrowLeft, RefreshCw,
  Eye, EyeOff, Brain, ArrowRight, BookOpen, FileText, Sparkles, Loader2
} from 'lucide-react';
import Toast from '../components/Toast';

const PracticePage = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [toast, setToast] = useState(null);

  // Resume Questions State
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'resume'
  const [resumeProfile, setResumeProfile] = useState(null);
  const [resumeQuestionsFlat, setResumeQuestionsFlat] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeQIndex, setResumeQIndex] = useState(0);
  const [showResumeAnswer, setShowResumeAnswer] = useState(false);

  // Fetch topics list
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/topics');
        if (res.data.success) {
          setTopics(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setToast({ message: 'Failed to load practice topics from database.', type: 'warning' });
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  // Fetch resume profile for resume questions
  useEffect(() => {
    if (!user) return;
    const fetchResume = async () => {
      try {
        setResumeLoading(true);
        const res = await axios.get('/api/resume/profile');
        if (res.data.success && res.data.data) {
          const profile = res.data.data;
          setResumeProfile(profile);

          // Flatten all likelyInterviewQuestions into one array of 10 questions max
          const likelyQ = profile.summaryReport?.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];
          const flat = [];
          for (const group of likelyQ) {
            for (const q of (group.questions || [])) {
              flat.push({ question: q, category: group.category || 'Resume Question' });
              if (flat.length >= 10) break;
            }
            if (flat.length >= 10) break;
          }
          setResumeQuestionsFlat(flat);
        }
      } catch (err) {
        console.error('Error fetching resume profile:', err);
      } finally {
        setResumeLoading(false);
      }
    };
    fetchResume();
  }, [user]);

  // Fetch and shuffle questions when topic is selected
  const handleSelectTopic = async (topic, difficultyFilter = '') => {
    setLoading(true);
    try {
      let url = `/api/questions?topicId=${topic._id}`;
      if (difficultyFilter) url += `&difficulty=${difficultyFilter}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setQuestions(res.data.data);
        setSelectedTopic(topic);
        setSelectedDifficulty(difficultyFilter);
        setCurrentIndex(0);
        setShowAnswer(false);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setToast({ message: 'Failed to retrieve questions for this topic.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleRestart = () => {
    if (selectedTopic) handleSelectTopic(selectedTopic, selectedDifficulty);
  };

  const handleResumeNext = () => {
    if (resumeQIndex < resumeQuestionsFlat.length - 1) {
      setResumeQIndex((prev) => prev + 1);
      setShowResumeAnswer(false);
    }
  };

  const handleResumePrev = () => {
    if (resumeQIndex > 0) {
      setResumeQIndex((prev) => prev - 1);
      setShowResumeAnswer(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-dark-bg px-4 py-16 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple mx-auto animate-pulse">
            <Brain size={32} />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Practice Banks Locked</h2>
            <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">
              Please log in or create an account to access our 420+ question banks, view answers, and practice.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-sm transition-all shadow-premium"
          >
            <span>Sign In to Practice</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading && topics.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none bg-white dark:bg-dark-bg transition-colors duration-300">
        <div className="h-10 w-48 bg-gray-200 dark:bg-dark-card animate-shimmer rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-dark-card animate-shimmer rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // --- INDIVIDUAL QUESTION PRACTICE ARENA ---
  if (selectedTopic && activeTab === 'topics') {
    const currentQuestion = questions[currentIndex];
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
        <div className="flex justify-between items-center">
          <button
            onClick={() => { setSelectedTopic(null); setSelectedDifficulty(''); }}
            className="flex items-center gap-1 text-sm font-semibold text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Topics</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-slate dark:text-dark-muted">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => handleSelectTopic(selectedTopic, e.target.value)}
                className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-purple dark:focus:border-dark-purple transition-all shadow-sm"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Easy</option>
                <option value="Intermediate">Medium</option>
                <option value="Advanced">Hard</option>
              </select>
            </div>
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-surface dark:hover:bg-dark-card text-xs font-bold text-brand-purple dark:text-dark-purple border border-brand-purple/20 dark:border-dark-purple/30 transition-all"
            >
              <RefreshCw size={12} />
              <span>Shuffle Bank</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl shadow-premium dark:shadow-dark-card p-8 space-y-8">
          <div className="flex justify-between items-center border-b border-brand-border dark:border-dark-border pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple">
                {selectedTopic.title} Pool
              </span>
              {currentQuestion && (
                <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  currentQuestion.difficulty === 'Beginner' ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' :
                  currentQuestion.difficulty === 'Intermediate' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            {questions.length > 0 && (
              <span className="text-xs font-semibold text-brand-slate dark:text-dark-muted">
                Question {currentIndex + 1} of {questions.length}
              </span>
            )}
          </div>

          {questions.length > 0 ? (
            <div className="space-y-6">
              <h2 className="font-outfit font-extrabold text-xl sm:text-2xl text-brand-charcoal dark:text-dark-text leading-snug">
                {currentQuestion.question}
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface dark:bg-dark-surface border border-brand-border dark:border-dark-border text-xs font-bold text-brand-charcoal dark:text-dark-text hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 hover:text-brand-purple dark:hover:text-dark-purple transition-all"
                >
                  {showAnswer ? <><EyeOff size={14} /><span>Hide Answer Guide</span></> : <><Eye size={14} /><span>Show Answer Guide</span></>}
                </button>
                {showAnswer && (
                  <div className="p-5 rounded-2xl bg-brand-purple-light/30 dark:bg-dark-purple/10 border border-brand-purple/10 dark:border-dark-purple/30 text-brand-slate dark:text-dark-muted text-sm space-y-3 animate-fade-in">
                    <h4 className="font-bold text-brand-purple dark:text-dark-purple text-xs uppercase tracking-wide">Interview Structure Guide</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Start by defining the concept explicitly (the "what").</li>
                      <li>Detail structural properties or framework usage (the "how").</li>
                      <li>Mention advantages, trade-offs, or design pattern implications (the "why").</li>
                      <li>Always structure your oral delivery; speak clearly, pacing yourself under 2 minutes.</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-brand-border dark:border-dark-border mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 rounded-xl border border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple text-brand-charcoal dark:text-dark-text font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-sm shadow-premium dark:shadow-neon-purple transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next Question
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-brand-slate dark:text-dark-muted text-sm">
              <AlertCircle size={24} className="mx-auto text-brand-purple dark:text-dark-purple mb-2" />
              No questions loaded for this topic.
            </div>
          )}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- MAIN PRACTICE HUB ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none bg-white dark:bg-dark-bg transition-colors duration-300">

      {/* Header */}
      <div>
        <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
          <Brain className="text-brand-purple dark:text-dark-purple" size={32} />
          <span>Practice Hub</span>
        </h1>
        <p className="text-brand-slate dark:text-dark-muted text-sm mt-1">
          Practice from topic banks or drill questions from your own resume.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-brand-border dark:border-dark-border pb-0">
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${activeTab === 'topics'
            ? 'bg-brand-purple dark:bg-dark-purple text-white shadow-purple-glow'
            : 'text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text border border-brand-border dark:border-dark-border bg-white dark:bg-dark-card'
          }`}
        >
          <BookOpen size={15} />
          <span>Topic Question Banks</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeTab === 'topics' ? 'bg-white/20' : 'bg-brand-purple/10 text-brand-purple'}`}>
            {topics.length} tracks
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resume')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${activeTab === 'resume'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text border border-brand-border dark:border-dark-border bg-white dark:bg-dark-card'
          }`}
        >
          <FileText size={15} />
          <span>Resume Questions</span>
          {resumeQuestionsFlat.length > 0 && (
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeTab === 'resume' ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-700'}`}>
              {resumeQuestionsFlat.length} Qs
            </span>
          )}
        </button>
      </div>

      {/* Tab: Topic Banks */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <div
                key={topic._id}
                onClick={() => handleSelectTopic(topic)}
                className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:border-brand-purple dark:hover:border-dark-purple hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple mb-4">
                    <HelpCircle size={20} />
                  </div>
                  <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mb-2 group-hover:text-brand-purple dark:group-hover:text-dark-purple transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-brand-slate dark:text-dark-muted text-xs leading-relaxed line-clamp-3 mb-4">
                    {topic.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-brand-border dark:border-dark-border pt-4 text-xs font-bold text-brand-purple dark:text-dark-purple">
                  <span>{topic.questionCount} Questions Available</span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted text-sm">
              <AlertCircle size={24} className="mx-auto text-brand-purple dark:text-dark-purple mb-2 animate-bounce" />
              No practice tracks seeded yet. Launch database seed to continue.
            </div>
          )}
        </div>
      )}

      {/* Tab: Resume Questions */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          {resumeLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-purple" />
            </div>
          ) : !resumeProfile ? (
            <div className="text-center py-16 bg-white dark:bg-dark-card rounded-3xl border-2 border-dashed border-brand-purple/30 dark:border-dark-purple/30 space-y-4">
              <FileText size={48} className="mx-auto text-brand-purple/40 dark:text-dark-purple/40" />
              <div>
                <h3 className="text-xl font-bold text-brand-charcoal dark:text-dark-text font-outfit">No Resume Uploaded Yet</h3>
                <p className="text-sm text-brand-slate dark:text-dark-muted mt-1">Upload your resume in the Dashboard to unlock personalized practice questions.</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-purple dark:bg-dark-purple text-white font-bold text-sm shadow-purple-glow hover:opacity-90 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : resumeQuestionsFlat.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border space-y-4">
              <Sparkles size={48} className="mx-auto text-amber-400" />
              <div>
                <h3 className="text-xl font-bold text-brand-charcoal dark:text-dark-text font-outfit">Questions Being Generated</h3>
                <p className="text-sm text-brand-slate dark:text-dark-muted mt-1">Re-analyze your resume in the Dashboard to generate personalized questions.</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-purple dark:bg-dark-purple text-white font-bold text-sm shadow-purple-glow hover:opacity-90 transition-all"
              >
                <span>Re-Analyze Resume</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <Sparkles size={20} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {resumeQuestionsFlat.length} personalized questions generated from your resume
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    These questions target your actual projects, tech stack, and achievements.
                  </p>
                </div>
              </div>

              {/* All Questions List */}
              <div className="space-y-4">
                {resumeQuestionsFlat.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      resumeQIndex === idx
                        ? 'bg-brand-purple/5 dark:bg-dark-purple/10 border-brand-purple dark:border-dark-purple shadow-md'
                        : 'bg-white dark:bg-dark-card border-brand-border dark:border-dark-border hover:border-brand-purple/40'
                    }`}
                    onClick={() => { setResumeQIndex(idx); setShowResumeAnswer(false); }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        resumeQIndex === idx ? 'bg-brand-purple text-white' : 'bg-brand-purple/10 text-brand-purple'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-bold text-brand-purple dark:text-dark-purple uppercase tracking-wider">
                          {item.category}
                        </span>
                        <p className="text-sm font-semibold text-brand-charcoal dark:text-dark-text leading-relaxed">
                          {item.question}
                        </p>
                        {resumeQIndex === idx && (
                          <div className="pt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowResumeAnswer(!showResumeAnswer); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface dark:bg-dark-bg border border-brand-border dark:border-dark-border text-xs font-bold text-brand-charcoal dark:text-dark-text hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 hover:text-brand-purple transition-all mt-1"
                            >
                              {showResumeAnswer ? <><EyeOff size={12} /><span>Hide Approach</span></> : <><Eye size={12} /><span>Show Approach Guide</span></>}
                            </button>
                            {showResumeAnswer && (
                              <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs space-y-2 animate-fade-in">
                                <p className="font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wide">🎯 Recommended Answer Approach</p>
                                <ul className="list-disc pl-4 space-y-1.5 text-amber-900 dark:text-amber-200">
                                  <li>Start with a direct 1-sentence answer (what it is or what you did).</li>
                                  <li>Explain HOW you implemented it: mention specific classes, functions, or design decisions.</li>
                                  <li>Relate to your resume: quote the actual project or training where you used this.</li>
                                  <li>Close with impact: time complexity, performance metric, or business outcome.</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-brand-border dark:border-dark-border">
                <button
                  onClick={handleResumePrev}
                  disabled={resumeQIndex === 0}
                  className="px-5 py-2.5 rounded-xl border border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple text-brand-charcoal dark:text-dark-text font-semibold text-sm transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-xs text-brand-slate dark:text-dark-muted font-semibold">
                  {resumeQIndex + 1} / {resumeQuestionsFlat.length}
                </span>
                <button
                  onClick={handleResumeNext}
                  disabled={resumeQIndex === resumeQuestionsFlat.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next Question
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PracticePage;
