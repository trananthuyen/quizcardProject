import React from 'react';
import { Trash2 } from 'lucide-react';
import './TrashView.css';

interface TrashViewProps {
  onGoHome: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onGoHome }) => {
  return (
    <div className="tv-container">
      <div className="tv-empty-box">
        <div className="tv-icon-circle">
          <Trash2 size={36} />
        </div>
        <h2 className="tv-title">Thùng rác đang trống</h2>
        <p className="tv-desc">
          Các bộ thẻ flashcard hoặc học liệu đã xóa sẽ tạm thời lưu ở đây. Hiện tại không có mục nào trong thùng rác.
        </p>
        <button
          type="button"
          className="tv-btn-home"
          onClick={onGoHome}
        >
          Quay lại Trang Chủ
        </button>
      </div>
    </div>
  );
};

