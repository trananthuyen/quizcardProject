import React, { useState } from 'react';
import { 
  Bookmark, Search, Plus
} from 'lucide-react';
import type { Category } from '../types';
import './FilterPills.css';

interface PillsProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  categories?: Category[];
  onOpenCreateCategory: () => void;
  allCategoryNames: string[];
  filterCounts: {
    total: number;
    studied: number;
    notStarted: number;
    categoryCounts: Record<string, number>;
  };
}

export const FilterPills: React.FC<PillsProps> = ({
  selectedFilter,
  onSelectFilter,
  onOpenCreateCategory,
  allCategoryNames,
  filterCounts,
}) => {
  const [activeFigmaPill, setActiveFigmaPill] = useState<string>('riffs');

  const handlePillClick = (key: string, filterVal?: string) => {
    setActiveFigmaPill(key);
    if (filterVal) {
      onSelectFilter(filterVal);
    }
  };

  return (
    <div className="fp-container">
      {/* Figma Aesthetic Category Pills Bar (Matching the screenshot) */}
      <div className="qc-pills-bar">
        <button 
          className={`qc-pill-btn ${activeFigmaPill === 'saved' ? 'active' : ''}`}
          onClick={() => handlePillClick('saved', 'STUDIED')}
        >
          <Bookmark size={14} />
          <span>Saved</span>
          <span className="qc-badge-new">New</span>
        </button>

        <div className="qc-topbar-search">
          <Search size={14} className="qc-topbar-search-icon" />
          <input 
            type="text" 
            placeholder="Search" 
          />
        </div>
      </div>

      {/* Sub-bar: QuizCard Database Topics & Categories */}
      <div className="fp-sub-bar">
        <span className="fp-topic-label">
          Chủ đề:
        </span>

        {/* Tab Tất cả */}
        <button
          onClick={() => onSelectFilter('ALL')}
          className={`fp-tab-btn ${selectedFilter === 'ALL' ? 'active-all' : ''}`}
        >
          <span>Tất cả</span>
          <span className={`fp-tab-count ${selectedFilter === 'ALL' ? 'active' : ''}`}>
            {filterCounts.total}
          </span>
        </button>

        {/* Tab Đã học */}
        <button
          onClick={() => onSelectFilter('STUDIED')}
          className={`fp-tab-btn ${selectedFilter === 'STUDIED' ? 'active-studied' : ''}`}
        >
          <span>Đã học</span>
          <span className={`fp-tab-count ${selectedFilter === 'STUDIED' ? 'active' : ''}`}>
            {filterCounts.studied}
          </span>
        </button>

        {/* Tab Chưa học */}
        <button
          onClick={() => onSelectFilter('NOT_STARTED')}
          className={`fp-tab-btn ${selectedFilter === 'NOT_STARTED' ? 'active-notstarted' : ''}`}
        >
          <span>Chưa học</span>
          <span className={`fp-tab-count ${selectedFilter === 'NOT_STARTED' ? 'active' : ''}`}>
            {filterCounts.notStarted}
          </span>
        </button>

        {/* Danh sách từng phân loại cụ thể */}
        {allCategoryNames.map((catName) => {
          const count = filterCounts.categoryCounts[catName] || 0;
          if (count === 0 && catName === 'Chung') return null;
          const isSelected = selectedFilter.toLowerCase() === catName.toLowerCase();
          return (
            <button
              key={catName}
              onClick={() => onSelectFilter(catName)}
              className={`fp-tab-btn ${isSelected ? 'active-custom' : ''}`}
            >
              <span>{catName}</span>
              <span className={`fp-tab-count ${isSelected ? 'active' : ''}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Nút Tạo phân loại mới */}
        <button
          onClick={onOpenCreateCategory}
          className="fp-btn-add-cat"
        >
          <Plus size={12} />
          <span>Thêm phân loại</span>
        </button>
      </div>
    </div>
  );
};
