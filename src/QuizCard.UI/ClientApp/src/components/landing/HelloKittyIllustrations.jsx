import React from 'react';

/**
 * Các hình vẽ minh họa SVG chất lượng cao phỏng theo phong cách Hello Kitty & Friends
 * trong giao diện mẫu Figma Community của người dùng.
 */

// 1. Hello Kitty Mascot Face SVG
export const HelloKittyFace = ({ size = 48, className = '' }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Tai trái & Tai phải */}
    <path d="M18 32 C12 12 25 5 36 20" fill="#ffffff" stroke="#18181b" strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M82 32 C88 12 75 5 64 20" fill="#ffffff" stroke="#18181b" strokeWidth="4.5" strokeLinejoin="round" />
    {/* Khuôn mặt bầu bĩnh */}
    <ellipse cx="50" cy="50" rx="42" ry="32" fill="#ffffff" stroke="#18181b" strokeWidth="4.5" />
    {/* Nơ đỏ đặc trưng bên tai phải */}
    <g transform="translate(62, 10)">
      <circle cx="12" cy="12" r="7.5" fill="#ef4444" stroke="#18181b" strokeWidth="3" />
      <path d="M4 12 C-4 4 -4 20 4 12 Z" fill="#ef4444" stroke="#18181b" strokeWidth="3" />
      <path d="M20 12 C28 4 28 20 20 12 Z" fill="#ef4444" stroke="#18181b" strokeWidth="3" />
    </g>
    {/* Đôi mắt đen hình bầu dục */}
    <ellipse cx="34" cy="52" rx="3.5" ry="5" fill="#18181b" />
    <ellipse cx="66" cy="52" rx="3.5" ry="5" fill="#18181b" />
    {/* Mũi vàng nhỏ xinh */}
    <ellipse cx="50" cy="57" rx="4.5" ry="3.2" fill="#facc15" stroke="#18181b" strokeWidth="2.5" />
    {/* Râu mèo 3 sợi mỗi bên */}
    <line x1="12" y1="48" x2="26" y2="50" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="10" y1="56" x2="25" y2="56" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="12" y1="64" x2="26" y2="62" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="88" y1="48" x2="74" y2="50" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="90" y1="56" x2="75" y2="56" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="88" y1="64" x2="74" y2="62" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

// 2. Cinnamoroll Face SVG (chú cún trắng tai dài bay lượn)
export const CinnamorollFace = ({ size = 56, className = '' }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Tai dài rủ sang 2 bên */}
    <path d="M28 35 C6 30 2 52 14 58 C26 64 32 45 36 38" fill="#ffffff" stroke="#18181b" strokeWidth="4" strokeLinejoin="round" />
    <path d="M92 35 C114 30 118 52 106 58 C94 64 88 45 84 38" fill="#ffffff" stroke="#18181b" strokeWidth="4" strokeLinejoin="round" />
    {/* Khuôn mặt tròn */}
    <ellipse cx="60" cy="40" rx="36" ry="24" fill="#ffffff" stroke="#18181b" strokeWidth="4" />
    {/* Mắt xanh biếc */}
    <ellipse cx="48" cy="40" rx="3.5" ry="4.5" fill="#38bdf8" stroke="#18181b" strokeWidth="2" />
    <ellipse cx="72" cy="40" rx="3.5" ry="4.5" fill="#38bdf8" stroke="#18181b" strokeWidth="2" />
    {/* Má hồng phấn */}
    <ellipse cx="38" cy="45" rx="5" ry="3.5" fill="#fbcfe8" />
    <ellipse cx="82" cy="45" rx="5" ry="3.5" fill="#fbcfe8" />
    {/* Miệng cười chúm chím */}
    <path d="M56 46 Q60 50 64 46" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 3. Pompompurin Face SVG (chú cún vàng đội mũ nồi nâu)
export const PompompurinFace = ({ size = 52, className = '' }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Tai cụp mềm mại */}
    <ellipse cx="22" cy="42" rx="9" ry="16" fill="#fde047" stroke="#18181b" strokeWidth="4" transform="rotate(-15 22 42)" />
    <ellipse cx="78" cy="42" rx="9" ry="16" fill="#fde047" stroke="#18181b" strokeWidth="4" transform="rotate(15 78 42)" />
    {/* Khuôn mặt vàng kem */}
    <ellipse cx="50" cy="50" rx="38" ry="30" fill="#fef08a" stroke="#18181b" strokeWidth="4" />
    {/* Mũ beret nâu trên đầu */}
    <path d="M38 24 C38 16 62 16 62 24 Z" fill="#78350f" stroke="#18181b" strokeWidth="3.5" />
    <circle cx="50" cy="16" r="3" fill="#78350f" stroke="#18181b" strokeWidth="2" />
    {/* Mắt nâu đen */}
    <circle cx="39" cy="48" r="3.5" fill="#18181b" />
    <circle cx="61" cy="48" r="3.5" fill="#18181b" />
    {/* Mũi & miệng chữ W */}
    <ellipse cx="50" cy="53" rx="3" ry="2" fill="#78350f" />
    <path d="M46 56 Q50 59 50 56 Q50 59 54 56" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 4. Badtz-Maru Penguin SVG (chú chim cánh cụt tóc gai ngầu)
