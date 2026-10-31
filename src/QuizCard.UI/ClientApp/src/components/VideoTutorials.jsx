import React, { useState, useEffect, useMemo } from 'react';
import { MonitorPlay, Play, Sparkles, Shuffle, Tag } from 'lucide-react';
import { CaptionStudio } from './CaptionStudio';
import { api } from '../api';
import './VideoTutorials.css';

/**
 * Thuật toán xáo trộn mảng ngẫu nhiên Fisher-Yates (Knuth Shuffle)
 * Độ phức tạp O(n), đảm bảo xác suất xuất hiện của mọi hoán vị đồng đều
 */
const shuffleArray = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const VideoTutorials = ({
    selectedVideo: externalSelectedVideo,
    onSelectVideo: externalOnSelectVideo,
    onTitleChange: externalOnTitleChange,
}) => {
    const [internalSelectedVideo, setInternalSelectedVideo] = useState(null);
    const selectedVideo = externalSelectedVideo !== undefined ? externalSelectedVideo : internalSelectedVideo;
    const setSelectedVideo = externalOnSelectVideo || setInternalSelectedVideo;
    const [cloudVideos, setCloudVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lọc danh sách theo tag chủ đề (không thêm chức năng tìm kiếm)
    const [selectedTag, setSelectedTag] = useState('ALL');

    // Seed điều khiển xáo trộn ngẫu nhiên
    const [shuffleSeed, setShuffleSeed] = useState(0);

    const handleReshuffle = () => {
        setShuffleSeed((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        api.getPublicVideos()
            .then((list) => {
                if (!isMounted) return;
                if (Array.isArray(list) && list.length > 0) {
                    const mapped = list.map((v) => {
                        return {
                            ...v,
                            id: v.publicId || v.id,
                            title: v.title,
                            description: v.description || 'Bài giảng video tương tác được lưu trữ trên Cloudinary.',
                            duration: v.duration > 0 ? `${Math.floor(v.duration / 60)}:${Math.floor(v.duration % 60).toString().padStart(2, '0')}` : '05:00',
                            thumbnail: v.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
                            videoUrl: v.secureUrl || v.url,
                            secureUrl: v.secureUrl,
                            vttEnText: v.vttEnText,
                            vttEnUrl: v.vttEnUrl,
                            vttViText: v.vttViText,
                            vttViUrl: v.vttViUrl,
                        };
                    });
                    setCloudVideos(mapped);
                } else {
                    setCloudVideos([]);
                }
            })
            .catch((err) => {
                console.warn('Lỗi tải video bài giảng:', err);
                if (isMounted) setCloudVideos([]);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    // Lọc danh sách video theo tag chủ đề (lọc danh sách, không dùng tìm kiếm)
    const filteredVideos = useMemo(() => {
        if (selectedTag === 'ALL') {
            return cloudVideos;
        }
        return cloudVideos.filter((video) => {
            const tags = video.tags || [video.tag];
            return tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        });
    }, [cloudVideos, selectedTag]);

    // Tự động sắp xếp ngẫu nhiên danh sách video bằng thuật toán Fisher-Yates
    const displayedVideos = useMemo(() => {
        return shuffleArray(filteredVideos);
    }, [filteredVideos, shuffleSeed]);

    // Nếu người dùng chọn 1 bài học, hiển thị trang CaptionStudio tương tác đầy đủ
    if (selectedVideo) {
        return (
            <CaptionStudio
                lesson={selectedVideo}
                onBack={() => setSelectedVideo(null)}
                parentTitle="Videos"
                hideHeader={true}
                onTitleChange={externalOnTitleChange}
            />
        );
    }

    return (
        <div className="vt-container">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{
                        display: 'inline-block',
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#0d99ff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: '12px'
                    }} />
                    <p style={{ fontWeight: 600 }}>Đang tải danh sách video bài giảng...</p>
                </div>
            ) : displayedVideos.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    maxWidth: '560px',
                    margin: '20px auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <MonitorPlay size={44} color="#94a3b8" style={{ margin: '0 auto 14px', opacity: 0.7 }} />
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                        {selectedTag !== 'ALL' ? `Không có video nào thuộc chủ đề #${selectedTag}` : 'Chưa có video bài giảng nào'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '13.5px', lineHeight: 1.6, marginBottom: selectedTag !== 'ALL' ? '16px' : 0 }}>
                        {selectedTag !== 'ALL'
                            ? 'Vui lòng chọn chủ đề khác hoặc bấm nút bên dưới để xem toàn bộ danh sách.'
                            : 'Hiện chưa có video nào trong cơ sở dữ liệu. Vui lòng đăng nhập trang Quản trị viên (Admin) để tải lên video và phụ đề bài học mới.'}
                    </p>
                    {selectedTag !== 'ALL' && (
                        <button
                            type="button"
                            className="vt-btn-reset"
                            onClick={() => setSelectedTag('ALL')}
                        >
                            Xem tất cả video
                        </button>
                    )}
                </div>
            ) : (
                <div className="vt-grid">
                    {displayedVideos.map((video) => (
                        <div key={video.id} className="vt-card" onClick={() => setSelectedVideo(video)} style={{ cursor: 'pointer' }}>
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
                                <h3 className="vt-card-title">{video.title}</h3>

                                <div className="vt-card-footer">
                                    <span className="vt-author">{video.author}</span>
                                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>Interactive Studio ▶</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
