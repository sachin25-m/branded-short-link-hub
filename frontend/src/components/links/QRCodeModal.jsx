import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '../ui/Button';

export const QRCodeModal = ({ isOpen, onClose, shortUrl, shortCode }) => {
  const qrRef = useRef(null);

  if (!isOpen || !shortUrl) return null;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${shortCode || 'link'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="coss-modal-overlay" onClick={onClose}>
      <div className="coss-modal" onClick={(e) => e.stopPropagation()}>
        <div className="coss-modal-header">
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
            QR Code Generator
          </h3>
          <button type="button" className="coss-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Scan to access the short link or download the PNG QR code.
        </p>

        <div
          ref={qrRef}
          style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <QRCodeCanvas
            value={shortUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="H"
            includeMargin={false}
          />
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Encoded Public Short URL:
          </span>
          <code className="coss-code" style={{ fontSize: '0.85rem' }}>
            {shortUrl}
          </code>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Button onClick={handleDownload}>
            📥 Download PNG QR Code
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
