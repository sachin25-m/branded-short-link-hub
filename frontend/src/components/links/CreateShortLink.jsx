import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { linkService } from '../../api/link.service';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export const CreateShortLink = () => {
  const { accessToken } = useAuth();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCreatedLink(null);
    setCopied(false);

    if (!destinationUrl.trim()) {
      setError('Please provide a destination URL.');
      return;
    }

    try {
      const parsed = new URL(destinationUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('URL must start with http:// or https://');
        return;
      }
    } catch (err) {
      setError('Please enter a valid HTTP or HTTPS URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        destinationUrl: destinationUrl.trim(),
      };
      if (customSlug.trim()) {
        payload.customSlug = customSlug.trim();
      }

      const res = await linkService.createLink(payload, accessToken);
      setCreatedLink(res.data);
      setDestinationUrl('');
      setCustomSlug('');
    } catch (err) {
      setError(err.message || 'Failed to create short link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(createdLink.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <Card>
      <h2 className="coss-title">Create Branded Short Link</h2>
      <p className="coss-subtitle">Transform long URLs into powerful 6-character short codes or custom vanity slugs</p>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Input
          id="link-destination"
          label="Destination URL"
          type="url"
          placeholder="https://example.com/long-landing-page-url"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          required
        />

        <Input
          id="link-custom-slug"
          label="Custom Vanity Slug (Optional)"
          type="text"
          placeholder="e.g. summer-sale (leave blank for auto 6-char code)"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
        />

        <Button type="submit" loading={loading} style={{ marginTop: '0.5rem' }}>
          ⚡ Shorten URL
        </Button>
      </form>

      {createdLink && (
        <div style={{ marginTop: '1.75rem', background: 'rgba(15, 23, 42, 0.8)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--accent-blue)' }}>
          <Alert type="success" className="" style={{ marginBottom: '1rem' }}>
            Short link created successfully!
          </Alert>

          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Destination:</span>{' '}
              <a href={createdLink.destinationUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {createdLink.destinationUrl}
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Short Code:</span>{' '}
              <strong style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{createdLink.shortCode}</strong>{' '}
              {createdLink.isCustomSlug && <span className="status-badge connected" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>Custom Slug</span>}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Short Link URL:</span>
              <code className="coss-code" style={{ marginTop: '0.25rem', display: 'block', fontSize: '0.95rem', padding: '0.5rem' }}>
                {createdLink.shortUrl}
              </code>
            </div>
          </div>

          <Button onClick={handleCopy} variant={copied ? 'primary' : 'secondary'}>
            {copied ? '✅ Copied to Clipboard!' : '📋 Copy Short Link'}
          </Button>
        </div>
      )}
    </Card>
  );
};
