import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const SignupForm = ({ onNavigate, setSimulatedToken }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await signup({ name, email, password });
      setSuccessData(response);
      if (response.data?.simulationDetails?.token) {
        setSimulatedToken(response.data.simulationDetails.token);
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Create Account</h2>
      <p className="coss-subtitle">Get started with your branded links & bio pages</p>

      {error && <Alert type="error">{error}</Alert>}

      {successData ? (
        <div>
          <Alert type="success">
            {successData.message || 'Account created successfully!'}
          </Alert>

          {successData.data?.simulationDetails && (
            <div className="coss-sim-box">
              <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '0.25rem' }}>
                ⚡ Email Verification Simulation (Development Mode)
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No real email was sent. Use the simulated verification token below to verify your account:
              </p>
              <code className="coss-code">
                Token: {successData.data.simulationDetails.token}
              </code>

              <div style={{ marginTop: '1rem' }}>
                <Button
                  onClick={() => {
                    setSimulatedToken(successData.data.simulationDetails.token);
                    onNavigate('verify');
                  }}
                >
                  Proceed to Verify Email
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            id="signup-name"
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="signup-email"
            label="Email Address"
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="signup-password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} style={{ marginTop: '0.5rem' }}>
            Create Account
          </Button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
        <button
          type="button"
          className="coss-link"
          onClick={() => onNavigate('login')}
        >
          Sign in
        </button>
      </div>
    </Card>
  );
};
