import React, { useState } from 'react';
import { Play, HelpCircle, BookOpen, Edit2, Trash2, Heart, Globe, Lock, Bookmark, BookmarkX } from 'lucide-react';
import { recordRecentDeck } from '../utils/recentStorage';
import './DeckCard.css';
// Hàm tính số lượt thích mặc định ổn định theo ID bộ thẻ
const getInitialLikes = (deckId) => {
    if (!deckId) return 120;
    let hash = 0;
    for (let i = 0; i < deckId.length; i++) {
        hash = (hash * 31 + deckId.charCodeAt(i)) & 0xffffffff;
    }
    return (Math.abs(hash) % 700) + 65;
};

export const DeckCard = ({
    deck,
    index,
    onSelectStudy,
    onSelectQuiz,
    onSelectCards,
    onEditDeck,
    onDeleteDeck,
    isCommunity = false,
    currentUser = null,
}) => {
    if (!deck) return null;

    const deckId = deck?.id || deck?.Id;
    const deckTitle = deck?.title || deck?.Title || 'Bộ thẻ không tên';
    const deckTotalCards = deck?.totalCards ?? deck?.TotalCards ?? 0;
    const deckMasteredCards = deck?.masteredCards ?? deck?.MasteredCards ?? 0;
    const deckFolder = deck?.folder || deck?.Folder || 'Chung';
    const tagSource = deck?.tag || deck?.Tag || '';
    const tags = tagSource ? tagSource.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const masteryPercent = deckTotalCards > 0
        ? Math.round((deckMasteredCards / deckTotalCards) * 100)
        : 0;

    const initialLikes = getInitialLikes(deckId);
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);

    // Kiểm tra xem bộ thẻ có phải là thẻ lưu từ Community không
    const isSaved = Boolean(deck?.isSaved);

    // Kiểm tra xem người dùng hiện tại có phải là người tạo / sở hữu bộ thẻ này không
    const deckUserId = deck?.userId || deck?.UserId;
    const currentUserId = currentUser?.id || currentUser?.Id;
    const isOwner = Boolean(
        currentUserId &&
        deckUserId &&
        String(currentUserId).toLowerCase() === String(deckUserId).toLowerCase()
    );

    // Tên thật của người tạo từ Database (hoặc từ tài khoản hiện tại nếu là chủ sở hữu)
    const rawAuthorName = deck?.authorName || deck?.AuthorName || (deckUserId ? 'Thành viên QuizCard' : 'QuizCard Team');
    const authorDisplayName = isOwner
        ? `${currentUser?.fullName || currentUser?.userName || rawAuthorName} (Tác giả)`
        : rawAuthorName;

    // Avatar thật từ Database
    const authorAvatar = isOwner
        ? (currentUser?.avatarUrl || currentUser?.AvatarUrl || deck?.authorAvatar || deck?.AuthorAvatar || '')
        : (deck?.authorAvatar || deck?.AuthorAvatar || '');
    const authorInitial = authorDisplayName.replace(/[^a-zA-Z0-9À-ỹ]/g, '').charAt(0).toUpperCase() || 'Q';
    const handleToggleLike = (e) => {
        e.stopPropagation();
        if (isLiked) {
            setLikes((prev) => prev - 1);
            setIsLiked(false);
        }
        else {
            setLikes((prev) => prev + 1);
            setIsLiked(true);
            recordRecentDeck({ deck, actionType: 'LIKE', currentUser });
        }
    };
    // Determine which visual theme template to render
    const themeIndex = (index || 0) % 4;
    return (<div className="qc-card" onClick={() => onSelectStudy(deck)}>
      {/* Top Preview Banner */}
      <div className={`qc-card-preview ${themeIndex === 0 ? 'qc-theme-dark-gauge' :
            themeIndex === 1 ? 'qc-theme-mindmap' :
                themeIndex === 2 ? 'qc-theme-app-icons' : 'qc-theme-aurora'}`}>
        {/* Theme 0: Split Dark/Light Gauge (Nastaran Jamali style) */}
        {themeIndex === 0 && (<div className="qc-gauge-split">
            <div className="qc-gauge-dark">
              <div className="dc-gauge-dark-title">
                {deckTitle.length > 20 ? deckTitle.slice(0, 20) + '...' : deckTitle}
              </div>
              <div className="qc-gauge-number dc-gauge-number-dark">
                {deckTotalCards || 58}
              </div>
              <div className="qc-gauge-glow"/>
            </div>
            <div className="qc-gauge-light">
              <div className="dc-gauge-light-title">
                📁 {deckFolder}
              </div>
              <div className="qc-gauge-number dc-gauge-number-light">
                {deckTotalCards || 58}
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
              <span>{deckTitle.length > 18 ? deckTitle.slice(0, 18) + '...' : deckTitle}</span>
            </div>
            <div className="dc-mindmap-subtitle">
              {deckTotalCards} Flashcards • 📁 {deckFolder}
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
              {deckTitle}
            </div>
          </div>)}

        {/* Theme 3: Aurora Gradient & Stats */}
        {themeIndex === 3 && (<div className="dc-aurora-content">
            <div className="dc-aurora-header">
              <span className="dc-aurora-badge">
                📁 {deckFolder}
              </span>
              <span className="dc-aurora-count">
                {deckTotalCards} thẻ
              </span>
            </div>

            <div>
              <div className="dc-aurora-title">
                {deckTitle}
              </div>
              <div className="dc-aurora-desc">
                {deck?.description || deck?.Description || 'Phương pháp lặp lại ngắt quãng SM-2'}
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

          <button className="qc-overlay-btn qc-overlay-btn-secondary" onClick={() => onSelectQuiz(deck)} disabled={deckTotalCards < 2} title={deckTotalCards < 2 ? 'Cần tối thiểu 2 thẻ' : 'Thi trắc nghiệm'}>
            <HelpCircle size={13}/>
            <span>Thi trắc nghiệm</span>
          </button>

          {/* Quản lý thẻ: Ở Community hoặc đối với thẻ đã lưu thì loại bỏ; ở My Resources đối với thẻ sở hữu thì hiển thị */}
          {!isCommunity && !isSaved && onSelectCards && (
            <button className="qc-overlay-btn qc-overlay-btn-secondary" onClick={() => onSelectCards(deck)}>
              <BookOpen size={13}/>
              <span>Quản lý thẻ</span>
            </button>
          )}

          {/* Nhóm nút Chỉnh sửa / Xóa / Bỏ lưu: */}
          {/* Đối với thẻ lưu từ Community: TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA, chỉ có nút Bỏ lưu */}
          {/* Ở Community: Loại bỏ Quản lý thẻ và Sửa; CHỈ người sở hữu (isOwner) mới có quyền XÓA */}
          {/* Ở MyResources đối với thẻ sở hữu: Người sở hữu có cả nút Sửa và Xóa */}
          {isSaved ? (
            <div className="dc-overlay-btn-group">
              {onDeleteDeck && (
                <button
                  onClick={(e) => onDeleteDeck(deck, e)}
                  className="dc-btn-delete dc-btn-unsave"
                  title="Bỏ lưu khỏi My Resources"
                >
                  <BookmarkX size={11} /> Bỏ lưu
                </button>
              )}
            </div>
          ) : (
            ((!isCommunity && onEditDeck) || isOwner) && (
              <div className="dc-overlay-btn-group">
                {!isCommunity && onEditDeck && (
                  <button onClick={(e) => onEditDeck(deck, e)} className="dc-btn-edit" title="Chỉnh sửa bộ thẻ">
                    <Edit2 size={11}/> Sửa
                  </button>
                )}
                {isOwner && onDeleteDeck && (
                  <button onClick={(e) => onDeleteDeck(deck, e)} className="dc-btn-delete" title="Xóa bộ thẻ của bạn">
                    <Trash2 size={11}/> Xóa
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Thẻ Tag phân loại deck & Huy hiệu trạng thái Công khai / Riêng tư & Huy hiệu Đã lưu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', padding: '6px 14px 2px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {tags.slice(0, 3).map((t) => (
            <span key={t} style={{ fontSize: '10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 6px', fontWeight: 500 }}>
              #{t}
            </span>
          ))}
          {tags.length > 3 && (
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>+{tags.length - 3}</span>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {isSaved && (
            <span
              title="Bộ thẻ lưu từ Cộng đồng (Chỉ xem và học, không thể sửa)"
              style={{
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                background: '#eff6ff',
                color: '#0284c7',
                border: '1px solid #bfdbfe',
              }}
            >
              <Bookmark size={10} fill="#0284c7" />
              Đã lưu
            </span>
          )}
          <span
            title={deck.isPublic !== false ? 'Công khai trên Community' : 'Riêng tư (chỉ người tạo xem được)'}
            style={{
              fontSize: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 600,
              background: deck.isPublic !== false ? '#eff6ff' : '#f1f5f9',
              color: deck.isPublic !== false ? '#2563eb' : '#64748b',
              border: deck.isPublic !== false ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            }}
          >
            {deck.isPublic !== false ? <Globe size={10} /> : <Lock size={10} />}
            {deck.isPublic !== false ? 'Công khai' : 'Riêng tư'}
          </span>
        </div>
      </div>

      {/* Card Footer (Author & Like count) */}
      <div className="qc-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="qc-author-group">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorDisplayName} className="qc-author-avatar"/>
          ) : (
            <div className="qc-author-avatar">
              <span>{authorInitial}</span>
            </div>
          )}
          <span className="qc-author-name" title={authorDisplayName}>
            {isOwner ? `⭐ ${authorDisplayName}` : authorDisplayName}
          </span>
        </div>

        <button className={`qc-like-btn ${isLiked ? 'liked' : ''}`} onClick={handleToggleLike} title="Yêu thích bộ thẻ này">
          <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#71717a'}/>
          <span>{likes}</span>
        </button>
      </div>
    </div>);
};
