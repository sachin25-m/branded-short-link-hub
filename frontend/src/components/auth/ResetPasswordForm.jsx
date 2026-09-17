import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const ResetPasswordForm = ({ onNavigate, initialToken = '' }) => {
  const { resetPassword } = useAuth();
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token.trim() || !newPassword) {
      setError('Both reset token and new password are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        token: token.trim(),
        newPassword,
      });
      setSuccess(response.message || 'Password reset successfully! You can now sign in.');
    } catch (err) {
      setError(err.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Reset Password</h2>
      <p className="coss-subtitle">Enter your token and choose a new secure password</p>

      {error && <Alert type="error">{error}</Alert>}
      {success && (
        <div>
          <Alert type="success">{success}</Alert>
          <div style={{ marginTop: '1.25rem' }}>
            <Button onClick={() => onNavigate('login')}>
              Sign In with New Password
            </Button>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
          <Input
            id="reset-token"
            label="Reset Token"
            type="text"
            placeholder="Paste reset token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Input
            id="reset-new-password"
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} style={{ marginTop: '0.5rem' }}>
            Update Password
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
