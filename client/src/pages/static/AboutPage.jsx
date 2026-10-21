import React from 'react';
import { Award, Sparkles, ShieldCheck, HeartHandshake, PackageCheck, Heart } from 'lucide-react';
import './AboutPage.css';

export function AboutPage() {
  return (
    <div className="about-page">
      {/* 1. Hero Header */}
      <div className="about-hero">
        <div className="container about-hero-content">
          <span className="about-eyebrow">ABOUT JASSERA</span>
          <h1 className="about-title">Crafted For Your Everyday Aesthetic</h1>
          <p className="about-subtitle">
            The boutique destination for viral statement bracelets, handcrafted jhumkas, and anti-tarnish daily wear jewellery.
          </p>
        </div>
      </div>

      {/* 2. Brand Story */}
      <div className="container about-section">
        <div className="about-story-grid">
          <div className="about-story-text">
            <span className="section-eyebrow">OUR STORY</span>
            <h2 className="about-story-heading">From An Instagram Dream to Your Jewellery Box</h2>
            <p>
              Jassera began with a simple passion: creating breathtaking, statement jewellery that doesn't cost a fortune. We noticed how difficult it was to find traditional jhumkas that are lightweight enough for all-day wear, or modern daily wear pieces that don't lose their shine after a few days.
            </p>
            <p>
              Every collection we launch is hand-curated with immense love — from oxidised silver jhumkas with delicate hanging bells to waterproof stainless steel clover pendants and signature statement bracelets. Whether you're dressing up for college ethnic day, a best friend's wedding, or everyday chic, Jassera has the perfect piece to elevate your look.
            </p>
          </div>
          <div className="about-story-img-wrap">
            <img
              src="/images/jassera-hero-banner.jpg"
              alt="Jassera Handcrafted Statement Bracelet & Jewellery Collection"
              className="about-story-img"
            />
          </div>
        </div>
      </div>

      {/* 3. The Four Pillars of Jassera Boutique */}
      <div className="about-pillars-bg">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">OUR PROMISE</span>
            <h2 className="section-title">The Jassera Quality Promise</h2>
          </div>

          <div className="about-pillars-grid">
            <div className="pillar-card">
              <Sparkles size={36} className="pillar-ic" />
              <h3>Handcrafted Statement Styles</h3>
              <p>Viral jhumkas, Afghan chokers, and Korean studs designed to turn heads and spark compliments wherever you go.</p>
            </div>
            <div className="pillar-card">
              <ShieldCheck size={36} className="pillar-ic" />
              <h3>Anti-Tarnish & Waterproof</h3>
              <p>Premium stainless steel & skin-friendly electroplating that resists sweat, water, and daily wear without fading.</p>
            </div>
            <div className="pillar-card">
              <PackageCheck size={36} className="pillar-ic" />
              <h3>Express Pan-India Shipping</h3>
              <p>Dispatched with care within 24 hours via BlueDart & Delhivery, tracked straight to your doorstep.</p>
            </div>
            <div className="pillar-card">
              <Heart size={36} className="pillar-ic" />
              <h3>Aesthetic Boutique Packaging</h3>
              <p>Packed in complimentary cute pouches and gift-ready boxes, perfect for birthdays, anniversaries, and unboxing reels.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
