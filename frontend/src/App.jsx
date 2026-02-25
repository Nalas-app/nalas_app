import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  ShoppingBag,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:3000/api/v1';

// Set up axios interceptor for logging "flow"
const logs = [];
const addLog = (log) => {
  logs.unshift({ id: Date.now(), ...log });
  if (logs.length > 5) logs.pop();
};

function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flowLogs, setFlowLogs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true); // Mock admin for demo

  // Form State
  const [formData, setFormData] = useState({
    customer_id: 'd8e4f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a', // Mock customer ID
    event_date: '',
    event_time: '12:00',
    guest_count: 50,
    venue_address: '',
    items: [
      { menu_item_id: '7a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', quantity: 1, unit_price: 250 }
    ]
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const apiRequest = async (method, path, data = null) => {
    const start = Date.now();
    try {
      const response = await axios({
        method,
        url: `${API_BASE}${path}`,
        data,
        headers: {
          Authorization: 'Bearer MOCK_TOKEN' // In real app, get from auth state
        }
      });
      const latency = Date.now() - start;
      const logEntry = {
        method: method.toUpperCase(),
        path,
        status: response.status,
        latency,
        data: response.data
      };
      setFlowLogs(prev => [logEntry, ...prev].slice(0, 5));
      return response.data;
    } catch (error) {
      const logEntry = {
        method: method.toUpperCase(),
        path,
        status: error.response?.status || 'ERR',
        latency: Date.now() - start,
        error: error.response?.data?.message || error.message
      };
      setFlowLogs(prev => [logEntry, ...prev].slice(0, 5));
      throw error;
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('get', '/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('post', '/orders', formData);
      await fetchOrders();
      setSelectedOrder(res.data);
      alert('Draft Order Created Successfully!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create order');
    }
  };

  const generateQuotation = async (id) => {
    try {
      await apiRequest('post', `/orders/${id}/quotation`);
      const updated = await apiRequest('get', `/orders/${id}`);
      setSelectedOrder(updated.data);
      await fetchOrders();
    } catch (err) {
      alert('ML/Billing Service Error: Falling back to standard rates');
    }
  };

  const confirmOrder = async (id) => {
    try {
      await apiRequest('post', `/orders/${id}/confirm`);
      const updated = await apiRequest('get', `/orders/${id}`);
      setSelectedOrder(updated.data);
      await fetchOrders();
    } catch (err) {
      alert('Stock Reservation Failed: Insufficient ingredients');
    }
  };

  const cancelOrder = async (id) => {
    const reason = prompt('Reason for cancellation?');
    if (!reason) return;
    try {
      await apiRequest('delete', `/orders/${id}`, { reason });
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Cancellation failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiRequest('patch', `/orders/${id}/status`, { status, notes: 'Manual update' });
      await fetchOrders();
      const res = await apiRequest('get', `/orders/${id}`);
      setSelectedOrder(res.data);
    } catch (err) {
      alert('Invalid transition or version conflict');
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo">MAGILAM FOODS <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 300 }}>| ORDER ENGINE</span></div>
        <div className="detail-actions">
          <button className="secondary" onClick={fetchOrders}><RefreshCcw size={16} /></button>
          <div className="status-badge status-confirmed">ADMIN MODE</div>
        </div>
      </header>

      <div className="grid">
        {/* Left Panel: Create & List */}
        <div className="panel">
          <section className="card animate" style={{ marginBottom: '2rem' }}>
            <h2><Plus size={20} /> Create New Event</h2>
            <form onSubmit={createOrder}>
              <div className="form-group">
                <label>Venue Address</label>
                <input
                  type="text"
                  placeholder="Street, City, Hall..."
                  required
                  value={formData.venue_address}
                  onChange={e => setFormData({ ...formData, venue_address: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Guest Count</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={formData.guest_count}
                    onChange={e => setFormData({ ...formData, guest_count: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <button type="submit">Initialize Order Flow</button>
            </form>
          </section>

          <section className="card animate" style={{ animationDelay: '0.1s' }}>
            <h2><ShoppingBag size={20} /> Recent Orders</h2>
            <div className="order-list">
              {orders.map(order => (
                <div
                  key={order.id}
                  className={`order-item ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-info">
                    <h3>{order.venue_address || 'Unnamed Event'}</h3>
                    <div className="order-meta">
                      <span><Clock size={12} /> {new Date(order.event_date).toLocaleDateString()}</span>
                      <span><Users size={12} /> {order.guest_count}</span>
                    </div>
                  </div>
                  <div className={`status-badge status-${order.status}`}>
                    {order.status}
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No orders found.</p>}
            </div>
          </section>
        </div>

        {/* Right Panel: Detail View */}
        <div className="panel">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card"
              >
                <div className="detail-header">
                  <div>
                    <div className="status-badge" style={{ background: 'var(--glass)', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                      Order ID: {selectedOrder.id.slice(0, 8)}...
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{selectedOrder.venue_address}</h1>
                    <div className="order-meta" style={{ fontSize: '1rem' }}>
                      <span><Clock /> {new Date(selectedOrder.event_date).toLocaleDateString()} at {selectedOrder.event_time}</span>
                    </div>
                  </div>
                  <div className={`status-badge status-${selectedOrder.status}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
                    {selectedOrder.status}
                  </div>
                </div>

                <div className="detail-actions" style={{ margin: '2rem 0', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem' }}>
                  {selectedOrder.status === 'draft' && (
                    <button onClick={() => generateQuotation(selectedOrder.id)}>
                      <TrendingUp size={16} style={{ marginRight: '8px' }} /> Generate ML Quotation
                    </button>
                  )}
                  {selectedOrder.status === 'quoted' && (
                    <button onClick={() => confirmOrder(selectedOrder.id)} style={{ background: 'var(--success)', color: 'white' }}>
                      <CheckCircle size={16} style={{ marginRight: '8px' }} /> Confirm & Reserve Stock
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button onClick={() => updateStatus(selectedOrder.id, 'preparing')}>
                      <Activity size={16} style={{ marginRight: '8px' }} /> Start Preparation
                    </button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button onClick={() => updateStatus(selectedOrder.id, 'completed')} style={{ background: 'var(--success)', color: 'white' }}>
                      <CheckCircle size={16} style={{ marginRight: '8px' }} /> Mark Completed
                    </button>
                  )}
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button className="secondary" onClick={() => cancelOrder(selectedOrder.id)} style={{ color: 'var(--danger)' }}>
                      <XCircle size={16} style={{ marginRight: '8px' }} /> Cancel
                    </button>
                  )}
                </div>

                <table className="item-table">
                  <thead>
                    <tr>
                      <th>MENU ITEM</th>
                      <th>QUANTITY</th>
                      <th>UNIT PRICE</th>
                      <th style={{ textAlign: 'right' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map(item => (
                      <tr key={item.id}>
                        <td>Item {item.menu_item_id.slice(0, 5)}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.unit_price}</td>
                        <td style={{ textAlign: 'right' }}>₹{item.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="total-section">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.total_amount || 0}</span>
                  </div>
                  <div className="total-row grand">
                    <span>Estimated Total</span>
                    <span>₹{selectedOrder.total_amount || 0}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card animate" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' }}>
                <FileText size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>Select an order to view the automated flow</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Real-time Data Flow Monitor */}
      <div className="flow-monitor">
        <div className="flow-title"><Activity size={14} style={{ verticalAlign: 'middle' }} /> BACKEND DATA FLOW</div>
        {flowLogs.map(log => (
          <div key={log.id} className="flow-log">
            <div>
              <span className="method">{log.method}</span> <span className="path">{log.path}</span>
            </div>
            <div style={{ color: log.status >= 400 ? 'var(--danger)' : '#aaa' }}>
              HTTP {log.status} • {log.latency}ms
            </div>
            {log.error && <div style={{ color: 'var(--warning)', fontSize: '0.6rem' }}>{log.error}</div>}
          </div>
        ))}
        {flowLogs.length === 0 && <div style={{ color: '#555' }}>Awaiting requests...</div>}
      </div>
    </div>
  );
}

export default App;
