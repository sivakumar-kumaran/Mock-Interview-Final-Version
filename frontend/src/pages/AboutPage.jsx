import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Mic, BarChart3, ShieldCheck, Zap, Users, Code2, Database, Brain, Globe, ArrowRight, Sparkles, Server, Info } from 'lucide-react';

const AboutPage = () => {
  const { user } = useAuth();

  const techStack = [
    { name: 'React', desc: 'Frontend UI framework', icon: Code2, color: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
    { name: 'Node.js', desc: 'Backend runtime', icon: Server, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { name: 'MongoDB', desc: 'NoSQL database', icon: Database, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
    { name: 'Express.js', desc: 'Server framework', icon: Globe, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/40' },
    { name: 'Gemini AI', desc: 'Google AI evaluation', icon: Brain, color: 'text-brand-purple dark:text-dark-purple', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { name: 'Tailwind CSS', desc: 'Utility-first styling', icon: Sparkles, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
  ];

  const features = [
    { icon: Mic, title: 'Speech-to-Text Recording', desc: 'Record your spoken answers with live transcription using native browser APIs. No plugins required.', color: 'from-brand-purple to-brand-blue' },
    { icon: Brain, title: 'AI-Powered Evaluation', desc: 'Google Gemini AI evaluates your responses for technical accuracy, communication clarity, and completeness.', color: 'from-brand-blue to-brand-cyan' },
    { icon: BarChart3, title: 'Performance Analytics', desc: 'Track your preparation progress with detailed dashboards, score trends, and strength analysis.', color: 'from-emerald-500 to-teal-500' },
    { icon: ShieldCheck, title: 'Interview Integrity', desc: 'Full-screen enforcement, tab switch detection, and violation tracking simulate real exam conditions.', color: 'from-amber-500 to-orange-500' },
    { icon: Users, title: 'Multiple Tracks', desc: '12 interview tracks covering Java, JavaScript, React, Node.js, SQL, DSA, OS, Networks, and more.', color: 'from-pink-500 to-rose-500' },
    { icon: Zap, title: 'Instant Feedback', desc: 'Get actionable, per-question feedback immediately after your mock interview session ends.', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-dark-bg min-h-screen select-none transition-colors duration-300">
      {/* Decorative Glow */}
      <div className="bg-ambient-glow glow-purple"></div>
      <div className="bg-ambient-glow glow-blue"></div>

      {/* Hero Banner */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple text-sm font-semibold mb-6">
          <Info size={16} />
          <span>About MockAI</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-brand-charcoal dark:text-dark-text leading-tight mb-6 flex items-center justify-center gap-2.5">
          <Info className="text-brand-purple dark:text-dark-purple animate-pulse" size={36} />
          <span>
            Your AI-Powered{' '}
            <span className="bg-gradient-to-r from-brand-purple via-brand-blue to-brand-cyan bg-clip-text text-transparent">
              Interview Coach
            </span>
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-brand-slate dark:text-dark-muted leading-relaxed">
          MockAI is a production-ready mock interview simulator built to help students and job seekers 
          ace their next technical or HR interview. Practice under realistic conditions, receive instant 
          AI evaluation, and track your growth over time.
        </p>
      </section>

      {/* Problem + Solution */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-8">
            <h3 className="text-lg font-outfit font-bold text-red-700 dark:text-red-400 mb-4">The Problem</h3>
            <ul className="space-y-3 text-sm text-red-800/80 dark:text-red-300/80">
              {['Lack of real interview practice', 'No personalized feedback', 'Fear of speaking and poor communication', 'Memorizing answers without understanding', 'No access to realistic exam simulations'].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Solution */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-8">
            <h3 className="text-lg font-outfit font-bold text-emerald-700 dark:text-emerald-400 mb-4">Our Solution</h3>
            <ul className="space-y-3 text-sm text-emerald-800/80 dark:text-emerald-300/80">
              {['Realistic AI-driven interview simulations', 'Instant per-question AI feedback & scoring', 'Speech recording with live transcription', 'Full-screen integrity enforcement', 'Performance analytics and progress tracking'].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-outfit font-extrabold text-brand-charcoal dark:text-dark-text mb-3">Platform Features</h2>
          <p className="text-brand-slate dark:text-dark-muted max-w-lg mx-auto">Built with cutting-edge tech to deliver a premium interview prep experience.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="group bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-2xl p-6 hover:shadow-premium-hover dark:hover:shadow-neon-purple transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-outfit font-bold text-brand-charcoal dark:text-dark-text mb-2">{feat.title}</h3>
                <p className="text-sm text-brand-slate dark:text-dark-muted leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-outfit font-extrabold text-brand-charcoal dark:text-dark-text mb-3">Technology Stack</h2>
          <p className="text-brand-slate dark:text-dark-muted">MERN stack powered by Google Gemini AI</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <div key={i} className={`${tech.bg} rounded-2xl p-5 text-center border border-transparent hover:border-brand-border dark:hover:border-dark-border transition-all duration-200 hover:-translate-y-0.5`}>
                <Icon size={28} className={`mx-auto mb-3 ${tech.color}`} />
                <h4 className="font-outfit font-bold text-sm text-brand-charcoal dark:text-dark-text">{tech.name}</h4>
                <p className="text-xs text-brand-slate dark:text-dark-muted mt-1">{tech.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Academic Credits */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <div className="bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 dark:from-dark-purple/10 dark:to-dark-blue/10 border border-brand-border dark:border-dark-border rounded-2xl p-10">
          <h2 className="text-2xl font-outfit font-extrabold text-brand-charcoal dark:text-dark-text mb-2">Academic Project</h2>
          <p className="text-brand-slate dark:text-dark-muted mb-6">Final Year Engineering Capstone</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold text-brand-charcoal dark:text-dark-text">Owner</p>
              <p className="text-brand-slate dark:text-dark-muted">Sivakumar P</p>
            </div>
            <div>
              <p className="font-semibold text-brand-charcoal dark:text-dark-text">Stack</p>
              <p className="text-brand-slate dark:text-dark-muted">MERN + Gemini</p>
            </div>
            <div>
              <p className="font-semibold text-brand-charcoal dark:text-dark-text">Year</p>
              <p className="text-brand-slate dark:text-dark-muted">{new Date().getFullYear()}</p>
            </div>
            <div>
              <p className="font-semibold text-brand-charcoal dark:text-dark-text">Status</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">Production Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
        <h2 className="text-2xl font-outfit font-extrabold text-brand-charcoal dark:text-dark-text mb-4">Ready to start practicing?</h2>
        <p className="text-brand-slate dark:text-dark-muted mb-8">Jump into your first AI mock interview session today.</p>
        <Link
          to={user ? '/interview/setup' : '/register'}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-white bg-gradient-to-r from-brand-purple to-brand-blue hover:from-brand-purpleHover hover:to-brand-blue dark:from-dark-purple dark:to-dark-blue rounded-2xl font-outfit font-bold text-base shadow-purple-glow dark:shadow-neon-purple transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          {user ? 'Start Interview' : 'Create Free Account'}
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;
