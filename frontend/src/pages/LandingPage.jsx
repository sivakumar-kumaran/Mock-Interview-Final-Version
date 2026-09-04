import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Cpu, ShieldCheck, BarChart3, Mic, Zap, Users, MessageSquare, ArrowRight, CheckCircle2, ChevronDown, Award, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const { isVersion2, switchVersion, appVersion } = useTheme();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the AI evaluate my interview responses?",
      a: "Our evaluation engine integrates Google Gemini Generative AI. It analyzes your recorded answer transcript against the difficulty level for technical accuracy, keyword coverage, communication clarity, completeness, and speaking confidence, returning an overall score and actionable feedback."
    },
    {
      q: "Do I need to download any software for speech recording?",
      a: "No. The platform utilizes standard HTML5 Web Media APIs built directly into your web browser. You can record, pause, resume, and review your transcript in real-time without installing any plug-ins."
    },
    {
      q: "What is the integrity tracking system?",
      a: "To simulate a real, high-stakes coding interview assessment, our environment monitors focus. It enforces full-screen execution, and logs violations if you switch browser tabs or click away from the screen. If 3 violations are logged, the mock interview is automatically submitted for grading."
    },
    {
      q: "Can I practice specific coding languages or non-tech topics?",
      a: "Yes! We support 12 distinct tracks: Java, JavaScript, React, Node.js, MongoDB, SQL, DBMS, Operating Systems, Computer Networks, Object-Oriented Programming (OOP), Data Structures & Algorithms (DSA), and HR behavioral preparation."
    }
  ];

  const features = [
    {
      icon: <Mic className="text-brand-purple dark:text-dark-purple" size={24} />,
      title: "Speech-To-Text Recording",
      desc: "Record your answers using your microphone. Get an instant live transcript to review and edit before submission."
    },
    {
      icon: <Cpu className="text-brand-blue dark:text-dark-blue" size={24} />,
      title: "Gemini AI Grading",
      desc: "Receive deep evaluations based on technical accuracy, communication, completeness, and relevant keywords."
    },
    {
      icon: <BarChart3 className="text-brand-cyan dark:text-dark-cyan" size={24} />,
      title: "Performance Trends",
      desc: "Monitor your preparation with weekly progress reports, average score dashboards, and strengths lists."
    },
    {
      icon: <ShieldCheck className="text-emerald-500 dark:text-emerald-400" size={24} />,
      title: "Integrity Safeguards",
      desc: "Enforce exam integrity with tab-switching detection and full screen locks to build real exam discipline."
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-dark-bg select-none transition-colors duration-300">
      
      {/* Decorative Glow Elements */}
      <div className="bg-ambient-glow glow-blue"></div>
      <div className="bg-ambient-glow glow-purple"></div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 sm:pt-28 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        
        {/* Version 1 ONLY Announcement Banner (Hidden in Version 2) with Spin-Up & Float Animation */}
        {!isVersion2 && (
          <div className="max-w-3xl mx-auto mb-10 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-brand-purple/20 via-brand-blue/15 to-emerald-500/20 border-2 border-brand-purple/50 dark:border-dark-purple/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(124,58,237,0.25)] text-left sm:text-center animate-spin-up animate-float-subtle relative overflow-hidden group">
            {/* Glowing Accent Ring */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-purple/25 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue text-white text-xs font-extrabold uppercase tracking-wider mb-3 shadow-md">
              <Sparkles size={14} className="animate-spin-slow text-amber-300" />
              <span>🚀 Version 2 is Ready!</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-brand-charcoal dark:text-dark-text font-outfit tracking-tight">
              Resume-Based AI Interview (Version 2)
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate dark:text-dark-muted mt-2 max-w-xl mx-auto leading-relaxed">
              Upload your resume and experience real-time project extraction, customized technical & SQL rounds, and our new emerald theme.
            </p>
            <div className="mt-5 flex items-center justify-start sm:justify-center gap-3">
              <button
                type="button"
                onClick={() => switchVersion('v2')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black shadow-[0_0_30px_rgba(0,245,160,0.6)] transition-all hover:scale-105 active:scale-95"
              >
                <span>Launch Version 2 (ResumeAI Theme)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Top Badges */}
        {isVersion2 ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-[#00F5A0] text-xs font-bold tracking-wide mb-8 shadow-[0_0_20px_rgba(0,245,160,0.25)] animate-pulse">
            <Sparkles size={14} className="text-[#00F5A0]" />
            <span>AI-Driven ATS Parsing & Mock Interview Intelligence</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-purple-light dark:bg-dark-purple/20 border border-brand-purple/10 dark:border-dark-purple/30 text-brand-purple dark:text-dark-purple text-xs font-bold uppercase tracking-wider mb-8 animate-pulse">
            <Award size={14} />
            <span>AI-Powered Interview Prep</span>
          </div>
        )}

        {/* Heading */}
        {isVersion2 ? (
          <h1 className="font-outfit font-extrabold text-3xl sm:text-6xl tracking-tight text-white leading-[1.15] mb-6">
            Scale Career Readiness with <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Production–Grade Precision
            </span>
          </h1>
        ) : (
          <h1 className="font-outfit font-extrabold text-3xl sm:text-5xl tracking-tight text-brand-charcoal dark:text-dark-text leading-[1.1] mb-6">
            Practice Smarter. <br className="hidden sm:block" />
            Speak Confidently. <span className="bg-gradient-to-r from-brand-purple via-brand-blue to-brand-cyan bg-clip-text text-transparent">Succeed in Every Interview.</span>
          </h1>
        )}

        {/* Subtitle with Emerald Highlight Spans */}
        {isVersion2 ? (
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-10">
            Audit resumes against target job specifications with <span className="text-[#00F5A0] font-bold">PyMuPDF parsing</span>, <span className="text-cyan-400 font-bold">FAISS semantic embeddings</span>, and seamlessly practice in the <span className="text-[#00F5A0] font-bold">MockWithSiva</span> virtual interviewer platform.
          </p>
        ) : (
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-brand-slate dark:text-dark-muted leading-relaxed mb-10">
            Practice real interview questions, get AI-generated feedback, and track your performance—all in one platform.
          </p>
        )}

        {/* Call to Actions */}
        {isVersion2 ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://resume-analyzer-eight-sigma.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#00F5A0] hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-[0_0_30px_rgba(0,245,160,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Analyze Resume Now</span>
              <ArrowRight size={18} />
            </a>
            <Link
              to={user ? "/interview/setup" : "/register"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-slate-700 hover:border-emerald-500/80 bg-slate-900/80 hover:bg-slate-800 text-slate-100 font-semibold text-base transition-all"
            >
              <span>Launch Mock Interview</span>
              <ExternalLink size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/interview/setup" : "/register"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-lg shadow-purple-glow dark:shadow-neon-purple transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0"
            >
              <span>Take Mock Interview</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to={user ? "/practice" : "/login"}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-2xl border border-brand-border dark:border-dark-border hover:border-brand-purple dark:hover:border-dark-purple text-brand-charcoal dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card font-semibold text-lg transition-colors"
            >
              Start Practice
            </Link>
          </div>
        )}

        {/* Mockup Showcase Panel */}
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto rounded-3xl border border-brand-border dark:border-dark-border bg-brand-surface/50 dark:bg-dark-card/50 p-3 sm:p-4 shadow-premium dark:shadow-dark-card glass-panel">
          <div className="rounded-2xl border border-brand-border dark:border-dark-border overflow-hidden bg-brand-charcoal aspect-[16/10] relative flex items-center justify-center">
            
            {/* Design representation of interface */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-charcoal via-slate-900 to-black p-6 flex flex-col justify-between text-left select-none">
              
              {/* Fake UI Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-white/40 ml-2 font-mono">https://mockai.com/interview/active</span>
                </div>
                <div className="px-3 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold">
                  FULLSCREEN LOCK ACTIVE
                </div>
              </div>

              {/* Fake UI Body */}
              <div className="grid grid-cols-3 gap-6 flex-1 py-6 items-center">
                <div className="col-span-2 space-y-4">
                  <div className="inline-block px-2.5 py-1 rounded bg-brand-purple/20 text-brand-purple text-[10px] font-bold">
                    QUESTION 3 OF 5
                  </div>
                  <h3 className="text-white text-base sm:text-2xl font-outfit font-bold leading-snug">
                    Explain how the JavaScript Event Loop works, covering call stack, callback queue, and microtask queue.
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs text-white/60">Recording audio... (01:24)</span>
                  </div>
                  <div className="h-20 rounded bg-white/5 border border-white/10 p-3 text-xs text-white/50 italic leading-relaxed">
                    "The event loop is a mechanism in JavaScript that allows it to execute asynchronous operations. When an async function finishes, it is put into the callback queue. The event loop checks the stack, and if it's empty,..."
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3.5">
                  <h4 className="text-white/80 font-semibold text-xs border-b border-white/5 pb-2">Integrity Status</h4>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Fullscreen</span>
                    <span className="text-green-400 font-bold">Enforced</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Tab switches</span>
                    <span className="text-white/80">0 / 3</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Warnings Left</span>
                    <span className="text-amber-400 font-bold">3 Warnings</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-purple h-full w-[40%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Features Grid */}
      <section className="py-20 bg-brand-surface dark:bg-dark-surface relative z-10 border-y border-brand-border dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl text-brand-charcoal dark:text-dark-text mb-4">
              Everything You Need to Ace Your Next Tech Interview
            </h2>
            <p className="text-brand-slate dark:text-dark-muted text-base sm:text-lg">
              We leverage browser capabilities and cloud intelligence to create a complete, automated simulator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-brand-border dark:border-dark-border hover:shadow-premium dark:hover:shadow-neon-purple transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-brand-surface dark:bg-dark-surface flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mb-3">{feat.title}</h3>
                <p className="text-brand-slate dark:text-dark-muted text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative z-10 bg-white dark:bg-dark-bg transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl text-brand-charcoal dark:text-dark-text mb-4">
              Step-by-Step Simulation Flow
            </h2>
            <p className="text-brand-slate dark:text-dark-muted">
              Complete mock interview loops are fully automated and run securely in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { num: '01', title: 'Choose Settings', desc: 'Select from 12 topics (e.g. JavaScript, React, SQL) and pick Beginner, Intermediate, or Advanced level.' },
              { num: '02', title: 'Speak & Record', desc: 'Review the question, start your voice capture, speak your thoughts, and check the live text transcripts.' },
              { num: '03', title: 'Maintain Focus', desc: 'Stay in full-screen. Tab switches trigger integrity counts. Auto-submits on 3 violations to ensure honesty.' },
              { num: '04', title: 'Get Evaluated', desc: 'Receive detailed report cards showing technical scores, communication rankings, strengths and suggestions.' },
            ].map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-brand-border dark:border-dark-border relative">
                <span className="absolute top-4 right-4 text-5xl font-extrabold text-brand-purple/10 dark:text-dark-purple/15 font-outfit">{step.num}</span>
                <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text mt-6 mb-3">{step.title}</h3>
                <p className="text-brand-slate dark:text-dark-muted text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-brand-surface dark:bg-dark-surface border-t border-brand-border dark:border-dark-border relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl text-brand-charcoal dark:text-dark-text leading-tight mb-6">
                Why Practice With Our AI Simulators?
              </h2>
              <p className="text-brand-slate dark:text-dark-muted mb-8 leading-relaxed">
                Reading articles and memorizing question banks rarely helps. True confidence comes from speaking answers aloud under pressure, handling structural time limits, and receiving objective evaluations.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: 'Overcome Speaking Anxiety', desc: 'Simulating real clock limits ensures you feel comfortable presenting technical topics.' },
                  { title: 'Pinpoint Knowledge Gaps', desc: 'AI diagnostics review exact keyword omissions and show where your concepts lack depth.' },
                  { title: 'Structure Technical Explanations', desc: 'Actionable recommendations prompt you to frame answers logically using bullet points.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <CheckCircle2 className="text-brand-purple dark:text-dark-purple shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm">{item.title}</h4>
                      <p className="text-xs text-brand-slate dark:text-dark-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple to-brand-cyan opacity-10 dark:opacity-20 blur-2xl rounded-3xl"></div>
              <div className="relative bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border p-8 shadow-premium dark:shadow-dark-card space-y-6">
                <h3 className="font-outfit font-extrabold text-xl text-brand-charcoal dark:text-dark-text">Platform Effectiveness</h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'Speaking Confidence Boost', value: '+85%', width: '85%', color: 'bg-brand-purple dark:bg-dark-purple' },
                    { label: 'Explanation Precision', value: '+70%', width: '70%', color: 'bg-brand-blue dark:bg-dark-blue' },
                    { label: 'Job Interview Success Rate', value: '+62%', width: '62%', color: 'bg-brand-cyan dark:bg-dark-cyan' },
                  ].map((stat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-brand-charcoal dark:text-dark-text mb-1">
                        <span>{stat.label}</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="w-full bg-brand-surface dark:bg-dark-surface h-2 rounded-full overflow-hidden">
                        <div className={`${stat.color} h-full rounded-full`} style={{ width: stat.width }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-brand-purple-light/50 dark:bg-dark-purple/10 border border-brand-purple/10 dark:border-dark-purple/30 p-4 rounded-2xl flex gap-3">
                  <Zap className="text-brand-purple dark:text-dark-purple shrink-0" size={18} />
                  <p className="text-xs text-brand-purple dark:text-dark-purple font-medium">
                    Designed for final year engineering project demonstrations, showing full-stack Node, MongoDB, and Gemini generative model capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-dark-bg relative z-10 border-b border-brand-border dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl text-brand-charcoal dark:text-dark-text mb-4">
              Student Success Stories
            </h2>
            <p className="text-brand-slate dark:text-dark-muted text-sm sm:text-base">
              See how job seekers prepared for placements using MockAI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                stars: 5,
                quote: '"The event-loop and closure question on this platform was literally asked word-for-word in my JavaScript round. Having practiced speaking my answer here, I didn\'t stammer and aced the explanation!"',
                initials: 'AR', color: 'bg-brand-purple',
                name: 'Ananya Rao', role: 'Software Dev Intern @ Wells Fargo'
              },
              {
                stars: 5,
                quote: '"The integrity locks on full-screen are awesome. They force you to not search for answers on other tabs. It feels exactly like a real assessment, which helped me manage time and get comfortable."',
                initials: 'RS', color: 'bg-brand-blue',
                name: 'Rohan Sharma', role: 'CSE Placement Candidate'
              },
              {
                stars: 5,
                quote: '"The HR questions round evaluation was surprisingly accurate. It highlighted that my weaknesses section was too negative and helped me frame it with improvements. High-quality SaaS feel!"',
                initials: 'KV', color: 'bg-brand-cyan',
                name: 'Karthik Verma', role: 'System Engineer Placement'
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-brand-surface dark:bg-dark-card rounded-2xl p-6 border border-brand-border dark:border-dark-border">
                <div className="flex gap-1.5 mb-4 text-yellow-400">
                  {Array.from({ length: t.stars }).map((_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-sm text-brand-slate dark:text-dark-muted italic mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} text-white flex items-center justify-center font-bold text-xs`}>
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-xs">{t.name}</h4>
                    <p className="text-[10px] text-brand-slate dark:text-dark-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 relative z-10 bg-brand-surface/40 dark:bg-dark-surface/50 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-brand-slate dark:text-dark-muted text-sm">
              Quick answers about platform technologies, speech recognition, and AI evaluation engines.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white dark:bg-dark-card rounded-2xl border border-brand-border dark:border-dark-border overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-brand-charcoal dark:text-dark-text hover:bg-brand-surface/50 dark:hover:bg-dark-cardHover transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`text-brand-slate dark:text-dark-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 border-t border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted text-sm leading-relaxed bg-brand-surface/20 dark:bg-dark-surface/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
