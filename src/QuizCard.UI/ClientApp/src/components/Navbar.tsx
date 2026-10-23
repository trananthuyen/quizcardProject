/**
 * Component Navbar: Thanh tiêu đề điều hướng cố định trên cùng ứng dụng.
 * Chứa logo thương hiệu, tên ứng dụng và nút bấm quay về trang chủ.
 */

import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  // Callback hàm gọi khi người dùng bấm vào Logo để quay về trang chủ
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome }) => {
  return (
    <header className="nb-header">
      <div className="nb-container">
        {/* Khối Logo và Tên ứng dụng (Clickable để về Home) */}
        <div onClick={onGoHome} className="nb-logo-group">
          {/* Icon logo gradient */}
          <div className="nb-logo-icon">
            <Layers size={22} />
          </div>

          <div>
            <div className="nb-title-row">
              <span className="nb-title-text">
                QuizCard
              </span>
              <span className="nb-tag-badge">
                OpenQuiz
              </span>
            </div>
            <p className="nb-subtitle">
              Nền tảng học Flashcard & Lặp lại ngắt quãng
            </p>
          </div>
        </div>

        {/* Khối huy hiệu thông tin thuật toán */}
        <div className="nb-right-group">
          <div className="nb-algorithm-pill">
            <Sparkles size={15} color="var(--primary)" />
            <span>Spaced Repetition SM-2</span>
          </div>
        </div>
      </div>
    </header>
  );
};
