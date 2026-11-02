# Chương 01 — Tòa nhà sụp đổ

Map đi xuống theo chiều dọc, chơi trên màn hình ngang: **7 tầng lầu và tầng trệt**. Bắt đầu ở tầng 7, qua các khoảng sàn vỡ so le ở mỗi tầng để tới sảnh tầng trệt. Tòa nhà có dầm nứt, sàn đứt, cốt thép lộ và bụi rơi. Camera theo cả hai trục, nhìn xuống sớm khi nhân vật đang rơi; bảng tầng T7 → TRỆT chỉ vị trí hiện tại.

Có hai quái thường ở mỗi tầng lầu. Tầng 4 có đồng nghiệp mắc kẹt: dọn hai quái, tới gần để cứu, sau đó lối xuống mở. Đồng nghiệp tự chạy, nhảy qua vật cản và rơi qua sàn vỡ bằng cùng bộ vật lý với người chơi. Không dịch chuyển đồng nghiệp giữa các tầng trong lúc chơi. Các điểm hồi sinh nằm ở tầng 6, 4, 2 và tầng trệt, lưu đúng tầng/độ cao cùng tiến trình cứu người.

Tầng trệt là sảnh riêng với **Kẻ Gác Cửa**, một boss có sprite riêng, 360 máu, đòn lao và sóng đập sàn báo trước. Khi còn dưới nửa máu, boss ra đòn nhanh hơn. Hạ boss rồi dẫn đồng nghiệp tới cửa phía trái để kết thúc. Cửa không mở khi boss còn sống.

`level-physics.js` xử lý chạm sàn/va chạm cho cả người chơi và đồng nghiệp. Chỉ coi là đứng vững khi chân chạm đúng mặt sàn ở cùng độ cao; một sàn nằm thấp hơn không giữ nhân vật trên không. Bước khỏi mép tủ hoặc dầm sẽ bắt đầu rơi ngay, không cần bấm nhảy. Va chạm quét chọn mặt sàn đầu tiên bị cắt khi rơi, không xuyên hoặc bỏ qua tầng.

Kiểm tra: `node tests/level-physics.spec.cjs` và `npm run test:level` khi máy chủ phát triển đang chạy. Kiểm tra trình duyệt đi đủ 8 mặt sàn bằng phím thật, bước khỏi tủ không nhảy, cứu và hộ tống đồng nghiệp, lưu/tải lại đúng độ cao, hai đòn boss, kết thúc và offline. Phòng thử nhân vật tại `/character-lab`; bản đồ ở `/` và `/level` trên production.
