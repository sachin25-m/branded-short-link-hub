import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { linkService } from '../../api/link.service';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { QRCodeModal } from './QRCodeModal';

export const LinkLibraryStudio = ({ onNavigate }) => {
  const { accessToken } = useAuth();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive UI states
  const [copiedId, setCopiedId] = useState(null);
  const [qrModalData, setQrModalData] = useState(null); // { shortUrl, shortCode }
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLinks = useCallback(
    async (pageToFetch = 1, searchToFetch = searchQuery) => {
      setLoading(true);
      setError(null);
      try {
        const res = await linkService.getLinks(
          { page: pageToFetch, limit: 10, search: searchToFetch },
          accessToken
        );
        if (res.success && res.data) {
          setLinks(res.data.links || []);
          setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch link library.');
      } finally {
        setLoading(false);
      }
    },
    [accessToken, searchQuery]
  );

  useEffect(() => {
    fetchLinks(1, searchQuery);
  }, [searchQuery, fetchLinks]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLinks(newPage, searchQuery);
    }
  };

  const handleCopy = async (id, shortUrl) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setCopiedId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    setDeleting(true);
    try {
      await linkService.deleteLink(deleteConfirmId, accessToken);
      setDeleteConfirmId(null);
      // Refresh current page or previous page if last item deleted
      const nextTotal = pagination.total - 1;
      const nextTotalPages = Math.ceil(nextTotal / pagination.limit) || 1;
      const targetPage = pagination.page > nextTotalPages ? nextTotalPages : pagination.page;
      fetchLinks(targetPage, searchQuery);
    } catch (err) {
      setError(err.message || 'Failed to delete link.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="coss-title" style={{ margin: 0 }}>Link Library Studio</h2>
          <p className="coss-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage, share, track, and generate QR codes for your short links</p>
        </div>
        <Button onClick={() => onNavigate('create-link')} style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
          ➕ Create Short Link
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Search Input Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Input
          id="link-library-search"
          type="search"
          placeholder="🔍 Search links by destination URL or short code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="coss-spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your short link library...</p>
        </div>
      ) : links.length === 0 ? (
        /* Empty State */
        <div className="coss-empty-state">
          <span className="coss-empty-icon">🔗</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {searchQuery ? 'No matching short links found' : 'No short links created yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {searchQuery
              ? `No links matched "${searchQuery}". Try clearing your search query.`
              : 'Start shortening long URLs and generating branded vanity links today.'}
          </p>
          {searchQuery ? (
            <Button variant="secondary" onClick={() => setSearchQuery('')} style={{ width: 'auto' }}>
              Clear Search
            </Button>
          ) : (
            <Button onClick={() => onNavigate('create-link')} style={{ width: 'auto' }}>
              Create Your First Short Link
            </Button>
          )}
        </div>
      ) : (
        /* Table / List View */
        <div>
          <div className="coss-table-container">
            <table className="coss-table">
              <thead>
                <tr>
                  <th>Short Link</th>
                  <th>Destination URL</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.95rem' }}
                        >
                          /{link.shortCode}
                        </a>
                        {link.isCustomSlug && (
                          <span className="status-badge connected" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            Vanity
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <a
                        href={link.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={link.destinationUrl}
                        style={{
                          color: 'var(--text-muted)',
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                        }}
                      >
                        {link.destinationUrl}
                      </a>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(link.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td>
                      <div className="coss-btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="coss-btn-sm"
                          onClick={() => handleCopy(link.id, link.shortUrl)}
                        >
                          {copiedId === link.id ? '✅ Copied' : '📋 Copy'}
                        </button>

                        <button
                          type="button"
                          className="coss-btn-sm"
                          onClick={() => setQrModalData({ shortUrl: link.shortUrl, shortCode: link.shortCode })}
                        >
                          📷 QR
                        </button>

                        <button
                          type="button"
                          className="coss-btn-sm coss-btn-danger"
                          onClick={() => setDeleteConfirmId(link.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="coss-pagination">
            <span className="coss-page-info">
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total links)
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                style={{ width: 'auto', padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
              >
                ◀ Previous
              </Button>

              <Button
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                style={{ width: 'auto', padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
              >
                Next ▶
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrModalData}
        onClose={() => setQrModalData(null)}
        shortUrl={qrModalData?.shortUrl}
        shortCode={qrModalData?.shortCode}
      />

      {/* Delete Modal Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="coss-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="coss-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coss-modal-header">
              <h3 style={{ margin: 0, color: 'var(--accent-rose)' }}>Confirm Deletion</h3>
              <button type="button" className="coss-modal-close" onClick={() => setDeleteConfirmId(null)}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this short link? This action is permanent and will remove associated click telemetry records.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                onClick={handleDelete}
                loading={deleting}
                style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}
              >
                Yes, Delete Link
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
