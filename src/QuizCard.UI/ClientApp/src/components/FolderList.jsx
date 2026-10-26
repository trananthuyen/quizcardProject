import React, { useMemo } from 'react';
import { LayoutGrid, Plus, ArrowRight } from 'lucide-react';
import './FolderList.css';
export const FolderList = ({ categories, decks, onOpenCreateCategory, onSelectCategory, }) => {
    const categoryCounts = useMemo(() => {
        const counts = {};
        decks.forEach((d) => {
            const cat = d.category?.trim() || 'Chung';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [decks]);
    return (<div className="fl-container">
      <div className="fl-header">
        <div>
          <h1 className="fl-title">
            <LayoutGrid size={26} color="#0d99ff"/>
            Tất Cả Thư Mục & Phân Loại
          </h1>
          <p className="fl-subtitle">
            Tổ chức các bộ thẻ flashcard theo chủ đề học tập, nhóm dự án và mục tiêu ôn thi
          </p>
        </div>
        <button type="button" className="fl-btn-create" onClick={onOpenCreateCategory}>
          <Plus size={16}/>
          Tạo Thư Mục Mới
        </button>
      </div>

      <div className="fl-grid">
        {categories.map((cat) => {
            const count = categoryCounts[cat.name] || 0;
            return (<div key={cat.id} className="fl-card" onClick={() => onSelectCategory(cat.name)} title={`Xem các bộ thẻ thuộc "${cat.name}"`}>
              <div>
                <div className="fl-card-top">
                  <div className="fl-card-icon-box" style={{ backgroundColor: `${cat.color || '#3b82f6'}15` }}>
                    <span>{cat.icon || '📁'}</span>
                  </div>
                  <div>
                    <h3 className="fl-card-name">{cat.name}</h3>
                    <div className="fl-card-count">{count} bộ thẻ flashcard</div>
                  </div>
                </div>
                <p className="fl-card-desc">
                  {cat.description || 'Chủ đề ôn tập các thẻ ghi nhớ và thuật ngữ quan trọng.'}
                </p>
              </div>

              <div className="fl-card-footer">
                <span>Xem bộ thẻ</span>
                <ArrowRight size={14}/>
              </div>
            </div>);
        })}
      </div>
    </div>);
};
