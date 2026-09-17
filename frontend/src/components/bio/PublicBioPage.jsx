import { useState, useEffect } from 'react';
import { bioService } from '../../api/bio.service';
import { PublicBioView } from './PublicBioView';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PublicBioPage = ({ username }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicProfile = async () => {
      setLoading(true);
      setNotFound(false);
      setError(null);
      try {
        const res = await bioService.getPublicBio(username);
        if (isMounted && res.success && res.profile) {
          setProfile(res.profile);
        } else if (isMounted) {
          setNotFound(true);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || 'Failed to load public bio page.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '480px', margin: '0 auto' }}>
        <div className="coss-spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Bio Profile...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👤</span>
          <h2 className="coss-title">Profile Not Found</h2>
          <p className="coss-subtitle" style={{ marginBottom: '1.5rem' }}>
            The bio profile @{username} does not exist or has been removed.
          </p>
          <Button onClick={() => (window.location.href = '/')}>
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <Card style={{ textAlign: 'center' }}>
          <h2 className="coss-title" style={{ color: 'var(--accent-rose)' }}>Unable to Load Profile</h2>
          <p className="coss-subtitle">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <PublicBioView profile={profile} />
    </div>
  );
};
