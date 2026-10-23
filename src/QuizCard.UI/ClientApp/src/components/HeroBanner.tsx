import React from 'react';
import { Palette, Sparkles, BookOpen, Compass } from 'lucide-react';
import './HeroBanner.css';

export const HeroBanner: React.FC = () => {
  return (
    <div className="qc-hero-banner">
      {/* Floating Decorative Stickers matching the Figma community design */}
      
      {/* Sticker 1: Color Palette */}
      <div className="qc-sticker qc-sticker-palette" title="Design Assets">
        <div className="hb-palette-content">
          <Palette size={16} color="#0284c7" />
          <div className="hb-palette-dots">
            <span className="hb-dot-rose" />
            <span className="hb-dot-blue" />
            <span className="hb-dot-green" />
          </div>
        </div>
      </div>

      {/* Sticker 2: Hexagon Icon */}
      <div className="qc-sticker qc-sticker-hex" title="Components">
        <Compass size={15} color="#6366f1" />
      </div>

      {/* Sticker 3: Double Pill Tag */}
      <div className="qc-sticker qc-sticker-tag" title="Tokens">
        <div className="hb-tag-col">
          <div className="hb-tag-row">
            <span className="hb-tag-dot-magenta" />
            <span className="hb-tag-bar-magenta" />
          </div>
          <div className="hb-tag-row">
            <span className="hb-tag-dot-purple" />
            <span className="hb-tag-bar-purple" />
          </div>
        </div>
      </div>

      {/* Sticker 4: Aa Typography */}
      <div className="qc-sticker qc-sticker-aa" title="Typography">
        <span>Aa</span>
      </div>

      {/* Sticker 5: Sparkles / Stars Tag */}
      <div className="qc-sticker qc-sticker-sparkle" title="Effects">
        <div className="hb-tag-col">
          <div className="hb-tag-row">
            <Sparkles size={11} color="#8b5cf6" />
            <span className="hb-sparkle-bar-purple" />
          </div>
          <div className="hb-tag-row">
            <span className="hb-sparkle-dot-pink" />
            <span className="hb-sparkle-bar-pink" />
          </div>
        </div>
      </div>

      {/* Sticker 6: Book / Flashcards */}
      <div className="qc-sticker qc-sticker-book" title="Flashcards">
        <BookOpen size={15} color="#0284c7" />
      </div>

      {/* Center Main Headline */}
      <h1 className="qc-hero-title">
        Discover community-made <span className="highlight-blue">libraries</span>, <span className="highlight-cyan">plugins</span>, <span className="highlight-purple">icon sets</span>, and more
      </h1>
    </div>
  );
};
