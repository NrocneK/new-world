# Chương 02 — Đêm vỡ trận

Sau khi thoát khỏi tòa nhà ở màn 1, nhân vật và đồng nghiệp đi qua đại lộ bị xâm lấn tới tuyến sơ tán. Màn 2 là đoạn đi cảnh ngang ngoài phố, nối trực tiếp từ nút kết thúc màn 1; cũng có lối vào riêng để chơi thử. Điểm kinh nghiệm được mang sang, lửa và gió đã mở khóa. Các bản lưu của hai màn độc lập.

## Tuyến nhiệm vụ

1. Hộ tống đồng nghiệp qua xác xe và quái trên đường tới trạm cứu thương. Sau đoạn hội thoại bàn giao, đồng nghiệp ở lại nơi an toàn.
2. Phá hai ổ dị giới bằng đòn đánh, lửa hoặc gió để hạ màn chắn. Có quái cận chiến và quái phun đạn canh các ổ; đường đứt cần nhảy qua. Ổ đã phá và nhiệm vụ bàn giao được lưu tại điểm hồi sinh.
3. Hạ **Kẻ Truy Sát** trước khu sơ tán. Boss có cú vồ theo mục tiêu đã báo trước và loạt ba gai; dưới nửa máu, nhịp tấn công nhanh hơn. Hạ boss rồi tới cổng để hoàn thành tuyến sơ tán.

## Tài nguyên và vận hành

`chapter-two-config.js` chứa vị trí quái, vật cản, điểm hồi sinh và lời thoại. `chapter-two-world.js` chứa hành vi đặc thù của đường phố, ổ dị giới, quái bắn xa và boss. Nhân vật, combo, vật lý, tỷ lệ và VFX dùng chung với màn 1. Màn 1 giữ cấu trúc đã tạm duyệt; bổ sung chuyển màn và lưu hành trình qua `campaign.js`.

`art/chapter-two/` gồm panorama phố, quái phun đạn, Kẻ Truy Sát và ổ dị giới. `tools/measure-chapter-two.py` chỉ đo vùng khung/điểm neo, không sửa pixel. `npm run build:level` tạo hai HTML offline độc lập, gói riêng từng màn và gói cả hai màn. Gói đầy đủ chứa `level.html` cùng `chapter-two.html`; mở `level.html` để bắt đầu. Website dùng một service worker lưu tài nguyên của cả hai màn.

Kiểm tra: `node tests/chapter-two.spec.cjs` đi toàn tuyến bằng phím thật, bàn giao đồng nghiệp, phá ổ, mở màn chắn, quan sát hai đòn boss, hoàn thành, tải lại checkpoint, offline và chuyển kinh nghiệm. `tests/chapter-one.spec.cjs` kiểm tra lại màn 1 cùng nút chuyển màn. `tests/chapter-cache-upgrade.spec.cjs` kiểm tra người chơi đang giữ cache của bản màn 1 cũ có thể cập nhật và chơi cả hai màn offline.

## Đoạn mẫu ngã tư (bản nâng cấp)

`/chapter-two?sample=clinic` vào ngay trước đống bê tông, với tải kỹ năng lửa/gió và một ô lưu riêng (`di-mon:chapter-two:v2:sample`). Chơi ở đường dẫn màn 2 đầy đủ vẫn gặp cùng đoạn giao tranh này. Hai đợt có quái trên cao, quái giáp và quái đánh từ phía sau. Khối bê tông chặn đạn; gió phản đạn thành sát thương địch; đòn móc/kết thúc phá giáp; lửa gây cháy và thùng dầu nổ sau cảnh báo. Không thay texture nhân vật hay VFX đã duyệt.

Đợt sau chỉ kích hoạt khi đợt trước đã dọn xong và qua hai giây nghỉ. Giáp có thanh độ bền riêng, khi vỡ tạo khoảng phản công 0,85 giây. Bắn xa khóa hướng ngắm trước khi phóng. Va chạm có dừng hình 35–65 ms riêng màn 2; tất cả vật lý cùng dừng để không làm đổi đường bay. Trạm chỉ trở thành checkpoint khi đã bàn giao an toàn. Nếu chạy vượt quái, HUD chỉ số còn lại và hướng quay về.

Kết thúc đoạn mẫu mở bảng kết quả, cho phép chơi lại hoặc đi tiếp phần còn lại. Bảng này không ghi nhận hoàn thành chương. Bản lưu màn 2 phiên bản 1 được đọc chuyển tiếp, giữ XP và nhiệm vụ bàn giao; không bắt đánh lại ngã tư nếu đã tới trạm. Khung chiến dịch và chuẩn đánh giá nằm ở `docs/campaign-outline.md`, `docs/combat-standard.md`, có trang đọc `/campaign`.

Kiểm tra thêm: `npm run test:clinic` gồm mô phỏng vật lý đạn/vật chắn, giáp, nổ, cháy, hai đợt và bài browser chơi thật từ vào đoạn mẫu tới kết quả. Browser cũng kiểm tra phản đạn bằng phím, tách save, chuyển bản lưu cũ, cảm ứng nhiều ngón, nhảy lần hai thẳng đứng, tạm dừng và bố cục điện thoại. Mỹ thuật vật thể mới dùng nguyên ảnh trong `street-props.png`, chỉ khai báo vùng sprite và scale đồng nhất.

## Đồng bộ mỹ thuật cảnh phố

Nền và bộ vật thể màn 2 được vẽ lại theo nét viền/mảng màu của nhân vật, giảm bề mặt tả thực và chi tiết nhiễu. Bus được dựng đúng tỷ lệ ở lề đường phía sau: cao 270 so với nhân vật khoảng 172. Khối bê tông thấp ở tiền cảnh là vật cản/che đạn riêng, giữ nguyên kích thước va chạm đã kiểm tra. Lều tăng tỷ lệ cửa vào. Panorama nối phố sang khu sơ tán dùng cùng hướng vẽ. Xem `docs/chapter-two-art-direction.md` để biết quy ước phân lớp và cache.

Bộ hero, VFX, shared engine, collider và toàn bộ tài nguyên màn 1 không thay đổi. Các thử nghiệm ngã tư, hoàn thành màn 2, chuyển bản lưu cũ, cảm ứng và nâng cấp service worker đã được chạy lại với bộ ảnh mới; bản HTML offline dùng đúng nguồn mới. Bài ngã tư kiểm tra thêm bus cao hơn nhân vật ít nhất 1,5 lần, dài hơn 4 lần chiều cao nhân vật, và không tham gia va chạm của tuyến đi trước.
