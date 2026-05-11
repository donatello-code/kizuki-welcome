import React, { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const ADMIN_PASSCODE = '9998';

// ─── Shared Styles ────────────────────────────────────────
const tabBtn = (active) => ({
  padding: '10px 20px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  fontWeight: 600,
  background: active ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' : 'var(--surface)',
  color: active ? 'white' : 'var(--text-secondary)',
  border: active ? 'none' : '1px solid var(--surface-border)',
  transition: 'all 0.3s ease',
});

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};

const badgeStyle = (status) => {
  const colors = {
    pending: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', color: '#eab308' },
    processing: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' },
    shipped: { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', color: '#6366f1' },
    delivered: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' },
  };
  const c = colors[status] || colors.pending;
  return {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: c.color,
    display: 'inline-block',
  };
};

// ─── Stat Card ────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    ...cardStyle,
    textAlign: 'center',
    padding: '24px 16px',
    borderTop: `3px solid ${color || 'var(--accent)'}`,
  }}>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: color || 'var(--accent)', marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>}
  </div>
);

// ─── AdminPage ────────────────────────────────────────────
const AdminPage = ({ onBackToStore }) => {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Dashboard
  const [stats, setStats] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  // Products
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  // SQL
  const [tables, setTables] = useState([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlError, setSqlError] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid passcode');
    }
  };

  // ─── API helpers ──────────────────────────────────────
  const apiPost = async (endpoint, body) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, passcode: ADMIN_PASSCODE }),
    });
    return res;
  };

  // ─── Dashboard ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost('/api/admin/stats', {});
      const data = await res.json();
      if (res.ok) setStats(data.stats);
      else setError(data.error);
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Orders ────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders`);
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
      else setError(data.error);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderDetail = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (res.ok) setOrderDetail(data.order);
      else setError(data.error);
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await apiPost(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      const data = await res.json();
      if (res.ok) {
        showMessage(`Order #${orderId} → ${newStatus}`);
        fetchOrders();
        if (orderDetail && orderDetail.order_id === orderId) {
          setOrderDetail({ ...orderDetail, status: newStatus });
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  // ─── Products ──────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost('/api/admin/quantities', {});
      const data = await res.json();
      if (res.ok) setProducts(data.products);
      else setError(data.error);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQuantityChange = (productId, value) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, quantity: parseInt(value, 10) || 0 } : p
      )
    );
  };

  const handleSaveQuantities = async () => {
    setSaving(true);
    setError(null);
    try {
      const quantities = {};
      products.forEach(p => { quantities[p.id] = p.quantity; });
      const res = await apiPost('/api/admin/update-quantities', { quantities });
      const data = await res.json();
      if (res.ok) {
        showMessage('Quantities updated successfully!');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update quantities');
    } finally {
      setSaving(false);
    }
  };

  // ─── SQL ───────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const res = await apiPost('/api/admin/tables', {});
      const data = await res.json();
      if (res.ok) setTables(data.tables);
    } catch (err) {
      console.error('Failed to fetch tables');
    }
  }, []);

  const runSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlError(null);
    setSqlResults(null);
    try {
      const res = await apiPost('/api/admin/sql-query', { query: sqlQuery.trim() });
      const data = await res.json();
      if (res.ok) {
        setSqlResults(data);
      } else {
        setSqlError(data.error);
      }
    } catch (err) {
      setSqlError('Failed to run query');
    } finally {
      setSqlLoading(false);
    }
  };

  const quickQuery = (query) => {
    setSqlQuery(query);
  };

  // ─── Tab switching ─────────────────────────────────────
  useEffect(() => {
    if (!authenticated) return;
    switch (activeTab) {
      case 'dashboard': fetchStats(); break;
      case 'orders': fetchOrders(); break;
      case 'products': fetchProducts(); break;
      case 'sql': fetchTables(); break;
    }
  }, [authenticated, activeTab, fetchStats, fetchOrders, fetchProducts, fetchTables]);

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
            Enter passcode to manage your store
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
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '14px' }}>
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

  // ─── Admin Dashboard ───────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'var(--bg-color)',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>⚡ KIZUKI Admin</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Manage orders, inventory, and data
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'orders', label: '📦 Orders' },
            { id: 'products', label: '📦 Products' },
            { id: 'sql', label: '🗄️ SQL Data' },
          ].map(tab => (
            <button
              key={tab.id}
              style={tabBtn(activeTab === tab.id)}
              onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); setOrderDetail(null); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Dashboard ── */}
        {activeTab === 'dashboard' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                Loading stats...
              </div>
            ) : stats ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}>
                  <StatCard label="Total Orders" value={stats.totalOrders} color="#6366f1" />
                  <StatCard
                    label="Total Revenue"
                    value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
                    color="#22c55e"
                  />
                  <StatCard label="Pending" value={stats.pendingOrders} color="#eab308" />
                  <StatCard label="Products" value={stats.totalProducts} color="#3b82f6" />
                  <StatCard label="Captured Cards" value={stats.totalCapturedCards} color="#a855f7" />
                  <StatCard label="Orders (7 days)" value={stats.recentOrders} color="#ec4899" />
                </div>

                {/* Orders by Status */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                    Orders by Status
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {stats.ordersByStatus.map(s => (
                      <div key={s.status} style={{
                        padding: '12px 20px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--surface-border)',
                        textAlign: 'center',
                        flex: '1 1 120px',
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{s.count}</div>
                        <span style={badgeStyle(s.status)}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                No data available yet.
              </div>
            )}
          </>
        )}

        {/* ── TAB: Orders ── */}
        {activeTab === 'orders' && (
          <>
            {selectedOrder && orderDetail ? (
              /* Order Detail View */
              <div>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setSelectedOrder(null); setOrderDetail(null); }}
                  style={{ marginBottom: '16px', padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  ← Back to Orders
                </button>

                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '4px' }}>
                        Order #{orderDetail.order_id}
                      </h2>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(orderDetail.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span style={badgeStyle(orderDetail.status)}>{orderDetail.status}</span>
                  </div>

                  {/* Customer Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</div>
                      <div style={{ fontWeight: 600 }}>{orderDetail.full_name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{orderDetail.email}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{orderDetail.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Shipping</div>
                      <div style={{ fontSize: '0.9rem' }}>{orderDetail.address}</div>
                      {orderDetail.apt && <div style={{ fontSize: '0.9rem' }}>{orderDetail.apt}</div>}
                      <div style={{ fontSize: '0.9rem' }}>{orderDetail.city}, {orderDetail.state} {orderDetail.zip}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Payment</div>
                      <div style={{ fontSize: '0.9rem' }}>{orderDetail.card_brand || 'Card'} ending in {orderDetail.card_last_four}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                        ${(orderDetail.total / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Items</div>
                    {(() => {
                      try {
                        const items = JSON.parse(orderDetail.items);
                        return items.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid var(--surface-border)' : 'none',
                          }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                {item.selectedSize ? `Size: ${item.selectedSize} · ` : ''}× {item.quantity}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ));
                      } catch { return <div style={{ color: 'var(--text-secondary)' }}>Could not parse items</div>; }
                    })()}
                  </div>

                  {/* Status Update */}
                  <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Update Status:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <button
                          key={s}
                          className="btn"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: orderDetail.status === s ? 'var(--accent)' : 'var(--surface)',
                            color: orderDetail.status === s ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${orderDetail.status === s ? 'var(--accent)' : 'var(--surface-border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            opacity: orderDetail.status === s ? 1 : 0.7,
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => updateOrderStatus(orderDetail.order_id, s)}
                          disabled={orderDetail.status === s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Orders List */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Orders ({orders.length})
                  </h3>
                  <button className="btn btn-secondary" onClick={fetchOrders} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    🔄 Refresh
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    Loading orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    No orders yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="glass"
                        style={{
                          padding: '16px 20px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid var(--surface-border)',
                        }}
                        onClick={() => { setSelectedOrder(order.order_id); fetchOrderDetail(order.order_id); }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              #{order.order_id}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {order.full_name} · {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                              ${(order.total / 100).toFixed(2)}
                            </span>
                            <span style={badgeStyle(order.status)}>{order.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── TAB: Products ── */}
        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Inventory Manager
              </h3>
              <button className="btn btn-secondary" onClick={fetchProducts} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                Loading products...
              </div>
            ) : (
              <>
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

                {/* Save Button */}
                <button
                  className="btn btn-primary"
                  onClick={handleSaveQuantities}
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

                {/* Quick Set Buttons */}
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
                        p.id === 'p_1' ? { ...p, quantity: 97 } : p
                      ));
                    }}
                  >
                    Reset Chessboard → 97
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => {
                      setProducts(prev => prev.map(p =>
                        p.id === 'p_2' ? { ...p, quantity: 94 } : p
                      ));
                    }}
                  >
                    Reset Hoodie → 94
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── TAB: SQL Data ── */}
        {activeTab === 'sql' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                🗄️ SQL Data Viewer
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Run read-only SELECT queries against the SQLite database.
              </p>
            </div>

            {/* Tables Overview */}
            <div style={{ ...cardStyle, marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Tables</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {tables.map(t => (
                  <div
                    key={t.name}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--surface-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      minWidth: '140px',
                    }}
                    onClick={() => quickQuery(`SELECT * FROM ${t.name} LIMIT 20`)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{t.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t.rowCount} rows</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Queries */}
            <div style={{ ...cardStyle, marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Quick Queries</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'All Orders', query: 'SELECT order_id, full_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20' },
                  { label: 'All Products', query: 'SELECT * FROM products' },
                  { label: 'Captured Cards', query: 'SELECT * FROM captured_cards ORDER BY last_used DESC' },
                  { label: 'Order Stats', query: "SELECT status, COUNT(*) as count, SUM(total) as revenue FROM orders GROUP BY status" },
                  { label: 'Recent Carts', query: 'SELECT * FROM carts ORDER BY updated_at DESC LIMIT 10' },
                ].map(q => (
                  <button
                    key={q.label}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    onClick={() => quickQuery(q.query)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div style={{ ...cardStyle, marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  className="input"
                  type="text"
                  placeholder="SELECT * FROM orders LIMIT 10"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') runSqlQuery(); }}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={runSqlQuery}
                  disabled={sqlLoading || !sqlQuery.trim()}
                  style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                >
                  {sqlLoading ? 'Running...' : '▶ Run'}
                </button>
              </div>
              {sqlError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px' }}>
                  ❌ {sqlError}
                </div>
              )}
            </div>

            {/* Results */}
            {sqlResults && (
              <div style={{ ...cardStyle, overflow: 'auto' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {sqlResults.count} row{sqlResults.count !== 1 ? 's' : ''} returned
                </div>
                {sqlResults.results.length > 0 ? (
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                  }}>
                    <thead>
                      <tr>
                        {Object.keys(sqlResults.results[0]).map(key => (
                          <th key={key} style={{
                            textAlign: 'left',
                            padding: '8px 12px',
                            borderBottom: '2px solid var(--surface-border)',
                            color: 'var(--accent)',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '0.5px',
                          }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResults.results.map((row, i) => (
                        <tr key={i} style={{
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} style={{
                              padding: '6px 12px',
                              borderBottom: '1px solid var(--surface-border)',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                            }}>
                              {val === null ? <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                    Query returned no results.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

