# Đồng bộ cảnh màn 2 theo nhân vật

Lấy bộ nhân vật đã duyệt làm chuẩn: nét viền tối rõ, mảng màu gọn, bóng đổ theo vài cấp và màu sáng ấm. Hai nền phố/trạm sơ tán và bộ đồ vật được vẽ lại theo cùng hướng này, giảm chất liệu tả thực, nhiễu pixel nhỏ và phản xạ mặt đường. Không đổi bất kỳ pixel, tỷ lệ, màu tóc hay hoạt ảnh nào của nhân vật chính; không thêm lớp màu phủ lên nhân vật hoặc VFX.

## Tỷ lệ và phân lớp

- Nhân vật idle cao xấp xỉ 172 đơn vị trong game, đầu rộng 110.
- Bus cao 270, dài khoảng 746: lớn hơn người, giữ nguyên tỷ lệ ngang/dọc của sprite. Bus đỗ ở lề đường sau tuyến đi, chân bánh cao hơn mặt đi 26 đơn vị để đọc được chiều sâu. Đây là vật trang trí hậu cảnh, không phải sàn đi hay vật chặn đạn.
- Hai khối bê tông ở tuyến trước là vật thể va chạm riêng. Đỉnh hình đúng đỉnh collider: khối đầu 200 × 70, khối sau 220 × 94. Quái bắn đứng trên bê tông; nhân vật/NPC đi khỏi mép sẽ rơi như trước. Đạn thấp bị các khối này chặn.
- Lều cứu thương cao 310, cửa vào đủ lớn so với nhân vật và đặt sau tuyến di chuyển. Thùng dầu giữ kích thước có thể đọc/đánh được ở tiền cảnh.

## Đóng gói và cache

Tài nguyên mới dùng đường dẫn riêng: `city-chibi.png`, `evacuation-chibi.png`, `street-props-chibi.png`, `manifest-chibi.json`. Tên mới tránh việc worker cũ trả lại ảnh tả thực từ cache. Cấu hình và hai builder online/offline đều dùng cùng các nguồn mới. Không đổi ID chương hoặc khóa lưu; tiến trình đang chơi tiếp tục được.

Chỉ áp dụng cảnh màn 2 trong lượt này. Màn 1 vẫn theo bản tạm duyệt; mỹ thuật toàn chiến dịch sẽ theo hướng đã được người chơi chốt sau khi xem cảnh thực tế.
