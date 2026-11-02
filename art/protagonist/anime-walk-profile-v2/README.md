# Walk — nhìn ngang, bản thử 02

Nhân vật được vẽ lại theo mẫu anime người trưởng thành, nhìn ngang sang phải.
Sheet gồm 8 khung, 4 cột × 2 hàng, thứ tự hàng trên rồi hàng dưới.

- `walk-source.png`: artwork gốc do công cụ tạo ảnh vẽ đủ từng tư thế.
- `walk-sheet.png`: các cel được đóng gói với vị trí đầu và đường tiếp đất thống nhất.
- `walk-sheet.json`: tọa độ từng ô, tốc độ xem 8 FPS.
- `walk-preview.gif`: lặp vô hạn, 8 khung/giây, nền tối và đường sàn để kiểm tra chuyển động.
- `registration.json`: độ dịch vị trí của từng cel khi đóng gói.

GIF phát các khung vẽ của sheet. Công đoạn đóng gói dịch nguyên cel, không thay đổi hình dáng tay chân hay nội suy thêm tư thế.

## Xuất lại

```sh
python art/protagonist/anime-walk-profile-v2/tools/register.py /path/to/generated-sheet.png
node art/protagonist/anime-walk-profile-v2/tools/pack-preview.cjs
```

Cần Pillow, NumPy, Playwright, Chromium, FFmpeg và server ở cổng 4173 phục vụ thư mục gốc repo.
