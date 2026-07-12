import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, ChevronRight, AlertCircle, ArrowLeft, RefreshCw, Eye, EyeOff, Brain, ArrowRight } from 'lucide-react';
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

  // Fetch and shuffle questions when topic is selected
  const handleSelectTopic = async (topic, difficultyFilter = '') => {
    setLoading(true);
    try {
      // Fetch randomized questions for this topic
      // The backend implements the Fisher-Yates Shuffle algorithm inside questionController
      // to ensure a random order, zero duplicates, and a fresh experience each session.
      let url = `/api/questions?topicId=${topic._id}`;
      if (difficultyFilter) {
        url += `&difficulty=${difficultyFilter}`;
      }
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
    // Re-fetch questions to run the Fisher-Yates shuffle algorithm again for a fresh order
    if (selectedTopic) {
      handleSelectTopic(selectedTopic, selectedDifficulty);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-dark-bg px-4 py-16 transition-colors duration-300">
        <div className="bg-ambient-glow glow-purple"></div>
        <div className="bg-ambient-glow glow-blue"></div>
        <div className="max-w-md w-full bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card text-center space-y-6 relative z-10 glass-panel">
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

  // --- PRACTICE TOPICS BROWSER VIEW ---
  if (!selectedTopic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none bg-white dark:bg-dark-bg transition-colors duration-300">
        
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
            <Brain className="text-brand-purple dark:text-dark-purple" size={32} />
            <span>Practice Question Banks</span>
          </h1>
          <p className="text-brand-slate dark:text-dark-muted text-sm mt-1">Select a topic below to review mock questions at your own pace.</p>
        </div>

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

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- INDIVIDUAL QUESTION PRACTICE ARENA ---
  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
      
      {/* Header buttons */}
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

      {/* Main Practice Card */}
      <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl shadow-premium dark:shadow-dark-card p-8 space-y-8">
        
        {/* Progress badge */}
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
            
            {/* Question Text */}
            <h2 className="font-outfit font-extrabold text-xl sm:text-2xl text-brand-charcoal dark:text-dark-text leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Self-Reflection Guide Panel */}
            <div className="space-y-3">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface dark:bg-dark-surface border border-brand-border dark:border-dark-border text-xs font-bold text-brand-charcoal dark:text-dark-text hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 hover:text-brand-purple dark:hover:text-dark-purple transition-all"
              >
                {showAnswer ? (
                  <>
                    <EyeOff size={14} />
                    <span>Hide Answer Guide</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>Show Answer Guide</span>
                  </>
                )}
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

            {/* Steppers */}
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
};

export default PracticePage;
