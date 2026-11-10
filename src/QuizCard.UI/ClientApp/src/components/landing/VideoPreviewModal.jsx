import React from 'react';
import { X, Play, ExternalLink } from 'lucide-react';
import './VideoPreviewModal.css';

export const VideoPreviewModal = ({ video, onClose, onOpenStudio }) => {
  if (!video) return null;

  return (
    <div className="vpm-overlay" onClick={onClose}>
      <div
        className="vpm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="vpm-header">
          <div>
            <span className="vpm-tag">Interactive Video Lesson</span>
            <h3 id="video-modal-title" className="vpm-title">
              {video.title}
            </h3>
          </div>
          <button
            type="button"
            className="vpm-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="vpm-player-box">
          {video.videoUrl ? (
            <video
              src={video.videoUrl}
              poster={video.thumbnail}
              controls
              autoPlay
              className="vpm-video-element"
            />
          ) : (
            <div className="vpm-simulated-player">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="vpm-poster-img"
              />
              <div className="vpm-player-overlay">
                <div className="vpm-center-play">
                  <Play size={40} fill="#ffffff" color="#ffffff" />
                </div>
                <div className="vpm-simulated-subtitles">
                  "Kỹ thuật Spaced Repetition SM-2 giúp bạn tối ưu hóa thời gian ôn tập flashcard..."
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description & Action Bar */}
        <div className="vpm-footer">
          <div className="vpm-info">
            <span className="vpm-duration">Thời lượng: {video.duration || '04:15'}</span>
            <span className="vpm-author">Tác giả: {video.author || 'QuizCard Community'}</span>
            <p className="vpm-desc">
              {video.description ||
                'Bài giảng này minh họa kỹ thuật Spaced Repetition và cách tự động tạo flashcard từ tài liệu.'}
            </p>
          </div>

          <div className="vpm-actions">
            {onOpenStudio && (
              <button
                type="button"
                className="vpm-studio-btn"
                onClick={() => {
                  onClose();
                  onOpenStudio(video);
                }}
              >
                <span>Học Tương Tác Trong Studio</span>
                <ExternalLink size={15} />
              </button>
            )}
            <button type="button" className="vpm-close-plain" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
