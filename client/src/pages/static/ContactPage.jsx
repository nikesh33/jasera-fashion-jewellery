import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/api';
import './ContactPage.css';

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Boutique Inquiry',
    date: '',
    message: '',
  });
  const [storeSettings, setStoreSettings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        if (res?.data?.settings) {
          setStoreSettings(res.data.settings);
        }
      })
      .catch((err) => console.warn('Could not load settings:', err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const subject = `${form.service}${form.date ? ` (Date: ${form.date})` : ''}`;
      const message = form.message || `Customer inquiry regarding ${form.service}. Preferred date: ${form.date || 'Flexible'}.`;

      await api.post('/contact', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject,
        message,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Contact submission error:', err);
      setErrorMessage(err.message || 'Failed to submit inquiry. Please try again or reach us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page container">
      <div className="contact-header text-center">
        <span className="section-eyebrow">CUSTOMER CONCIERGE</span>
        <h1 className="contact-title">Get In Touch With Jassera</h1>
        <p className="contact-subtitle">
          Have a question about our viral statement earrings, shipping timelines, or custom orders? Send us a message and our team will get back to you swiftly.
        </p>
      </div>

      <div className="contact-grid">
        {/* Salon Details */}
        <div className="salon-info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <img
              src="/images/jassera-logo.jpg"
              alt="Jassera Jewellery"
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(197, 162, 98, 0.45)', objectFit: 'cover' }}
            />
            <div>
              <h2 className="salon-name" style={{ margin: 0 }}>The Jassera Boutique Studio</h2>
              <span className="salon-tag">Jewellery & Accessories</span>
            </div>
          </div>

          <div className="salon-contact-list">
            <div className="contact-item">
              <MapPin className="contact-ic" size={20} />
              <div>
                <strong>Boutique Studio</strong>
                <span>Jassera Design Studio, 14 Karigar Lane, Zaveri Bazaar, Mumbai 400002</span>
              </div>
            </div>

            <div className="contact-item">
              <Phone className="contact-ic" size={20} />
              <div>
                <strong>Concierge & WhatsApp Support</strong>
                <span>{storeSettings?.support_phone || '+91 98200 12345'}</span>
              </div>
            </div>

            <div className="contact-item">
              <Mail className="contact-ic" size={20} />
              <div>
                <strong>Support & Order Queries</strong>
                <span>{storeSettings?.support_email || 'support@jassera.in'}</span>
              </div>
            </div>

            <div className="contact-item">
              <Clock className="contact-ic" size={20} />
              <div>
                <strong>Customer Care Hours</strong>
                <span>Monday – Saturday: 10:00 AM – 7:30 PM (IST)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment / Inquiry Form */}
        <div className="appointment-form-card">
          {submitted ? (
            <div className="appointment-success">
              <CheckCircle size={48} color="var(--color-success)" />
              <h3>Message Received Successfully</h3>
              <p>
                Thank you, <strong>{form.name}</strong>! Your inquiry has been saved to our boutique database. Our team will contact you within 2 business hours.
              </p>
              <Button
                variant="outline"
                size="md"
                style={{ marginTop: '20px' }}
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: '',
                    email: '',
                    phone: '',
                    service: 'Boutique Inquiry',
                    date: '',
                    message: '',
                  });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <h3 className="form-card-title">Send An Inquiry</h3>

              {errorMessage && (
                <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '0.9rem' }}>
                  {errorMessage}
                </div>
              )}

              <Input
                label="Your Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Radhika Sharma"
              />
              <div className="form-grid-2">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                />
                <Input
                  label="Phone Number"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98200 00000"
                />
              </div>

              <div className="input-field">
                <label className="input-label">Topic / Service</label>
                <select
                  className="input-control"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  <option value="Order & Delivery Inquiry">Order Status & Delivery Timeline</option>
                  <option value="Bridal Jewellery Inquiry">Bridal & Festive Curation</option>
                  <option value="Wholesale & Bulk Orders">Bulk / Return Gifting Inquiry</option>
                  <option value="Product Care & Return">Product Quality & Returns</option>
                </select>
              </div>

              <div className="input-field">
                <label className="input-label">Message (Optional)</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you're looking for or your order number..."
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <Button variant="primary" size="lg" fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Message...' : 'Submit Inquiry'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
