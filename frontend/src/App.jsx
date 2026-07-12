import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PracticePage from './pages/PracticePage';
import ProfilePage from './pages/ProfilePage';
import InterviewSetup from './pages/InterviewSetup';
import InterviewActive from './pages/InterviewActive';
import InterviewFeedback from './pages/InterviewFeedback';
import InterviewHistory from './pages/InterviewHistory';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const location = useLocation();
  const isInterviewActivePage = location.pathname === '/interview/active';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      
      {/* Global Navbar - hidden on active interview page */}
      {!isInterviewActivePage && <Navbar />}

      {/* Main Application Routes */}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/practice" element={<PracticePage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/interview/setup" element={<InterviewSetup />} />
          <Route
            path="/interview/active"
            element={
              <ProtectedRoute>
                <InterviewActive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/feedback"
            element={
              <ProtectedRoute>
                <InterviewFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/feedback/:id"
            element={
              <ProtectedRoute>
                <InterviewFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Redirect any unmatched routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating AI Chatbot - hidden on active interview page */}
      {!isInterviewActivePage && <ChatBot />}
      
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <InterviewProvider>
            <AppContent />
          </InterviewProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
