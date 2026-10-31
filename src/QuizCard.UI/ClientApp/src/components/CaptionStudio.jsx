import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  UploadCloud,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Subtitles,
  Maximize2,
  Minimize2,
  Wand2,
  AlignEndHorizontal,
  AlignStartHorizontal,
  MousePointerClick,
  Bookmark,
  ArrowDownToLine,
  Search,
  X,
  Globe,
} from 'lucide-react';
import { api } from '../api';
import './CaptionStudio.css';

// ==========================================
// KỊCH BẢN MẪU ĐỒNG BỘ SONG NGỮ CHUẨN XÁC
// ==========================================
const SCENARIOS = {
  ai_podcast: {
    title: 'Podcast: AI & Thiết Kế Sản Phẩm Tương Lai',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    speakers: {
      mai: {
        name: 'Mai Linh',
        role: 'Host • Product Lead',
        avatar: '👩‍💼',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
        accentColor: '#4f46e5',
      },
      tuan: {
        name: 'Tuấn Anh',
        role: 'Khách mời • AI Architect',
        avatar: '👨‍💻',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        badgeBorder: 'border-sky-200',
        accentColor: '#0284c7',
      },
    },
    transcript: [
      {
        speaker: 'mai',
        start: 0.4,
        end: 4.5,
        enText: 'Welcome everyone back to our Product & AI Design Podcast today!',
        words: [
          { text: 'Chào', en: 'Welcome', start: 0.4, end: 0.8 },
          { text: 'mừng', en: 'everyone', start: 0.8, end: 1.2 },
          { text: 'các', en: 'back', start: 1.2, end: 1.5 },
          { text: 'bạn', en: 'to', start: 1.5, end: 1.9 },
          { text: 'đến', en: 'our', start: 1.9, end: 2.3 },
          { text: 'với', en: 'Product', start: 2.3, end: 2.7 },
          { text: 'Podcast', en: '& AI', start: 2.7, end: 3.3 },
          { text: 'Thiết', en: 'Design', start: 3.3, end: 3.7 },
          { text: 'Kế', en: 'Podcast', start: 3.7, end: 4.1 },
          { text: 'hôm nay!', en: 'today!', start: 4.1, end: 4.5 },
        ],
      },
      {
        speaker: 'tuan',
        start: 4.7,
        end: 9.2,
        enText: 'Hi Mai! Synchronized word-by-word subtitles make watching videos much more engaging.',
        words: [
          { text: 'Chào', en: 'Hi', start: 4.7, end: 5.1 },
          { text: 'Mai!', en: 'Mai!', start: 5.1, end: 5.5 },
          { text: 'Phụ', en: 'Synchronized', start: 5.5, end: 5.9 },
          { text: 'đề', en: 'word-by-word', start: 5.9, end: 6.3 },
          { text: 'chạy', en: 'subtitles', start: 6.3, end: 6.7 },
          { text: 'từng', en: 'make', start: 6.7, end: 7.1 },
          { text: 'chữ', en: 'watching', start: 7.1, end: 7.5 },
          { text: 'giúp', en: 'videos', start: 7.5, end: 7.9 },
          { text: 'người', en: 'much', start: 7.9, end: 8.3 },
          { text: 'xem', en: 'more', start: 8.3, end: 8.7 },
          { text: 'cuốn hút.', en: 'engaging.', start: 8.7, end: 9.2 },
        ],
      },
      {
        speaker: 'mai',
        start: 9.4,
        end: 13.8,
        enText: 'Right! Especially in a clean Light Mode workspace, reading long transcripts feels effortless.',
        words: [
          { text: 'Đúng', en: 'Right!', start: 9.4, end: 9.8 },
          { text: 'vậy!', en: 'Especially', start: 9.8, end: 10.2 },
          { text: 'Giao', en: 'in a', start: 10.2, end: 10.6 },
          { text: 'diện', en: 'clean', start: 10.6, end: 11.0 },
          { text: 'nền', en: 'Light', start: 11.0, end: 11.4 },
          { text: 'trắng', en: 'Mode,', start: 11.4, end: 11.8 },
          { text: 'sáng', en: 'reading', start: 11.8, end: 12.2 },
          { text: 'giúp', en: 'transcripts', start: 12.2, end: 12.6 },
          { text: 'đọc', en: 'feels', start: 12.6, end: 13.1 },
          { text: 'rất', en: 'so', start: 13.1, end: 13.4 },
          { text: 'dịu mắt.', en: 'effortless.', start: 13.4, end: 13.8 },
        ],
      },
      {
        speaker: 'tuan',
        start: 14.0,
        end: 15.0,
        enText: 'Click any word to jump directly to that exact timestamp!',
        words: [
          { text: 'Hãy', en: 'Click', start: 14.0, end: 14.2 },
          { text: 'bấm', en: 'any', start: 14.2, end: 14.4 },
          { text: 'thử', en: 'word', start: 14.4, end: 14.6 },
          { text: 'từng', en: 'to', start: 14.6, end: 14.8 },
          { text: 'từ nhé!', en: 'jump!', start: 14.8, end: 15.0 },
        ],
      },
    ],
  },

  tech_interview: {
    title: 'Phỏng Vấn Senior Frontend Engineer',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    speakers: {
      thao: {
        name: 'Thanh Thảo',
        role: 'Engineering Manager',
        avatar: '👩‍🏫',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        accentColor: '#059669',
      },
      huy: {
        name: 'Đức Huy',
        role: 'Ứng viên Frontend',
        avatar: '🧑‍💻',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        accentColor: '#d97706',
      },
    },
    transcript: [
      {
        speaker: 'thao',
        start: 0.3,
        end: 4.8,
        enText: 'Hello Huy, how do you optimize real-time subtitle rendering at 60 frames per second?',
        words: [
          { text: 'Chào', en: 'Hello', start: 0.3, end: 0.7 },
          { text: 'Huy,', en: 'Huy,', start: 0.7, end: 1.2 },
          { text: 'bạn', en: 'how', start: 1.2, end: 1.6 },
          { text: 'tối', en: 'do you', start: 1.6, end: 2.0 },
          { text: 'ưu', en: 'optimize', start: 2.0, end: 2.5 },
          { text: 'hiệu', en: 'real-time', start: 2.5, end: 3.0 },
          { text: 'ứng', en: 'subtitle', start: 3.0, end: 3.5 },
          { text: 'phụ', en: 'rendering', start: 3.5, end: 4.0 },
          { text: 'đề', en: 'smoothly', start: 4.0, end: 4.4 },
          { text: 'thế nào?', en: 'at 60fps?', start: 4.4, end: 4.8 },
        ],
      },
      {
        speaker: 'huy',
        start: 5.0,
        end: 10.2,
        enText: 'I map each word to exact start and end timestamps and only update active DOM nodes.',
        words: [
          { text: 'Mình', en: 'I', start: 5.0, end: 5.4 },
          { text: 'gán', en: 'map', start: 5.4, end: 5.9 },
          { text: 'mốc', en: 'each', start: 5.9, end: 6.3 },
          { text: 'thời', en: 'word', start: 6.3, end: 6.8 },
          { text: 'gian', en: 'to exact', start: 6.8, end: 7.3 },
          { text: 'cho', en: 'start', start: 7.3, end: 7.7 },
          { text: 'từng', en: 'and end', start: 7.7, end: 8.2 },
          { text: 'từ', en: 'timestamps', start: 8.2, end: 8.7 },
          { text: 'và', en: 'and', start: 8.7, end: 9.1 },
          { text: 'cập', en: 'update', start: 9.1, end: 9.6 },
          { text: 'nhật mượt mà.', en: 'DOM nodes.', start: 9.6, end: 10.2 },
        ],
      },
      {
        speaker: 'thao',
        start: 10.5,
        end: 14.8,
        enText: 'Awesome! And the sentence repeat button is super helpful for language learners.',
        words: [
          { text: 'Rất', en: 'Awesome!', start: 10.5, end: 11.0 },
          { text: 'tuyệt!', en: 'And the', start: 11.0, end: 11.5 },
          { text: 'Tính', en: 'sentence', start: 11.5, end: 12.0 },
          { text: 'năng', en: 'repeat', start: 12.0, end: 12.5 },
          { text: 'lặp', en: 'button', start: 12.5, end: 13.0 },
          { text: 'câu', en: 'is super', start: 13.0, end: 13.5 },
          { text: 'cũng', en: 'helpful', start: 13.5, end: 14.0 },
          { text: 'rất', en: 'for', start: 14.0, end: 14.4 },
          { text: 'hữu ích.', en: 'learners.', start: 14.4, end: 14.8 },
        ],
      },
    ],
  },

  coffee_talk: {
    title: 'Trò Chuyện Cuối Tuần Ở Quán Cà Phê',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    speakers: {
      an: {
        name: 'An Nhiên',
        role: 'Visual Designer',
        avatar: '🎨',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        accentColor: '#e11d48',
      },
      nam: {
        name: 'Nam Khánh',
        role: 'Nhiếp Ảnh Gia',
        avatar: '📷',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
        accentColor: '#4f46e5',
      },
    },
    transcript: [
      {
        speaker: 'an',
        start: 0.4,
        end: 4.8,
        enText: 'Good morning Nam! The sunlight at this coffee shop today is so peaceful.',
        words: [
          { text: 'Chào', en: 'Good', start: 0.4, end: 0.8 },
          { text: 'buổi', en: 'morning', start: 0.8, end: 1.3 },
          { text: 'sáng', en: 'Nam!', start: 1.3, end: 1.8 },
          { text: 'Nam!', en: 'The', start: 1.8, end: 2.3 },
          { text: 'Nắng', en: 'sunlight', start: 2.3, end: 2.8 },
          { text: 'sớm', en: 'at this', start: 2.8, end: 3.3 },
          { text: 'ở', en: 'coffee', start: 3.3, end: 3.7 },
          { text: 'quán', en: 'shop', start: 3.7, end: 4.2 },
          { text: 'đẹp quá.', en: 'is peaceful.', start: 4.2, end: 4.8 },
        ],
      },
      {
        speaker: 'nam',
        start: 5.0,
        end: 10.0,
        enText: "Totally! Let's edit our travel vlog and add dynamic bilingual subtitles right away.",
        words: [
          { text: 'Công', en: 'Totally!', start: 5.0, end: 5.5 },
          { text: 'nhận!', en: "Let's", start: 5.5, end: 6.0 },
          { text: 'Cùng', en: 'edit', start: 6.0, end: 6.5 },
          { text: 'dựng', en: 'our', start: 6.5, end: 7.0 },
          { text: 'vlog', en: 'travel', start: 7.0, end: 7.5 },
          { text: 'du', en: 'vlog', start: 7.5, end: 8.0 },
          { text: 'lịch', en: 'and add', start: 8.0, end: 8.5 },
          { text: 'và', en: 'dynamic', start: 8.5, end: 9.0 },
          { text: 'thêm', en: 'bilingual', start: 9.0, end: 9.5 },
          { text: 'phụ đề nhé!', en: 'subtitles!', start: 9.5, end: 10.0 },
        ],
      },
      {
        speaker: 'an',
        start: 10.3,
        end: 14.8,
        enText: 'I love the Highlight Marker style—it looks like yellow highlighter on crisp white paper.',
        words: [
          { text: 'Mình', en: 'I love', start: 10.3, end: 10.8 },
          { text: 'thích', en: 'the', start: 10.8, end: 11.3 },
          { text: 'kiểu', en: 'Highlight', start: 11.3, end: 11.8 },
          { text: 'Bút', en: 'Marker', start: 11.8, end: 12.3 },
          { text: 'Dạ', en: 'style', start: 12.3, end: 12.8 },
          { text: 'Quang', en: 'on', start: 12.8, end: 13.4 },
          { text: 'trên', en: 'crisp', start: 13.4, end: 14.0 },
          { text: 'nền trắng!', en: 'white paper!', start: 14.0, end: 14.8 },
        ],
      },
    ],
  },
};

