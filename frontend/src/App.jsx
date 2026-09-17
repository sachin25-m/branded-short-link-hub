import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HealthStatus } from './components/HealthStatus';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { EmailVerificationNotice } from './components/auth/EmailVerificationNotice';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { ProtectedDashboard } from './components/auth/ProtectedDashboard';
import { CreateShortLink } from './components/links/CreateShortLink';
import { LinkLibraryStudio } from './components/links/LinkLibraryStudio';
import { BioBuilder } from './components/bio/BioBuilder';
import { PublicBioPage } from './components/bio/PublicBioPage';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';

const MainContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [authTab, setAuthTab] = useState('analytics');
  const [simulatedToken, setSimulatedToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [publicBioUsername, setPublicBioUsername] = useState(null);

  useEffect(() => {
    // Check if visiting public bio page path e.g. /bio/username
    const path = window.location.pathname;
    if (path.startsWith('/bio/')) {
      const parts = path.split('/bio/');
      if (parts[1] && parts[1].trim()) {
        setPublicBioUsername(decodeURIComponent(parts[1].trim()));
      }
    }
  }, []);

  if (publicBioUsername) {
    return <PublicBioPage username={publicBioUsername} />;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="coss-spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Initializing security session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        <div className="coss-nav-tabs">
          <button
            type="button"
            className={`coss-tab ${authTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setAuthTab('analytics')}
          >
            Analytics
          </button>
          <button
            type="button"
            className={`coss-tab ${authTab === 'bio-hub' ? 'active' : ''}`}
            onClick={() => setAuthTab('bio-hub')}
          >
            Bio Hub
          </button>
          <button
            type="button"
            className={`coss-tab ${authTab === 'library' ? 'active' : ''}`}
            onClick={() => setAuthTab('library')}
          >
            Link Library
          </button>
          <button
            type="button"
            className={`coss-tab ${authTab === 'create-link' ? 'active' : ''}`}
            onClick={() => setAuthTab('create-link')}
          >
            Create Short Link
          </button>
          <button
            type="button"
            className={`coss-tab ${authTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setAuthTab('dashboard')}
          >
            Auth Dashboard
          </button>
        </div>

        {authTab === 'analytics' && <AnalyticsDashboard />}
        {authTab === 'bio-hub' && <BioBuilder />}
        {authTab === 'library' && <LinkLibraryStudio onNavigate={setAuthTab} />}
        {authTab === 'create-link' && <CreateShortLink />}
        {authTab === 'dashboard' && <ProtectedDashboard />}
      </div>
    );
  }

  return (
    <div>
      <div className="coss-nav-tabs">
        <button
          type="button"
          className={`coss-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`coss-tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
        <button
          type="button"
          className={`coss-tab ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          Verify Email
        </button>
        <button
          type="button"
          className={`coss-tab ${activeTab === 'forgot-password' ? 'active' : ''}`}
          onClick={() => setActiveTab('forgot-password')}
        >
          Forgot Password
        </button>
        <button
          type="button"
          className={`coss-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          API Health
        </button>
      </div>

      {activeTab === 'login' && <LoginForm onNavigate={setActiveTab} />}
      {activeTab === 'signup' && (
        <SignupForm
          onNavigate={setActiveTab}
          setSimulatedToken={setSimulatedToken}
        />
      )}
      {activeTab === 'verify' && (
        <EmailVerificationNotice
          onNavigate={setActiveTab}
          initialToken={simulatedToken}
        />
      )}
      {activeTab === 'forgot-password' && (
        <ForgotPasswordForm
          onNavigate={setActiveTab}
          setResetToken={setResetToken}
        />
      )}
      {activeTab === 'reset-password' && (
        <ResetPasswordForm
          onNavigate={setActiveTab}
          initialToken={resetToken}
        />
      )}
      {activeTab === 'health' && <HealthStatus />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Branded Short-Link & Bio-Link Hub
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Analytics & Click Telemetry Engine (Step 6)
          </p>
        </header>
        <MainContent />
      </div>
    </AuthProvider>
  );
}

export default App;
