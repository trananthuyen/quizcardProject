import React, { useState } from 'react';
import { Bookmark, Search, Plus, Folder as FolderIcon, Tag } from 'lucide-react';
import './FilterPills.css';

export const FilterPills = ({
    selectedFilter,
    onSelectFilter,
    searchQuery = '',
    onSearchChange,
    allTags = [],
    tagCounts = {},
    allFolderNames = [],
    filterCounts = {},
    mode = 'tag', // 'tag' (Community) hoặc 'folder' (My Resources)
    onOpenCreateFolder,
}) => {
    const folderNames = allFolderNames;
    const handleOpenCreate = onOpenCreateFolder;
    const [activeFigmaPill, setActiveFigmaPill] = useState('riffs');

    const handlePillClick = (key, filterVal) => {
        setActiveFigmaPill(key);
        if (filterVal) {
            onSelectFilter(filterVal);
        }
    };

    return (<div className="fp-container">
      {/* Figma Aesthetic Category Pills Bar */}
      <div className="qc-pills-bar">
        <button className={`qc-pill-btn ${activeFigmaPill === 'saved' ? 'active' : ''}`} onClick={() => handlePillClick('saved', 'STUDIED')}>
          <Bookmark size={14}/>
          <span>Saved</span>
          <span className="qc-badge-new">New</span>
        </button>

        <div className="qc-topbar-search">
          <Search size={14} className="qc-topbar-search-icon"/>
          <input
            type="text"
            placeholder={mode === 'tag' ? "Tìm theo từ khóa, tag..." : "Tìm kiếm bộ thẻ..."}
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Sub-bar: QuizCard Tags (Community) hoặc Folders (My Resources) */}
      <div className="fp-sub-bar">
        {mode === 'tag' ? (
          <span className="fp-topic-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={13} color="#10b981" />
            <span>Chủ đề:</span>
          </span>
        ) : (
          <span className="fp-topic-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FolderIcon size={13} color="#3b82f6" />
            <span>Thư mục:</span>
          </span>
        )}

        {/* Tab Tất cả */}
        <button onClick={() => onSelectFilter('ALL')} className={`fp-tab-btn ${selectedFilter === 'ALL' ? 'active-all' : ''}`}>
          <span>Tất cả</span>
          <span className={`fp-tab-count ${selectedFilter === 'ALL' ? 'active' : ''}`}>
            {filterCounts.total ?? 0}
          </span>
        </button>

        {/* Tab Đã học */}
        <button onClick={() => onSelectFilter('STUDIED')} className={`fp-tab-btn ${selectedFilter === 'STUDIED' ? 'active-studied' : ''}`}>
          <span>Đã học</span>
          <span className={`fp-tab-count ${selectedFilter === 'STUDIED' ? 'active' : ''}`}>
            {filterCounts.studied ?? 0}
          </span>
        </button>

        {/* Tab Chưa học */}
        <button onClick={() => onSelectFilter('NOT_STARTED')} className={`fp-tab-btn ${selectedFilter === 'NOT_STARTED' ? 'active-notstarted' : ''}`}>
          <span>Chưa học</span>
          <span className={`fp-tab-count ${selectedFilter === 'NOT_STARTED' ? 'active' : ''}`}>
            {filterCounts.notStarted ?? 0}
          </span>
        </button>

        {/* 1. KHI Ở CHẾ ĐỘ TAG (COMMUNITY): Lọc theo các Tag chủ đề */}
        {mode === 'tag' && (allTags || []).map((tagName) => {
            const count = (tagCounts && tagCounts[tagName.toLowerCase()]) || 0;
            const isSelected = (selectedFilter || '').toLowerCase() === tagName.toLowerCase();
            return (
              <button
                key={tagName}
                onClick={() => onSelectFilter(tagName)}
                className={`fp-tab-btn fp-tag-pill ${isSelected ? 'active-tag' : ''}`}
                title={`Lọc theo chủ đề #${tagName}`}
              >
                <span style={{ color: isSelected ? '#ffffff' : '#15803d', fontWeight: 600 }}>
                  #{tagName}
                </span>
                <span className={`fp-tab-count ${isSelected ? 'active' : ''}`}>
                  {count}
                </span>
              </button>
            );
        })}

        {/* 2. KHI Ở CHẾ ĐỘ FOLDER (MY RESOURCES): Lọc theo các Thư mục */}
        {mode === 'folder' && (folderNames || []).map((fName) => {
            const count = (filterCounts?.folderCounts && filterCounts.folderCounts[fName])
                || (filterCounts?.categoryCounts && filterCounts.categoryCounts[fName])
                || 0;
            if (count === 0 && fName === 'Chung')
                return null;
            const isSelected = (selectedFilter || '').toLowerCase() === fName.toLowerCase();
            return (
              <button
                key={fName}
                onClick={() => onSelectFilter(fName)}
                className={`fp-tab-btn ${isSelected ? 'active-custom' : ''}`}
              >
                <span>{fName}</span>
                <span className={`fp-tab-count ${isSelected ? 'active' : ''}`}>
                  {count}
                </span>
              </button>
            );
        })}

        {/* Nút Tạo thư mục mới (chỉ ở chế độ Folder) */}
        {mode === 'folder' && handleOpenCreate && (
          <button onClick={handleOpenCreate} className="fp-btn-add-cat" title="Tạo thư mục mới để phân nhóm bộ thẻ">
            <Plus size={12}/>
            <span>Thêm thư mục</span>
          </button>
        )}
      </div>
    </div>);
};
