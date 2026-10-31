import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cloud,
  UploadCloud,
  Link,
  Trash2,
  Copy,
  Check,
  Play,
  ExternalLink,
  LogOut,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  FileVideo,
  RotateCw,
  Database,
  Subtitles,
  FileText,
  Code2,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Terminal
} from 'lucide-react';
import { api } from '../../api';
import { AdminUsersManagement } from './AdminUsersManagement';
import { AdminLogsManagement } from './AdminLogsManagement';
import './AdminDashboard.css';

export const AdminDashboard = ({ admin, onLogout, onBackToApp }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users' | 'videos' | 'logs'
  const [config, setConfig] = useState({ isConfigured: false, cloudName: '' });
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoDescInput, setVideoDescInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [targetFolder, setTargetFolder] = useState('quizcard_videos');

  // Quản lý Phụ đề WebVTT khi tải lên video mới
  const [vttEnFile, setVttEnFile] = useState(null);
  const [vttEnTextInput, setVttEnTextInput] = useState('');
  const [vttEnUrlInput, setVttEnUrlInput] = useState('');
  const [showEnTextarea, setShowEnTextarea] = useState(false);

  const [vttViFile, setVttViFile] = useState(null);
  const [vttViTextInput, setVttViTextInput] = useState('');
  const [vttViUrlInput, setVttViUrlInput] = useState('');
  const [showViTextarea, setShowViTextarea] = useState(false);

  const [showVttAccordion, setShowVttAccordion] = useState(true);

  // Modal quản lý & xem phụ đề cho video đã có
  const [activeSubModalVideo, setActiveSubModalVideo] = useState(null);
  const [modalVttEnFile, setModalVttEnFile] = useState(null);
  const [modalVttEnText, setModalVttEnText] = useState('');
  const [modalVttEnUrl, setModalVttEnUrl] = useState('');
  const [modalVttViFile, setModalVttViFile] = useState(null);
  const [modalVttViText, setModalVttViText] = useState('');
  const [modalVttViUrl, setModalVttViUrl] = useState('');
  const [isSavingModalSubs, setIsSavingModalSubs] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });

  // Modal xem chi tiết văn bản WebVTT lưu trong DB
  const [viewVttModal, setViewVttModal] = useState(null); // { title: '', lang: '', text: '' }

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  // Tải danh sách video từ cơ sở dữ liệu
  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const list = await api.getAdminVideos();
      if (Array.isArray(list)) {
        setUploadedVideos(list);
      }
    } catch (err) {
      console.error('Không thể tải danh sách video:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Khởi tạo: Tải cấu hình Cloudinary & Danh sách video từ Database
  useEffect(() => {
    api.getCloudinaryConfig().then((cfg) => {
      if (cfg) setConfig(cfg);
    }).catch(() => {});

    loadVideos();
  }, []);

  // Đọc nội dung file VTT vào text input khi người dùng chọn file
  const handleVttFileChange = (file, setFile, setText) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target?.result || '');
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Reset form upload
  const resetUploadForm = () => {
    setSelectedFile(null);
    setVideoTitleInput('');
    setVideoDescInput('');
    setVideoUrlInput('');
    setVttEnFile(null);
    setVttEnTextInput('');
    setVttEnUrlInput('');
    setVttViFile(null);
    setVttViTextInput('');
    setVttViUrlInput('');
  };

  // Xử lý upload file video từ máy
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Vui lòng chọn một file video để tải lên.');
      return;
    }

    const MAX_CLOUDINARY_BYTES = 104857600; // 100 MB giới hạn tối đa của tài khoản Cloudinary Free
    if (selectedFile.size > MAX_CLOUDINARY_BYTES) {
      const fileMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File video quá lớn (${fileMb} MB). Giới hạn tối đa của tài khoản Cloudinary Free là 100 MB (104,857,600 bytes). Vui lòng nén video (dùng HandBrake, CapCut, v.v.) hoặc chọn file dưới 100 MB trước khi tải lên.`);
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadResult(null);

    try {
      const title = videoTitleInput.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');
      const desc = videoDescInput.trim() || null;

      const res = await api.uploadVideoToCloudinary(
        selectedFile,
        targetFolder,
        title,
        desc,
        vttEnFile,
        vttViFile,
        vttEnUrlInput.trim() || null,
        vttViUrlInput.trim() || null,
        vttEnTextInput.trim() || null,
        vttViTextInput.trim() || null
      );

      if (res && res.success) {
        setUploadResult(res.cloudinary || res);

        if (res.video) {
          setUploadedVideos((prev) => [res.video, ...prev.filter((v) => v.publicId !== res.video.publicId)]);
        } else {
          await loadVideos();
        }

        resetUploadForm();
      } else {
        let errMsg = res?.errorMessage || 'Upload video lên Cloudinary thất bại.';
        if (errMsg.includes('File size too large') || errMsg.includes('104857600')) {
          errMsg = `Dung lượng video (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn 100 MB của tài khoản Cloudinary Free. Vui lòng nén video xuống dưới 100 MB.`;
        }
        setUploadError(errMsg);
      }
    } catch (err) {
      let msg = err.message || 'Lỗi kết nối khi tải video lên Cloudinary.';
      if (msg.includes('File size too large') || msg.includes('104857600')) {
        msg = `Dung lượng video (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn 100 MB của tài khoản Cloudinary Free. Vui lòng nén video xuống dưới 100 MB trước khi tải lên.`;
      }
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Xử lý upload video từ URL bên ngoài
  const handleUrlUploadSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) {
      setUploadError('Vui lòng nhập đường dẫn video hợp lệ.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadResult(null);

    try {
      const title = videoTitleInput.trim() || null;
      const desc = videoDescInput.trim() || null;

      const res = await api.uploadVideoUrlToCloudinary(
        videoUrlInput.trim(),
        targetFolder,
        title,
        desc,
        vttEnUrlInput.trim() || null,
        vttViUrlInput.trim() || null,
        vttEnTextInput.trim() || null,
        vttViTextInput.trim() || null
      );

      if (res && res.success) {
        setUploadResult(res.cloudinary || res);

        if (res.video) {
          setUploadedVideos((prev) => [res.video, ...prev.filter((v) => v.publicId !== res.video.publicId)]);
        } else {
          await loadVideos();
        }

        resetUploadForm();
      } else {
        setUploadError(res?.errorMessage || 'Không thể tải video từ URL.');
      }
    } catch (err) {
      setUploadError(err.message || 'Lỗi tải video từ URL.');
    } finally {
      setIsUploading(false);
    }
  };

  // Mở modal đính kèm / sửa phụ đề cho video đã có
  const handleOpenSubModal = (video) => {
    setActiveSubModalVideo(video);
    setModalVttEnFile(null);
    setModalVttEnText(video.vttEnText || '');
    setModalVttEnUrl(video.vttEnUrl || '');
    setModalVttViFile(null);
    setModalVttViText(video.vttViText || '');
    setModalVttViUrl(video.vttViUrl || '');
    setModalMsg({ type: '', text: '' });
  };

  // Lưu phụ đề từ Modal
  const handleSaveSubModal = async (e) => {
    e.preventDefault();
    if (!activeSubModalVideo) return;

    setIsSavingModalSubs(true);
    setModalMsg({ type: '', text: '' });

    try {
      const res = await api.attachVideoSubtitles(activeSubModalVideo.publicId, {
        vttEnFile: modalVttEnFile,
        vttViFile: modalVttViFile,
        vttEnText: modalVttEnText.trim() || null,
        vttViText: modalVttViText.trim() || null,
        vttEnUrl: modalVttEnUrl.trim() || null,
        vttViUrl: modalVttViUrl.trim() || null,
        folder: activeSubModalVideo.folder || 'quizcard_videos',
      });

      if (res && res.success && res.video) {
        setUploadedVideos((prev) =>
          prev.map((v) => (v.publicId === res.video.publicId ? res.video : v))
        );
        setActiveSubModalVideo(res.video);
        setModalMsg({ type: 'success', text: 'Đã cập nhật phụ đề WebVTT thành công vào cơ sở dữ liệu!' });
      } else {
        setModalMsg({ type: 'error', text: res?.errorMessage || 'Cập nhật phụ đề thất bại.' });
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.message || 'Lỗi khi lưu phụ đề.' });
    } finally {
      setIsSavingModalSubs(false);
    }
  };

  // Xử lý xóa video khỏi Cloudinary và Database
  const handleDeleteVideo = async (video) => {
    const publicId = typeof video === 'string' ? video : video?.publicId;
    const id = typeof video === 'object' ? video?.id : null;
    const title = typeof video === 'object' ? (video?.title || publicId) : publicId;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa video "${title}" khỏi Cloudinary và Cơ sở dữ liệu?`)) return;

    try {
      await api.deleteCloudinaryVideo(publicId, id);
      setUploadedVideos((prev) => prev.filter((v) => v.publicId !== publicId && (!id || v.id !== id)));
      if (previewVideo?.publicId === publicId || (id && previewVideo?.id === id)) setPreviewVideo(null);
      if (activeSubModalVideo?.publicId === publicId || (id && activeSubModalVideo?.id === id)) setActiveSubModalVideo(null);
      alert('Đã xóa video thành công khỏi Cloudinary và Cơ sở dữ liệu!');
    } catch (err) {
      alert(`Lỗi khi xóa video: ${err.message}`);
    }
  };

  // Sao chép liên kết video hoặc nội dung VTT
  const handleCopyLink = (url) => {
    navigator.clipboard?.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2500);
  };

  return (
    <div className="ad-wrapper">
      {/* 1. TOPBAR ADMIN */}
      <header className="ad-topbar">
        <div className="ad-topbar-inner">
          <div className="ad-brand">
            <div className="ad-brand-logo">
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <h1 className="ad-brand-title">
                QuizCard <span className="ad-badge-admin">Admin Area</span>
              </h1>
              <p className="ad-brand-subtitle">Hệ thống quản trị tài khoản, video Cloudinary &amp; nội dung QuizCard</p>
            </div>
          </div>

          <div className="ad-topbar-actions">
            <div className="ad-user-pill">
              <div className="ad-user-avatar">A</div>
              <span className="ad-user-name">{admin?.username || 'admin'}</span>
              <span className="ad-role-badge">Super Admin</span>
            </div>

            <button
              type="button"
              className="ad-btn-header"
              onClick={onBackToApp}
              title="Quay lại ứng dụng người dùng"
            >
              <ArrowLeft size={15} />
              <span>Về trang chủ</span>
            </button>

            <button
              type="button"
              className="ad-btn-header ad-btn-logout"
              onClick={onLogout}
              title="Đăng xuất khỏi phiên Quản trị viên"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. NỘI DUNG WORKSPACE */}
      <main className="ad-main">
        {/* THANH ĐIỀU HƯỚNG TAB QUẢN TRỊ VIÊN */}
        <div style={{ marginBottom: '20px' }}>
          <div className="ad-nav-tabs-bar">
            <button
              type="button"
              className={`ad-nav-tab ${activeAdminTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('users')}
            >
              <Users size={16} />
              <span>Quản Lý Người Dùng &amp; Decks</span>
            </button>

            <button
              type="button"
              className={`ad-nav-tab ${activeAdminTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('videos')}
            >
              <Video size={16} />
              <span>Quản Trị Video Cloudinary</span>
            </button>

            <button
              type="button"
              className={`ad-nav-tab ${activeAdminTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('logs')}
            >
              <Terminal size={16} />
              <span>Nhật Ký Yêu Cầu (Logs)</span>
            </button>
          </div>
        </div>

        {activeAdminTab === 'users' ? (
          <AdminUsersManagement />
        ) : activeAdminTab === 'logs' ? (
          <AdminLogsManagement />
        ) : (
          <>
            {/* Banner trạng thái kết nối Cloudinary & Database */}
        <div className="ad-banner">
          <div className="ad-banner-left">
            <div className="ad-cloud-icon">
              <Cloud size={24} color="#0d99ff" />
            </div>
            <div>
              <h2 className="ad-banner-title">
                Cloudinary Storage &amp; MySQL Database Connected
              </h2>
              <p className="ad-banner-desc">
                Video được lưu trên Cloudinary. Phụ đề tiếng Anh &amp; tiếng Việt được lưu trữ trực tiếp dưới dạng <strong>TEXT</strong> trong bảng <code>CloudinaryVideos</code> để hiển thị phụ đề tương tác tức thì.
              </p>
            </div>
          </div>
          <div className="ad-banner-right">
            <span className={`ad-status-pill ${config.isConfigured ? 'online' : 'offline'}`}>
              <span className="ad-status-dot" />
              {config.isConfigured ? `Cloud: ${config.cloudName || 'Active'}` : 'Chưa cấu hình'}
            </span>
          </div>
        </div>

        {/* Workspace: 2 Cột Upload & Thư viện video */}
        <div className="ad-grid">
          {/* CỘT TRÁI: FORM UPLOAD VIDEO & PHỤ ĐỀ */}
          <div className="ad-card">
            <div className="ad-card-header">
              <div className="ad-card-title-row">
                <Video size={18} color="#0d99ff" />
                <h3 className="ad-card-title">Tải Lên Video Bài Giảng Mới</h3>
              </div>
              <div className="ad-mode-tabs">
                <button
                  type="button"
                  className={`ad-mode-tab ${uploadMode === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  <UploadCloud size={14} />
                  <span>Từ máy tính</span>
                </button>
                <button
                  type="button"
                  className={`ad-mode-tab ${uploadMode === 'url' ? 'active' : ''}`}
                  onClick={() => setUploadMode('url')}
                >
                  <Link size={14} />
                  <span>Từ URL</span>
                </button>
              </div>
            </div>

            <div className="ad-card-body">
              {uploadError && (
                <div className="ad-alert ad-alert-error">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadResult && (
                <div className="ad-alert ad-alert-success">
                  <CheckCircle2 size={16} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Upload &amp; Lưu video kèm phụ đề vào Database thành công!</div>
                    <div style={{ fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>
                      {uploadResult.secureUrl}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ad-btn-copy"
                    onClick={() => handleCopyLink(uploadResult.secureUrl)}
                  >
                    {copiedUrl === uploadResult.secureUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              )}

              {uploadMode === 'file' ? (
                <form onSubmit={handleFileUploadSubmit} className="ad-form">
                  <div className="ad-dropzone">
                    <input
                      type="file"
                      accept="video/*"
                      id="ad-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file && !videoTitleInput) {
                          setVideoTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                    />
                    <label htmlFor="ad-file-input" className="ad-dropzone-label">
                      <div className="ad-dropzone-icon">
                        <FileVideo size={32} color="#0d99ff" />
                      </div>
                      <div className="ad-dropzone-text">
                        {selectedFile ? (
                          <>
                            <strong>{selectedFile.name}</strong>
                            <span>({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            {selectedFile.size > 104857600 && (
                              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>
                                ⚠️ Vượt quá hạn mức 100 MB của gói Cloudinary Free. Vui lòng nén video trước khi tải lên.
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <strong>Nhấp để chọn file video từ máy</strong>
                            <span>Hỗ trợ MP4, WebM, MOV (Gói Cloudinary Free tối đa 100MB)</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Tiêu đề bài học / video *</label>
                    <input
                      type="text"
                      className="ad-input"
                      value={videoTitleInput}
                      onChange={(e) => setVideoTitleInput(e.target.value)}
                      placeholder="Ví dụ: Hội thoại phỏng vấn Frontend Senior"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Mô tả bài học (tùy chọn)</label>
                    <textarea
                      className="ad-input"
                      rows={2}
                      value={videoDescInput}
                      onChange={(e) => setVideoDescInput(e.target.value)}
                      placeholder="Ghi chú nội dung trọng tâm bài học..."
                      disabled={isUploading}
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Thư mục lưu trữ trên Cloudinary</label>
                    <input
                      type="text"
                      className="ad-input"
                      value={targetFolder}
                      onChange={(e) => setTargetFolder(e.target.value)}
                      placeholder="quizcard_videos"
                      disabled={isUploading}
                    />
                  </div>

                  {/* KHỐI TẢI PHỤ ĐỀ WEBVTT TIẾNG ANH & TIẾNG VIỆT */}
                  <div className="ad-vtt-box">
                    <div
                      className="ad-vtt-box-header"
                      onClick={() => setShowVttAccordion(!showVttAccordion)}
                    >
                      <div className="ad-vtt-header-left">
                        <Subtitles size={17} color="#2563eb" />
                        <div>
                          <strong>Đính kèm Phụ đề WebVTT (.vtt)</strong>
                          <span className="ad-vtt-hint">Lưu dưới dạng TEXT trong Database để chạy chữ theo thời gian thực</span>
                        </div>
                      </div>
                      {showVttAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {showVttAccordion && (
                      <div className="ad-vtt-box-content">
                        {/* 1. Phụ đề tiếng Anh */}
                        <div className="ad-vtt-card">
                          <div className="ad-vtt-card-top">
                            <span className="ad-flag">🇬🇧</span>
                            <span className="ad-vtt-label">Phụ đề Tiếng Anh (English Subtitles)</span>
                          </div>

                          <div className="ad-vtt-inputs-row">
                            <input
                              type="file"
                              accept=".vtt,.srt,text/vtt"
                              id="ad-vtt-en-input"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleVttFileChange(
                                  e.target.files?.[0] || null,
                                  setVttEnFile,
                                  setVttEnTextInput
                                )
                              }
                            />
                            <label htmlFor="ad-vtt-en-input" className="ad-btn-vtt-pick">
                              <FileText size={14} />
                              <span>{vttEnFile ? vttEnFile.name : 'Chọn file .vtt tiếng Anh'}</span>
                            </label>
                            {vttEnFile && (
                              <button
                                type="button"
                                className="ad-btn-vtt-clear"
                                onClick={() => {
                                  setVttEnFile(null);
                                  setVttEnTextInput('');
                                }}
                                title="Xóa file đã chọn"
                              >
                                <X size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              className={`ad-btn-toggle-text ${showEnTextarea ? 'active' : ''}`}
                              onClick={() => setShowEnTextarea(!showEnTextarea)}
                            >
                              <Code2 size={13} />
                              <span>{showEnTextarea ? 'Ẩn Text VTT' : 'Nhập/Xem Text VTT'}</span>
                            </button>
                          </div>

                          {showEnTextarea && (
                            <textarea
                              className="ad-input ad-vtt-textarea"
                              rows={4}
                              placeholder="WEBVTT&#10;&#10;00:00:01.000 --> 00:00:04.000&#10;Hello everyone, welcome to the lesson!&#10;..."
                              value={vttEnTextInput}
                              onChange={(e) => setVttEnTextInput(e.target.value)}
                            />
                          )}

                          <input
                            type="url"
                            className="ad-input ad-input-sm"
                            placeholder="Hoặc dán URL file VTT tiếng Anh (tùy chọn)"
                            value={vttEnUrlInput}
                            onChange={(e) => setVttEnUrlInput(e.target.value)}
                          />
                        </div>

                        {/* 2. Phụ đề tiếng Việt */}
                        <div className="ad-vtt-card">
                          <div className="ad-vtt-card-top">
                            <span className="ad-flag">🇻🇳</span>
                            <span className="ad-vtt-label">Phụ đề Tiếng Việt (Vietnamese Subtitles)</span>
                          </div>

                          <div className="ad-vtt-inputs-row">
                            <input
                              type="file"
                              accept=".vtt,.srt,text/vtt"
                              id="ad-vtt-vi-input"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleVttFileChange(
                                  e.target.files?.[0] || null,
                                  setVttViFile,
                                  setVttViTextInput
                                )
                              }
                            />
                            <label htmlFor="ad-vtt-vi-input" className="ad-btn-vtt-pick">
                              <FileText size={14} />
                              <span>{vttViFile ? vttViFile.name : 'Chọn file .vtt tiếng Việt'}</span>
                            </label>
                            {vttViFile && (
                              <button
                                type="button"
                                className="ad-btn-vtt-clear"
                                onClick={() => {
                                  setVttViFile(null);
                                  setVttViTextInput('');
                                }}
                                title="Xóa file đã chọn"
                              >
                                <X size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              className={`ad-btn-toggle-text ${showViTextarea ? 'active' : ''}`}
                              onClick={() => setShowViTextarea(!showViTextarea)}
                            >
                              <Code2 size={13} />
                              <span>{showViTextarea ? 'Ẩn Text VTT' : 'Nhập/Xem Text VTT'}</span>
                            </button>
                          </div>

                          {showViTextarea && (
                            <textarea
                              className="ad-input ad-vtt-textarea"
                              rows={4}
                              placeholder="WEBVTT&#10;&#10;00:00:01.000 --> 00:00:04.000&#10;Xin chào các bạn, chào mừng đến với bài học!&#10;..."
                              value={vttViTextInput}
                              onChange={(e) => setVttViTextInput(e.target.value)}
                            />
                          )}

                          <input
                            type="url"
                            className="ad-input ad-input-sm"
                            placeholder="Hoặc dán URL file VTT tiếng Việt (tùy chọn)"
                            value={vttViUrlInput}
                            onChange={(e) => setVttViUrlInput(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="ad-btn-primary" disabled={isUploading || !selectedFile}>
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="ad-spinner" />
                        <span>Đang tải lên &amp; đẩy lên Cloudinary (file lớn có thể mất vài phút)...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Bắt đầu tải lên &amp; Lưu vào DB</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUrlUploadSubmit} className="ad-form">
                  <div className="ad-field">
                    <label className="ad-label">Đường dẫn Video URL (MP4 trực tiếp hoặc stream) *</label>
                    <input
                      type="url"
                      className="ad-input"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      required
                      disabled={isUploading}
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Tiêu đề bài học / video *</label>
                    <input
                      type="text"
                      className="ad-input"
                      value={videoTitleInput}
                      onChange={(e) => setVideoTitleInput(e.target.value)}
                      placeholder="Ví dụ: Podcast công nghệ & AI"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Mô tả bài học (tùy chọn)</label>
                    <textarea
                      className="ad-input"
                      rows={2}
                      value={videoDescInput}
                      onChange={(e) => setVideoDescInput(e.target.value)}
                      placeholder="Ghi chú nội dung trọng tâm..."
                      disabled={isUploading}
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-label">Thư mục lưu trữ trên Cloudinary</label>
                    <input
                      type="text"
                      className="ad-input"
                      value={targetFolder}
                      onChange={(e) => setTargetFolder(e.target.value)}
                      placeholder="quizcard_videos"
                      disabled={isUploading}
                    />
                  </div>

                  {/* KHỐI TẢI PHỤ ĐỀ WEBVTT CHO URL MODE */}
                  <div className="ad-vtt-box">
                    <div
                      className="ad-vtt-box-header"
                      onClick={() => setShowVttAccordion(!showVttAccordion)}
                    >
                      <div className="ad-vtt-header-left">
                        <Subtitles size={17} color="#2563eb" />
                        <div>
                          <strong>Đính kèm Phụ đề WebVTT (.vtt)</strong>
                          <span className="ad-vtt-hint">Lưu dưới dạng TEXT trong Database</span>
                        </div>
                      </div>
                      {showVttAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {showVttAccordion && (
                      <div className="ad-vtt-box-content">
                        <div className="ad-vtt-card">
                          <div className="ad-vtt-card-top">
                            <span className="ad-flag">🇬🇧</span>
                            <span className="ad-vtt-label">Phụ đề Tiếng Anh (.vtt)</span>
                          </div>
                          <textarea
                            className="ad-input ad-vtt-textarea"
                            rows={3}
                            placeholder="Dán toàn bộ nội dung text WebVTT tiếng Anh vào đây..."
                            value={vttEnTextInput}
                            onChange={(e) => setVttEnTextInput(e.target.value)}
                          />
                          <input
                            type="url"
                            className="ad-input ad-input-sm"
                            placeholder="Hoặc dán URL file VTT tiếng Anh"
                            value={vttEnUrlInput}
                            onChange={(e) => setVttEnUrlInput(e.target.value)}
                          />
                        </div>

                        <div className="ad-vtt-card">
                          <div className="ad-vtt-card-top">
                            <span className="ad-flag">🇻🇳</span>
                            <span className="ad-vtt-label">Phụ đề Tiếng Việt (.vtt)</span>
                          </div>
                          <textarea
                            className="ad-input ad-vtt-textarea"
                            rows={3}
                            placeholder="Dán toàn bộ nội dung text WebVTT tiếng Việt vào đây..."
                            value={vttViTextInput}
                            onChange={(e) => setVttViTextInput(e.target.value)}
                          />
                          <input
                            type="url"
                            className="ad-input ad-input-sm"
                            placeholder="Hoặc dán URL file VTT tiếng Việt"
                            value={vttViUrlInput}
                            onChange={(e) => setVttViUrlInput(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="ad-btn-primary" disabled={isUploading || !videoUrlInput.trim()}>
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="ad-spinner" />
                        <span>Đang kéo video về Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Link size={16} />
                        <span>Nạp video từ URL &amp; Lưu vào DB</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH & TRÌNH PHÁT THỬ */}
          <div className="ad-card">
            <div className="ad-card-header">
              <div className="ad-card-title-row">
                <Database size={18} color="#0d99ff" />
                <h3 className="ad-card-title">Thư Viện Video Đã Lưu Trong DB ({uploadedVideos.length})</h3>
              </div>
              <button
                type="button"
                className="ad-btn-action"
                onClick={loadVideos}
                disabled={loadingVideos}
                title="Làm mới danh sách từ Database"
              >
                <RotateCw size={14} className={loadingVideos ? 'ad-spinner' : ''} />
              </button>
            </div>

            <div className="ad-card-body">
              {/* Trình phát thử video nếu đang chọn preview */}
              {previewVideo && (
                <div className="ad-preview-box">
                  <div className="ad-preview-header">
                    <span>Đang xem trước: <strong>{previewVideo.title}</strong></span>
                    <button type="button" className="ad-btn-close-preview" onClick={() => setPreviewVideo(null)}>
                      ✕ Đóng
                    </button>
                  </div>
                  <video
                    src={previewVideo.secureUrl}
                    controls
                    autoPlay
                    className="ad-preview-video"
                  >
                    {previewVideo.vttEnUrl && (
                      <track kind="subtitles" src={previewVideo.vttEnUrl} srcLang="en" label="English" default />
                    )}
                    {previewVideo.vttViUrl && (
                      <track kind="subtitles" src={previewVideo.vttViUrl} srcLang="vi" label="Tiếng Việt" />
                    )}
                  </video>
                </div>
              )}

              {/* Trạng thái tải video */}
              {loadingVideos && uploadedVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  <Loader2 size={24} className="ad-spinner" style={{ margin: '0 auto 8px' }} />
                  <div>Đang tải danh sách video từ Database...</div>
                </div>
              ) : uploadedVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  <Video size={36} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                  <div>Chưa có video nào được lưu trong Database. Hãy tải lên video đầu tiên!</div>
                </div>
              ) : (
                <div className="ad-video-list">
                  {uploadedVideos.map((vid, idx) => (
                    <div key={vid.id || vid.publicId || idx} className="ad-video-item">
                      <div className="ad-video-left">
                        <div className="ad-video-icon">
                          <Video size={20} color="#0d99ff" />
                        </div>
                        <div className="ad-video-meta">
                          <h4 className="ad-video-name" title={vid.title}>
                            {vid.title}
                          </h4>
                          {vid.description && (
                            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0', lineClamp: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {vid.description}
                            </p>
                          )}
                          <div className="ad-video-submeta">
                            <span>{Math.round(vid.duration || 0)}s</span>
                            <span>•</span>
                            <span>{(vid.format || 'mp4').toUpperCase()}</span>
                            {vid.bytes > 0 && (
                              <>
                                <span>•</span>
                                <span>{(vid.bytes / (1024 * 1024)).toFixed(1)} MB</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="ad-public-id" title={vid.publicId}>{vid.publicId}</span>
                          </div>

                          {/* Huy hiệu hiển thị trạng thái phụ đề VTT trong DB */}
                          <div className="ad-vtt-badges">
                            {vid.vttEnText ? (
                              <button
                                type="button"
                                className="ad-badge-vtt ad-badge-vtt-active"
                                onClick={() =>
                                  setViewVttModal({
                                    title: vid.title,
                                    lang: 'Tiếng Anh (EN)',
                                    text: vid.vttEnText,
                                    url: vid.vttEnUrl,
                                  })
                                }
                                title="Nhấp để xem nội dung WebVTT tiếng Anh lưu trong DB"
                              >
                                🇬🇧 VTT EN (Text in DB)
                              </button>
                            ) : vid.vttEnUrl ? (
                              <a
                                href={vid.vttEnUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ad-badge-vtt ad-badge-vtt-active"
                                title="Mở file VTT tiếng Anh trên Cloudinary"
                              >
                                🇬🇧 VTT EN (Link)
                              </a>
                            ) : (
                              <span className="ad-badge-vtt ad-badge-vtt-none" title="Chưa có phụ đề tiếng Anh">
                                🇬🇧 Chưa có VTT
                              </span>
                            )}

                            {vid.vttViText ? (
                              <button
                                type="button"
                                className="ad-badge-vtt ad-badge-vtt-active"
                                onClick={() =>
                                  setViewVttModal({
                                    title: vid.title,
                                    lang: 'Tiếng Việt (VI)',
                                    text: vid.vttViText,
                                    url: vid.vttViUrl,
                                  })
                                }
                                title="Nhấp để xem nội dung WebVTT tiếng Việt lưu trong DB"
                              >
                                🇻🇳 VTT VI (Text in DB)
                              </button>
                            ) : vid.vttViUrl ? (
                              <a
                                href={vid.vttViUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ad-badge-vtt ad-badge-vtt-active"
                                title="Mở file VTT tiếng Việt trên Cloudinary"
                              >
                                🇻🇳 VTT VI (Link)
                              </a>
                            ) : (
                              <span className="ad-badge-vtt ad-badge-vtt-none" title="Chưa có phụ đề tiếng Việt">
                                🇻🇳 Chưa có VTT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ad-video-actions">
                        <button
                          type="button"
                          className="ad-btn-action"
                          onClick={() => handleOpenSubModal(vid)}
                          title="Quản lý / Đính kèm phụ đề VTT"
                        >
                          <Subtitles size={14} color="#2563eb" />
                        </button>

                        <button
                          type="button"
                          className="ad-btn-action"
                          onClick={() => setPreviewVideo(vid)}
                          title="Phát thử video"
                        >
                          <Play size={14} />
                        </button>

                        <button
                          type="button"
                          className="ad-btn-action"
                          onClick={() => handleCopyLink(vid.secureUrl)}
                          title="Sao chép link Cloudinary"
                        >
                          {copiedUrl === vid.secureUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>

                        <a
                          href={vid.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ad-btn-action"
                          title="Mở tab mới"
                        >
                          <ExternalLink size={14} />
                        </a>

                        <button
                          type="button"
                          className="ad-btn-action ad-btn-delete"
                          onClick={() => handleDeleteVideo(vid)}
                          title="Xóa video khỏi Cloudinary và Database"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      {/* 3. MODAL QUẢN LÝ / CẬP NHẬT PHỤ ĐỀ CHO VIDEO ĐÃ CÓ */}
      {activeSubModalVideo && (
        <div className="ad-modal-backdrop" onClick={() => setActiveSubModalVideo(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <div className="ad-modal-title-row">
                <Subtitles size={18} color="#2563eb" />
                <h3>Quản Lý Phụ Đề VTT: {activeSubModalVideo.title}</h3>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setActiveSubModalVideo(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubModal} className="ad-modal-body">
              {modalMsg.text && (
                <div
                  className={`ad-alert ${
                    modalMsg.type === 'success' ? 'ad-alert-success' : 'ad-alert-error'
                  }`}
                >
                  {modalMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{modalMsg.text}</span>
                </div>
              )}

              {/* Sub Tiếng Anh */}
              <div className="ad-vtt-card">
                <div className="ad-vtt-card-top">
                  <span className="ad-flag">🇬🇧</span>
                  <strong>Phụ đề WebVTT Tiếng Anh</strong>
                </div>

                <div className="ad-vtt-inputs-row">
                  <input
                    type="file"
                    accept=".vtt,.srt,text/vtt"
                    id="modal-vtt-en-file"
                    style={{ display: 'none' }}
                    onChange={(e) =>
                      handleVttFileChange(
                        e.target.files?.[0] || null,
                        setModalVttEnFile,
                        setModalVttEnText
                      )
                    }
                  />
                  <label htmlFor="modal-vtt-en-file" className="ad-btn-vtt-pick">
                    <FileText size={14} />
                    <span>{modalVttEnFile ? modalVttEnFile.name : 'Tải file .vtt mới từ máy'}</span>
                  </label>
                  {modalVttEnFile && (
                    <button
                      type="button"
                      className="ad-btn-vtt-clear"
                      onClick={() => setModalVttEnFile(null)}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <label className="ad-label" style={{ marginTop: 8 }}>
                  Nội dung text WebVTT (Lưu trực tiếp vào cột VttEnText):
                </label>
                <textarea
                  className="ad-input ad-vtt-textarea"
                  rows={4}
                  placeholder="WEBVTT&#10;&#10;00:00:01.000 --> 00:00:05.000&#10;English subtitle text..."
                  value={modalVttEnText}
                  onChange={(e) => setModalVttEnText(e.target.value)}
                />

                <input
                  type="url"
                  className="ad-input ad-input-sm"
                  placeholder="URL file VTT tiếng Anh (nếu có)"
                  value={modalVttEnUrl}
                  onChange={(e) => setModalVttEnUrl(e.target.value)}
                />
              </div>

              {/* Sub Tiếng Việt */}
              <div className="ad-vtt-card">
                <div className="ad-vtt-card-top">
                  <span className="ad-flag">🇻🇳</span>
                  <strong>Phụ đề WebVTT Tiếng Việt</strong>
                </div>

                <div className="ad-vtt-inputs-row">
                  <input
                    type="file"
                    accept=".vtt,.srt,text/vtt"
                    id="modal-vtt-vi-file"
                    style={{ display: 'none' }}
                    onChange={(e) =>
                      handleVttFileChange(
                        e.target.files?.[0] || null,
                        setModalVttViFile,
                        setModalVttViText
                      )
                    }
                  />
                  <label htmlFor="modal-vtt-vi-file" className="ad-btn-vtt-pick">
                    <FileText size={14} />
                    <span>{modalVttViFile ? modalVttViFile.name : 'Tải file .vtt mới từ máy'}</span>
                  </label>
                  {modalVttViFile && (
                    <button
                      type="button"
                      className="ad-btn-vtt-clear"
                      onClick={() => setModalVttViFile(null)}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <label className="ad-label" style={{ marginTop: 8 }}>
                  Nội dung text WebVTT (Lưu trực tiếp vào cột VttViText):
                </label>
                <textarea
                  className="ad-input ad-vtt-textarea"
                  rows={4}
                  placeholder="WEBVTT&#10;&#10;00:00:01.000 --> 00:00:05.000&#10;Nội dung phụ đề tiếng Việt..."
                  value={modalVttViText}
                  onChange={(e) => setModalVttViText(e.target.value)}
                />

                <input
                  type="url"
                  className="ad-input ad-input-sm"
                  placeholder="URL file VTT tiếng Việt (nếu có)"
                  value={modalVttViUrl}
                  onChange={(e) => setModalVttViUrl(e.target.value)}
                />
              </div>

              <div className="ad-modal-footer">
                <button
                  type="button"
                  className="ad-btn-header"
                  onClick={() => setActiveSubModalVideo(null)}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="ad-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={isSavingModalSubs}
                >
                  {isSavingModalSubs ? (
                    <>
                      <Loader2 size={15} className="ad-spinner" />
                      <span>Đang lưu vào Database...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Lưu Thay Đổi Phụ Đề</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL XEM NHANH NỘI DUNG WEBVTT TEXT TRONG DB */}
      {viewVttModal && (
        <div className="ad-modal-backdrop" onClick={() => setViewVttModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <div className="ad-modal-title-row">
                <FileText size={18} color="#2563eb" />
                <h3>Nội Dung Phụ Đề {viewVttModal.lang}: {viewVttModal.title}</h3>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setViewVttModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="ad-modal-body">
              <pre className="ad-vtt-code-viewer">{viewVttModal.text}</pre>

              <div className="ad-modal-footer">
                {viewVttModal.url && (
                  <a
                    href={viewVttModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ad-btn-header"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                    <span>Mở link gốc Cloudinary</span>
                  </a>
                )}
                <button
                  type="button"
                  className="ad-btn-primary"
                  style={{ width: 'auto' }}
                  onClick={() => handleCopyLink(viewVttModal.text)}
                >
                  {copiedUrl === viewVttModal.text ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedUrl === viewVttModal.text ? 'Đã sao chép Text!' : 'Sao chép nội dung VTT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
