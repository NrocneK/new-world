# Attack mẫu người — bản 01

Giữ loại đòn của combo cũ: đấm thẳng tay 1, đấm thẳng tay 2 bằng tay đối diện, rồi đấm móc đi lên. Vẽ lại cùng mẫu anime người trưởng thành, nhìn ngang sang phải. Đòn 4 đổi sang một tay đấm thẳng xuống đất: tay đánh có nắm đấm chạm sàn và cẳng tay gần thẳng đứng; tay còn lại giữ gần ngực.

Tham chiếu động tác 1–3 là các pose cũ trong `identity-v6/inputs/attack1-poses.png` đến `attack3-poses.png`. Sơ đồ cấu trúc mới mô tả các pha chuyển tiếp theo tỷ lệ người; không phải mocap hay khung trích từ video. Nhận diện và màu tóc/da/áo/giày đối chiếu trực tiếp với idle và walk anime hiện có. Các đòn dùng chung cel guard mở/đóng. Đóng gói chỉ tịnh tiến và thay đổi tỷ lệ đồng đều toàn bộ hình để cùng chiều cao đứng 484 px; không cắt ghép, uốn chi thể hay tự đổi màu bằng mã.

Đòn thẳng 2 đã vẽ lại tay sau: tay gần máy giữ cạnh mặt, cánh tay đánh nằm phía sau tay giữ. Cổ tay đấm thẳng liền trục cẳng tay; mũi giày hướng sang phải. Hai điểm chạm của giày nằm cùng mặt sàn; chân sau có thể nhấc gót nhưng mũi chân giữ tiếp xúc, gồm cả tư thế quỳ đấm đất. Trang xem có phóng to riêng nắm đấm và hai bàn chân, kèm mẫu idle để đối chiếu màu. `palette-inspection.json` ghi thống kê màu áo để hỗ trợ đối chiếu, không thay thế kiểm tra tranh bằng mắt.

8 khung riêng mỗi đòn, cộng 32 khung. Giữ gần thời lượng combo trước cho ba đòn đầu: 250 ms, 250 ms, 360 ms (bộ cũ xấp xỉ 250/250/364 ms); đòn đấm đất mới 520 ms. GIF phát một lần, có bản xem chậm. JSON ghi thời lượng từng cel và khung tiếp xúc.

PNG/GIF xuất chỉ có nhân vật. Trang xem có bật bộ VFX đã duyệt; ảnh VFX gốc và manifest không bị sửa. Áp lực đấm thẳng gắn nắm đấm, móc đi từ chân lên, chấn động cuối phát quanh điểm nắm đấm chạm sàn. Hiển thị source-over, không thêm bloom/quầng trắng. Đây là trang duyệt tài nguyên; gameplay, hitbox và combo cũ không bị sửa.

`protected-baselines.json` lưu hash idle, walk/run, chỉnh kính, dữ liệu combat cũ và bộ VFX để kiểm tra chúng giữ nguyên. `combat-plan.json` là ý đồ tư thế, không phải dữ liệu đo từ tranh. Tọa độ neo xuất được kiểm tra trực tiếp trên artwork cuối.

Kiểm tra: `python tools/validate-assets.py`, `node --test tools/timeline.test.mjs`, `node tools/browser-review.cjs` (chạy từ gốc repo và dùng đường dẫn đầy đủ tới script). Bài kiểm tra đọc ảnh/alpha/timing, điểm tiếp đất hai giày, các mốc combo và thao tác trang xem; hướng bàn tay và giải phẫu vẫn cần kiểm tra trực quan. `tools/stage-public.py` chỉ sao chép tài nguyên mới và xuất JSON tải xuống dùng tọa độ toàn atlas, không sửa dữ liệu trò chơi.
