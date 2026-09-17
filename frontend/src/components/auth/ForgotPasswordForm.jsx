import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const ForgotPasswordForm = ({ onNavigate, setResetToken }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseMsg, setResponseMsg] = useState(null);
  const [simDetails, setSimDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResponseMsg(null);
    setSimDetails(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setResponseMsg(res.message);
      if (res.simulationDetails?.token) {
        setSimDetails(res.simulationDetails);
        setResetToken(res.simulationDetails.token);
      }
    } catch (err) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Forgot Password</h2>
      <p className="coss-subtitle">Enter your email to receive reset instructions</p>

      {error && <Alert type="error">{error}</Alert>}

      {responseMsg ? (
        <div>
          <Alert type="info">{responseMsg}</Alert>

          {simDetails && (
            <div className="coss-sim-box">
              <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '0.25rem' }}>
                ⚡ Password Reset Simulation (Development Mode)
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Simulated reset token generated for account testing:
              </p>
              <code className="coss-code">Token: {simDetails.token}</code>

              <div style={{ marginTop: '1rem' }}>
                <Button
                  onClick={() => {
                    setResetToken(simDetails.token);
                    onNavigate('reset-password');
                  }}
                >
                  Proceed to Reset Password
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            id="forgot-email"
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} style={{ marginTop: '0.5rem' }}>
            Send Reset Instructions
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
