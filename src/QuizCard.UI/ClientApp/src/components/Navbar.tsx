/**
 * Component Navbar: Thanh tiêu đề điều hướng cố định trên cùng ứng dụng.
 * Chứa logo thương hiệu, tên ứng dụng và nút bấm quay về trang chủ.
 */

import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

interface NavbarProps {
  // Callback hàm gọi khi người dùng bấm vào Logo để quay về trang chủ
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome }) => {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Khối Logo và Tên ứng dụng (Clickable để về Home) */}
        <div 
          onClick={onGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          {/* Icon logo gradient */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}>
            <Layers size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                QuizCard
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '2px 6px',
                borderRadius: '6px',
              }}>
                OpenQuiz
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Nền tảng học Flashcard & Lặp lại ngắt quãng
            </p>
          </div>
        </div>

        {/* Khối huy hiệu thông tin thuật toán */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            <Sparkles size={15} color="var(--primary)" />
            <span>Spaced Repetition SM-2</span>
          </div>
        </div>
      </div>
    </header>
  );
};
