import { useState } from 'react';
import { THEMES, PLATFORM_CONFIG } from './bioThemes';

export const PublicBioView = ({ profile }) => {
  const [imgError, setImgError] = useState(false);

  const activeThemeKey = profile?.theme && THEMES[profile.theme] ? profile.theme : 'minimal-light';
  const theme = THEMES[activeThemeKey];

  const displayName = profile?.displayName || 'Your Name';
  const username = profile?.username || 'username';
  const bioText = profile?.bio || 'Add a short bio to introduce yourself to your audience.';
  const avatarUrl = profile?.avatarUrl || '';
  const socialLinks = profile?.socialLinks || [];

  const initialLetter = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div
      style={{
        width: '100%',
        minHeight: '480px',
        padding: '2rem 1.25rem',
        borderRadius: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        ...theme.bgStyle,
      }}
    >
      {/* Profile Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem 1.75rem',
          borderRadius: '1.25rem',
          textAlign: 'center',
          boxSizing: 'border-box',
          ...theme.cardStyle,
        }}
      >
        {/* Avatar Image / Fallback Initial */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={() => setImgError(true)}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              {initialLetter}
            </div>
          )}
        </div>

        {/* Display Name & Handle */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 0.25rem 0',
            color: theme.titleColor,
            letterSpacing: '-0.025em',
          }}
        >
          {displayName}
        </h1>
        <p style={{ fontSize: '0.875rem', color: theme.bioColor, margin: '0 0 1.25rem 0', fontWeight: 500 }}>
          @{username}
        </p>

        {/* Bio Text */}
        {bioText && (
          <p
            style={{
              fontSize: '0.925rem',
              lineHeight: 1.5,
              color: theme.bioColor,
              marginBottom: '1.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {bioText}
          </p>
        )}

        {/* Social Link Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {socialLinks.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: theme.bioColor, fontStyle: 'italic' }}>
              No social links added yet.
            </p>
          ) : (
            socialLinks.map((item, index) => {
              const platformInfo = PLATFORM_CONFIG[item.platform] || {
                name: item.platform,
                icon: '🔗',
              };

              return (
                <a
                  key={`${item.platform}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    boxSizing: 'border-box',
                    ...theme.buttonStyle,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.opacity = '0.95';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{platformInfo.icon}</span>
                  <span>{platformInfo.name}</span>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
