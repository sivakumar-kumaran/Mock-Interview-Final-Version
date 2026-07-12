import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useInterview } from '../context/InterviewContext';
import { Calendar, Award, ShieldAlert, ArrowRight, ChevronRight, AlertCircle, RefreshCw, Eye, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';

const InterviewHistory = () => {
  const navigate = useNavigate();
  const { resetInterview } = useInterview();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const handleDeleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview record? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await axios.delete(`/api/interview/${id}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(item => item._id !== id));
        setToast({ message: 'Interview record deleted successfully.', type: 'success' });
      }
    } catch (err) {
      console.error('Error deleting interview:', err);
      setToast({ message: 'Failed to delete interview record. Please try again.', type: 'error' });
    }
  };

  // Fetch interview history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/interview/history');
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setToast({ message: 'Failed to retrieve historical interview list.', type: 'warning' });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRetake = () => {
    resetInterview();
    navigate('/interview/setup');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
        <div className="h-10 w-48 bg-gray-200 dark:bg-dark-card animate-shimmer rounded-xl"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none space-y-8 relative bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
      <div className="bg-ambient-glow glow-purple"></div>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border dark:border-dark-border pb-6">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
            <Calendar className="text-brand-purple dark:text-dark-purple" size={30} />
            <span>Interview History Logs</span>
          </h1>
          <p className="text-brand-slate dark:text-dark-muted text-sm">Review your past evaluations, transcripts, and warning details.</p>
        </div>
        <button
          onClick={handleRetake}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold shadow-premium dark:shadow-neon-purple hover:translate-y-[-1px] active:translate-y-0 transition-all text-sm"
        >
          <span>Take New Mock Exam</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* History Grid */}
      <div className="space-y-4 relative z-10">
        {history.length > 0 ? (
          history.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card hover:border-brand-purple dark:hover:border-dark-purple transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
            >
              
              <div className="flex items-center gap-4">
                {/* Circular Score display */}
                <div className="w-14 h-14 rounded-2xl bg-brand-purple-light dark:bg-dark-purple/20 flex flex-col items-center justify-center text-brand-purple dark:text-dark-purple border border-brand-purple/10 dark:border-dark-purple/30 shrink-0">
                  <span className="text-lg font-outfit font-extrabold">{item.score}%</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-brand-purple/75 dark:text-dark-purple/75">Score</span>
                </div>

                <div>
                  <h3 className="font-outfit font-bold text-base sm:text-lg text-brand-charcoal dark:text-dark-text">
                    {item.topic} Assessment
                  </h3>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-slate dark:text-dark-muted mt-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>Level: {item.difficulty}</span>
                    {item.violationsCount > 0 && (
                      <span className="text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                        <ShieldAlert size={12} />
                        {item.violationsCount} Warnings
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start border-t sm:border-t-0 border-brand-border dark:border-dark-border pt-4 sm:pt-0">
                <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${
                  item.status === 'terminated'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                }`}>
                  {item.status === 'terminated' ? 'Terminated' : 'Completed'}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/interview/feedback/${item._id}`}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-brand-purple/20 dark:border-dark-purple/30 hover:border-brand-purple dark:hover:border-dark-purple hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 text-xs font-bold text-brand-purple dark:text-dark-purple shadow-premium/5 dark:shadow-neon-purple/5 transition-all"
                  >
                    <Eye size={14} />
                    <span>View Report Card</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteInterview(item._id)}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    title="Delete Interview Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted text-sm">
            <AlertCircle size={28} className="mx-auto text-brand-purple dark:text-dark-purple mb-3" />
            No interview history records found. Start your first session to build your log!
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InterviewHistory;
