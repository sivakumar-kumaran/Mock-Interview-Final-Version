import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const InterviewContext = createContext(null);

export const useInterview = () => useContext(InterviewContext);

export const InterviewProvider = ({ children }) => {
  const [activeInterview, setActiveInterview] = useState(null);
  const [responses, setResponses] = useState([]);
  const [violations, setViolations] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('idle'); // idle, active, evaluating, feedback
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interviewMode, setInterviewMode] = useState('ai'); // 'ai' or 'practice'

  // Initialize/start the interview session
  const startNewInterview = async (topicTitle, difficulty, mode = 'ai') => {
    setInterviewMode(mode);
    setLoading(true);
    setError(null);
    setResponses([]);
    setViolations([]);
    setCurrentQuestionIndex(0);
    setFeedback(null);
    setInterviewStatus('idle');

    try {
      const res = await axios.post('/api/interview/start', { topicTitle, difficulty });
      if (res.data.success) {
        setActiveInterview(res.data.data);
        setInterviewStatus('active');
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to start interview.');
      setLoading(false);
      return { success: false, message: err.response?.data?.message || 'Failed to start' };
    }
  };

  // Log a security / integrity violation
  const logViolation = (type) => {
    const newViolation = { type, timestamp: new Date() };
    setViolations((prev) => {
      const updated = [...prev, newViolation];
      
      // Auto terminate if violations exceed 3
      if (updated.length >= 3) {
        // Trigger auto submit in the next tick
        setTimeout(() => {
          terminateInterviewEarly(updated);
        }, 100);
      }
      return updated;
    });
  };

  // Auto terminate interview due to multiple violations
  const terminateInterviewEarly = async (currentViolations = violations) => {
    if (interviewStatus !== 'active') return;
    setInterviewStatus('evaluating');
    setLoading(true);

    try {
      const payload = {
        interviewId: activeInterview.interviewId,
        responses: responses, // Submit whatever was completed so far
        violations: currentViolations,
        status: 'terminated'
      };

      const res = await axios.post('/api/interview/submit', payload);
      if (res.data.success) {
        setFeedback(res.data.data);
        setInterviewStatus('feedback');
      }
    } catch (err) {
      console.error('Error auto-submitting interview on violations:', err);
      setError('Interview auto-terminated due to security violations, evaluation failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer for active question and advance the flow
  const submitActiveAnswer = async (answerText) => {
    if (!activeInterview) return;

    const currentQuestion = activeInterview.questions[currentQuestionIndex];
    const newResponse = {
      question: currentQuestion.question,
      answer: answerText || ''
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // If more questions exist, advance index
    if (currentQuestionIndex < activeInterview.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Last question completed, trigger full evaluation submit
      setInterviewStatus('evaluating');
      setLoading(true);

      try {
        const payload = {
          interviewId: activeInterview.interviewId,
          responses: updatedResponses,
          violations,
          status: 'completed'
        };

        const res = await axios.post('/api/interview/submit', payload);
        if (res.data.success) {
          setFeedback(res.data.data);
          setInterviewStatus('feedback');
        }
      } catch (err) {
        console.error('Error submitting interview responses:', err);
        setError('Failed to submit interview responses for AI evaluation.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetInterview = () => {
    setActiveInterview(null);
    setResponses([]);
    setViolations([]);
    setCurrentQuestionIndex(0);
    setInterviewStatus('idle');
    setFeedback(null);
    setInterviewMode('ai');
  };

  const value = {
    activeInterview,
    responses,
    violations,
    currentQuestionIndex,
    interviewStatus,
    feedback,
    loading,
    error,
    interviewMode,
    startNewInterview,
    submitActiveAnswer,
    logViolation,
    terminateInterviewEarly,
    resetInterview
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};
