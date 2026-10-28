import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';

/**
 * ResumeAnalyzingCard Component
 * Fixed full-screen takeover completely covering the background.
 * Displays only "Resume processing" with futuristic animations.
 * When analysis completes, renders an animated "Payment Done" style success symbol (GPay/Apple Pay style)
 * before smoothly transitioning to dashboard.
 */
const ResumeAnalyzingCard = ({
  isAnalyzing = false,
  isComplete = false,
  onComplete
}) => {
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Lock body scroll while the full-screen card is open to fully cover background
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle completion & trigger "Payment Done" style animation
  useEffect(() => {
    if (isComplete) {
      setShowSuccessBadge(true);
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessBadge(false);
    }
  }, [isComplete, onComplete]);

  if (!isAnalyzing && !isComplete && !showSuccessBadge) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-screen z-[999999] flex items-center justify-center p-4 bg-[#060913]/98 backdrop-blur-2xl transition-all duration-500 animate-fade-in select-none overflow-hidden">
      
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* FIXED IMMERSIVE CARD */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#111827] via-[#0E1626] to-[#070D18] border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_80px_rgba(16,185,129,0.22)] overflow-hidden flex flex-col items-center text-center transform transition-all duration-300">
        
        {/* Subtle Ambient Backlight Glow inside card */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 bg-emerald-500/25" />

        {!showSuccessBadge ? (
          /* ================= ACTIVE ANALYZING STATE ================= */
          <div className="flex flex-col items-center space-y-7 w-full relative z-10 py-4">
            
            {/* Animated Radar & Scanning Document Badge */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer Ripple Rings */}
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-35" />
              <div className="absolute -inset-2 rounded-full border border-emerald-500/20 animate-pulse" />
              
              {/* Counter-rotating cyber radar rings */}
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-500/60 animate-spin"
                style={{ animationDuration: '2.2s' }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-teal-400 border-l-teal-500/40 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '3s' }}
              />
              
              {/* Center glowing badge with laser scan sweep */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-slate-900 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden">
                <FileText size={34} className="text-emerald-400 animate-pulse" />
                
                {/* Laser scan line sweeping across */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_12px_#34d399] animate-scan-laser" />
              </div>
            </div>

            {/* ONLY TEXT: "Resume processing" with animated dots */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-extrabold text-2xl sm:text-3xl bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent tracking-wide">
                  Resume processing
                </h3>
                <div className="ai-thinking-dots flex items-center gap-1">
                  <span className="!w-2 !h-2 !bg-emerald-400" />
                  <span className="!w-2 !h-2 !bg-emerald-400" />
                  <span className="!w-2 !h-2 !bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Futuristic Equalizer Wave & Infinite Shimmer Progress Bar */}
            <div className="w-full flex flex-col items-center space-y-3 pt-1">
              {/* Equalizer Frequency Bars */}
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((scale, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                    style={{
                      height: `${Math.round(scale * 22)}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>

              {/* Infinite Glowing Laser Progress Line */}
              <div className="w-48 h-1 bg-slate-800/90 rounded-full overflow-hidden relative border border-slate-700/60 shadow-inner">
                <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-shimmer" />
              </div>
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
            <div className="space-y-1">
              <h3 className="font-outfit font-black text-2xl sm:text-3xl text-white tracking-tight">
                Resume Processed!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
                Intelligence profile verified & ready
              </p>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default ResumeAnalyzingCard;
