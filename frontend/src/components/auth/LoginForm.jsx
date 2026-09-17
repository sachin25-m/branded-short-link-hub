import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const LoginForm = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unverifiedAlert, setUnverifiedAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedAlert(false);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      if (err.data && err.data.emailVerified === false) {
        setUnverifiedAlert(true);
        setError('Your email is not verified yet. Please check your verification simulation link.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Welcome Back</h2>
      <p className="coss-subtitle">Sign in to your Branded Short-Link & Bio-Link Hub</p>

      {error && <Alert type="error">{error}</Alert>}
      {unverifiedAlert && (
        <Alert type="warning">
          Need to verify your email?{' '}
          <button
            type="button"
            className="coss-link"
            onClick={() => onNavigate('verify')}
            style={{ fontWeight: 600 }}
          >
            Go to Verification Simulation
          </button>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="login-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="coss-link"
            onClick={() => onNavigate('forgot-password')}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" loading={loading}>
          Sign In
        </Button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Don&apos;t have an account? </span>
        <button
          type="button"
          className="coss-link"
          onClick={() => onNavigate('signup')}
        >
          Create one now
        </button>
      </div>
    </Card>
  );
};
