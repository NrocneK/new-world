# Đồng bộ cảnh màn 2 theo nhân vật

Lấy bộ nhân vật đã duyệt làm chuẩn: nét viền tối rõ, mảng màu gọn, bóng đổ theo vài cấp và màu sáng ấm. Panorama nối phố tới trạm sơ tán và bộ đồ vật được vẽ lại theo cùng hướng này, giảm chất liệu tả thực, nhiễu pixel nhỏ và phản xạ mặt đường. Không đổi bất kỳ pixel, tỷ lệ, màu tóc hay hoạt ảnh nào của nhân vật chính; không thêm lớp màu phủ lên nhân vật hoặc VFX.

## Tỷ lệ và phân lớp

- Nhân vật idle cao xấp xỉ 172 đơn vị trong game, đầu rộng 110.
- Bus cao 270, dài khoảng 746: lớn hơn người, giữ nguyên tỷ lệ ngang/dọc của sprite. Bus đỗ ở lề đường sau tuyến đi, chân bánh cao hơn mặt đi 26 đơn vị để đọc được chiều sâu. Đây là vật trang trí hậu cảnh, không phải sàn đi hay vật chặn đạn.
- Hai khối bê tông ở tuyến trước là vật thể va chạm riêng. Đỉnh hình đúng đỉnh collider: khối đầu 200 × 70, khối sau 220 × 94. Quái bắn đứng trên bê tông; nhân vật/NPC đi khỏi mép sẽ rơi như trước. Đạn thấp bị các khối này chặn.
- Lều cứu thương cao 310, cửa vào đủ lớn so với nhân vật và đặt sau tuyến di chuyển. Thùng dầu giữ kích thước có thể đọc/đánh được ở tiền cảnh.

## Đóng gói và cache

Tài nguyên mới dùng đường dẫn riêng: `street-panorama.png`, `street-props-chibi.png`, `manifest-chibi.json`. Tên mới tránh việc worker cũ trả lại ảnh tả thực từ cache. Cấu hình và hai builder online/offline đều dùng cùng các nguồn mới. Không đổi ID chương hoặc khóa lưu; tiến trình đang chơi tiếp tục được.

Chỉ áp dụng cảnh màn 2 trong lượt này. Màn 1 vẫn theo bản tạm duyệt; mỹ thuật toàn chiến dịch sẽ theo hướng đã được người chơi chốt sau khi xem cảnh thực tế.

## Cảnh liên tục và khung hình rộng hơn

Bản mới thay hai ảnh `city-chibi.png`/`evacuation-chibi.png` bằng **một** `street-panorama.png` nối từ phố sang khu sơ tán. Xóa chọn ảnh theo `camera > 4700`, phép lặp `% 1600`, tile ảnh và mọi crossfade theo tiến trình. Panorama giữ nguyên tỷ lệ nguồn, được bố trí đủ rộng cho toàn hành trình camera; cả đầu và cuối luôn phủ kín vùng nhìn. Hố không điều khiển nền.

Màn 2 dùng camera zoom **0,72** trên toàn bộ lớp thế giới: hero, NPC, quái, đồ vật, hiệu ứng, nhãn và vùng va chạm cùng một phép chiếu. Nhân vật idle từ khoảng 172 còn 124 pixel trên canvas 1280 × 720; đầu từ 110 còn 79,2. Bề ngang nhìn thấy từ 1280 lên khoảng 1778 đơn vị, tăng khoảng 39%. Không sửa sprite hoặc thu riêng từng bộ phận; logic va chạm và đường bay vẫn chạy trong tọa độ gốc. HUD và nút cảm ứng giữ nguyên kích thước đọc/bấm.

`level-view.js` quản lý khung nhìn, biên camera và bố trí panorama. Camera màn 2 cố định phương dọc để chân chạm mặt đường ở dòng 540; nhảy không kéo nền lên xuống. Màn 1 dùng zoom mặc định 1 và giữ cách theo dõi rơi trước đây. Không thay khóa lưu hay vị trí checkpoint.

Kiểm tra bổ sung: `tests/level-view.spec.cjs` xác nhận tỷ lệ chiếu, độ phủ nền, cuộn qua hố/mốc cũ và camera mặc định màn 1. Bài chơi hết màn 2 quan sát các lệnh Canvas thật: một nguồn panorama, dịch chuyển liên tục theo camera cả khi đi tới lẫn quay lại, không nhảy ảnh tại mốc cũ. Hai bài nâng cache kiểm tra người chơi có worker/ảnh cũ nhận được module chiếu và panorama mới, sau đó chơi offline.