export const BadtzMaruFace = ({ size = 48, className = '' }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Tóc gai nhọn trên đầu */}
    <path d="M25 35 L32 10 L45 28 L58 10 L65 35 Z" fill="#18181b" stroke="#18181b" strokeWidth="3" strokeLinejoin="round" />
    {/* Khuôn mặt đen */}
    <ellipse cx="45" cy="48" rx="32" ry="26" fill="#18181b" />
    {/* Bụng / vùng mắt trắng */}
    <ellipse cx="36" cy="46" rx="9" ry="12" fill="#ffffff" />
    <ellipse cx="54" cy="46" rx="9" ry="12" fill="#ffffff" />
    {/* Tròng mắt liếc ngang ngầu lòi */}
    <ellipse cx="38" cy="46" rx="3" ry="4" fill="#18181b" />
    <ellipse cx="56" cy="46" rx="3" ry="4" fill="#18181b" />
    {/* Mỏ vịt vàng nhọn */}
    <polygon points="45,48 53,55 45,62 37,55" fill="#facc15" stroke="#18181b" strokeWidth="2" />
  </svg>
);

// 5. Banner Card 1: Vàng rực rỡ "FIGMA / QUIZCARD IS BETTER WITH FRIENDS"
export const DeckBannerFriendsYellow = () => (
  <div className="qc-banner-art qc-banner-yellow">
    <div className="qc-banner-yellow-text">
      <span className="qc-by-line1">FIGMA IS</span>
      <span className="qc-by-line2">BETTER</span>
      <span className="qc-by-line3">WITH</span>
      <span className="qc-by-line4">FRIENDS</span>
      <div className="qc-by-brand">QuizCard</div>
    </div>
    <div className="qc-banner-yellow-chars">
      <div className="char-badge char-kitty">
        <HelloKittyFace size={52} />
      </div>
      <div className="char-badge char-pompom">
        <PompompurinFace size={56} />
      </div>
      <div className="char-badge char-badtz">
        <BadtzMaruFace size={48} />
      </div>
    </div>
  </div>
);

// 6. Banner Card 2: Trắng nét vẽ "HELLO KITTY AND FRIENDS - COLORING BOOK"
export const DeckBannerColoringBook = () => (
  <div className="qc-banner-art qc-banner-white-sketch">
    <div className="qc-sketch-header">
      <span className="qc-sketch-title">HELLO KITTY</span>
      <span className="qc-sketch-sub">AND FRIENDS</span>
    </div>
    {/* Cầu vồng nét vẽ */}
    <svg className="qc-sketch-rainbow" viewBox="0 0 200 80" fill="none">
      <path d="M20 75 A80 80 0 0 1 180 75" stroke="#18181b" strokeWidth="3" fill="none" strokeDasharray="4 2" />
      <path d="M35 75 A65 65 0 0 1 165 75" stroke="#18181b" strokeWidth="2.5" fill="none" />
      <path d="M50 75 A50 50 0 0 1 150 75" stroke="#18181b" strokeWidth="2.5" fill="none" />
    </svg>
    <div className="qc-sketch-mascots-row">
      <CinnamorollFace size={44} />
      <HelloKittyFace size={46} />
      <BadtzMaruFace size={42} />
    </div>
  </div>
);

// 7. Banner Card 3: Xanh ngọc cảnh quan "Hello Kitty and Friends Template"
export const DeckBannerSlidesSky = () => (
  <div className="qc-banner-art qc-banner-sky">
    <div className="qc-sky-title">Hello Kitty and Friends</div>
    <div className="qc-sky-subtitle">Template</div>
    {/* Cầu vồng 7 màu & Ngôi nhà quả táo */}
    <div className="qc-sky-landscape">
      <div className="qc-rainbow-arch">
        <span className="r-arc r-red" />
        <span className="r-arc r-orange" />
        <span className="r-arc r-yellow" />
        <span className="r-arc r-green" />
        <span className="r-arc r-blue" />
        <span className="r-arc r-purple" />
      </div>
      <div className="qc-apple-house" title="Apple Cottage">
        🍎
      </div>
      <div className="qc-sky-friends-row">
        <PompompurinFace size={38} />
        <HelloKittyFace size={40} />
        <CinnamorollFace size={42} />
      </div>
    </div>
  </div>
);
