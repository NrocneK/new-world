# Dị Môn — demo và tệp tải

Trang chính trong `site/index.html` là demo điều khiển nhân vật đầy đủ: di chuyển, chiến đấu, nguyên tố, nhảy hai lần, xem từng động tác và điều khiển cảm ứng. Bản xem VFX mới là trang phụ `site/vfx-review.html`. Bộ VFX này vẫn tách riêng để xem và chỉnh; bước đóng gói không tự thay bộ hiệu ứng của demo chính.

Các tệp tải đã được kiểm tra nằm trong `site/downloads/`:

- `di-mon-vfx-v5.zip`: gói VFX và bản xem offline.
- `di-mon-vfx-v5.html`: bản xem VFX offline độc lập.
- `air-kick-preview.png`: ảnh xem trước cú đá.

## Vercel

Dự án là web tĩnh, không cần cài thư viện, build hoặc biến môi trường để chạy. `vercel.json` đã đặt output là `site` và trang chính là demo chơi được. Không đặt Root Directory thành trang VFX.

Khi import repository vào Vercel, chọn nhánh `codex/vfx-v5-downloads`, Framework Preset **Other**, Root Directory để trống, Output Directory **site**. Không bật build command. Vercel sẽ phục vụ `/` là demo và `/vfx-review` là trang VFX. Các đường dẫn `/downloads/` được cấu hình tải tệp bằng `Content-Disposition: attachment`.

Để agent triển khai trực tiếp bằng CLI, cần cấp `VERCEL_TOKEN` qua phần Secrets của môi trường, cho phép API `api.vercel.com` và các trang `*.vercel.app`. Không gửi token vào chat. Việc lưu draft cấu hình môi trường chưa triển khai website hay cấp thông tin đăng nhập; cần áp dụng cấu hình qua giao diện môi trường.

Bản chuẩn bị này chưa khẳng định đã deploy. Chỉ dùng URL thật do Vercel trả về sau khi triển khai thành công.
