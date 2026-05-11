import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const ADMIN_PASSCODE = '9998';

const AdminPage = ({ onBackToStore }) => {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid passcode');
    }
  };

  const fetchQuantities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/quantities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: ADMIN_PASSCODE }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
      } else {
        setError(data.error || 'Failed to fetch quantities');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchQuantities();
    }
  }, [authenticated]);

  const handleQuantityChange = (productId, value) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, quantity: parseInt(value, 10) || 0 } : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const quantities = {};
      products.forEach(p => { quantities[p.id] = p.quantity; });

      const res = await fetch(`${BACKEND_URL}/api/admin/update-quantities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: ADMIN_PASSCODE, quantities }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Quantities updated successfully!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to update quantities');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setSaving(false);
    }
  };

  // ─── Login Screen ─────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--bg-color)',
      }}>
        <div className="glass" style={{
          padding: '48px',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Admin Panel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Enter passcode to manage inventory
          </p>
          <form onSubmit={handleLogin}>
            <input
              className="input"
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ marginBottom: '16px', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
              autoFocus
            />
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '14px' }}
            >
              Unlock
            </button>
          </form>
          <button
            className="btn btn-secondary"
            onClick={onBackToStore}
            style={{ width: '100%', marginTop: '12px' }}
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'var(--bg-color)',
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Inventory Manager</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Update product quantities in real-time
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onBackToStore} style={{ padding: '10px 20px' }}>
            ← Store
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>
            ✅ {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>
            ❌ {error}
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Loading quantities...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map(product => (
              <div key={product.id} className="glass" style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
                    {product.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    ID: {product.id}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.9rem', minWidth: '40px' }}
                    onClick={() => handleQuantityChange(product.id, Math.max(0, product.quantity - 1))}
                  >
                    −
                  </button>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      padding: '10px',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  />
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.9rem', minWidth: '40px' }}
                    onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {!loading && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem',
              marginTop: '24px',
            }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        )}

        {/* Quick Set Buttons */}
        {!loading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px' }}
              onClick={() => {
                setProducts(prev => prev.map(p =>
                  p.id === 'p_1' ? { ...p, quantity: 99 } : p
                ));
              }}
            >
              Reset Chessboard → 99
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px' }}
              onClick={() => {
                setProducts(prev => prev.map(p =>
                  p.id === 'p_2' ? { ...p, quantity: 100 } : p
                ));
              }}
            >
              Reset Hoodie → 100
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
