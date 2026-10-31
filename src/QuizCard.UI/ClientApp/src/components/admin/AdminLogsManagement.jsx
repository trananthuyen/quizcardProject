import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle,
  AlertOctagon,
  Clock,
  Search,
  X,
  RotateCw,
  Trash2,
  Eye,
  Server,
  Filter,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../api';
import './AdminLogsManagement.css';

export const AdminLogsManagement = () => {
  const [stats, setStats] = useState({
    totalRequestsToday: 0,
    totalRequestsAllTime: 0,
    totalErrorsToday: 0,
    avgDurationMsToday: 0,
    successRatePercent: 100,
    requestsByMethod: {},
    statusCodeDistribution: {},
    topEndpoints: [],
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [statusCode, setStatusCode] = useState('');
  const [onlyErrors, setOnlyErrors] = useState(false);

  // Modal xem chi tiết log
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Tải thống kê
  const loadStats = useCallback(async () => {
    try {
      const data = await api.getAdminLogStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Lỗi tải thống kê logs:', err);
    }
  }, []);

  // Tải danh sách logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminLogs({
        page,
        pageSize,
        search: debouncedSearch,
        method: method !== 'ALL' ? method : '',
        statusCode,
        onlyErrors,
      });

      if (res) {
        setLogs(res.items || []);
        setTotalItems(res.totalItems || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, method, statusCode, onlyErrors]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Xóa dọn dẹp nhật ký
  const handleClearLogs = async (days = null) => {
    const promptMsg = days
      ? `Bạn có chắc muốn xóa tất cả log cũ hơn ${days} ngày?`
      : 'XÁC NHẬN: Bạn có chắc chắn muốn XÓA TOÀN BỘ nhật ký yêu cầu trong hệ thống?';

    if (!window.confirm(promptMsg)) return;

    try {
      const res = await api.clearAdminLogs(days);
      alert(res.message || 'Đã dọn dẹp nhật ký thành công.');
      loadStats();
      loadLogs();
    } catch (err) {
      alert(err.message || 'Không thể dọn dẹp nhật ký');
    }
  };

  const getMethodClass = (m) => {
    switch (m?.toUpperCase()) {
      case 'GET':
        return 'alm-method-get';
      case 'POST':
        return 'alm-method-post';
      case 'PUT':
      case 'PATCH':
        return 'alm-method-put';
      case 'DELETE':
        return 'alm-method-delete';
      default:
        return 'alm-method-get';
    }
  };

  const getStatusClass = (code) => {
    if (code >= 500) return 'alm-status-5xx';
    if (code >= 400) return 'alm-status-4xx';
    if (code >= 300) return 'alm-status-3xx';
    return 'alm-status-2xx';
  };

  const getDurationClass = (ms) => {
    if (ms > 500) return 'alm-duration-slow';
    if (ms > 150) return 'alm-duration-mid';
    return 'alm-duration-fast';
  };

  return (
    <div className="alm-container">
      {/* 1. THẺ THỐNG KÊ KPI HIỆU NĂNG */}
      <div className="alm-stats-grid">
        <div className="alm-stat-card">
          <div className="alm-stat-icon alm-icon-blue">
            <Activity size={24} />
          </div>
          <div className="alm-stat-content">
            <span className="alm-stat-label">Yêu Cầu Hôm Nay</span>
            <span className="alm-stat-value">
              {stats.totalRequestsToday.toLocaleString('vi-VN')}
            </span>
            <span className="alm-stat-hint">
              Tổng tích lũy: {stats.totalRequestsAllTime.toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="alm-stat-card">
          <div className="alm-stat-icon alm-icon-emerald">
            <CheckCircle size={24} />
          </div>
          <div className="alm-stat-content">
            <span className="alm-stat-label">Tỷ Lệ Thành Công</span>
            <span className="alm-stat-value">{stats.successRatePercent}%</span>
            <span className="alm-stat-hint">
              {stats.totalRequestsToday - stats.totalErrorsToday} request hợp lệ
            </span>
          </div>
        </div>

        <div className="alm-stat-card">
          <div className="alm-stat-icon alm-icon-amber">
            <Clock size={24} />
          </div>
          <div className="alm-stat-content">
            <span className="alm-stat-label">Tốc Độ Phản Hồi TB</span>
            <span className="alm-stat-value">{stats.avgDurationMsToday} ms</span>
            <span className="alm-stat-hint">Thời gian xử lý phía server</span>
          </div>
        </div>

        <div className="alm-stat-card">
          <div className="alm-stat-icon alm-icon-red">
            <AlertOctagon size={24} />
          </div>
          <div className="alm-stat-content">
            <span className="alm-stat-label">Yêu Cầu Lỗi (4xx/5xx)</span>
            <span className="alm-stat-value">
              {stats.totalErrorsToday.toLocaleString('vi-VN')}
            </span>
            <span className="alm-stat-hint">Gồm lỗi quyền và ngoại lệ</span>
          </div>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
      <div className="alm-toolbar">
        <div className="alm-search-box">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            className="alm-search-input"
            placeholder="Tìm theo URL path, email người dùng, client IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setSearch('')}
            >
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        <div className="alm-filters-group">
          {/* Lọc Method */}
          <select
            className="alm-select"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Method</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Lọc Status Code */}
          <select
            className="alm-select"
            value={statusCode}
            onChange={(e) => {
              setStatusCode(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả mã HTTP</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>

          {/* Toggle chỉ lấy lỗi */}
          <button
            type="button"
            className={`alm-filter-chip ${onlyErrors ? 'active-error' : ''}`}
            onClick={() => {
              setOnlyErrors(!onlyErrors);
              setPage(1);
            }}
          >
            <ShieldAlert size={14} />
            <span>Chỉ xem lỗi</span>
          </button>

          <button
            type="button"
            className="alm-filter-chip"
            onClick={() => {
              loadStats();
              loadLogs();
            }}
            title="Làm mới dữ liệu"
          >
            <RotateCw size={14} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            className="alm-btn-clear-logs"
            onClick={() => handleClearLogs(null)}
            title="Dọn dẹp xóa sạch nhật ký"
          >
            <Trash2 size={13} />
            <span>Dọn dẹp Logs</span>
          </button>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH NHẬT KÝ REQUESTS */}
      <div className="alm-table-card">
        <div className="alm-table-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={17} color="#0d99ff" />
            <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a' }}>
              Nhật Ký Yêu Cầu Người Dùng (Live Request Logs)
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Tổng số: <strong>{totalItems.toLocaleString('vi-VN')}</strong> bản ghi
          </span>
        </div>

        <div className="alm-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
              <span>Đang tải nhật ký yêu cầu...</span>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Terminal size={36} style={{ color: '#cbd5e1', margin: '0 auto 10px auto' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy bản ghi log nào</p>
            </div>
          ) : (
            <table className="alm-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Đường Dẫn (API Path)</th>
                  <th>Trạng Thái</th>
                  <th>Thời Gian</th>
                  <th>Tài Khoản / Client</th>
                  <th>Địa Chỉ IP</th>
                  <th>Thời Điểm (UTC)</th>
                  <th style={{ textAlign: 'center' }}>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={`alm-badge-method ${getMethodClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>

                    <td>
                      <div className="alm-path-cell" title={log.path + (log.queryString || '')}>
                        {log.path}
                        {log.queryString && (
                          <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                            {log.queryString}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`alm-badge-status ${getStatusClass(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>

                    <td>
                      <span className={`alm-duration-pill ${getDurationClass(log.durationMs)}`}>
                        {log.durationMs} ms
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {log.userEmail ? (
                          <strong style={{ color: '#0f172a' }}>{log.userEmail}</strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Khách (Guest)</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: '11px', color: '#475569' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </code>
                    </td>

                    <td style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(log.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="alm-btn-detail"
                        onClick={() => setSelectedLog(log)}
                        title="Xem chi tiết đầy đủ của request"
                      >
                        <Eye size={12} />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="alm-pagination">
            <button
              type="button"
              className="alm-pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> Trang trước
            </button>

            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (
              {totalItems} logs)
            </span>

            <button
              type="button"
              className="alm-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL CHI TIẾT LOG RECORD */}
      {selectedLog && (
        <div className="alm-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="alm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="alm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`alm-badge-method ${getMethodClass(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  {selectedLog.path}
                </span>
                <span className={`alm-badge-status ${getStatusClass(selectedLog.statusCode)}`}>
                  {selectedLog.statusCode}
                </span>
              </div>

              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} color="#94a3b8" />
              </button>
            </div>

            <div className="alm-modal-body">
              <div className="alm-detail-row">
                <span className="alm-detail-label">Đường Dẫn Đầy Đủ</span>
                <span className="alm-detail-value">
                  <code>{selectedLog.path}{selectedLog.queryString || ''}</code>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="alm-detail-row">
                  <span className="alm-detail-label">Người Dùng</span>
                  <span className="alm-detail-value">
                    {selectedLog.userEmail ? (
                      <strong>{selectedLog.userEmail}</strong>
                    ) : (
                      'Khách (Guest / Chưa đăng nhập)'
                    )}
                  </span>
                </div>

                <div className="alm-detail-row">
                  <span className="alm-detail-label">Client IP</span>
                  <span className="alm-detail-value">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>

                <div className="alm-detail-row">
                  <span className="alm-detail-label">Thời Gian Phản Hồi</span>
                  <span className="alm-detail-value">{selectedLog.durationMs} ms</span>
                </div>

                <div className="alm-detail-row">
                  <span className="alm-detail-label">Thời Điểm Ghi Nhận</span>
                  <span className="alm-detail-value">{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="alm-detail-row">
                <span className="alm-detail-label">User-Agent (Trình Duyệt &amp; Thiết Bị)</span>
                <span className="alm-detail-value" style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedLog.userAgent || 'Không xác định'}
                </span>
              </div>

              {selectedLog.requestBody && (
                <div className="alm-detail-row">
                  <span className="alm-detail-label">Dữ Liệu Request Body (JSON)</span>
                  <pre className="alm-code-box">{selectedLog.requestBody}</pre>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div className="alm-detail-row">
                  <span className="alm-detail-label" style={{ color: '#dc2626' }}>
                    Chi Tiết Lỗi / Ngoại Lệ (Exception StackTrace)
                  </span>
                  <pre className="alm-code-box" style={{ color: '#f87171', background: '#450a0a' }}>
                    {selectedLog.errorMessage}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

