import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { Mic, MicOff, Pause, Play, Send, Clock, AlertTriangle, Maximize2, ShieldAlert, SkipForward, StopCircle, Video, VideoOff, Brain } from 'lucide-react';
import Toast from '../components/Toast';

const InterviewActive = () => {
  const {
    activeInterview,
    currentQuestionIndex,
    interviewStatus,
    interviewMode,
    violations,
    responses,
    logViolation,
    submitActiveAnswer,
    terminateInterviewEarly
  } = useInterview();

  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [toast, setToast] = useState(null);
  const [isVideoBlurred, setIsVideoBlurred] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const isAiMode = interviewMode === 'ai';
  const currentQuestion = activeInterview?.questions?.[currentQuestionIndex];
  const totalQuestions = activeInterview?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

  // Handle redirect to feedback page on completion or termination
  useEffect(() => {
    if (interviewStatus === 'feedback') {
      navigate('/interview/feedback');
    } else if (interviewStatus === 'idle' || !activeInterview) {
      navigate('/interview/setup');
    }
  }, [interviewStatus, activeInterview, navigate]);

  // Initialize webcam for both modes when hasStarted becomes true
  useEffect(() => {
    if (hasStarted) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [hasStarted]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to access webcam:', err);
      setToast({ message: 'Webcam access denied. Video preview unavailable.', type: 'warning' });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Handle fullscreen and visibility state listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFull);

      if (!isCurrentlyFull && interviewStatus === 'active' && hasStarted) {
        logViolation('fullscreen-exit');
        setToast({ message: 'Warning: Fullscreen exited. Integrity violation logged.', type: 'warning' });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && interviewStatus === 'active' && hasStarted) {
        logViolation('tab-switch');
        setIsVideoBlurred(true);
        setToast({ message: 'Warning: Tab switch detected. Video blurred. Violation logged.', type: 'warning' });
      } else if (!document.hidden) {
        // Unblur after returning (with delay for penalty feel)
        setTimeout(() => setIsVideoBlurred(false), 1500);
      }
    };

    const handleWindowBlur = () => {
      if (interviewStatus === 'active' && hasStarted) {
        logViolation('window-blur');
        setIsVideoBlurred(true);
        setToast({ message: 'Warning: Window focus lost. Video blurred. Violation logged.', type: 'warning' });
      }
    };

    const handleWindowFocus = () => {
      setTimeout(() => setIsVideoBlurred(false), 1500);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [interviewStatus, hasStarted]);

  // Handle Question Change and Timer resets
  useEffect(() => {
    if (!activeInterview || !hasStarted) return;

    setTranscript('');
    setTimeLeft(180);
    stopSpeechRecognition();

    // Brief AI thinking animation on question change
    setAiThinking(true);
    const thinkTimer = setTimeout(() => setAiThinking(false), 1200);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(thinkTimer);
    };
  }, [currentQuestionIndex, activeInterview, hasStarted]);

  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
      if (voice) {
        utterance.voice = voice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Speak motivational quote at start + read questions
  useEffect(() => {
    if (!activeInterview || !currentQuestion || !hasStarted) return;

    let textToSpeak = '';
    if (currentQuestionIndex === 0) {
      const motivationQuotes = [
        "Welcome to your mock interview. Remember: Believe you can and you're halfway there. You've got this! Let's start with the first question: ",
        "Hello! Success is not final, failure is not fatal: it is the courage to continue that counts. Stay confident. Here is your first question: ",
        "Welcome. Your focus determines your reality. Take a deep breath, speak clearly, and do your best. Let's begin: ",
        "Hello! Preparation meets opportunity today. Believe in your skills and let's start. First question: "
      ];
      const randomQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
      textToSpeak = randomQuote + currentQuestion.question;
    } else {
      textToSpeak = `Next question: ${currentQuestion.question}`;
    }

    const speakTimer = setTimeout(() => {
      speakText(textToSpeak);
    }, 1000);

    return () => {
      clearTimeout(speakTimer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestionIndex, activeInterview, currentQuestion, hasStarted, speakText]);

  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);

  // Sync state with refs to avoid SpeechRecognition recreation cycles
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false; // Turn off interim results to maximize accuracy and eliminate input lag
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let newSpeech = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newSpeech += event.results[i][0].transcript;
          }
        }
        if (newSpeech) {
          setTranscript((prev) => {
            const cleanedPrev = prev.trim();
            return cleanedPrev ? `${cleanedPrev} ${newSpeech.trim()}` : newSpeech.trim();
          });
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setToast({ message: 'Microphone permission blocked. Please enable it in browser settings.', type: 'error' });
        }
      };

      rec.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart speech recognition:', e);
          }
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopSpeechRecognition();
    };
  }, []);

  const enterFullscreen = () => {
    const docEl = document.documentElement;
    const requestMethod =
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen;

    if (requestMethod) {
      requestMethod.call(docEl).catch((err) => {
        console.error('Error enabling fullscreen mode:', err);
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeOut = () => {
    setToast({ message: 'Time limit reached. Submitting answer automatically.', type: 'info' });
    stopSpeechRecognition();
    submitActiveAnswer(transcript);
  };

  // Recording controls
  const startRecording = () => {
    if (!recognitionRef.current) {
      setToast({ message: 'Web Speech API not supported. Please type your response directly.', type: 'warning' });
      setIsRecording(true);
      return;
    }
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (e) {
      console.error(e);
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    }
    setIsPaused(false);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSubmitAnswer = () => {
    stopSpeechRecognition();
    submitActiveAnswer(transcript);
  };

  const handleSkipQuestion = () => {
    stopSpeechRecognition();
    submitActiveAnswer(''); // Empty answer = skipped
    setToast({ message: 'Question skipped.', type: 'info' });
  };

  const handleEndInterview = () => {
    setShowEndConfirm(true);
  };

  const confirmEndInterview = () => {
    stopSpeechRecognition();
    stopWebcam();
    setShowEndConfirm(false);
    terminateInterviewEarly(violations);
  };

  // Loading indicator for evaluation
  if (interviewStatus === 'evaluating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4 transition-colors duration-300">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-brand-purple/20 dark:border-dark-purple/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-purple dark:border-dark-purple border-t-transparent rounded-full animate-spin"></div>
            <Brain size={28} className="text-brand-purple dark:text-dark-purple animate-pulse" />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-xl text-brand-charcoal dark:text-dark-text mb-2">Analyzing Responses</h2>
            <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed">
              Gemini AI is evaluating your transcripts for technical accuracy, communication, confidence, and completeness. This may take a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeInterview) return null;

  // Custom Start Proctoring Fullscreen Overlay
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-brand-surface dark:bg-dark-bg flex items-center justify-center p-6 relative select-none transition-colors duration-300">
        <div className="bg-ambient-glow glow-purple"></div>
        <div className="bg-ambient-glow glow-blue"></div>

        <div className="max-w-md w-full bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card text-center space-y-6 relative z-10 glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white mx-auto shadow-purple-glow">
            <Brain size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Ready to Begin?</h2>
            <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">
              Your mock interview session is configured. Click below to enter fullscreen mode and begin.
            </p>
          </div>
          <button
            onClick={() => {
              setHasStarted(true);
              enterFullscreen();
            }}
            className="w-full py-4 rounded-2xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-base transition-all shadow-premium dark:shadow-neon-purple hover:translate-y-[-2px] active:translate-y-0"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-brand-surface dark:bg-dark-bg transition-colors duration-300 select-none relative">
      
      {/* Fullscreen Blocking Guard Overlay (for proctored sessions) */}
      {(!isFullscreen) && (
        <div className="fixed inset-0 z-[999] bg-brand-charcoal/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-6 text-center select-none">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border p-8 max-w-md space-y-6 shadow-premium dark:shadow-dark-card">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle size={28} className="animate-bounce" />
            </div>
            <div>
              <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Fullscreen Lock Exited</h2>
              <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">
                To resume the interview, you must keep the browser in fullscreen mode. Any exit attempts log integrity violations.
              </p>
            </div>
            <button
              onClick={enterFullscreen}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold transition-all shadow-premium dark:shadow-neon-purple"
            >
              <Maximize2 size={16} />
              <span>Return to Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* End Interview Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border p-8 max-w-md space-y-6 shadow-premium dark:shadow-dark-card animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <StopCircle size={28} />
            </div>
            <div className="text-center">
              <h2 className="font-outfit font-bold text-xl text-brand-charcoal dark:text-dark-text mb-2">End Interview Early?</h2>
              <p className="text-sm text-brand-slate dark:text-dark-muted">
                Your completed answers will be submitted to AI for evaluation. Unanswered questions will receive zero scores.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-brand-border dark:border-dark-border text-brand-charcoal dark:text-dark-text font-semibold hover:bg-brand-surface dark:hover:bg-dark-cardHover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInterview}
                className="flex-1 py-3 rounded-xl bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 text-white font-semibold transition-colors"
              >
                End & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white dark:bg-dark-surface border-b border-brand-border dark:border-dark-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
              isAiMode
                ? 'bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isAiMode ? '🤖 AI Interview' : '📖 Practice'}
            </span>
            <span className="text-xs text-brand-slate dark:text-dark-muted font-semibold hidden sm:inline">
              {activeInterview.topic} • {activeInterview.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Violations (AI mode) */}
            {isAiMode && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                <AlertTriangle size={14} className="animate-pulse" />
                <span>{violations.length}/3</span>
              </div>
            )}

            {/* Timer */}
            <div className={`flex items-center gap-1 text-sm font-extrabold font-mono px-3 py-1.5 rounded-lg border ${
              timeLeft <= 30
                ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30'
                : 'text-brand-charcoal dark:text-dark-text border-brand-border dark:border-dark-border bg-brand-surface dark:bg-dark-card'
            }`}>
              <Clock size={14} className={timeLeft <= 30 ? 'text-rose-500' : 'text-brand-purple dark:text-dark-purple'} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Question progress */}
            <span className="text-xs font-bold text-brand-charcoal dark:text-dark-text hidden sm:inline">
              Q{currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto mt-2">
          <div className="w-full h-1.5 bg-brand-border dark:bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-blue dark:from-dark-purple dark:to-dark-cyan rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="max-w-7xl mx-auto px-4 py-6 animate-slide-up">
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* LEFT PANEL: AI Interviewer Section */}
          <div className="space-y-5">
            {/* AI Avatar Display Box */}
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl overflow-hidden shadow-premium dark:shadow-dark-card">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-brand-border dark:border-dark-border">
                <Brain size={14} className="text-brand-purple dark:text-dark-purple animate-pulse" />
                <span className="text-xs font-bold text-brand-charcoal dark:text-dark-text">AI Interviewer Avatar</span>
              </div>
              <div className="relative bg-brand-charcoal aspect-video flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-charcoal via-slate-900 to-black p-6">
                
                {/* Holographic AI Avatar Orb */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-purple/30 dark:border-dark-purple/30 animate-ping duration-1000"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-brand-blue/40 dark:border-dark-blue/40 animate-pulse duration-700"></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-purple-glow">
                    <Brain size={48} className="text-white animate-bounce" />
                  </div>
                </div>
                
                <span className="mt-4 px-3 py-1 bg-white/10 text-white/90 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-ping"></span>
                  <span>AI Assistant Active</span>
                </span>
              </div>
            </div>

            {/* Question Display Card */}
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <div className="flex items-center gap-4 mb-5">
                <div className="ai-avatar-orb w-14 h-14 shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Brain size={20} className="text-brand-purple dark:text-dark-purple" />
                  </div>
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-brand-charcoal dark:text-dark-text">
                    {isAiMode ? 'AI Interviewer' : 'Practice Assistant'}
                  </h3>
                  <p className="text-xs text-brand-slate dark:text-dark-muted">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>
                </div>
              </div>

              {/* Question Display - Speech Bubble */}
              {aiThinking ? (
                <div className="ai-speech-bubble flex items-center gap-3 min-h-[80px]">
                  <div className="ai-thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="text-xs text-brand-slate dark:text-dark-muted italic">Preparing next question...</span>
                </div>
              ) : (
                <div className="ai-speech-bubble">
                  <h2 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text leading-relaxed">
                    {currentQuestion?.question}
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: User Video & Answer Workspace */}
          <div className="space-y-5">
            {/* User Video Camera Feed */}
            <div className={`bg-white dark:bg-dark-card border rounded-3xl overflow-hidden shadow-premium dark:shadow-dark-card transition-all duration-300 ${
              isRecording && !isPaused
                ? 'ring-4 ring-brand-purple dark:ring-dark-purple border-brand-purple dark:border-dark-purple scale-[1.01]'
                : 'border-brand-border dark:border-dark-border'
            }`}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-brand-purple dark:text-dark-purple" />
                  <span className="text-xs font-bold text-brand-charcoal dark:text-dark-text">Your Camera</span>
                </div>
                {isVideoBlurred && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                    <VideoOff size={12} />
                    <span>Blurred — return focus</span>
                  </div>
                )}
                {isRecording && !isVideoBlurred && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs text-brand-slate dark:text-dark-muted">Recording</span>
                  </div>
                )}
              </div>
              <div className="relative bg-gray-900 aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-all duration-500 ${isVideoBlurred ? 'blur-xl scale-105' : ''}`}
                />
                {isVideoBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center text-white">
                      <ShieldAlert size={32} className="mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-semibold">Focus Lost</p>
                      <p className="text-xs opacity-70">Return to this window</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Answer Workspace */}
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-4 mb-4">
                <h3 className="font-outfit font-bold text-sm text-brand-charcoal dark:text-dark-text">Answer Workspace</h3>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs text-brand-slate dark:text-dark-muted">
                      {isPaused ? 'Paused' : 'Listening...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Transcript textarea */}
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Click 'Record' to speak your response, or type directly..."
                className="w-full h-56 p-4 border border-brand-border dark:border-dark-border rounded-2xl outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-brand-surface/30 dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text leading-relaxed resize-none transition-colors animate-fade-in"
              ></textarea>

              {/* Recording Controls */}
              <div className="flex flex-wrap gap-2 mt-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-xs shadow-premium dark:shadow-neon-purple transition-all"
                  >
                    <Mic size={14} />
                    <span>Record</span>
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={resumeRecording}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple text-brand-charcoal dark:text-dark-text font-semibold text-xs transition-all"
                      >
                        <Play size={12} className="fill-current" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseRecording}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold text-xs transition-all"
                      >
                        <Pause size={12} className="fill-current" />
                        <span>Pause</span>
                      </button>
                    )}
                    <button
                      onClick={() => { stopSpeechRecognition(); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 font-semibold text-xs transition-all"
                    >
                      <MicOff size={12} />
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Submit Answer */}
              <button
                onClick={handleSubmitAnswer}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-sm shadow-premium dark:shadow-neon-purple transition-all hover:-translate-y-0.5"
              >
                <Send size={14} />
                <span>Submit Answer</span>
              </button>

              {/* Skip Question */}
              <button
                onClick={handleSkipQuestion}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold text-sm transition-all"
              >
                <SkipForward size={14} />
                <span>Skip</span>
              </button>

              {/* End Interview */}
              <button
                onClick={handleEndInterview}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 font-semibold text-sm transition-all"
              >
                <StopCircle size={14} />
                <span>End Interview</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InterviewActive;