// Định dạng giây thành mm:ss
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Chuyển đổi timestamp dạng hh:mm:ss.sss hoặc mm:ss.sss sang giây
function parseVttTimestamp(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr) || 0;
}

// Phân tích cú pháp chuỗi WebVTT text lưu trong cơ sở dữ liệu
function parseVttText(vttString) {
  if (!vttString || typeof vttString !== 'string') return [];
  const lines = vttString.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((s) => s.trim().split(' ')[0]);
      const start = parseVttTimestamp(startStr);
      const end = parseVttTimestamp(endStr);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== '') {
        // Loại bỏ các thẻ WebVTT dạng <v Mai> hoặc <c.yellow> nếu có
        const clean = lines[i].replace(/<[^>]+>/g, '').trim();
        if (clean) textLines.push(clean);
        i++;
      }
      const rawText = textLines.join(' ');
      if (rawText) {
        cues.push({ start, end, text: rawText });
      }
    }
    i++;
  }
  return cues;
}

// Hàm lấy danh sách từ theo chế độ hiển thị ngôn ngữ
function getLineWords(line, mode) {
  if (!line) return [];
  if (mode === 'en') {
    if (line.enWords && line.enWords.length > 0) return line.enWords;
    return (line.words || []).map((w) => ({
      ...w,
      text: w.en || w.text,
      en: w.en || w.text,
    }));
  }
  if (mode === 'vi') {
    if (line.viWords && line.viWords.length > 0) return line.viWords;
    return (line.words || []).map((w) => ({
      ...w,
      text: w.vi || w.text,
      vi: w.vi || w.text,
    }));
  }
  // Chế độ 'bilingual' (Song ngữ):
  // Ưu tiên danh sách từ theo tiếng nói trong video (tiếng Anh) để chạy karaoke thời gian thực
  if (line.enWords && line.enWords.length > 0) return line.enWords;
  return line.words || [];
}

