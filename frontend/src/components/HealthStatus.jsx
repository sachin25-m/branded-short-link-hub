import { useState, useEffect } from 'react';
import { checkApiHealth } from '../api/health.service';

export const HealthStatus = () => {
  const [status, setStatus] = useState({
    loading: true,
    success: false,
    message: '',
  });

  const verifyHealth = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkApiHealth();
    setStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  useEffect(() => {
    verifyHealth();
  }, []);

  return (
    <div className="card">
      <h1 className="title">Branded Short-Link Hub</h1>
      <p className="subtitle">Step 1: Base MERN Architecture Setup</p>

      {status.loading ? (
        <div className="status-badge loading">
          <span className="pulse-dot"></span> Checking API status...
        </div>
      ) : status.success ? (
        <div className="status-badge connected">
          <span className="pulse-dot"></span> Backend API Connected
        </div>
      ) : (
        <div className="status-badge error">
          <span className="pulse-dot"></span> Backend Connection Error
        </div>
      )}

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">API Health Endpoint</span>
          <span className="info-value">GET /api/health</span>
        </div>
        <div className="info-item">
          <span className="info-label">Server Response</span>
          <span className="info-value">{status.loading ? 'Fetching...' : status.message}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Database Handler</span>
          <span className="info-value">MongoDB / Mongoose Configured</span>
        </div>
        <div className="info-item">
          <span className="info-label">Environment</span>
          <span className="info-value">Development Mode</span>
        </div>
      </div>

      {!status.loading && (
        <button className="btn-retry" onClick={verifyHealth}>
          Refresh API Status
        </button>
      )}
    </div>
  );
};
