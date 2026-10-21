import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './ContactPage.css';

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Bridal Consultation',
    date: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="contact-page container">
      <div className="contact-header text-center">
        <span className="section-eyebrow">PATRON CONCIERGE</span>
        <h1 className="contact-title">Book A Private Salon Consultation</h1>
        <p className="contact-subtitle">
          Experience our private bridal suites and view rare heirloom collections with our senior jewellery historians.
        </p>
      </div>

      <div className="contact-grid">
        {/* Salon Details */}
        <div className="salon-info-card">
          <h2 className="salon-name">The Mumbai Flagship Salon</h2>
          <span className="salon-tag">By Appointment Only</span>

          <div className="salon-contact-list">
            <div className="contact-item">
              <MapPin className="contact-ic" size={20} />
              <div>
                <strong>Flagship Address</strong>
                <span>Jassera Studio, 14 Karigar Lane, Zaveri Bazaar, Mumbai 400002</span>
              </div>
            </div>

            <div className="contact-item">
              <Phone className="contact-ic" size={20} />
              <div>
                <strong>Direct Concierge Hotline</strong>
                <span>+91 22 2847 9000 / +91 98200 12345</span>
              </div>
            </div>

            <div className="contact-item">
              <Mail className="contact-ic" size={20} />
              <div>
                <strong>Private Salon Inquiries</strong>
                <span>concierge@jasserajewels.com</span>
              </div>
            </div>

            <div className="contact-item">
              <Clock className="contact-ic" size={20} />
              <div>
                <strong>Salon Hours</strong>
                <span>Monday – Saturday: 10:30 AM – 7:30 PM (IST)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Form */}
        <div className="appointment-form-card">
          {submitted ? (
            <div className="appointment-success">
              <CheckCircle size={48} color="var(--color-success)" />
              <h3>Consultation Request Received</h3>
              <p>
                Our private concierge will contact you within 2 business hours to confirm your private salon appointment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <h3 className="form-card-title">Schedule Your Private Appointment</h3>
              <Input
                label="Patron Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Radhika Singhania"
              />
              <div className="form-grid-2">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="patron@example.com"
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
                <label className="input-label">Type of Consultation</label>
                <select
                  className="input-control"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  <option value="Bridal Consultation">Royal Bridal Trousseau Consultation</option>
                  <option value="Heirloom Restoration">Heirloom Restoration & Re-stringing</option>
                  <option value="Custom Bespoke Commission">Custom Bespoke Jadau Commission</option>
                  <option value="Virtual Video Salon">Private Virtual Video Salon</option>
                </select>
              </div>

              <Input
                label="Preferred Date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <Button variant="primary" size="lg" fullWidth type="submit">
                Request Private Appointment
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
