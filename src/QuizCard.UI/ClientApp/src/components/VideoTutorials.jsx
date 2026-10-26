import React, { useState } from 'react';
import { MonitorPlay, Play, X } from 'lucide-react';
import './VideoTutorials.css';
const VIDEOS = [
    {
        id: 'sm2-intro',
        title: 'Lộ trình ghi nhớ 3000 từ vựng cốt lõi với Spaced Repetition (SM-2)',
        description: 'Tìm hiểu cách não bộ lưu trữ ký ức và cơ chế lặp lại ngắt quãng SuperMemo SM-2 để tối ưu hóa thời gian ôn tập.',
        duration: '12:45',
        tag: 'Spaced Repetition',
        author: 'Dr. Piotr Woźniak System',
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'active-recall',
        title: 'Active Recall & Chế độ Luyện Thi Trắc Nghiệm QuizArena',
        description: 'Tại sao việc chủ động truy xuất thông tin (Active Recall) lại tăng hiệu quả ghi nhớ gấp 3 lần so với việc đọc sách thụ động thông thường.',
        duration: '08:30',
        tag: 'Active Recall',
        author: 'QuizCard Academy',
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'bulk-import',
        title: 'Tạo Flashcard siêu tốc bằng AI & Tính năng Nhập hàng loạt',
        description: 'Hướng dẫn chuẩn bị dữ liệu dạng bảng hoặc danh sách từ vựng và nhập hàng loạt vào bộ thẻ trong tích tắc.',
        duration: '05:15',
        tag: 'Productivity',
        author: 'tran an thuyen',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'flashcard-tips',
        title: 'Mẹo thiết kế bộ thẻ: Nguyên tắc một thông tin (Minimum Information Principle)',
        description: 'Bí quyết đặt câu hỏi ngắn gọn, định nghĩa rõ ràng, thêm ví dụ ngữ cảnh giúp việc học lật thẻ 3D trở nên nhẹ nhàng và bền vững.',
        duration: '10:20',
        tag: 'Tips & Tricks',
        author: 'SuperMemo Research',
        thumbnail: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
];
export const VideoTutorials = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    return (<div className="vt-container">
      <div className="vt-header">
        <h1 className="vt-title">
          <MonitorPlay size={26} color="#0d99ff"/>
          Video Hướng Dẫn & Phương Pháp Học
        </h1>
        <p className="vt-subtitle">
          Tổng hợp các video hướng dẫn kỹ thuật ghi nhớ đỉnh cao, phương pháp Active Recall và Spaced Repetition SM-2
        </p>
      </div>

      <div className="vt-grid">
        {VIDEOS.map((video) => (<div key={video.id} className="vt-card" onClick={() => setSelectedVideo(video)} style={{ cursor: 'pointer' }}>
            <div className="vt-thumbnail-box">
              <img src={video.thumbnail} alt={video.title} className="vt-thumbnail-img"/>
              <div className="vt-play-overlay">
                <div className="vt-play-btn">
                  <Play size={22} fill="currentColor"/>
                </div>
              </div>
              <span className="vt-duration">{video.duration}</span>
            </div>

            <div className="vt-card-body">
              <span className="vt-card-tag">{video.tag}</span>
              <h3 className="vt-card-title">{video.title}</h3>
              <p className="vt-card-desc">{video.description}</p>

              <div className="vt-card-footer">
                <span className="vt-author">{video.author}</span>
                <span>HD Video</span>
              </div>
            </div>
          </div>))}
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (<div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="vt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="vt-modal-iframe-box">
              <iframe src={`${selectedVideo.videoUrl}?autoplay=1`} title={selectedVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
            </div>
            <div className="vt-modal-info">
              <div>
                <div className="vt-modal-title">{selectedVideo.title}</div>
                <div className="vt-modal-author">
                  Tác giả: {selectedVideo.author} • Thời lượng: {selectedVideo.duration}
                </div>
              </div>
              <button type="button" className="vt-modal-close-btn" onClick={() => setSelectedVideo(null)} title="Đóng video">
                <X size={18}/>
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
