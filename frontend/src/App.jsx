import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import FullScreenLoader from './components/FullScreenLoader';

// Dynamic Browser Tab Title Manager
const PageTitleManager = () => {
  const { userRole, currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let title = 'Levlox Portal';

    if (path.startsWith('/student') || (currentUser && userRole === 'student')) {
      title = 'Levlox Student Portal';
    } else if (path.startsWith('/admin') || (currentUser && userRole === 'admin')) {
      title = 'Levlox Admin Portal';
    } else if (path.startsWith('/trainer') || (currentUser && userRole === 'trainer')) {
      title = 'Levlox Trainer Portal';
    } else if (path.startsWith('/login')) {
      title = 'Levlox Portal — Login';
    } else if (path.startsWith('/reset-password')) {
      title = 'Levlox Portal — Reset Password';
    } else if (path.startsWith('/verify-email')) {
      title = 'Levlox Portal — Verify Email';
    } else {
      title = 'Levlox Portal';
    }

    document.title = title;
  }, [location.pathname, userRole, currentUser]);

  return null;
};

// Dashboards are large and mutually exclusive — split them so a student never
// downloads the admin bundle (and vice versa).
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TrainerDashboard = lazy(() => import('./pages/TrainerDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentDetailsPage = lazy(() => import('./pages/StudentDetailsPage'));
const BatchDetailsPage = lazy(() => import('./pages/BatchDetailsPage'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

/**
 * Root redirect — uses Firebase Auth state to send users to the right place.
 */
const RootRedirect = () => {
  const { currentUser, userRole, authLoading } = useAuth();

  if (authLoading) return <FullScreenLoader />;

  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'trainer') return <Navigate to="/trainer" replace />;
  if (userRole === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <PageTitleManager />
          <div className="app-container">
            <Suspense fallback={<FullScreenLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />


                {/* Protected Student Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <ErrorBoundary>
                        <StudentDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Trainer Routes */}
                <Route
                  path="/trainer/*"
                  element={
                    <ProtectedRoute allowedRoles={['trainer']}>
                      <ErrorBoundary>
                        <TrainerDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin/students/:studentId"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ErrorBoundary>
                        <StudentDetailsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/batches/:batchId"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ErrorBoundary>
                        <BatchDetailsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ErrorBoundary>
                        <AdminDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all → smart redirect */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;
