import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/landing/LandingPage';
import SignupFlow from './components/landing/SignupFlow';
import SigninFlow from './components/landing/SigninFlow';
import DashboardLayout from './components/dashboard/DashboardLayout';
import CompleteProfile from './components/landing/CompleteProfile'; 

function AppContent() {
  const { user } = useAuth();

  // Protected Route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/signin" />;
    }
    if (user && (user as any).profile_complete === false) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Landing Page Routes */}
      <Route path="/landing/*" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup/*" element={!user ? <SignupFlow /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signin/*" element={!user ? <SigninFlow /> : <Navigate to="/dashboard" replace />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />

      {/* Redirect root to landing page */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      {/* Optionally, add a fallback route for 404s */}
      {/* <Route path="*" element={<Navigate to="/landing" replace />} /> */}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;