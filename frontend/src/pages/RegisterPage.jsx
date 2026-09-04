import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Cpu, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setToast({ message: 'Please enter all fields', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, confirmPassword);
    setLoading(false);

    if (res?.success) {
      navigate('/dashboard');
    } else {
      setToast({ message: res?.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-brand-surface/30 dark:bg-dark-bg relative px-4 py-8 select-none transition-colors duration-300">
      
      <div className="bg-ambient-glow glow-purple"></div>

      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-brand-border dark:border-dark-border shadow-premium dark:shadow-dark-card p-8 relative z-10 glass-panel">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white mx-auto mb-4">
            <Cpu size={24} />
          </div>
          <h2 className="font-outfit font-extrabold text-2xl text-brand-charcoal dark:text-dark-text mb-2">Create Account</h2>
          <p className="text-brand-slate dark:text-dark-muted text-sm">Sign up to begin taking AI mock interviews today.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold shadow-premium dark:shadow-neon-purple transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Redirect */}
        <div className="text-center mt-6 text-xs text-brand-slate dark:text-dark-muted border-t border-brand-border dark:border-dark-border pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-purple dark:text-dark-purple font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RegisterPage;
