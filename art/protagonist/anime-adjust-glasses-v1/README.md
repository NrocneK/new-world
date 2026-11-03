# Chỉnh kính — animation riêng, bản 01

Động tác độc lập với idle thở/chớp mắt. Một lần nâng tay gần lên gọng kính, chạm và đẩy nhẹ rồi hạ tay; tay xa giữ bên đùi. Mẫu người anime nhìn ngang sang phải, cùng nhận diện/trang phục/tỷ lệ với idle.

8 khung, thời lượng `[100,140,140,160,240,160,180,240]` ms, tổng 1360 ms. `loop:false`; GIF thường và GIF xem chậm đều phát một lần. Khung đầu/cuối dùng nguyên cel 00 của idle để nối về tư thế nghỉ. Các khung giữa là tranh mới; công đoạn đóng gói chỉ căn cả cel theo chân/sàn, không uốn hoặc cắt dán từng chi thể.

Tham chiếu: nhân vật idle hiện có và sơ đồ khớp tự dựng cho động tác chỉnh kính; không dùng một clip mocap/video thực tế. File `gesture-plan.json` là ý đồ tư thế, không phải kết quả đo từ tranh.

Quy tắc gọi thử: sau 8000 ms idle liên tục, chuyển sang `adjust-glasses` một lần, kết thúc trở về idle. Trong cùng lần đứng yên không lặp lại động tác. Đi/chạy/tấn công/nhảy ngắt động tác hoặc hủy chờ; lần vào idle kế tiếp bắt đầu lại bộ đếm. `glasses-controller.js` là bộ điều khiển riêng dùng trong trang thử; gameplay hiện tại không bị sửa.

Trang thử có phát riêng một lần, phát chậm, chọn khung, phóng to tay/kính và mô phỏng chờ idle/đi bộ để kiểm tra ngắt. Sprite, GIF, timing JSON riêng; nguồn idle, walk và run không thay đổi. `protected-baselines.json` lưu hash các tài nguyên được giữ nguyên.
