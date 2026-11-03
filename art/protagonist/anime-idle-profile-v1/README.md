# Idle nhìn ngang — bản 01

Mẫu người anime trưởng thành nhìn ngang sang phải, giữ nhận diện và trang phục của walk/run đã duyệt. Tư thế nghỉ thẳng tự nhiên, hai chân đặt sàn, tay buông bên đùi. Một nhịp thở nhỏ ở ngực/vai, tay và nếp áo theo sau nhẹ; chớp mắt một lần trong vòng lặp.

Tham chiếu hình ảnh trực tiếp: `kling-kit/01-references/hero.png` và khung 00 của `anime-walk-profile-v2`. Đây là thiết kế chuyển động idle mới từ các key pose thở/chớp mắt, không lấy từ một clip chuyển động thực tế hoặc Naruto. Walk và run được người dùng duyệt trước khi làm idle, không sửa các tài nguyên đã chốt.

8 khung, sheet 4×2. Phát theo thời lượng từng khung `[600,500,600,500,500,80,80,500]` ms: tổng 3360 ms. Hai khung khép/nhắm mắt chỉ giữ 80 ms mỗi khung. Có GIF thường và GIF chậm 0.5×. Đọc `idle-sheet.json` để giữ đúng thời gian khi đưa vào game; phát tất cả các khung cùng thời lượng sẽ làm sai nhịp chớp mắt.

Tranh được tạo bằng công cụ ảnh; công đoạn đóng gói chỉ dịch nguyên cel theo tâm phần bàn chân và sàn, không uốn hoặc kéo giãn cơ thể. FFmpeg mã hóa ảnh GIF; công cụ chỉ đặt lại thời gian trong các block điều khiển của GIF, không vẽ lại hay biến dạng ảnh.
