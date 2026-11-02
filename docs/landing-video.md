# Dị Môn — video giới thiệu landing page

Bản ngang 16:9, 1920 × 1080, 30 fps, 30 giây. MP4 H.264/yuv420p + AAC stereo, fast-start để phát trên web. Chữ tiếng Việt, nhạc nền và tiếng chuyển cảnh/va chạm được tổng hợp riêng cho đoạn dựng này. Không lồng tiếng.

0–4s: đêm xâm lấn và cánh cổng mở. 4–8s: giới thiệu nhân viên 01/tinh linh. 8–14s: combo cận chiến. 14–18s: hộ tống/cứu người. 18–22s: đối đầu Kẻ Truy Sát. 22–25s: hỏa/phong năng. 25–30s: tên game, lời mời chơi thử và địa chỉ demo.

Gameplay ghi từ chính engine hiện tại bằng điều khiển bàn phím; bắt đầu tại các checkpoint trong một browser context riêng để ghi hình. Các cảnh đầu/cuối dùng nguyên frame nhân vật đã duyệt, scale đồng nhất theo bề rộng đầu. Không tách/biến dạng bộ phận hoặc sửa màu. Cảnh gameplay được cắt khung và phóng đồng nhất để đọc được hành động. Nhạc/âm thanh không dùng bản thu bên ngoài; font là Noto Sans Display.

Nguồn dựng nằm trong `video/`: `tools/capture.cjs` ghi cảnh, `renderer.js` sắp hình/chữ, `tools/score.py` dựng âm thanh, `tools/render.cjs` xuất 900 frame vào FFmpeg. `game-source-baseline.json` giữ SHA trước khi làm video để xác nhận mã màn chơi không bị thay đổi. Các file xem/tải công khai nằm riêng tại `site/trailer.html`, `site/media/`, `site/downloads/di-mon-intro-1080p.mp4`. Trang demo chơi được hiện tại được giữ nguyên.
