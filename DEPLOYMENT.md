# Dị Môn — demo và tệp tải

Đã triển khai Vercel production:

- Chương 01 chơi được: https://di-mon-demo.vercel.app/
- Chương 02: https://di-mon-demo.vercel.app/chapter-two
- Gói cả hai màn offline: https://di-mon-demo.vercel.app/downloads/di-mon-game.zip
- Phòng thử nhân vật: https://di-mon-demo.vercel.app/character-lab
- Tải chương offline: https://di-mon-demo.vercel.app/downloads/di-mon-chapter-one.zip
- Trang VFX mới: https://di-mon-demo.vercel.app/vfx-review
- Tải ZIP: https://di-mon-demo.vercel.app/downloads/di-mon-vfx-v6.zip
- Tải HTML offline: https://di-mon-demo.vercel.app/downloads/di-mon-vfx-v6.html

Trang chính trong `site/index.html` là màn chơi Chương 01: từ tầng 7 đi xuống qua sàn vỡ của 7 tầng lầu, cứu đồng nghiệp và hạ boss giữ cửa ở tầng trệt. Phòng thử 17 động tác được giữ ở `site/character-lab.html`. Màn chơi có bản HTML offline đóng gói trong ZIP và service worker lưu tài nguyên sau lần tải đầu. Hai đòn đấm thẳng đã thay các khối trắng vẽ bằng Canvas bằng texture khí lực trong `art/vfx/air-pressure-v2/sources/straight-clear.png`, bỏ lớp mây trắng và thu gọn tỷ lệ hiển thị. Bản xem VFX mới là trang phụ `site/vfx-review.html`, dùng cùng nguồn, điểm neo và tỷ lệ cho hai đòn này. Các động tác khác giữ nguyên.

Các tệp tải đã được kiểm tra nằm trong `site/downloads/`:

- `di-mon-vfx-v6.zip`: gói VFX và bản xem offline.
- `di-mon-vfx-v6.html`: bản xem VFX offline độc lập.
- `air-kick-preview.png`: ảnh xem trước cú đá.

## Vercel

Dự án là web tĩnh, không cần cài thư viện, build hoặc biến môi trường để chạy. `vercel.json` đã đặt output là `site` và trang chính là demo chơi được. Không đặt Root Directory thành trang VFX. Chạy `npm run build:level` rồi `node tools/build-vercel-site.mjs` để đóng gói. ZIP lưu trên GitHub và Vercel chuyển hướng tải về, không tải ZIP vào API file upload.

Khi import repository vào Vercel, chọn nhánh `codex/vfx-v5-downloads`, Framework Preset **Other**, Root Directory để trống, Output Directory **site**. Không bật build command. Vercel phục vụ `/` là demo và `/vfx-review` là trang VFX. HTML tải xuống dùng `Content-Disposition: attachment`; ZIP chuyển đến bản gốc công khai đã tải lên GitHub.

Để agent triển khai trực tiếp bằng CLI, cần cấp `VERCEL_TOKEN` qua phần Secrets của môi trường, cho phép API `api.vercel.com` và các trang `*.vercel.app`. Không gửi token vào chat. Việc lưu draft cấu hình môi trường chưa triển khai website hay cấp thông tin đăng nhập; cần áp dụng cấu hình qua giao diện môi trường.

Bản production đã được Vercel xác nhận `READY`; domain chính và đường tải trả HTTP 200 khi không đăng nhập. Trong môi trường quản lý, triển khai dùng REST API được Vercel công bố để tương thích với credential proxy; không đưa token vào source hoặc tệp tải xuống.

Bản map dọc dùng `level-physics.js` và dữ liệu `office-descent-7-v2`. Mã và CSS vào trang được gắn phiên bản theo hash, JSON có phiên bản map để tránh service worker cũ trả cấu trúc map ngang. Worker mới đọc cache theo đường dẫn bỏ query phiên bản và có cache riêng theo hash tài nguyên. Bản lưu map ngang cũ được tách khỏi bản lưu map dọc.

Màn 2 tại `site/chapter-two.html`, dùng `chapter-two-config.js` và `chapter-two-world.js` cùng nhân vật/vật lý hiện có. `campaign.js` giữ điểm kinh nghiệm chuyển màn; các checkpoint của hai màn độc lập. Cả hai dùng một service worker cache tài nguyên chung. Các tệp JS/CSS vào trang có tên chứa hash (`tools/level-entries.mjs`) để người chơi đang giữ cache của bản cũ nhận đúng engine mới. Gói `di-mon-game.zip` chứa `level.html` và `chapter-two.html` tự chạy offline. ZIP tiếp tục tải từ GitHub qua redirect, không gửi ZIP vào Vercel file API.
