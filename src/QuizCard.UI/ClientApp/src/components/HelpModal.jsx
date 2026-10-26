import React from 'react';
import { X, HelpCircle, Keyboard, Sparkles } from 'lucide-react';
import './HelpModal.css';
export const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen)
        return null;
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal-content hm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="hm-header">
          <div className="hm-header-left">
            <div className="hm-icon-box">
              <HelpCircle size={18}/>
            </div>
            <div>
              <h3 className="hm-title">QuizCard Community Help</h3>
              <span className="hm-subtitle">Hướng dẫn và phím tắt thao tác nhanh</span>
            </div>
          </div>
          <button onClick={onClose} className="hm-close-btn" title="Đóng">
            <X size={18}/>
          </button>
        </div>

        <div className="hm-body">
          <div className="hm-card">
            <div className="hm-card-title">
              <Keyboard size={15} color="#0d99ff"/> Phím tắt trong Phòng học lật thẻ:
            </div>
            <ul className="hm-list">
              <li><strong>Phím Space</strong>: Lật thẻ xem định nghĩa / câu trả lời</li>
              <li><strong>Phím 1</strong>: Đánh giá thẻ Khó (Học lại ngay)</li>
              <li><strong>Phím 2</strong>: Đánh giá thẻ Tạm được (Ôn lại sau)</li>
              <li><strong>Phím 3</strong>: Đánh giá thẻ Dễ (Đã thuộc lòng)</li>
              <li><strong>Phím A</strong>: Nghe phát âm AI âm thanh chuẩn</li>
            </ul>
          </div>

          <div className="hm-card">
            <div className="hm-card-title">
              <Sparkles size={15} color="#8b5cf6"/> Thuật toán Lặp lại ngắt quãng SM-2:
            </div>
            <p className="hm-desc">
              Hệ thống tự động tính toán thời điểm vàng bạn sắp quên từ vựng để nhắc nhở ôn luyện, giúp ghi nhớ lâu bền vào trí nhớ dài hạn mà không cần học vẹt.
            </p>
          </div>
        </div>

        <div className="hm-footer">
          <button onClick={onClose} className="hm-confirm-btn">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>);
};
