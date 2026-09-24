import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useInterview } from '../context/InterviewContext';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Star } from 'lucide-react';
import Toast from '../components/Toast';

const InterviewFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { feedback: contextFeedback, resetInterview } = useInterview();
  const { isDark } = useTheme();

  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedResponse, setExpandedResponse] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      // Check if we are viewing the feedback immediately from the completed context
      if (!id && contextFeedback) {
        setInterviewData(contextFeedback);
        setLoading(false);
        triggerConfetti(contextFeedback.interview?.score);
        return;
      }

      // Otherwise fetch by ID
      if (id) {
        try {
          setLoading(true);
          const res = await axios.get(`/api/interview/${id}`);
          if (res.data.success) {
            setInterviewData(res.data.data);
            triggerConfetti(res.data.data.interview?.score);
          }
        } catch (err) {
          console.error('Error fetching interview details:', err);
          setToast({ message: 'Failed to load interview feedback details.', type: 'error' });
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/dashboard');
      }
    };

    fetchInterviewDetails();
  }, [id, contextFeedback, navigate]);

  const triggerConfetti = (score) => {
    if (score && score >= 70) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleRetake = () => {
    resetInterview();
    navigate('/interview/setup');
  };

  const toggleExpandResponse = (index) => {
    setExpandedResponse(expandedResponse === index ? null : index);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
        <div className="h-10 w-48 bg-gray-200 dark:bg-dark-card animate-shimmer rounded-xl"></div>
        <div className="h-64 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          <div className="h-40 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          <div className="h-40 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
        </div>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center select-none space-y-4 bg-white dark:bg-dark-bg min-h-[80vh] transition-colors duration-300">
        <AlertCircle size={40} className="text-brand-purple dark:text-dark-purple mx-auto animate-bounce" />
        <h2 className="font-outfit font-extrabold text-xl text-brand-charcoal dark:text-dark-text">Feedback Log Missing</h2>
        <p className="text-sm text-brand-slate dark:text-dark-muted">The requested interview results could not be located.</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple text-white font-semibold text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { interview, responses } = interviewData;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 select-none space-y-8 relative bg-white dark:bg-dark-bg transition-colors duration-300 min-h-screen">
      
      {/* Back control row */}
      <div className="flex justify-between items-center border-b border-brand-border dark:border-dark-border pb-4">
        <button
          onClick={() => {
            resetInterview();
            navigate('/dashboard');
          }}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={handleRetake}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white text-xs font-bold shadow-premium dark:shadow-neon-purple transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
        >
          <RefreshCw size={12} />
          <span>Retake Mock Interview</span>
        </button>
      </div>

      {/* Main Score Banner — Score + AI Feedback only */}
      <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="space-y-3 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center md:justify-start">
            <span className="px-3 py-1 bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple rounded-lg text-xs font-bold capitalize flex items-center gap-1.5">
              <Star size={14} className="animate-pulse text-brand-purple dark:text-dark-purple" />
              <span>{interview.topic} Mock</span>
            </span>
            <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase ${
              interview.status === 'terminated' 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
            }`}>
              {interview.status === 'terminated' ? 'Terminated (Security)' : 'Completed'}
            </span>
          </div>

          <h2 className="font-outfit font-extrabold text-2xl sm:text-3xl text-brand-charcoal dark:text-dark-text">
            AI Interview Evaluation Report
          </h2>
          
          {/* AI Overall Feedback */}
          {interview.feedback?.summary && (
            <p className="text-brand-slate dark:text-dark-muted text-sm max-w-xl leading-relaxed">
              {interview.feedback.summary}
            </p>
          )}
        </div>

        {/* Circular Overall Score Graphic */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="72" cy="72" r="62" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="8" fill="transparent" />
            <circle
              cx="72"
              cy="72"
              r="62"
              stroke={isDark ? '#A78BFA' : '#7C3AED'}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 62}
              strokeDashoffset={2 * Math.PI * 62 * (1 - (interview.score || 0) / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text leading-none block">{interview.score}%</span>
            <span className="text-[10px] uppercase font-bold text-brand-slate dark:text-dark-muted tracking-wider block mt-1">Average Score</span>
          </div>
        </div>

      </div>

      {/* Integrity Logs Summary Banner */}
      {interview.violationsCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-350 rounded-3xl p-6 shadow-premium flex gap-4 text-xs leading-relaxed">
          <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2 w-full">
            <p className="font-bold uppercase">Assessment Integrity Audits logged: {interview.violationsCount} Violation(s)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {interview.violations?.map((v, i) => (
                <div key={i} className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="capitalize">{v.type.replace('-', ' ')}</span>
                  <span className="text-amber-600 dark:text-amber-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question Responses Breakdown list — Score + Feedback only */}
      <div className="space-y-4">
        <h3 className="font-outfit font-extrabold text-xl text-brand-charcoal dark:text-dark-text">
          Question Responses & Audit
        </h3>

        <div className="space-y-4">
          {responses.map((resItem, idx) => {
            const isExpanded = expandedResponse === idx;
            const isCoding = resItem.responseType === 'coding' || Boolean(resItem.code);

            return (
              <div
                key={resItem._id}
                className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl overflow-hidden shadow-premium dark:shadow-dark-card transition-all"
              >
                {/* Header card trigger */}
                <button
                  onClick={() => toggleExpandResponse(idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-brand-surface/40 dark:hover:bg-dark-cardHover transition-colors gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple font-outfit font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        {resItem.category && (
                          <span className="px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple dark:text-dark-purple text-[10px] font-bold uppercase">
                            {resItem.category}
                          </span>
                        )}
                        <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-snug truncate max-w-xl">
                          {resItem.question}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-slate dark:text-dark-muted mt-0.5">Score: {resItem.evaluation?.score}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-[10px] rounded font-bold ${
                      resItem.evaluation?.score >= 80 ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' :
                      resItem.evaluation?.score >= 60 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    }`}>
                      {resItem.evaluation?.score >= 80 ? 'Exceptional' : resItem.evaluation?.score >= 60 ? 'Passing' : 'Critical'}
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Expanded Details — Score + Feedback only */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-brand-border dark:border-dark-border bg-brand-surface/20 dark:bg-dark-surface/30 space-y-4 text-sm">
                    
                    {/* Score badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wide">Score</span>
                      <span className={`px-3 py-1 rounded-xl text-sm font-extrabold font-outfit ${
                        resItem.evaluation?.score >= 80 ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' :
                        resItem.evaluation?.score >= 60 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>
                        {resItem.evaluation?.score}%
                      </span>
                    </div>

                    {/* Transcript or Code (for context) */}
                    {isCoding ? (
                      <div className="space-y-2">
                        <h5 className="font-bold text-brand-charcoal dark:text-dark-text text-xs uppercase tracking-wide">
                          Your Code ({resItem.language || 'JavaScript'})
                        </h5>
                        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                          {resItem.code || resItem.answer || '// No code submitted'}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h5 className="font-bold text-brand-charcoal dark:text-dark-text text-xs uppercase tracking-wide">Your Answer</h5>
                        <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border text-xs leading-relaxed text-brand-slate dark:text-dark-muted italic">
                          "{resItem.answer || 'No answer recorded.'}"
                        </div>
                      </div>
                    )}

                    {/* Feedback only */}
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-brand-charcoal dark:text-dark-text text-xs uppercase tracking-wide">Feedback</h5>
                      <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed">
                        {resItem.evaluation?.feedback || 'Good attempt. Refer to overall recommendations.'}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InterviewFeedback;
