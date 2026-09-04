import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Send,
  Clock,
  AlertTriangle,
  Maximize2,
  ShieldAlert,
  SkipForward,
  StopCircle,
  Video,
  VideoOff,
  Brain,
  Code2,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Trash2,
  Loader2
} from 'lucide-react';
import Toast from '../components/Toast';
import EmbeddedCodeEditor from '../components/CodeEditor/EmbeddedCodeEditor';

const InterviewActive = () => {
  const {
    activeInterview,
    currentQuestionIndex,
    interviewStatus,
    interviewMode,
    violations,
    logViolation,
    runCode,
    submitActiveAnswer,
    terminateInterviewEarly
  } = useInterview();

  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
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
  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);

  const isAiMode = interviewMode === 'ai';
  const currentQuestion = activeInterview?.questions?.[currentQuestionIndex];
  const totalQuestions = activeInterview?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const exitFullscreenSafe = () => {
    if (document.fullscreenElement) {
      const exitMethod =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document).catch(() => {});
      }
    }
  };

  // Redirect on finish
  useEffect(() => {
    if (interviewStatus === 'feedback') {
      exitFullscreenSafe();
      navigate('/interview/feedback');
    } else if (interviewStatus === 'idle' || !activeInterview) {
      exitFullscreenSafe();
      navigate('/interview/setup');
    }
  }, [interviewStatus, activeInterview, navigate]);

  useEffect(() => {
    return () => {
      exitFullscreenSafe();
    };
  }, []);

  // Web camera initialization
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

  // Fullscreen & integrity listeners
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

  // Speech Synthesis
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

      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };
      utterance.onend = () => {
        setIsAiSpeaking(false);
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleReplayQuestion = () => {
    if (currentQuestion?.question) {
      speakText(currentQuestion.question);
    }
  };

  // Question change & timer reset
  useEffect(() => {
    if (!activeInterview || !hasStarted) return;

    setTranscript('');
    
    let questionSeconds = 240;
    if (currentQuestion?.allocatedMinutes) {
      questionSeconds = currentQuestion.allocatedMinutes * 60;
    } else if (currentQuestion?.language === 'sql' || currentQuestion?.category === 'sql') {
      questionSeconds = 600;
    } else if (currentQuestion?.type === 'coding' || currentQuestion?.category === 'coding') {
      questionSeconds = 900;
    }

    setTimeLeft(questionSeconds);
    stopSpeechRecognition();

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
  }, [currentQuestionIndex, activeInterview, hasStarted, currentQuestion]);

  // Read question on mount/switch
  useEffect(() => {
    if (!activeInterview || !currentQuestion || !hasStarted) return;

    let textToSpeak = '';
    if (currentQuestionIndex === 0) {
      const motivationQuotes = [
        "Welcome to your mock interview. Stay confident and speak clearly. Let's begin with the first question: ",
        "Hello! Take a deep breath, believe in your preparation. Here is your first question: ",
        "Welcome! Speak with structure and clarity. First question: "
      ];
      const randomQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
      textToSpeak = randomQuote + currentQuestion.question;
    } else {
      textToSpeak = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;
    }

    const speakTimer = setTimeout(() => {
      speakText(textToSpeak);
    }, 800);

    return () => {
      clearTimeout(speakTimer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsAiSpeaking(false);
    };
  }, [currentQuestionIndex, activeInterview, currentQuestion, hasStarted, speakText]);

  // Sync state refs
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
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
    submitActiveAnswer('');
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
      <div className="h-screen w-screen flex items-center justify-center bg-[#070b14] text-slate-100 px-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <Brain size={28} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-xl text-white mb-2">Analyzing Responses</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini AI is evaluating your technical accuracy, communication, confidence, and structured problem-solving...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeInterview) return null;

  // Proctoring Start Modal
  if (!hasStarted) {
    return (
      <div className="h-screen w-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-6 relative select-none">
        <div className="max-w-md w-full bg-[#0D1527] border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)] text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <Brain size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-white mb-2">Interactive Interview Room</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Session is ready. Live question stream, camera proctoring, and AI speech synthesis will activate upon entry.
            </p>
          </div>
          <button
            onClick={() => {
              setHasStarted(true);
              enterFullscreen();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#070b14] font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-100"
          >
            Enter Interview Mode (Fullscreen)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-[#070b14] text-slate-100 select-none relative font-inter">
      
      {/* Fullscreen Guard Overlay */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 text-center select-none">
          <div className="bg-[#0D1527] rounded-3xl border border-rose-500/40 p-8 max-w-md space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle size={28} className="animate-bounce" />
            </div>
            <div>
              <h2 className="font-outfit font-extrabold text-xl text-white mb-2">Fullscreen Lock Exited</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                To continue the proctored interview session, please return to fullscreen mode.
              </p>
            </div>
            <button
              onClick={enterFullscreen}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-md"
            >
              <Maximize2 size={16} />
              <span>Return to Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* End Interview Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[998] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0D1527] rounded-3xl border border-slate-700 p-7 max-w-md w-full space-y-5 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <StopCircle size={26} />
            </div>
            <div className="text-center">
              <h2 className="font-outfit font-bold text-lg text-white mb-1.5">End Interview Early?</h2>
              <p className="text-xs text-slate-300">
                Your completed answers will be submitted for AI evaluation. Unanswered questions will receive 0 scores.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInterview}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                End & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP COMPACT HEADER (Fixed Height: ~48px) */}
      <header className="h-12 shrink-0 bg-[#0B101D] border-b border-slate-800/80 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wide ${
            isAiMode
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isAiMode ? '🤖 AI Interview' : '📖 Practice Mode'}
          </span>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            {activeInterview.topic} • <span className="text-emerald-400 font-bold capitalize">{activeInterview.difficulty}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Violations */}
          {isAiMode && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/40 px-2.5 py-0.5 rounded-lg border border-rose-800/50">
              <AlertTriangle size={13} className="animate-pulse" />
              <span>Violations: {violations.length}/3</span>
            </div>
          )}

          {/* Question Index Pill */}
          <span className="text-xs font-extrabold text-white bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
            Q {currentQuestionIndex + 1} of {totalQuestions}
          </span>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-1 text-xs font-mono font-extrabold px-3 py-1 rounded-lg border ${
            timeLeft <= 30
              ? 'text-rose-400 border-rose-500/60 bg-rose-950/50 animate-pulse'
              : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
          }`}>
            <Clock size={13} className={timeLeft <= 30 ? 'text-rose-400' : 'text-emerald-400'} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* TOP PROGRESS LINE */}
      <div className="h-1 w-full bg-slate-800 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* HORIZONTAL QUESTION BANNER (Fixed ~75px - 90px) */}
      <div className="shrink-0 px-4 py-2.5 bg-[#090E1B]/95 border-b border-emerald-500/20 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                {currentQuestion?.category === 'intro' ? 'Stage 1: Resume Overview'
                  : currentQuestion?.category === 'technical' ? 'Stage 2: Core Tech Deep Dive'
                  : currentQuestion?.category === 'sql' ? 'Stage 3: Compulsory SQL Challenge'
                  : currentQuestion?.category === 'coding' ? 'Stage 4: Live Coding Challenge'
                  : currentQuestion?.category === 'architecture' || currentQuestion?.category === 'database' ? 'Stage 5: Architecture & Systems'
                  : currentQuestion?.category === 'behavioral' ? 'Stage 6: Behavioral & HR'
                  : currentQuestion?.category || 'General Question'}
              </span>
              {currentQuestion?.allocatedMinutes && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  • {currentQuestion.allocatedMinutes} min allocated
                </span>
              )}
            </div>

            {aiThinking ? (
              <div className="flex items-center gap-2 py-1 text-slate-400 text-xs italic">
                <Loader2 size={13} className="animate-spin text-emerald-400" />
                <span>AI Interviewer is preparing your question...</span>
              </div>
            ) : (
              <h2 className="font-outfit font-bold text-sm sm:text-base text-white leading-snug line-clamp-2">
                {currentQuestion?.question}
              </h2>
            )}
          </div>

          {/* Replay Audio Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReplayQuestion}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isAiSpeaking
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Replay Question Audio"
            >
              <Volume2 size={14} className={isAiSpeaking ? 'animate-bounce' : ''} />
              <span>{isAiSpeaking ? 'AI Speaking...' : 'Play Question'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* MIDDLE VIEWPORT: DUAL SCREEN (AI Interviewer + User Camera) OR Coding Editor */}
      <div className="flex-1 min-h-0 px-4 py-2 flex flex-col justify-center">
        <div className="max-w-7xl w-full mx-auto h-full flex flex-col">
          
          {currentQuestion?.type === 'coding' || currentQuestion?.category === 'coding' ? (
            /* Coding Round Layout */
            <div className="h-full flex flex-col min-h-0">
              <EmbeddedCodeEditor
                question={currentQuestion.question}
                initialLanguage={currentQuestion.language || 'javascript'}
                starterCode={currentQuestion.starterCode || ''}
                testCases={currentQuestion.testCases || []}
                onRunCode={(q, code, lang, tc) => runCode(q, code, lang, tc)}
                onSubmitCode={(codeData) => {
                  submitActiveAnswer(codeData.code, codeData);
                }}
              />
            </div>
          ) : (
            /* Verbal Dual Screen: AI Avatar + User Video Feed */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 h-full min-h-0">
              
              {/* 1. AI INTERVIEWER SCREEN */}
              <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#0B1220] to-[#050811] border transition-all duration-300 flex flex-col items-center justify-center p-4 shadow-lg ${
                isAiSpeaking
                  ? 'border-emerald-400 ring-4 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                  : 'border-slate-800'
              }`}>
                {/* AI Header Label */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-slate-700/50">
                  <Brain size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200">AI Interviewer</span>
                </div>

                {/* AI Live Audio Waves (Top Right) */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1 z-10">
                  {isAiSpeaking ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold animate-pulse">
                      <div className="flex items-center gap-0.5 h-2.5 mr-1">
                        <span className="w-0.5 h-full bg-emerald-400 animate-bounce"></span>
                        <span className="w-0.5 h-2 bg-emerald-400 animate-bounce delay-75"></span>
                        <span className="w-0.5 h-full bg-emerald-400 animate-bounce delay-150"></span>
                      </div>
                      <span>Speaking</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800">
                      Standby
                    </span>
                  )}
                </div>

                {/* Animated Holographic AI Orb */}
                <div className="relative flex items-center justify-center my-auto">
                  {/* Concentric Speaking Rings */}
                  {isAiSpeaking && (
                    <>
                      <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30 animate-ping duration-1000"></div>
                      <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-400/50 animate-pulse duration-700"></div>
                    </>
                  )}

                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
                    isAiSpeaking
                      ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] scale-105'
                      : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700'
                  }`}>
                    <Brain
                      size={42}
                      className={`transition-colors duration-300 ${
                        isAiSpeaking ? 'text-[#070b14] animate-bounce' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <span className={`text-[11px] font-semibold px-3 py-0.5 rounded-full ${
                    isAiSpeaking
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/40'
                  }`}>
                    {isAiSpeaking ? 'AI is asking question...' : 'AI Assistant Active'}
                  </span>
                </div>
              </div>

              {/* 2. USER CAMERA & AUDIO SCREEN */}
              <div className={`relative rounded-2xl overflow-hidden bg-black border transition-all duration-300 flex flex-col justify-center shadow-lg ${
                isRecording && !isPaused
                  ? 'border-emerald-400 ring-4 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                  : 'border-slate-800'
              }`}>
                {/* User Camera Header Label */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-slate-700/50">
                  <Video size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200">Your Video & Mic</span>
                </div>

                {/* User Speaking Status Badge */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1 z-10">
                  {isRecording && !isPaused ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold animate-pulse">
                      <div className="flex items-center gap-0.5 h-2.5 mr-1">
                        <span className="w-0.5 h-full bg-emerald-400 animate-bounce"></span>
                        <span className="w-0.5 h-2 bg-emerald-400 animate-bounce delay-75"></span>
                        <span className="w-0.5 h-full bg-emerald-400 animate-bounce delay-150"></span>
                      </div>
                      <span>Listening...</span>
                    </div>
                  ) : isPaused ? (
                    <span className="text-[10px] text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40">
                      Paused
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800">
                      Mic Idle
                    </span>
                  )}
                </div>

                {/* Live Webcam Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isVideoBlurred ? 'blur-xl scale-105' : ''
                  }`}
                />

                {/* Focus Lost Guard Alert */}
                {isVideoBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                    <div className="text-center text-white p-4">
                      <ShieldAlert size={36} className="mx-auto mb-1.5 text-rose-500 animate-bounce" />
                      <p className="text-sm font-bold text-rose-300">Focus Lost Warning</p>
                      <p className="text-[11px] text-slate-300">Return window focus immediately</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* BOTTOM WORKSPACE & CONTROL DOCK (Fixed Height: ~130px - 140px, NO PAGE SCROLL) */}
      <div className="shrink-0 bg-[#0B101D] border-t border-slate-800/90 px-4 py-2.5 z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto space-y-2">
          
          {/* Live Transcript Input / Textarea */}
          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click 'Record' to speak your answer, or type your response here directly..."
              className="w-full h-11 px-4 pr-20 bg-[#070B14] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="absolute right-3 top-2.5 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs"
                title="Clear text"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Controls Bar: Mic cluster on left, Submission actions on right */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Left: Recording Controls */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#070b14] font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] active:scale-100"
                >
                  <Mic size={14} className="animate-pulse" />
                  <span>Record Answer</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Play size={13} className="fill-current text-emerald-400" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-colors"
                    >
                      <Pause size={13} className="fill-current" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopSpeechRecognition}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors"
                  >
                    <MicOff size={13} />
                    <span>Stop</span>
                  </button>
                </div>
              )}

              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline ml-1">
                {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words spoken` : '0 words'}
              </span>
            </div>

            {/* Right: Submit / Skip / End Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                title="Skip this question"
              >
                <SkipForward size={13} />
                <span>Skip</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#070b14] font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] active:scale-100"
              >
                <Send size={13} />
                <span>Submit Answer</span>
              </button>

              <button
                type="button"
                onClick={handleEndInterview}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-colors"
                title="End interview early"
              >
                <StopCircle size={13} />
                <span className="hidden sm:inline">End</span>
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
