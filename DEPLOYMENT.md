# Dị Môn — demo và tệp tải

Đã triển khai Vercel production:

- Demo chơi được: https://di-mon-demo.vercel.app/
- Trang VFX mới: https://di-mon-demo.vercel.app/vfx-review
- Tải ZIP: https://di-mon-demo.vercel.app/downloads/di-mon-vfx-v5.zip
- Tải HTML offline: https://di-mon-demo.vercel.app/downloads/di-mon-vfx-v5.html

Trang chính trong `site/index.html` là demo điều khiển nhân vật đầy đủ: di chuyển, chiến đấu, nguyên tố, nhảy hai lần, xem từng động tác và điều khiển cảm ứng. Bản xem VFX mới là trang phụ `site/vfx-review.html`. Bộ VFX này vẫn tách riêng để xem và chỉnh; bước đóng gói không tự thay bộ hiệu ứng của demo chính.

Các tệp tải đã được kiểm tra nằm trong `site/downloads/`:

- `di-mon-vfx-v5.zip`: gói VFX và bản xem offline.
- `di-mon-vfx-v5.html`: bản xem VFX offline độc lập.
- `air-kick-preview.png`: ảnh xem trước cú đá.

## Vercel

Dự án là web tĩnh, không cần cài thư viện, build hoặc biến môi trường để chạy. `vercel.json` đã đặt output là `site` và trang chính là demo chơi được. Không đặt Root Directory thành trang VFX.

Khi import repository vào Vercel, chọn nhánh `codex/vfx-v5-downloads`, Framework Preset **Other**, Root Directory để trống, Output Directory **site**. Không bật build command. Vercel phục vụ `/` là demo và `/vfx-review` là trang VFX. HTML tải xuống dùng `Content-Disposition: attachment`; ZIP chuyển đến bản gốc công khai đã tải lên GitHub.

Để agent triển khai trực tiếp bằng CLI, cần cấp `VERCEL_TOKEN` qua phần Secrets của môi trường, cho phép API `api.vercel.com` và các trang `*.vercel.app`. Không gửi token vào chat. Việc lưu draft cấu hình môi trường chưa triển khai website hay cấp thông tin đăng nhập; cần áp dụng cấu hình qua giao diện môi trường.

Bản production đã được Vercel xác nhận `READY`; domain chính và đường tải trả HTTP 200 khi không đăng nhập. Trong môi trường quản lý, triển khai dùng REST API được Vercel công bố để tương thích với credential proxy; không đưa token vào source hoặc tệp tải xuống.
