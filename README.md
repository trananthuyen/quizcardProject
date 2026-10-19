# QuizCard - Ứng Dụng Học Flashcard Thông Minh (OpenQuiz)

QuizCard là ứng dụng học từ vựng và thuật ngữ qua Flashcard, áp dụng kỹ thuật lặp lại ngắt quãng (**Spaced Repetition** / Leitner System rút gọn), giúp tối ưu hóa khả năng ghi nhớ dài hạn.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

* **Backend**: ASP.NET Core (.NET 10 Web API)
* **Frontend**: React 19 + TypeScript (Vite) + Lucide Icons + Canvas-Confetti
* **Database**: **SQLite** (file `quizcard.db` tự động tạo ngay trong thư mục dự án khi chạy)
* **Kiến trúc**: Single Host – ASP.NET Core vừa làm API vừa trực tiếp serve ứng dụng React SPA từ `wwwroot`.

---

## ✨ 3 Tính Năng Cốt Lõi Đã Hoàn Thiện

### 1. Quản lý Dự án / Bộ thẻ (Deck Management)
* **Tạo bộ thẻ mới**: Đặt tên bộ thẻ, mô tả mục tiêu học tập.
* **Chỉnh sửa / Xóa**: Cập nhật thông tin hoặc xóa bộ thẻ (tự động xóa kèm các thẻ con theo cơ chế Cascade Delete).
* **Thống kê tổng quan**: Theo dõi trực quan phần trăm mức độ thuộc, số lượng thẻ Đã thuộc, Đang học và Chưa học trên từng bộ thẻ.

### 2. Quản lý Thẻ Flashcard (Card Management)
* **Tạo thẻ từ chuỗi văn bản (Bulk Import - MỚI)**: Nhập nhanh hàng loạt thẻ bằng cách dán chuỗi danh sách. Hệ thống tự động nhận diện định dạng phân cách (`-`, `:`, `|`, `Tab`), hỗ trợ xem trước (Real-time Preview) và tạo hàng chục thẻ chỉ với 1 click!
* **Thêm thẻ lẻ**: Nhập **Thuật ngữ (Term)**, **Định nghĩa (Definition)** và **Ví dụ minh họa (Example)**.
* **Chỉnh sửa / Xóa thẻ**: Cập nhật nội dung thẻ tức thì.
* **Tìm kiếm & Lọc thông minh**: Lọc nhanh thẻ theo trạng thái (*Tất cả, Chưa học, Đang học, Đã thuộc*) và tìm kiếm theo từ khóa.
* **Theo dõi tiến độ thẻ**: Hiển thị số lần trả lời Đúng / Sai của từng thẻ.

### 3. Phòng học Thẻ (Study Mode)
* **Thẻ 3D sinh động**: Hiệu ứng lật thẻ 3D xoay 180° mượt mà (mặt trước: Thuật ngữ; mặt sau: Định nghĩa + Ví dụ).
* **Phát âm từ vựng (Text-to-Speech)**: Hỗ trợ đọc thuật ngữ và định nghĩa ngay trên thẻ.
* **Thuật toán Spaced Repetition (Quy tắc đã chốt)**:
  * **Nhớ đúng**: Tăng số lần đúng liên tiếp. Khi **đúng 3 lần liên tiếp** $\rightarrow$ Thẻ được công nhận **"Đã thuộc" (Mastered)** và giãn cách thời gian ôn tập tiếp theo (+3 ngày trở lên).
  * **Chưa nhớ**: Chuỗi đúng về 0, chuyển trạng thái **"Đang học" (Learning)**, và **thẻ được tự động đẩy về cuối phiên học** để người dùng lặp lại cho đến khi ghi nhớ.
* **Hỗ trợ Phím tắt nhanh**:
  * `[Space]`: Lật thẻ xem đáp án.
  * `[1]` hoặc `[←]`: Chưa nhớ / Sai.
  * `[2]` hoặc `[→]`: Đã nhớ đúng / Thuộc.
* **Màn hình tổng kết phiên học**: Bắn pháo hoa ăn mừng (Confetti), thống kê số thẻ đã ôn, số thẻ thuộc mới và độ chính xác của phiên học.

### 4. Luyện Thi Trắc Nghiệm (Multiple-Choice Quiz Mode - MỚI)
* **Tự động sinh đề thi 4 phương án (A, B, C, D)**: Lấy ngẫu nhiên các định nghĩa/thuật ngữ từ các thẻ khác trong bộ làm đáp án gây nhiễu (distractors).
* **3 Chế độ linh hoạt**:
  * *Thuật ngữ $\rightarrow$ Chọn Định nghĩa*
  * *Định nghĩa $\rightarrow$ Chọn Thuật ngữ*
  * *Trộn lẫn ngẫu nhiên (Mixed)*
* **Phản hồi tức thì & Học từ sai lầm**:
  * Chọn đúng: Nút đổi màu xanh lá và cộng điểm.
  * Chọn sai: Nút đổi màu đỏ, đồng thời hệ thống **tự động chỉ ra đáp án đúng** và ghi chú ví dụ để học lại ngay lập tức.
  * **Tự động lặp lại câu sai**: Những câu trả lời sai sẽ được tự động xếp vào cuối bài để người dùng làm lại cho đến khi đạt điểm tối đa!
* **Phím tắt cực nhanh**: Bấm phím `[1, 2, 3, 4]` hoặc `[A, B, C, D]` để chọn phương án, bấm `[Enter]` hoặc `[Space]` để chuyển câu tiếp theo.
* **Màn hình tổng kết điểm số**: Báo cáo tỷ lệ chính xác (%), số câu đúng lần đầu, bảng ôn lại các câu từng sai và bắn pháo hoa khi hoàn thành.

---

## 🛠️ Hướng Dẫn Chạy Ứng Dụng

### Cách 1: Chạy toàn bộ ứng dụng trên 1 Host duy nhất (Khuyên dùng)

Chỉ cần mở terminal tại thư mục gốc `d:\quizcardProject` và chạy:

```powershell
dotnet run --project src/QuizCard.UI/QuizCard.UI.csproj --urls "http://localhost:5030"
```

Sau đó mở trình duyệt truy cập:
👉 **http://localhost:5030**

*(Cơ sở dữ liệu SQLite `quizcard.db` sẽ tự động tạo và nạp sẵn 1 bộ thẻ mẫu "Thuật ngữ Lập Trình Cơ Bản" gồm 5 thẻ để bạn trải nghiệm ngay lập tức).*

---

### Cách 2: Chạy Frontend riêng trong chế độ Development (Hỗ trợ Hot-Reload)

Nếu bạn muốn chỉnh sửa giao diện React với Vite Hot Reload:

1. **Terminal 1 (Backend API)**:
   ```powershell
   dotnet run --project src/QuizCard.UI/QuizCard.UI.csproj --urls "http://localhost:5030"
   ```

2. **Terminal 2 (React Vite Dev Server)**:
   ```powershell
   cd src/QuizCard.UI/ClientApp
   cmd.exe /c "npm run dev"
   ```
   Sau đó truy cập **http://localhost:5173**. Vite đã cấu hình sẵn proxy `/api` sang backend `http://localhost:5030`.

3. Khi muốn cập nhật bản build vào backend:
   ```powershell
   cd src/QuizCard.UI/ClientApp
   cmd.exe /c "npm run build"
   ```

