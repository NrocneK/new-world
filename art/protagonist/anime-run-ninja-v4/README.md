# Ninja run — bản thử 04

Vẽ lại chu kỳ thành 16 khung (8 khung mỗi bước chân), phát 24 FPS. Giảm nhịp nảy của đầu, chuyển trọng tâm sang chuyển động khớp lệch pha: hông/ngực → vai → khuỷu → cổ tay/bàn tay, kèm tóc và gấu áo theo sau. Hai tay tiếp tục giữ về sau; dáng nghiêng thẳng qua hông khi chân sau duỗi.

Hai sheet nguồn gồm một bước chân gần trụ và một bước chân xa trụ. Sheet xuất 4×4 (1600×2048 px, mỗi ô 400×512 px), đọc từ trái sang phải, trên xuống dưới. Các sơ đồ và `gait-plan.json` ghi ý đồ tư thế, không phải kết quả đo từ tranh.

Tranh được vẽ bằng công cụ tạo ảnh. Các công cụ đóng gói phân tách tại khoảng trong suốt và chỉ dịch nguyên cel theo vùng hông/sàn; không uốn chi thể, kéo giãn hay dùng khối thân cắt rời để giả lập chuyển động. Trang xem có phát chậm và chọn từng khung để kiểm tra.
