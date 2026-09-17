import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const EmailVerificationNotice = ({ onNavigate, initialToken = '' }) => {
  const { verifyEmail } = useAuth();
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token.trim()) {
      setError('Please provide a verification token.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyEmail(token.trim());
      setSuccess(response.message || 'Email verified successfully! You can now log in.');
    } catch (err) {
      setError(err.message || 'Verification failed. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Verify Email Address</h2>
      <p className="coss-subtitle">Email Verification Simulation Tool</p>

      {error && <Alert type="error">{error}</Alert>}
      {success && (
        <div>
          <Alert type="success">{success}</Alert>
          <div style={{ marginTop: '1.25rem' }}>
            <Button onClick={() => onNavigate('login')}>
              Proceed to Sign In
            </Button>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleVerify}>
          <Input
            id="verification-token"
            label="Verification Token"
            type="text"
            placeholder="Paste simulated token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} style={{ marginTop: '0.5rem' }}>
            Verify Email
          </Button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <button
          type="button"
          className="coss-link"
          onClick={() => onNavigate('login')}
        >
          Back to Sign In
        </button>
      </div>
    </Card>
  );
};
