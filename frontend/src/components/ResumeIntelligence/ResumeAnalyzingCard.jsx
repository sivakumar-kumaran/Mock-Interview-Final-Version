import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Brain, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

const ANALYSIS_STEPS = [
  'Extracting complete resume content & structure...',
  'Extracting candidate name, summary & CGPA/percentage...',
  'Deduplicating technical skills, frameworks & tools...',
  'Cataloging engineering projects, internships & certifications...',
  'Finalizing dynamic career intelligence & interview readiness...'
];

/**
 * ResumeAnalyzingCard Component
 * Displays a full-screen focused card informing the user that resume analysis is happening.
 * When analysis completes, renders an animated "Payment Done" style success symbol (GPay/Apple Pay style)
 * before smoothly transitioning to the dashboard.
 */
const ResumeAnalyzingCard = ({
  isAnalyzing = false,
  isComplete = false,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Cycle through informative steps during analysis
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Handle completion & trigger "Payment Done" style animation
  useEffect(() => {
    if (isComplete) {
      setShowSuccessBadge(true);
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1600); // 1.6s delay to show the payment done symbol before returning to dashboard
      return () => clearTimeout(timer);
    } else {
      setShowSuccessBadge(false);
    }
  }, [isComplete, onComplete]);

  if (!isAnalyzing && !isComplete && !showSuccessBadge) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md transition-all duration-500 animate-fade-in select-none">
      
      {/* ONLY THIS CARD IS DISPLAYED IN SCREEN */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#111827] to-[#0B0F19] border border-slate-700/80 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center transform transition-all duration-300">
        
        {/* Subtle Ambient Backlight Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          showSuccessBadge ? 'bg-emerald-500/25' : 'bg-brand-purple/20'
        }`} />

        {!showSuccessBadge ? (
          /* ================= ACTIVE ANALYZING STATE ================= */
          <div className="flex flex-col items-center space-y-6 w-full relative z-10 py-2">
            
            {/* Animated Radar & Scanning Document Badge */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Spinning outer radar rings */}
              <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20 animate-ping opacity-40" />
              <div className="absolute inset-0 rounded-full border border-brand-purple/40 border-t-brand-purple animate-spin" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/30 border-b-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
              
              {/* Center icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple/30 to-emerald-500/20 border border-slate-600/60 flex items-center justify-center text-emerald-400 shadow-inner">
                <Brain size={30} className="animate-pulse text-emerald-400" />
              </div>
            </div>

            {/* Informative Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-light text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} className="animate-pulse" />
                <span>AI Resume Intelligence</span>
              </div>
              <h3 className="font-outfit font-extrabold text-2xl text-white">
                Analyzing Your Resume
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Gemini AI is parsing and verifying your authentic credentials, projects, and tech stacks.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-brand-purple via-indigo-500 to-emerald-400 transition-all duration-700 rounded-full"
                style={{ width: `${Math.min(95, (currentStepIndex + 1) * 20)}%` }}
              />
            </div>

            {/* Step Checklist Box */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={idx} className="flex items-center gap-2.5 text-xs transition-colors duration-300">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${
                      isPassed
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-purple text-white ring-2 ring-brand-purple/50 animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {isPassed ? <Check size={11} strokeWidth={3} /> : idx + 1}
                    </span>
                    <span className={`leading-tight ${
                      isPassed
                        ? 'text-slate-300 font-medium'
                        : isCurrent
                        ? 'text-white font-semibold'
                        : 'text-slate-600'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Zero placeholders • 100% extracted from your resume</span>
            </div>

          </div>
        ) : (
          /* ================= "PAYMENT DONE" STYLE SUCCESS SYMBOL ================= */
          <div className="flex flex-col items-center space-y-6 w-full relative z-10 py-6 animate-scale-up">
            
            {/* GPay / Apple Pay Style Big Circular Green Badge */}
            <div className="relative flex items-center justify-center my-2">
              {/* Outer Ripple Rings */}
              <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/30 animate-pulse" />
              
              {/* Central Solid Emerald Badge */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.7)] flex items-center justify-center transform transition-transform duration-500 scale-100">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Text */}
            <div className="space-y-2">
              <h3 className="font-outfit font-black text-2xl sm:text-3xl text-white tracking-tight">
                Resume Analyzed!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
                Structured profile created & verified successfully
              </p>
            </div>

            {/* Redirection indicator badge */}
            <div className="px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Opening your dashboard...</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeAnalyzingCard;
