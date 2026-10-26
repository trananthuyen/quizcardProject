import React, { useState } from 'react';
import { Play, HelpCircle, BookOpen, Edit2, Trash2, Heart } from 'lucide-react';
import './DeckCard.css';
// Preset authors and initial like counts matching the screenshot aesthetic
const CREATOR_PROFILES = [
    { name: 'Nastaran Jamali', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80', initialLikes: 933 },
    { name: 'Hardik Gondhiya', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80', initialLikes: 616 },
    { name: 'tran an thuyen', avatar: '', initialLikes: 420 },
    { name: 'Figma Community', avatar: '', initialLikes: 785 },
    { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80', initialLikes: 512 },
    { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80', initialLikes: 340 },
];
export const DeckCard = ({ deck, index, onSelectStudy, onSelectQuiz, onSelectCards, onEditDeck, onDeleteDeck, }) => {
    const profile = CREATOR_PROFILES[index % CREATOR_PROFILES.length];
    const [likes, setLikes] = useState(profile.initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const handleToggleLike = (e) => {
        e.stopPropagation();
        if (isLiked) {
            setLikes((prev) => prev - 1);
            setIsLiked(false);
        }
        else {
            setLikes((prev) => prev + 1);
            setIsLiked(true);
        }
    };
    const masteryPercent = deck.totalCards > 0
        ? Math.round((deck.masteredCards / deck.totalCards) * 100)
        : 0;
    // Determine which visual theme template to render
    const themeIndex = index % 4;
    return (<div className="qc-card" onClick={() => onSelectStudy(deck)}>
      {/* Top Preview Banner */}
      <div className={`qc-card-preview ${themeIndex === 0 ? 'qc-theme-dark-gauge' :
            themeIndex === 1 ? 'qc-theme-mindmap' :
                themeIndex === 2 ? 'qc-theme-app-icons' : 'qc-theme-aurora'}`}>
        {/* Theme 0: Split Dark/Light Gauge (Nastaran Jamali style) */}
        {themeIndex === 0 && (<div className="qc-gauge-split">
            <div className="qc-gauge-dark">
              <div className="dc-gauge-dark-title">
                {deck.title.length > 20 ? deck.title.slice(0, 20) + '...' : deck.title}
              </div>
              <div className="qc-gauge-number dc-gauge-number-dark">
                {deck.totalCards || 58}
              </div>
              <div className="qc-gauge-glow"/>
            </div>
            <div className="qc-gauge-light">
              <div className="dc-gauge-light-title">
                {deck.category || 'COLLOCATIONS'}
              </div>
              <div className="qc-gauge-number dc-gauge-number-light">
                {deck.totalCards || 58}
              </div>
            </div>
          </div>)}

        {/* Theme 1: Mindmap Neural Network (Hardik Gondhiya style) */}
        {themeIndex === 1 && (<div className="qc-mindmap-view">
            <svg className="dc-mindmap-svg">
              <path d="M 50 80 Q 110 50 170 80" stroke="#38bdf8" strokeWidth="1.5" fill="none"/>
              <path d="M 50 100 Q 110 130 170 100" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
              <path d="M 30 50 Q 80 80 140 85" stroke="#34d399" strokeWidth="1" fill="none"/>
              <circle cx="50" cy="80" r="3" fill="#38bdf8"/>
              <circle cx="170" cy="80" r="3" fill="#38bdf8"/>
              <circle cx="50" cy="100" r="3" fill="#818cf8"/>
              <circle cx="170" cy="100" r="3" fill="#818cf8"/>
            </svg>
            <div className="qc-mindmap-center">
              <span>{deck.title.length > 18 ? deck.title.slice(0, 18) + '...' : deck.title}</span>
            </div>
            <div className="dc-mindmap-subtitle">
              {deck.totalCards} Flashcards • {deck.category || 'General'}
            </div>
          </div>)}

        {/* Theme 2: 3D App Icon Grid */}
        {themeIndex === 2 && (<div className="dc-icon-grid-wrapper">
            <div className="qc-icon-grid">
              <div className="qc-icon-cube">🎨</div>
              <div className="qc-icon-cube dc-cube-blue">⚡</div>
              <div className="qc-icon-cube dc-cube-green">📚</div>
              <div className="qc-icon-cube dc-cube-purple">🧠</div>
              <div className="qc-icon-cube dc-cube-amber">💡</div>
              <div className="qc-icon-cube">✨</div>
            </div>
            <div className="dc-icon-title">
              {deck.title}
            </div>
          </div>)}

        {/* Theme 3: Aurora Gradient & Stats */}
        {themeIndex === 3 && (<div className="dc-aurora-content">
            <div className="dc-aurora-header">
              <span className="dc-aurora-badge">
                {deck.category || 'Chung'}
              </span>
              <span className="dc-aurora-count">
                {deck.totalCards} thẻ
              </span>
            </div>

            <div>
              <div className="dc-aurora-title">
                {deck.title}
              </div>
              <div className="dc-aurora-desc">
                {deck.description || 'Phương pháp lặp lại ngắt quãng SM-2'}
              </div>
            </div>

            <div className="dc-aurora-progress-row">
              <div className="dc-progress-track">
                <div className="dc-progress-fill" style={{ width: `${masteryPercent}%` }}/>
              </div>
              <span className="dc-progress-percent">{masteryPercent}%</span>
            </div>
          </div>)}

        {/* Card Overlay on Hover (Figma style actions) */}
        <div className="qc-card-overlay" onClick={(e) => e.stopPropagation()}>
          <button className="qc-overlay-btn qc-overlay-btn-primary" onClick={() => onSelectStudy(deck)}>
            <Play size={13} fill="#ffffff"/>
            <span>Học lật thẻ</span>
          </button>

          <button className="qc-overlay-btn qc-overlay-btn-secondary" onClick={() => onSelectQuiz(deck)} disabled={deck.totalCards < 2} title={deck.totalCards < 2 ? 'Cần tối thiểu 2 thẻ' : 'Thi trắc nghiệm'}>
            <HelpCircle size={13}/>
            <span>Thi trắc nghiệm</span>
          </button>

          <button className="qc-overlay-btn qc-overlay-btn-secondary" onClick={() => onSelectCards(deck)}>
            <BookOpen size={13}/>
            <span>Quản lý thẻ</span>
          </button>

          <div className="dc-overlay-btn-group">
            <button onClick={(e) => onEditDeck(deck, e)} className="dc-btn-edit" title="Chỉnh sửa bộ thẻ">
              <Edit2 size={11}/> Sửa
            </button>
            <button onClick={(e) => onDeleteDeck(deck, e)} className="dc-btn-delete" title="Xóa bộ thẻ">
              <Trash2 size={11}/> Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer (Author & Like count) */}
      <div className="qc-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="qc-author-group">
          {profile.avatar ? (<img src={profile.avatar} alt={profile.name} className="qc-author-avatar"/>) : (<div className="qc-author-avatar">
              <span>{profile.name.charAt(0).toUpperCase()}</span>
            </div>)}
          <span className="qc-author-name">{profile.name}</span>
        </div>

        <button className={`qc-like-btn ${isLiked ? 'liked' : ''}`} onClick={handleToggleLike} title="Yêu thích bộ thẻ này">
          <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#71717a'}/>
          <span>{likes}</span>
        </button>
      </div>
    </div>);
};