// Tìm phụ đề khớp thời gian nhất giữa hai ngôn ngữ (đồng bộ mốc thời gian chuẩn xác 100%)
function findBestMatchingCue(targetCue, candidateCues, targetIdx, totalTargetCues) {
  if (!candidateCues || candidateCues.length === 0) return null;
  if (!targetCue) return null;

  // 1. Trường hợp phổ biến nhất: Số lượng câu 2 bên bằng nhau -> Ghép chuẩn 1-1 theo index
  if (candidateCues.length === totalTargetCues && candidateCues[targetIdx]) {
    const directCue = candidateCues[targetIdx];
    if (Math.abs(directCue.start - targetCue.start) < 4.0) {
      return directCue;
    }
  }

  // 2. Trường hợp số lượng câu khác nhau: Tìm cue có thời gian trùng lặp (overlap) lớn nhất
  let bestCue = null;
  let maxOverlap = 0;

  for (let i = 0; i < candidateCues.length; i++) {
    const cand = candidateCues[i];
    const overlap = Math.max(0, Math.min(targetCue.end, cand.end) - Math.max(targetCue.start, cand.start));
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestCue = cand;
    }
  }

  // Nếu có đoạn trùng lặp thời gian đáng kể (> 0.25s)
  if (bestCue && maxOverlap > 0.25) {
    return bestCue;
  }

  // 3. Nếu không có đoạn trùng lặp rõ ràng, tìm cue có điểm giữa thời gian (mid-point) gần nhất
  const targetMid = (targetCue.start + targetCue.end) / 2;
  let minDiff = Infinity;
  let closestCue = null;

  for (let i = 0; i < candidateCues.length; i++) {
    const cand = candidateCues[i];
    const candMid = (cand.start + cand.end) / 2;
    const diff = Math.abs(candMid - targetMid);
    if (diff < minDiff && diff < 3.5) {
      minDiff = diff;
      closestCue = cand;
    }
  }

  if (closestCue) return closestCue;

  // 4. Fallback theo tỷ lệ index
  const proportionalIdx = Math.min(
    candidateCues.length - 1,
    Math.max(0, Math.round(targetIdx * (candidateCues.length / totalTargetCues)))
  );
  return candidateCues[proportionalIdx] || null;
}

