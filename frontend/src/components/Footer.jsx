import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-dark-surface border-t border-brand-border dark:border-dark-border select-none relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white">
                <Cpu size={18} />
              </div>
              <span className="font-outfit font-extrabold text-lg text-brand-charcoal dark:text-dark-text">
                Mock<span className="bg-gradient-to-r from-brand-purple to-brand-blue dark:from-dark-purple dark:to-dark-cyan bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
            <p className="text-sm text-brand-slate dark:text-dark-muted max-w-sm">
              An intelligent, production-ready mock interview simulator that leverages speech-to-text transcription and Gemini Generative AI to grade candidate performance.
            </p>
            <div className="flex gap-4 text-brand-slate dark:text-dark-muted">
              <a href="#" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors"><Github size={18} /></a>
              <a href="#" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors"><Twitter size={18} /></a>
              <a href="#" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-brand-slate dark:text-dark-muted">
              <li><Link to="/dashboard" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors">Dashboard</Link></li>
              <li><Link to="/practice" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors">Practice Topics</Link></li>
              <li><Link to="/interview/setup" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors">AI Interview</Link></li>
              <li><Link to="/history" className="hover:text-brand-purple dark:hover:text-dark-purple transition-colors">History Log</Link></li>
            </ul>
          </div>

          {/* Contact / Info */}
          <div>
            <h4 className="text-sm font-semibold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-4">Academic Project</h4>
            <ul className="space-y-2 text-sm text-brand-slate dark:text-dark-muted">
              <li><p>Owner: Sivakumar P</p></li>
              <li><p>Stack: MERN & Gemini AI</p></li>
              <li><p>OS: Windows Sandbox</p></li>
              <li><p>Status: Ready for Demo</p></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-border dark:border-dark-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-slate dark:text-dark-muted">
          <p>&copy; {new Date().getFullYear()} MockAI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={12} className="text-red-500 fill-current animate-bounce" /> for Final Year Engineering Project.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
