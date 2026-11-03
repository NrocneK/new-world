# Attack nhìn ngang — bản 03

Quy ước tay được chốt lại theo người dùng: tay phải ở gần máy là tay1; tay trái ở xa là tay2. Đòn2 dùng tay trái xuyên suốt lấy đà, duỗi ra và thu về; cánh tay phải ở trước giữ thế thủ. Tư thế và bàn tay trái được vẽ lại bằng imagegen, không chỉ đổi tên dữ liệu tay. Các sơ đồ màu chỉ là tham chiếu vai/khuỷu/cổ tay; không phải bằng chứng tự động về giải phẫu của tranh cuối.

Móc dùng tay phải ở gần và nâng nắm đấm cao hơn bản2, giữ chiều dài cánh tay khi mở góc khuỷu. Khung xuất cao640px, sàn620px; chiều cao đứng vẫn484px. Phần thêm phía trên là khoảng trống cho tầm đánh, không thu nhỏ nhân vật. Artwork đấm tay1 giữ nguyên nguồn; tất cả đóng gói bằng tịnh tiến và đổi tỷ lệ đồng đều toàn hình, không uốn/cắt ghép chi thể hoặc đổi màu bằng mã.

`uppercut-peak.png` là nguyên cel móc cao nhất (đòn3 khung5 theo cách đếm1–8). Chính cel đó cũng là khung8 kết thúc móc và khung1 mở đầu đấm đất. `slam-start.png` xuất trực tiếp từ cel mở đầu đã đóng gói; kiểm tra so sánh toàn bộ RGBA giữa ba vị trí. Đòn3 kết thúc giữ đỉnh, không thu về thế thủ trước đòn4. Nút “Móc → Đấm đất” phát riêng đoạn nối này.

Đấm đất đi xuống bằng cùng tay phải đang ở trên cao; tay trái/xa vung ra sau, gối sau không tì sàn. Khung3 đã bỏ tư thế tay cao bị lỗi và thay bằng pha hạ tay xuống trước thân, còn cách mặt đất. Tay trái ở sau được sửa riêng hình nắm đấm: bàn tay hướng ra sau được xoay để mu tay hướng về máy và ngón cái nằm phía trên, cạnh ngón út phía dưới; không dùng hình nắm đấm phải có ngón cái phía dưới. Khung hồi phục6 (đếm từ0) dùng lại nguyên tư thế hạ tay2 theo chiều ngược chuyển động, giữ nắm đấm trái đã sửa thay cho cel thô6 chưa dùng. Trang có ô phóng to riêng bàn tay này. Tọa độ ô phóng to lấy từ các vùng da trên cel, không dùng thuật toán để tuyên bố tay phải/trái.

PNG/GIF nhân vật không kèm VFX. Ba VFX đầu dùng nguồn cũ; đấm đất giữ bộ VFX thử bản2 riêng (vòng khí mỏng, vệt dựng lên, mảnh vỡ). Chỉ cập nhật neo theo pose mới; các bitmap VFX cũ và manifest không bị sửa, không thêm bloom. Gameplay, hitbox, idle/walk/run/chỉnh kính không thay đổi.

Mỗi đòn8cel, tổng32cel. Thời lượng250/250/360/520ms; JSON có timing, sự kiện tiếp xúc và quy ước tay. Atlas2048×5120, mỗi cel512×640. GIF phát một lần, có bản chậm. Trang xem hỗ trợ1×/0,5×/0,25×, từng khung, VFX tùy chọn; query `action=attack4&frame=2` mở trực tiếp khung3. Các URL bản3 tránh nhầm ảnh từ cache bản trước.

Tái xuất từ gốc repo: chạy `tools/register.py` cho mỗi source, rồi `pack-preview.cjs`, `measure-anchors.py`, `prepare-ground-fx.py`, `stage-public.py` trong thư mục công cụ này. `register.py` dùng guard cuối làm chuẩn chiều cao riêng cho đấm đất vì khung đầu đã ở đỉnh móc.

Kiểm tra: `python art/protagonist/anime-attack-profile-v3/tools/validate-assets.py`; `node --test art/protagonist/anime-attack-profile-v3/tools/timeline.test.mjs`; `node art/protagonist/anime-attack-profile-v3/tools/browser-review.cjs`. Chúng kiểm tra alpha, không cắt khung, điểm chạm giày, timing, khung nối giống nhau, thứ tự sự kiện, thao tác trang và link tải. Hướng ngón cái, chủ cánh tay và hình dáng khớp cần kiểm tra tranh trực tiếp; các bài kiểm tra kỹ thuật không xác nhận thay phần đó.
