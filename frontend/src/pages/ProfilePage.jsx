import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, KeyRound, Save, Calendar, Award } from 'lucide-react';
import Toast from '../components/Toast';

const ProfilePage = () => {
  const { user, updateProfileInContext } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/user/profile');
        if (res.data.success) {
          const profile = res.data.data.profile;
          setName(profile.name);
          setEmail(profile.email);
          setStats(res.data.data.stats);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setToast({ message: 'Failed to retrieve profile data.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    if (password && password.length < 6) {
      setToast({ message: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    setSaveLoading(true);
    try {
      const payload = { name, email };
      if (password) {
        payload.password = password;
        payload.currentPassword = currentPassword;
      }

      const res = await axios.put('/api/user/profile', payload);
      if (res.data.success) {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        
        // Sync new information with Auth Context
        updateProfileInContext({ name, email });
        
        // Clear passwords fields
        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setToast({
        message: err.response?.data?.message || 'Failed to update profile info.',
        type: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300">
        <div className="h-8 w-40 bg-gray-200 dark:bg-dark-card animate-shimmer rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer md:col-span-1"></div>
          <div className="h-80 rounded-3xl bg-gray-100 dark:bg-dark-card animate-shimmer md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none space-y-8 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
      
      <div>
        <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
          <User className="text-brand-purple dark:text-dark-purple" size={30} />
          <span>Account Settings</span>
        </h1>
        <p className="text-brand-slate dark:text-dark-muted text-sm">Manage your profile details and credential options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Stats Overview */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card h-fit space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-brand-purple-light dark:bg-dark-purple/20 flex items-center justify-center text-brand-purple dark:text-dark-purple font-outfit font-extrabold text-2xl border border-brand-purple/20 dark:border-dark-purple/30 mx-auto mb-3">
              {name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-brand-charcoal dark:text-dark-text text-lg">{name}</h3>
            <span className="text-xs text-brand-slate dark:text-dark-muted capitalize">{user?.role} Account</span>
          </div>

          <div className="border-t border-brand-border dark:border-dark-border pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-slate dark:text-dark-muted flex items-center gap-1"><Calendar size={12} /> Joined</span>
              <span className="font-bold text-brand-charcoal dark:text-dark-text">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-slate dark:text-dark-muted flex items-center gap-1"><Award size={12} /> Avg Score</span>
              <span className="font-bold text-brand-purple dark:text-dark-purple">{stats?.averageScore || 0}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-slate dark:text-dark-muted flex items-center gap-1"><Award size={12} /> Mock Exams</span>
              <span className="font-bold text-brand-charcoal dark:text-dark-text">{stats?.totalInterviews || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-8 shadow-premium dark:shadow-dark-card md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
              Edit Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text border-b border-brand-border dark:border-dark-border pt-4 pb-3">
              Update Password
            </h3>
            <p className="text-xs text-brand-slate dark:text-dark-muted italic">Leave password fields blank if you do not wish to reset credentials.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                    <KeyRound size={14} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                    required={!!password}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold shadow-premium dark:shadow-neon-purple transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none self-end"
            >
              {saveLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ProfilePage;
