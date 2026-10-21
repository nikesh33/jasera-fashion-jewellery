import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, Search, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatPrice } from '../../lib/utils';
import { api } from '../../lib/api';
import './TrackOrderPage.css';

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderNumber, setOrderNumber] = useState(initialId);
  const [contactVerify, setContactVerify] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchTracking = async (idToSearch, contact = '') => {
    if (!idToSearch.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let url = `/orders/track/${encodeURIComponent(idToSearch.trim())}`;
      if (contact.trim()) {
        const isEmail = contact.includes('@');
        url += isEmail ? `?email=${encodeURIComponent(contact.trim())}` : `?phone=${encodeURIComponent(contact.trim())}`;
      }
      const res = await api.get(url);
      if (res?.data?.order) {
        setOrder(res.data.order);
      } else {
        setErrorMsg('Order not found. Please check your order number.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to locate order. Please check the order ID.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchTracking(initialId);
    }
  }, [initialId]);

  const handleTrack = (e) => {
    e.preventDefault();
    fetchTracking(orderNumber, contactVerify);
  };

  const statusSteps = [
    { key: 'pending', title: 'Order Received' },
    { key: 'confirmed', title: 'Order Confirmed' },
    { key: 'processing', title: 'Processing & Packaging' },
    { key: 'shipped', title: 'Shipped' },
    { key: 'delivered', title: 'Delivered' },
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const orderProgression = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = orderProgression.indexOf(currentStatus || 'pending');
    const stepIndex = orderProgression.indexOf(stepKey);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="track-page container">
      <div className="track-header text-center">
        <span className="section-eyebrow">ORDER TRACKING</span>
        <h1 className="track-title">Track Your Order</h1>
        <p className="track-subtitle">
          Enter your order number to check the current fulfillment and delivery status.
        </p>

        <form onSubmit={handleTrack} className="track-search-form" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <Input
              placeholder="Order Number (e.g. SUV-1700000000000)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
            <Button variant="primary" size="md" type="submit" isLoading={isLoading} icon={Search}>
              Track Order
            </Button>
          </div>
          <div style={{ marginTop: '8px' }}>
            <Input
              placeholder="Optional: Phone or Email (to view items & address)"
              value={contactVerify}
              onChange={(e) => setContactVerify(e.target.value)}
            />
          </div>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '16px', color: '#B3261E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {order && (
        <div className="track-result-card">
          <div className="track-meta-bar">
            <div>
              <span className="meta-label">Order Number</span>
              <strong className="meta-val font-mono">{order.order_number}</strong>
            </div>
            <div>
              <span className="meta-label">Delivery Partner</span>
              <strong className="meta-val">{order.carrier || 'Standard Courier'}</strong>
            </div>
            <div>
              <span className="meta-label">Tracking Number</span>
              <strong className="meta-val font-mono">{order.tracking_number || 'Will be updated upon dispatch'}</strong>
            </div>
            <div>
              <span className="meta-label">Order Amount</span>
              <strong className="meta-val text-maroon">{formatPrice(order.total_amount || order.total || 0)}</strong>
            </div>
          </div>

          <div className="track-timeline">
            {statusSteps.map((step, idx) => {
              const state = getStepStatus(step.key, order.status || order.fulfilment_status);
              return (
                <div
                  key={idx}
                  className={`timeline-node ${state === 'completed' ? 'is-completed' : ''} ${state === 'current' ? 'is-current' : ''}`}
                >
                  <div className="node-marker">
                    {state === 'completed' && <CheckCircle2 size={20} />}
                    {state === 'current' && <Clock size={20} />}
                    {state === 'pending' && <div className="pending-dot" />}
                  </div>
                  <div className="node-info">
                    <h4>{step.title}</h4>
                    <span>
                      {state === 'completed' && 'Completed'}
                      {state === 'current' && `In Progress (${(order.status || 'pending').toUpperCase()})`}
                      {state === 'pending' && 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--grey-200)', paddingTop: '16px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--color-charcoal)' }}>Order Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--grey-700)' }}>
                    <span>{item.product_name || item.name} × {item.quantity}</span>
                    <strong style={{ color: 'var(--color-charcoal)' }}>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="track-security-banner">
            <ShieldCheck size={24} className="banner-ic" />
            <div>
              <strong>Delivery Verification</strong>
              <p>For order safety, please verify package condition upon delivery from our courier partner.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
