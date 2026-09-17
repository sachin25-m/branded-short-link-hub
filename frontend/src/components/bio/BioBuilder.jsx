import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bioService } from '../../api/bio.service';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { THEMES, PLATFORM_CONFIG } from './bioThemes';
import { PublicBioView } from './PublicBioView';

export const BioBuilder = () => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState('minimal-light');
  const [socialLinks, setSocialLinks] = useState([]);

  // New Link inputs
  const [selectedPlatform, setSelectedPlatform] = useState('github');
  const [platformUrl, setPlatformUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await bioService.getMyBio(accessToken);
        if (isMounted && res.success && res.profile) {
          setUsername(res.profile.username || '');
          setDisplayName(res.profile.displayName || '');
          setBio(res.profile.bio || '');
          setAvatarUrl(res.profile.avatarUrl || '');
          setTheme(res.profile.theme || 'minimal-light');
          setSocialLinks(res.profile.socialLinks || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load bio profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleAddSocialLink = () => {
    if (!platformUrl.trim()) return;

    try {
      const parsed = new URL(platformUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Social URL must start with http:// or https://');
        return;
      }
    } catch (e) {
      setError('Please enter a valid HTTP or HTTPS social profile URL.');
      return;
    }

    // Filter out existing platform if already added
    const updated = socialLinks.filter((l) => l.platform !== selectedPlatform);
    updated.push({ platform: selectedPlatform, url: platformUrl.trim() });
    setSocialLinks(updated);
    setPlatformUrl('');
    setError(null);
  };

  const handleRemoveSocialLink = (platformToRemove) => {
    setSocialLinks(socialLinks.filter((l) => l.platform !== platformToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !displayName.trim()) {
      setError('Username and Display Name are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await bioService.updateMyBio(
        {
          username: username.trim(),
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          socialLinks,
          theme,
        },
        accessToken
      );

      if (res.success) {
        setSuccess('Bio Profile saved successfully!');
        if (res.profile) {
          setUsername(res.profile.username);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save bio profile.');
    } finally {
      setSaving(false);
    }
  };

  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'http://localhost:5173';
  const publicBioUrl = `${publicAppUrl}/bio/${username.trim() || 'username'}`;

  // Live profile preview object
  const previewProfile = {
    username: username.trim() || 'username',
    displayName: displayName.trim() || 'Your Name',
    bio: bio.trim(),
    avatarUrl: avatarUrl.trim(),
    socialLinks,
    theme,
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="coss-spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Bio Hub Builder...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Visual Builder Editor Form */}
        <Card>
          <h2 className="coss-title">Link-in-Bio Builder</h2>
          <p className="coss-subtitle">Customize your public bio profile page</p>

          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Input
              id="bio-username"
              label="Public Username / Handle"
              type="text"
              placeholder="e.g. johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              id="bio-display-name"
              label="Display Name"
              type="text"
              placeholder="e.g. John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <div className="coss-form-group">
              <label htmlFor="bio-text" className="coss-label">
                Bio Description ({bio.length}/300)
              </label>
              <textarea
                id="bio-text"
                rows={3}
                placeholder="Write a brief introduction..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                className="coss-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <Input
              id="bio-avatar-url"
              label="Avatar Image URL (Optional)"
              type="url"
              placeholder="https://example.com/my-photo.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />

            {/* Theme Picker */}
            <div className="coss-form-group">
              <label className="coss-label">Select Theme</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '0.5rem',
                      border: theme === t.id ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      background: theme === t.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Links Manager */}
            <div className="coss-form-group" style={{ marginTop: '1.25rem' }}>
              <label className="coss-label">Social Profile Links</label>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="coss-input"
                  style={{ width: '130px', padding: '0.5rem' }}
                >
                  {Object.entries(PLATFORM_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.icon} {val.name}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  className="coss-input"
                  style={{ flex: 1 }}
                />

                <Button type="button" onClick={handleAddSocialLink} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                  Add
                </Button>
              </div>

              {/* Social Links Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {socialLinks.map((item) => {
                  const pInfo = PLATFORM_CONFIG[item.platform] || { name: item.platform, icon: '🔗' };
                  return (
                    <div
                      key={item.platform}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(15, 23, 42, 0.7)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span>{pInfo.icon}</span>
                        <strong>{pInfo.name}:</strong>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(item.platform)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-rose)',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={saving} style={{ marginTop: '1.25rem' }}>
              💾 Save Bio Profile
            </Button>
          </form>

          {/* Public Bio Page URL Box */}
          {username && (
            <div className="coss-sim-box" style={{ marginTop: '1.5rem' }}>
              <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '0.25rem' }}>
                🌐 Public Bio Page Link
              </strong>
              <a
                href={publicBioUrl}
                target="_blank"
                rel="noreferrer"
                className="coss-link"
                style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}
              >
                {publicBioUrl}
              </a>
            </div>
          )}
        </Card>

        {/* Right Column: Real-Time Live Preview */}
        <div>
          <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: '0.05em', uppercase: 'true' }}>
              👁️ LIVE PREVIEW
            </span>
          </div>
          <PublicBioView profile={previewProfile} />
        </div>
      </div>
    </div>
  );
};
