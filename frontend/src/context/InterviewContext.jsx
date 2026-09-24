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
  const [resumeEligibility, setResumeEligibility] = useState(null);

  // Check resume interview eligibility (cooldown & weekly limits)
  const checkResumeEligibility = async () => {
    try {
      const res = await axios.get('/api/interview/resume/eligibility');
      if (res.data.success) {
        setResumeEligibility(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error('Error fetching resume eligibility:', err);
      return null;
    }
  };

  // Initialize/start Version 1 topic interview
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
        setActiveInterview({
          ...res.data.data,
          interviewType: 'topic'
        });
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

  // Initialize/start Version 2 Resume-Based Interview
  const startResumeInterview = async (difficulty = 'Intermediate') => {
    setInterviewMode('ai');
    setLoading(true);
    setError(null);
    setResponses([]);
    setViolations([]);
    setCurrentQuestionIndex(0);
    setFeedback(null);
    setInterviewStatus('idle');

    try {
      const res = await axios.post('/api/interview/resume/start', { difficulty });
      if (res.data.success) {
        setActiveInterview({
          ...res.data.data,
          interviewType: 'resume'
        });
        setInterviewStatus('active');
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      console.error('Error starting resume interview:', err);
      const errMsg = err.response?.data?.message || 'Failed to start Resume Interview.';
      setError(errMsg);
      setLoading(false);
      return { success: false, message: errMsg, data: err.response?.data?.data };
    }
  };

  // Run candidate code against test cases in real-time
  const runCode = async (question, code, language, testCases) => {
    try {
      const res = await axios.post('/api/interview/resume/code-run', {
        question,
        code,
        language,
        testCases
      });
      return res.data;
    } catch (err) {
      console.error('Error running code:', err);
      return { success: false, message: 'Failed to run code evaluation' };
    }
  };

  // Log a security / integrity violation
  const logViolation = (type) => {
    const newViolation = { type, timestamp: new Date() };
    setViolations((prev) => {
      const updated = [...prev, newViolation];
      
      // Auto terminate if violations exceed 3
      if (updated.length >= 3) {
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
      const isResume = activeInterview?.interviewType === 'resume';
      const endpoint = isResume ? '/api/interview/resume/submit' : '/api/interview/submit';

      const payload = {
        interviewId: activeInterview.interviewId,
        responses: responses,
        violations: currentViolations,
        status: 'terminated'
      };

      const res = await axios.post(endpoint, payload);
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
  const submitActiveAnswer = async (answerText, codeSubmission = null) => {
    if (!activeInterview) return;

    const currentQuestion = activeInterview.questions[currentQuestionIndex];
    
    let newResponse = {
      question: currentQuestion.question,
      category: currentQuestion.category || 'technical',
      responseType: currentQuestion.type || 'verbal',
      answer: answerText || ''
    };

    if (codeSubmission || currentQuestion.type === 'coding' || currentQuestion.category === 'coding') {
      newResponse = {
        ...newResponse,
        responseType: 'coding',
        code: codeSubmission?.code || answerText || '',
        language: codeSubmission?.language || currentQuestion.language || 'javascript',
        testCases: currentQuestion.testCases || [],
        answer: codeSubmission?.code || answerText || ''
      };
    }

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
        const isResume = activeInterview?.interviewType === 'resume';
        const endpoint = isResume ? '/api/interview/resume/submit' : '/api/interview/submit';

        const payload = {
          interviewId: activeInterview.interviewId,
          responses: updatedResponses,
          violations,
          status: 'completed'
        };

        const res = await axios.post(endpoint, payload);
        if (res.data.success) {
          setFeedback(res.data.data);
          setInterviewStatus('feedback');
          if (isResume) {
            checkResumeEligibility(); // refresh cooldown state
          }
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
    resumeEligibility,
    checkResumeEligibility,
    startNewInterview,
    startResumeInterview,
    runCode,
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

