import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, User, LogOut, LayoutDashboard, HelpCircle, FileText, Settings, ShieldAlert, Cpu, Sun, Moon, Info, Home, Brain, Maximize, Minimize } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
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
    } else {
      const exitMethod =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if (exitMethod) {
        exitMethod.call(document).catch((err) => {
          console.error('Error exiting fullscreen mode:', err);
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
    setShowProfileMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  // Public links visible to everyone
  const publicLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Practice', path: '/practice', icon: Brain },
    { name: 'Interview', path: '/interview/setup', icon: Cpu },
  ];

  // Links visible only after login
  const authLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  // Admin-only link
  const adminLink = { name: 'Admin', path: '/admin', icon: ShieldAlert };

  const allVisibleLinks = [
    ...publicLinks,
    ...(user ? authLinks : []),
    ...(user?.role === 'admin' ? [adminLink] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-brand-border dark:border-dark-border select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-purple-glow transition-transform duration-300 group-hover:scale-105">
                <Cpu size={20} className="animate-pulse" />
              </div>
              <span className="font-outfit font-extrabold text-xl tracking-tight text-brand-charcoal dark:text-dark-text">
                Mock<span className="bg-gradient-to-r from-brand-purple to-brand-blue dark:from-dark-purple dark:to-dark-cyan bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {allVisibleLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-brand-purple/10 text-brand-purple dark:bg-dark-purple/20 dark:text-dark-purple'
                      : 'text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right section: Theme toggle + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card transition-all duration-200"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card transition-all duration-200"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {user ? (
              <div className="relative">
                {/* Profile Avatar Button */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-surface dark:hover:bg-dark-card transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-outfit font-bold text-sm shadow-purple-glow">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-semibold text-brand-charcoal dark:text-dark-text">{user.name}</p>
                    <span className="text-[10px] text-brand-slate dark:text-dark-muted capitalize">{user.role}</span>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-xl shadow-premium dark:shadow-dark-card overflow-hidden animate-slide-up z-50">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-brand-slate dark:text-dark-muted hover:bg-brand-surface dark:hover:bg-dark-cardHover hover:text-brand-charcoal dark:hover:text-dark-text transition-colors"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-brand-slate dark:text-dark-muted hover:bg-brand-surface dark:hover:bg-dark-cardHover hover:text-brand-charcoal dark:hover:text-dark-text transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <div className="border-t border-brand-border dark:border-dark-border"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-brand-charcoal dark:text-dark-text hover:text-brand-purple dark:hover:text-dark-purple transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-purple hover:bg-brand-purpleHover dark:bg-dark-purple dark:hover:bg-dark-purpleHover rounded-xl shadow-premium dark:shadow-neon-purple transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[0px]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Theme toggle + Fullscreen toggle + menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-brand-slate dark:text-dark-muted"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-brand-slate dark:text-dark-muted"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden border-t border-brand-border dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {allVisibleLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    active
                      ? 'bg-brand-purple/10 text-brand-purple dark:bg-dark-purple/20 dark:text-dark-purple'
                      : 'text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-card'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {user ? (
              <div className="pt-4 pb-2 border-t border-brand-border dark:border-dark-border mt-4 px-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-outfit font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-charcoal dark:text-dark-text">{user.name}</h4>
                    <p className="text-xs text-brand-slate dark:text-dark-muted">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-brand-purple dark:text-dark-purple bg-brand-purple/10 dark:bg-dark-purple/20 hover:bg-brand-purple/20 font-semibold transition-colors mb-2"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 font-semibold transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-brand-border dark:border-dark-border mt-4 flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 text-center text-brand-charcoal dark:text-dark-text font-semibold hover:bg-brand-surface dark:hover:bg-dark-card rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 text-center text-white bg-brand-purple dark:bg-dark-purple font-semibold hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover rounded-lg shadow-premium dark:shadow-neon-purple transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
