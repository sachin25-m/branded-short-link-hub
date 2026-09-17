import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { authService } from '../../api/auth.service';

export const ProtectedDashboard = () => {
  const { user, accessToken, logout, refreshSession } = useAuth();
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleTestProtectedEndpoint = async () => {
    setActionLoading(true);
    setApiError(null);
    setStatusMsg(null);
    try {
      const data = await authService.getMe(accessToken);
      setApiData(data);
      setStatusMsg('Successfully fetched protected user data using Access Token!');
    } catch (err) {
      setApiError(err.message || 'Failed to fetch protected route.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setActionLoading(true);
    setApiError(null);
    setStatusMsg(null);
    try {
      const newAccessToken = await refreshSession();
      if (newAccessToken) {
        setStatusMsg('Refresh Token rotated successfully! Issued new 15m Access Token & 7d Refresh Cookie.');
      } else {
        setApiError('Session refresh failed or cookie expired.');
      }
    } catch (err) {
      setApiError(err.message || 'Failed to refresh token.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="coss-title" style={{ margin: 0 }}>Auth Dashboard</h2>
        <span className="status-badge connected">
          <span className="pulse-dot" /> Authenticated
        </span>
      </div>
      <p className="coss-subtitle">Step 2 Authentication & Token Rotation Verification</p>

      {statusMsg && <Alert type="success">{statusMsg}</Alert>}
      {apiError && <Alert type="error">{apiError}</Alert>}

      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Authenticated Profile
        </h3>
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{user?.name}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{user?.email}</strong></div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Email Verified:</span>{' '}
            <span className={`status-badge ${user?.emailVerified ? 'connected' : 'error'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
              {user?.emailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div><span style={{ color: 'var(--text-muted)' }}>User ID:</span> <code className="info-value">{user?._id}</code></div>
        </div>
      </div>

      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
          🔒 Active Security Specifications
        </h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'grid', gap: '0.375rem' }}>
          <li><strong>Access Token:</strong> Short-lived JWT (EXACTLY 15 minutes lifetime).</li>
          <li><strong>Refresh Token:</strong> Long-lived JWT (EXACTLY 7 days lifetime).</li>
          <li><strong>Cookie Security:</strong> Stored in <code style={{ color: 'var(--accent-emerald)' }}>httpOnly</code> cookie (inaccessible via JavaScript/localStorage).</li>
          <li><strong>Rotation Strategy:</strong> Single-use token rotation with automatic reuse detection & session family revocation.</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Button onClick={handleTestProtectedEndpoint} loading={actionLoading} variant="secondary">
          ⚡ Test Protected Route (GET /api/auth/me)
        </Button>

        <Button onClick={handleManualRefresh} loading={actionLoading} variant="secondary">
          🔄 Test Refresh Token Rotation (POST /api/auth/refresh)
        </Button>

        <Button onClick={logout} style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}>
          🚪 Sign Out
        </Button>
      </div>

      {apiData && (
        <div style={{ marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest API Response:</span>
          <pre className="coss-code" style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.8rem' }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};