export const CaptionStudio = ({
  lesson = null,
  onBack,
  parentTitle = 'Videos',
  hideHeader = false,
  onTitleChange = null,
}) => {
  // Danh sách video bài giảng lưu trong database (Cloudinary)
  const [dbVideos, setDbVideos] = useState([]);
  const [selectedVideoKey, setSelectedVideoKey] = useState(() => {
    if (lesson?.publicId) return `db_${lesson.publicId}`;
    if (lesson?.id) return `db_${lesson.id}`;
    return 'ai_podcast';
  });

  const [customVideoUrl, setCustomVideoUrl] = useState(null);
  const [customTitle, setCustomTitle] = useState(null);

  // Phụ đề tải về từ Cloudinary URL (trong trường hợp DB chưa lưu text)
  const [fetchedVttEn, setFetchedVttEn] = useState(lesson?.vttEnText || '');
  const [fetchedVttVi, setFetchedVttVi] = useState(lesson?.vttViText || '');
  const [loadingSubs, setLoadingSubs] = useState(false);

  // 1. Tải danh sách video bài giảng từ database Cloudinary
  useEffect(() => {
    let isMounted = true;
    api.getPublicVideos()
      .then((list) => {
        if (!isMounted) return;
        if (Array.isArray(list) && list.length > 0) {
          setDbVideos(list);
          if (lesson) {
            const match = list.find((v) => v.publicId === lesson.publicId || v.id === lesson.id);
            if (match) {
              setSelectedVideoKey(`db_${match.publicId || match.id}`);
            }
          }
        }
      })
      .catch((err) => console.warn('Lỗi khi tải video từ Database:', err));

    return () => { isMounted = false; };
  }, [lesson]);

  // 2. Xác định đối tượng video đang được chọn từ Database Cloudinary
  const currentDbVideo = useMemo(() => {
    if (selectedVideoKey.startsWith('db_')) {
      const targetId = selectedVideoKey.replace('db_', '');
      const foundInList = dbVideos.find((v) => (v.publicId || v.id) === targetId);
      if (foundInList) return foundInList;
      if (lesson && (lesson.publicId === targetId || lesson.id === targetId)) return lesson;
    }
    return null;
  }, [selectedVideoKey, dbVideos, lesson]);

  // 3. Tải phụ đề từ Cloudinary nếu video chỉ có URL (chưa lưu trực tiếp text vào DB)
  useEffect(() => {
    if (!currentDbVideo) {
      setFetchedVttEn('');
      setFetchedVttVi('');
      return;
    }

    // Xử lý phụ đề tiếng Anh
    if (currentDbVideo.vttEnText) {
      setFetchedVttEn(currentDbVideo.vttEnText);
    } else if (currentDbVideo.vttEnUrl) {
      setLoadingSubs(true);
      fetch(currentDbVideo.vttEnUrl)
        .then((r) => (r.ok ? r.text() : ''))
        .then((text) => setFetchedVttEn(text))
        .catch((e) => console.warn('Lỗi khi nạp file VTT EN từ Cloudinary:', e))
        .finally(() => setLoadingSubs(false));
    } else {
      setFetchedVttEn('');
    }

    // Xử lý phụ đề tiếng Việt
    if (currentDbVideo.vttViText) {
      setFetchedVttVi(currentDbVideo.vttViText);
    } else if (currentDbVideo.vttViUrl) {
      fetch(currentDbVideo.vttViUrl)
        .then((r) => (r.ok ? r.text() : ''))
        .then((text) => setFetchedVttVi(text))
        .catch((e) => console.warn('Lỗi khi nạp file VTT VI từ Cloudinary:', e));
    } else {
      setFetchedVttVi('');
    }
  }, [currentDbVideo]);

  // 4. Xây dựng dữ liệu kịch bản và phụ đề tương tác chạy theo từng từ
  const scenarioData = useMemo(() => {
    if (currentDbVideo) {
      const enVtt = currentDbVideo.vttEnText || fetchedVttEn;
      const viVtt = currentDbVideo.vttViText || fetchedVttVi;

      let parsedTranscript = [];

      if (enVtt || viVtt) {
        const enCues = parseVttText(enVtt);
        const viCues = parseVttText(viVtt);

        // Chuẩn hóa mốc thời gian: Ưu tiên tiếng Anh làm cơ sở nếu có, ngược lại dùng tiếng Việt
        const baseCues = enCues.length > 0 ? enCues : viCues;
        const totalBase = baseCues.length;

        parsedTranscript = baseCues.map((cue, idx) => {
          let enCue = null;
          let viCue = null;

          if (baseCues === enCues) {
            enCue = cue;
            viCue = findBestMatchingCue(cue, viCues, idx, totalBase);
          } else {
            viCue = cue;
            enCue = findBestMatchingCue(cue, enCues, idx, totalBase);
          }

          const enSentence = (enCue ? enCue.text : '').trim();
          const viSentence = (viCue ? viCue.text : '').trim();

          const start = cue.start;
          const end = cue.end;
          const duration = Math.max(end - start, 0.4);

          // Tách riêng từ tiếng Anh thuần túy (Tuyệt đối không lẫn từ tiếng Việt)
          const rawEnWords = enSentence.split(/\s+/).filter(Boolean);
          const stepEn = rawEnWords.length > 0 ? duration / rawEnWords.length : 0.2;
          const enWords = rawEnWords.map((word, wIdx) => ({
            text: word,
            en: word,
            start: Number((start + wIdx * stepEn).toFixed(2)),
            end: Number((start + (wIdx + 1) * stepEn).toFixed(2)),
          }));

          // Tách riêng từ tiếng Việt thuần túy (Tuyệt đối không lẫn từ tiếng Anh)
          const rawViWords = viSentence.split(/\s+/).filter(Boolean);
          const stepVi = rawViWords.length > 0 ? duration / rawViWords.length : 0.2;
          const viWords = rawViWords.map((word, wIdx) => ({
            text: word,
            vi: word,
            start: Number((start + wIdx * stepVi).toFixed(2)),
            end: Number((start + (wIdx + 1) * stepVi).toFixed(2)),
          }));

          return {
            speaker: idx % 2 === 0 ? 'mai' : 'tuan',
            start,
            end,
            enText: enSentence,
            viText: viSentence,
            enWords,
            viWords,
            words: enWords.length > 0 ? enWords : viWords,
          };
        });
      }

      // Nếu video chưa có subtitle VTT, tạo câu thoại khởi đầu thân thiện
      if (parsedTranscript.length === 0) {
        const titleText = currentDbVideo.title || 'Video Bài Học';
        parsedTranscript = [
          {
            speaker: 'mai',
            start: 0.4,
            end: 4.5,
            enText: `Welcome to the lesson: ${titleText}`,
            viText: `Chào mừng bạn đến với bài giảng: ${titleText}`,
            words: [
              { text: 'Chào', en: 'Welcome', start: 0.4, end: 1.0 },
              { text: 'mừng', en: 'to', start: 1.0, end: 1.6 },
              { text: 'bạn', en: 'the', start: 1.6, end: 2.2 },
              { text: 'đến', en: 'lesson:', start: 2.2, end: 2.8 },
              { text: 'với', en: titleText, start: 2.8, end: 3.4 },
              { text: 'bài học!', en: 'Enjoy!', start: 3.4, end: 4.5 },
            ],
          },
        ];
      }

      return {
        title: currentDbVideo.title || 'Video Bài Học',
        videoUrl: currentDbVideo.secureUrl || currentDbVideo.url || currentDbVideo.videoUrl,
        speakers: {
          mai: {
            name: currentDbVideo.createdBy || 'Giảng viên',
            role: 'Cloudinary Instructor',
            avatar: '👩‍🏫',
            badgeBg: 'bg-indigo-50',
            badgeText: 'text-indigo-700',
            badgeBorder: 'border-indigo-200',
            accentColor: '#4f46e5',
          },
          tuan: {
            name: 'Học viên QuizCard',
            role: 'Active Learner',
            avatar: '👨‍🎓',
            badgeBg: 'bg-sky-50',
            badgeText: 'text-sky-700',
            badgeBorder: 'border-sky-200',
            accentColor: '#0284c7',
          },
        },
        transcript: parsedTranscript,
      };
    }

    return SCENARIOS[selectedVideoKey] || SCENARIOS.ai_podcast;
  }, [currentDbVideo, selectedVideoKey, fetchedVttEn, fetchedVttVi]);

  const activeTitle = customTitle || (currentDbVideo ? currentDbVideo.title : (lesson?.title || scenarioData.title));
  const activeVideoSrc = customVideoUrl || (currentDbVideo ? (currentDbVideo.secureUrl || currentDbVideo.url || currentDbVideo.videoUrl) : (lesson?.secureUrl || lesson?.url || scenarioData.videoUrl));

  // Báo tiêu đề bài học lên component cha (App.jsx Topbar)
  useEffect(() => {
    if (activeTitle && typeof onTitleChange === 'function') {
      onTitleChange(activeTitle);
    }
  }, [activeTitle, onTitleChange]);

  // Trạng thái phát video
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // Trạng thái tùy chỉnh phụ đề
  const [subtitleStyle, setSubtitleStyle] = useState('style-light-glass'); // 'style-light-glass' | 'style-capcut' | 'style-marker' | 'style-cinema'
  const [langMode, setLangMode] = useState('bilingual'); // 'bilingual' | 'vi' | 'en'
  const [subtitlePosition, setSubtitlePosition] = useState('bottom'); // 'bottom' | 'top'
  const [fontSize, setFontSize] = useState(12);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  // Chế độ co giãn khung hình video: 'contain' (vừa khung hình nguyên bản, không cắt) hoặc 'cover' (lấp đầy 16:9)
  const [videoFit, setVideoFit] = useState('contain');

  // Tính năng học tập
  const [loopCurrentSentence, setLoopCurrentSentence] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarkedLines, setBookmarkedLines] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Từ được chọn hiển thị ở thanh Inspector
  const [inspectorData, setInspectorData] = useState({
    vi: 'Chào',
    en: 'Welcome',
    time: 0.4,
    speakerName: 'Mai Linh',
  });

  // Tìm câu và từ đang hoạt động theo thời gian thực
  const { activeLineIndex, activeWordIndex, currentLineObj, currentSpeaker } = useMemo(() => {
    const transcript = scenarioData.transcript;
    let lineIdx = -1;
    let lineObj = null;

    for (let i = 0; i < transcript.length; i++) {
      const item = transcript[i];
      if (currentTime >= item.start && currentTime <= item.end + 0.25) {
        lineIdx = i;
        lineObj = item;
        break;
      }
    }

    let wordIdx = -1;
    if (lineObj) {
      const activeWords = getLineWords(lineObj, langMode);
      for (let w = 0; w < activeWords.length; w++) {
        const wObj = activeWords[w];
        if (currentTime >= wObj.start && currentTime <= wObj.end) {
          wordIdx = w;
          break;
        } else if (
          currentTime > wObj.end &&
          (w === activeWords.length - 1 || currentTime < activeWords[w + 1]?.start)
        ) {
          wordIdx = w;
        }
      }
    }

    const speaker = lineObj ? scenarioData.speakers[lineObj.speaker] : null;

    return {
      activeLineIndex: lineIdx,
      activeWordIndex: wordIdx,
      currentLineObj: lineObj,
      currentSpeaker: speaker,
    };
  }, [scenarioData, currentTime, langMode]);

  // Nhảy tới mốc thời gian cụ thể
  const seekTo = useCallback((time) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, time);
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  // Xử lý bật/tắt phát video
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Phím tắt Space để Play/Pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Xử lý lặp lại câu thoại hiện tại (Loop sentence)
  useEffect(() => {
    if (loopCurrentSentence && currentLineObj) {
      if (currentTime >= currentLineObj.end) {
        seekTo(currentLineObj.start);
      }
    }
  }, [loopCurrentSentence, currentLineObj, currentTime, seekTo]);

  // Tự động cuộn hội thoại theo lời đang đọc
  useEffect(() => {
    if (autoScrollEnabled && activeLineIndex !== -1 && transcriptContainerRef.current) {
      const activeEl = document.getElementById(`cs-dialogue-${activeLineIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeLineIndex, autoScrollEnabled]);

  // Xử lý sự kiện timeupdate của Video
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Tự động tua về đầu nếu phát vượt quá kịch bản
    const transcript = scenarioData.transcript;
    const lastEnd = transcript[transcript.length - 1].end + 0.8;
    if (cur > lastEnd) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const transcript = scenarioData.transcript;
    const maxEnd = transcript[transcript.length - 1].end + 1;
    const effDur = Math.min(videoRef.current.duration || 16, maxEnd);
    setDuration(effDur);
  };

  // Điều khiển âm lượng
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (newMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setVolume(volume > 0 ? volume : 1);
    }
  };

  // Tốc độ phát
  const handleSpeedSelect = (speed) => {
    setPlaybackSpeed(speed);
    setIsSpeedMenuOpen(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toàn màn hình
  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Đánh dấu câu thoại
  const toggleBookmark = (lineIdx, e) => {
    e.stopPropagation();
    setBookmarkedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineIdx)) next.delete(lineIdx);
      else next.add(lineIdx);
      return next;
    });
  };

  // Tải video từ máy tính để luyện tập (phát tức thì qua Blob URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setCustomVideoUrl(localUrl);
    setCustomTitle(`Video máy tính: ${file.name.replace(/\.[^/.]+$/, '')}`);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 100);
  };

  // Lọc danh sách hội thoại bên cột phải
  const filteredTranscript = useMemo(() => {
    return scenarioData.transcript.filter((item, idx) => {
      if (showBookmarksOnly && !bookmarkedLines.has(idx)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullVi = (item.viText || (item.viWords ? item.viWords.map((w) => w.text).join(' ') : item.words.map((w) => w.text).join(' '))).toLowerCase();
        const fullEn = (item.enText || (item.enWords ? item.enWords.map((w) => w.text).join(' ') : '')).toLowerCase();
        if (!fullVi.includes(q) && !fullEn.includes(q)) return false;
      }
      return true;
    });
  }, [scenarioData, showBookmarksOnly, bookmarkedLines, searchQuery]);

  // Thống kê tổng số từ theo ngôn ngữ hiển thị
  const totalWordsCount = useMemo(() => {
    return scenarioData.transcript.reduce((acc, line) => {
      const words = getLineWords(line, langMode);
      return acc + words.length;
    }, 0);
  }, [scenarioData, langMode]);

  return (
    <div className="cs-wrapper">
      {/* ============================================================ */}
      {/* 1. HEADER BAR                                               */}
      {/* ============================================================ */}
      {/* 1. HEADER BAR (Chỉ hiển thị khi không được nhúng vào Topbar của App.jsx) */}
      {!hideHeader && (
        <header className="cs-header">
          <div className="cs-header-inner">
            {/* Left: Breadcrumb điều hướng quay về (tương tự StudyArena, QuizArena) */}
            <div className="cs-header-left">
              <div className="qc-breadcrumb cs-breadcrumb">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="qc-breadcrumb-back"
                    title={`Quay lại danh sách ${parentTitle}`}
                  >
                    ← {parentTitle}
                  </button>
                ) : (
                  <span className="qc-breadcrumb-back">← {parentTitle}</span>
                )}
                <span className="qc-breadcrumb-sep">/</span>
                <span className="qc-breadcrumb-current" title={activeTitle}>
                  {activeTitle}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN WORKSPACE (2 CỘT)                                   */}
      {/* ============================================================ */}
      <main className="cs-main-grid">
        {/* CỘT TRÁI: VIDEO PLAYER & BẢNG TUỲ BIẾN PHỤ ĐỀ */}
        <div className="cs-left-col">
          {/* Card Trình phát Video */}
          <div className="cs-player-card">
            {/* Dải trạng thái đầu video */}
            <div className="cs-status-strip">
              <div className="cs-status-left">
                <div className={`cs-eq-indicator ${isPlaying ? 'playing' : ''}`}>
                  <span className="cs-eq-bar" />
                  <span className="cs-eq-bar" />
                  <span className="cs-eq-bar" />
                </div>
                <span className="cs-scenario-badge" title={activeTitle}>
                  {activeTitle}
                </span>
              </div>
            </div>

            {/* Màn hình Video Viewport */}
            <div ref={playerContainerRef} className="cs-video-viewport" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={activeVideoSrc}
                className={`cs-video-element fit-${videoFit}`}
                playsInline
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                {(currentDbVideo?.vttEnUrl || lesson?.vttEnUrl) && (
                  <track
                    kind="subtitles"
                    src={currentDbVideo?.vttEnUrl || lesson?.vttEnUrl}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
                {(currentDbVideo?.vttViUrl || lesson?.vttViUrl) && (
                  <track
                    kind="subtitles"
                    src={currentDbVideo?.vttViUrl || lesson?.vttViUrl}
                    srcLang="vi"
                    label="Tiếng Việt"
                  />
                )}
              </video>

              {/* Lớp gradient bóng mờ đáy video để phụ đề nổi bật */}
              <div className="cs-video-gradient-bottom" />

              {/* Nút Play lớn ở giữa khi tạm dừng */}
              {!isPlaying && (
                <button
                  type="button"
                  className="cs-big-play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  title="Bấm để phát (Phím Space)"
                >
                  <Play size={32} fill="#4f46e5" style={{ marginLeft: 3 }} />
                </button>
              )}

              {/* Huy hiệu cảnh báo đang lặp câu */}
              {loopCurrentSentence && (
                <div className="cs-loop-badge">
                  <Repeat1 size={14} />
                  <span>Đang lặp câu thoại hiện tại</span>
                </div>
              )}

              {/* ========================================== */}
              {/* PHỤ ĐỀ KARAOKE NỔI ĐỘNG TRÊN MẶT VIDEO      */}
              {/* ========================================== */}
              {subtitlesVisible && (
                <div className={`cs-caption-overlay ${subtitlePosition === 'top' ? 'pos-top' : 'pos-bottom'}`}>
                
                  {/* Hộp phụ đề chạy chữ từng từ (Karaoke Box) */}
                  <div
                    className={`caption-box ${subtitleStyle}`}
                    style={{ fontSize: `${fontSize}px` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentLineObj ? (
                      (() => {
                        const wordsToDisplay = getLineWords(currentLineObj, langMode);
                        return wordsToDisplay.map((w, idx) => {
                          let cls = 'caption-word';
                          if (idx === activeWordIndex) cls += ' active';
                          else if (idx < activeWordIndex) cls += ' past';

                          const displayText = langMode === 'en' ? (w.en || w.text) : (langMode === 'vi' ? (w.vi || w.text) : (w.en || w.text));
                          return (
                            <span
                              key={w.start + '-' + idx}
                              className={cls}
                              onClick={() => seekTo(w.start)}
                              title={`Nhảy tới @ ${w.start.toFixed(1)}s`}
                            >
                              {displayText}
                            </span>
                          );
                        });
                      })()
                    ) : (
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                        ▶ Bấm Phát hoặc chọn một từ bất kỳ bên phải để bắt đầu...
                      </span>
                    )}
                  </div>

                  {/* Bản dịch phụ song ngữ phía dưới hộp phụ đề chính (Chỉ hiện khi ở chế độ Song ngữ) */}
                  {langMode === 'bilingual' && (currentLineObj?.viText || (!currentDbVideo && currentLineObj?.enText)) && (
                    <div className="cs-caption-translation" onClick={(e) => e.stopPropagation()}>
                      {currentLineObj.viText || currentLineObj.enText}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thanh điều khiển Video (Video Controls Bar) */}
            <div className="cs-controls-bar">
              {/* Thanh Seek Bar có mốc câu thoại */}
              <div className="cs-seekbar-container">
                <div className="cs-timeline-markers">
                  {scenarioData.transcript.map((item, idx) => {
                    const spk = scenarioData.speakers[item.speaker];
                    const leftPct = Math.min(98, Math.max(1, (item.start / Math.max(duration, 1)) * 100));
                    return (
                      <div
                        key={idx}
                        className="cs-timeline-marker-dot"
                        style={{
                          left: `${leftPct}%`,
                          backgroundColor: spk?.accentColor || '#4f46e5',
                        }}
                        title={`${spk?.name || ''}: ${formatTime(item.start)}`}
                      />
                    );
                  })}
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(duration, 1)}
                  step="0.02"
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="cs-range-slider"
                  style={{
                    background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(currentTime / Math.max(duration, 1)) * 100}%, #e2e8f0 ${(currentTime / Math.max(duration, 1)) * 100}%, #e2e8f0 100%)`
                  }}
                />
              </div>

              {/* Các nút điều khiển hàng dưới */}
              <div className="cs-controls-row">
                {/* Nhóm trái: Play/Pause, tua -5s/+5s, lặp câu, đồng hồ */}
                <div className="cs-controls-left">
                  <button
                    type="button"
                    className="cs-btn-play-pause"
                    onClick={togglePlay}
                    title="Phát / Tạm dừng (Phím Space)"
                  >
                    {isPlaying ? <Pause size={17} fill="#ffffff" /> : <Play size={17} fill="#ffffff" />}
                  </button>

                  <button
                    type="button"
                    className="cs-btn-icon"
                    onClick={() => seekTo(currentTime - 5)}
                    title="Lùi 5 giây"
                  >
                    <RotateCcw size={17} />
                  </button>

                  <button
                    type="button"
                    className="cs-btn-icon"
                    onClick={() => seekTo(currentTime + 5)}
                    title="Tua tới 5 giây"
                  >
                    <RotateCw size={17} />
                  </button>

                  {/* Nút Lặp câu thoại */}
                  <button
                    type="button"
                    className={`cs-btn-loop ${loopCurrentSentence ? 'active' : ''}`}
                    onClick={() => setLoopCurrentSentence((prev) => !prev)}
                    title="Lặp lại câu hội thoại hiện tại để luyện nghe"
                  >
                    <Repeat size={14} />
                    <span>Lặp câu</span>
                  </button>

                  {/* Đồng hồ thời gian */}
                  <div className="cs-time-display">
                    <span className="cs-time-current">{formatTime(currentTime)}</span>
                    <span className="cs-time-sep">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Nhóm phải: Âm lượng, Bật/Tắt CC, Tốc độ, Toàn màn hình */}
                <div className="cs-controls-right">
                  {/* Âm lượng */}
                  <div className="cs-volume-box">
                    <button type="button" className="cs-btn-icon" onClick={handleToggleMute}>
                      {isMuted || volume === 0 ? (
                        <VolumeX size={16} color="#ef4444" />
                      ) : volume < 0.5 ? (
                        <Volume1 size={16} />
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="cs-range-slider"
                      style={{
                        width: '56px',
                        background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(isMuted ? 0 : volume) * 100}%, #e2e8f0 ${(isMuted ? 0 : volume) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                  </div>

                  {/* Nút CC Subtitle */}
                  <button
                    type="button"
                    className={`cs-btn-cc ${!subtitlesVisible ? 'inactive' : ''}`}
                    onClick={() => setSubtitlesVisible((prev) => !prev)}
                    title="Ẩn / Hiện phụ đề trên video"
                  >
                    <Subtitles size={15} />
                    <span>CC</span>
                  </button>

                  {/* Chuyển đổi chế độ co giãn video: Vừa khung (không bị cắt) / Lấp đầy (phóng to) */}
                  <button
                    type="button"
                    className={`cs-btn-fit ${videoFit === 'contain' ? 'active' : ''}`}
                    onClick={() => setVideoFit((prev) => (prev === 'contain' ? 'cover' : 'contain'))}
                    title={
                      videoFit === 'contain'
                        ? 'Đang ở chế độ Vừa khung (Hiển thị đầy đủ 100%, không bị phóng to cắt góc). Bấm để chuyển sang Lấp đầy'
                        : 'Đang ở chế độ Lấp đầy (Cover). Bấm để thu về Vừa khung hình nguyên bản'
                    }
                  >
                    {videoFit === 'contain' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    <span>{videoFit === 'contain' ? 'Vừa khung' : 'Lấp đầy'}</span>
                  </button>

                  {/* Tốc độ phát */}
                  <div className="cs-speed-container">
                    <button
                      type="button"
                      className="cs-speed-btn"
                      onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                    >
                      {playbackSpeed}x
                    </button>

                    {isSpeedMenuOpen && (
                      <div className="cs-speed-menu">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`cs-speed-opt ${playbackSpeed === s ? 'active' : ''}`}
                            onClick={() => handleSpeedSelect(s)}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toàn màn hình */}
                  <button
                    type="button"
                    className="cs-btn-icon"
                    onClick={handleToggleFullscreen}
                    title="Toàn màn hình"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card Tùy chỉnh Kiểu Dáng & Vị Trí Phụ Đề */}
          <div className="cs-custom-card">
            <div className="cs-custom-header">
              <div className="cs-custom-title-box">
                <div className="cs-custom-icon">
                  <Wand2 size={16} />
                </div>
                <h3 className="cs-custom-title">Tuỳ Chỉnh Hiệu Ứng Phụ Đề Chạy Chữ</h3>
              </div>

              {/* Nút đổi vị trí Trên / Dưới */}
              <button
                type="button"
                className="cs-btn-loop"
                onClick={() => setSubtitlePosition((p) => (p === 'bottom' ? 'top' : 'bottom'))}
                title="Đổi vị trí hiển thị phụ đề"
              >
                {subtitlePosition === 'bottom' ? (
                  <AlignEndHorizontal size={14} color="#4f46e5" />
                ) : (
                  <AlignStartHorizontal size={14} color="#4f46e5" />
                )}
                <span>Vị trí: {subtitlePosition === 'bottom' ? 'Bên dưới' : 'Phía trên'}</span>
              </button>
            </div>

            {/* Lựa chọn 4 phong cách visual & thanh trượt cỡ chữ */}
            <div className="cs-custom-grid">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  Phong cách hiển thị từng từ (Word-by-Word Style):
                </label>
                <div className="cs-style-buttons">
                  <button
                    type="button"
                    className={`cs-style-btn ${subtitleStyle === 'style-light-glass' ? 'active' : ''}`}
                    onClick={() => setSubtitleStyle('style-light-glass')}
                  >
                    ✨ Light Glass
                  </button>
                  <button
                    type="button"
                    className={`cs-style-btn ${subtitleStyle === 'style-capcut' ? 'active' : ''}`}
                    onClick={() => setSubtitleStyle('style-capcut')}
                  >
                    🔥 CapCut Pop
                  </button>
                  <button
                    type="button"
                    className={`cs-style-btn ${subtitleStyle === 'style-marker' ? 'active' : ''}`}
                    onClick={() => setSubtitleStyle('style-marker')}
                  >
                    🖍️ Bút Dạ Quang
                  </button>
                  <button
                    type="button"
                    className={`cs-style-btn ${subtitleStyle === 'style-cinema' ? 'active' : ''}`}
                    onClick={() => setSubtitleStyle('style-cinema')}
                  >
                    🎬 Cinema Clean
                  </button>
                </div>
              </div>

              {/* Điều chỉnh cỡ chữ */}
              <div className="cs-fontsize-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cỡ chữ phụ đề</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="16"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="cs-range-slider"
                  style={{
                    background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((fontSize - 12) / 4) * 100}%, #e2e8f0 ${((fontSize - 12) / 4) * 100}%, #e2e8f0 100%)`
                  }}
                />
              </div>
            </div>

            {/* Thanh nhân vật trong hội thoại */}
            <div className="cs-speakers-legend-bar">
              <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MousePointerClick size={14} color="#6366f1" />
                <span>Chạm vào từng từ để phát ngay tại giây đó</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI: KỊCH BẢN HỘI THOẠI ĐỒNG BỘ (TRANSCRIPT PANEL)        */}
        {/* ============================================================ */}
        <div className="cs-transcript-panel">
          {/* Header Panel */}
          <div className="cs-transcript-header">
            <div className="cs-transcript-title-box">
              <span className="cs-transcript-indicator-dot" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Lọc chỉ xem đã đánh dấu */}
              <button
                type="button"
                className={`cs-btn-loop ${showBookmarksOnly ? 'active' : ''}`}
                onClick={() => setShowBookmarksOnly((prev) => !prev)}
                title="Chỉ xem các câu đã đánh dấu"
              >
                <Bookmark size={13} color="#d97706" />
                <span>{bookmarkedLines.size}</span>
              </button>

              {/* Tự cuộn */}
              <button
                type="button"
                className={`cs-btn-loop ${autoScrollEnabled ? 'active' : ''}`}
                onClick={() => setAutoScrollEnabled((prev) => !prev)}
                title="Tự động cuộn theo lời thoại đang đọc"
              >
                <ArrowDownToLine size={13} />
                <span>Tự cuộn</span>
              </button>
            </div>
          </div>

          {/* Thanh chuyển chế độ ngôn ngữ phụ đề cân đối (Full-width Segmented Control) */}
          <div className="cs-transcript-lang-bar">
            <div className="cs-lang-group">
              <button
                type="button"
                className={`cs-lang-btn ${langMode === 'bilingual' ? 'active' : ''}`}
                onClick={() => setLangMode('bilingual')}
              >
                Song ngữ VI–EN
              </button>
              <button
                type="button"
                className={`cs-lang-btn ${langMode === 'vi' ? 'active' : ''}`}
                onClick={() => setLangMode('vi')}
              >
                Chỉ Tiếng Việt
              </button>
              <button
                type="button"
                className={`cs-lang-btn ${langMode === 'en' ? 'active' : ''}`}
                onClick={() => setLangMode('en')}
              >
                Chỉ Tiếng Anh
              </button>
            </div>
          </div>

          {/* Ô tìm kiếm hội thoại */}
          <div className="cs-transcript-search-bar">
            <Search size={15} className="cs-search-icon-left" />
            <input
              type="text"
              placeholder="Tìm từ vựng, cụm từ hoặc nội dung hội thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cs-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="cs-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Danh sách thẻ hội thoại có thể cuộn */}
          <div ref={transcriptContainerRef} className="cs-dialogue-list">
            {filteredTranscript.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '13px' }}>
                Không tìm thấy câu hội thoại nào khớp với bộ lọc.
              </div>
            ) : (
              filteredTranscript.map((line) => {
                const actualIndex = scenarioData.transcript.indexOf(line);
                const spk = scenarioData.speakers[line.speaker];
                const isCurrentLine = actualIndex === activeLineIndex;
                const isBookmarked = bookmarkedLines.has(actualIndex);

                return (
                  <div
                    key={actualIndex}
                    id={`cs-dialogue-${actualIndex}`}
                    className={`cs-dialogue-card ${isCurrentLine ? 'active-line' : ''}`}
                    onClick={() => seekTo(line.start)}
                  >
                    {/* Header câu: Người nói, Bookmark & Nút thời gian */}
                    <div className="cs-dialogue-top">

                      <div className="cs-dialogue-actions">
                        <button
                          type="button"
                          className={`cs-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                          onClick={(e) => toggleBookmark(actualIndex, e)}
                          title="Đánh dấu câu thoại này"
                        >
                          <Bookmark size={14} fill={isBookmarked ? '#d97706' : 'none'} />
                        </button>

                        <button
                          type="button"
                          className="cs-timestamp-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(line.start);
                          }}
                          title="Nhảy tới đầu câu"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>{formatTime(line.start)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dòng chữ từng từ có thể click để phát */}
                    <div className="cs-words-flow">
                      {(() => {
                        const lineWords = getLineWords(line, langMode);
                        return lineWords.map((w, wIdx) => {
                          const isWordActive = isCurrentLine && wIdx === activeWordIndex;
                          const wordText = langMode === 'en' ? (w.en || w.text) : (langMode === 'vi' ? (w.vi || w.text) : (w.en || w.text));

                          return (
                            <span
                              key={w.start + '-' + wIdx}
                              className={`tr-word ${isWordActive ? 'active-word' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectorData({
                                  vi: w.vi || line.viText || w.text,
                                  en: w.en || line.enText || w.text,
                                  time: w.start,
                                  speakerName: spk?.name || 'Speaker',
                                });
                                seekTo(w.start);
                              }}
                            >
                              {wordText}
                            </span>
                          );
                        });
                      })()}
                    </div>

                    {/* Dịch nghĩa song ngữ tiếng Việt bên dưới (Chỉ hiển thị khi bật chế độ Song ngữ) */}
                    {langMode === 'bilingual' && (line.viText || (!currentDbVideo && line.enText)) && (
                      <div className="cs-dialogue-translation">
                        <Globe size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{line.viText || line.enText}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Panel */}
          <div className="cs-transcript-footer">
            <div>
              <span>Tổng cộng: <strong style={{ color: '#0f172a' }}>{scenarioData.transcript.length} câu</strong></span>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>
              <span>Tổng số: <strong style={{ color: '#0f172a' }}>{totalWordsCount} từ</strong></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

