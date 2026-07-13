import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Cpu, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setToast({ message: 'Please enter all fields', type: 'error' });
      return;
    }

    // Enter fullscreen mode on user login click gesture
    enterFullscreen();

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res?.success) {
      navigate('/dashboard');
    } else {
      // Exit fullscreen if login failed
      if (document.fullscreenElement) {
        const exitMethod =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;
        if (exitMethod) {
          exitMethod.call(document).catch((err) => {
            console.error('Error exiting fullscreen on failed login:', err);
          });
        }
      }
      setToast({ message: res?.message || 'Login failed', type: 'error' });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-surface/30 dark:bg-dark-bg relative px-4 select-none transition-colors duration-300">
      
      <div className="bg-ambient-glow glow-blue"></div>

      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border shadow-premium dark:shadow-dark-card p-8 relative z-10 glass-panel">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white mx-auto mb-4">
            <Cpu size={24} />
          </div>
          <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Welcome Back</h2>
          <p className="text-brand-slate dark:text-dark-muted text-sm">Sign in to resume your mock interview preparation.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold shadow-premium dark:shadow-neon-purple transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Redirect */}
        <div className="text-center mt-6 text-xs text-brand-slate dark:text-dark-muted border-t border-brand-border dark:border-dark-border pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-purple dark:text-dark-purple font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default LoginPage;
