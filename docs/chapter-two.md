# Chương 02 — Đêm vỡ trận

Sau khi thoát khỏi tòa nhà ở màn 1, nhân vật và đồng nghiệp đi qua đại lộ bị xâm lấn tới tuyến sơ tán. Màn 2 là đoạn đi cảnh ngang ngoài phố, nối trực tiếp từ nút kết thúc màn 1; cũng có lối vào riêng để chơi thử. Điểm kinh nghiệm được mang sang, lửa và gió đã mở khóa. Các bản lưu của hai màn độc lập.

## Tuyến nhiệm vụ

1. Hộ tống đồng nghiệp qua xác xe và quái trên đường tới trạm cứu thương. Sau đoạn hội thoại bàn giao, đồng nghiệp ở lại nơi an toàn.
2. Phá hai ổ dị giới bằng đòn đánh, lửa hoặc gió để hạ màn chắn. Có quái cận chiến và quái phun đạn canh các ổ; đường đứt cần nhảy qua. Ổ đã phá và nhiệm vụ bàn giao được lưu tại điểm hồi sinh.
3. Hạ **Kẻ Truy Sát** trước khu sơ tán. Boss có cú vồ theo mục tiêu đã báo trước và loạt ba gai; dưới nửa máu, nhịp tấn công nhanh hơn. Hạ boss rồi tới cổng để hoàn thành tuyến sơ tán.

## Tài nguyên và vận hành

`chapter-two-config.js` chứa vị trí quái, vật cản, điểm hồi sinh và lời thoại. `chapter-two-world.js` chứa hành vi đặc thù của đường phố, ổ dị giới, quái bắn xa và boss. Nhân vật, combo, vật lý, tỷ lệ và VFX dùng chung với màn 1. Màn 1 giữ cấu trúc đã tạm duyệt; bổ sung chuyển màn và lưu hành trình qua `campaign.js`.

`art/chapter-two/` gồm hai nền phố, quái phun đạn, Kẻ Truy Sát và ổ dị giới. `tools/measure-chapter-two.py` chỉ đo vùng khung/điểm neo, không sửa pixel. `npm run build:level` tạo hai HTML offline độc lập, gói riêng từng màn và gói cả hai màn. Gói đầy đủ chứa `level.html` cùng `chapter-two.html`; mở `level.html` để bắt đầu. Website dùng một service worker lưu tài nguyên của cả hai màn.

Kiểm tra: `node tests/chapter-two.spec.cjs` đi toàn tuyến bằng phím thật, bàn giao đồng nghiệp, phá ổ, mở màn chắn, quan sát hai đòn boss, hoàn thành, tải lại checkpoint, offline và chuyển kinh nghiệm. `tests/chapter-one.spec.cjs` kiểm tra lại màn 1 cùng nút chuyển màn. `tests/chapter-cache-upgrade.spec.cjs` kiểm tra người chơi đang giữ cache của bản màn 1 cũ có thể cập nhật và chơi cả hai màn offline.
