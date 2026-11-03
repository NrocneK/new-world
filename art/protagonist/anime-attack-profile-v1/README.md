# Attack mẫu người — bản 02 (nguồn làm việc trong thư mục v1)

Giữ loại đòn của combo cũ: đấm thẳng tay 1, đấm thẳng tay 2 bằng tay đối diện, rồi đấm móc đi lên. Vẽ lại cùng mẫu anime người trưởng thành, nhìn ngang sang phải. Đòn 4 là một tay đấm thẳng xuống đất: tay đánh có nắm đấm chạm sàn và cẳng tay gần thẳng đứng; chân chùng rộng, gối sau không tì đất; tay còn lại vung ra sau để cân bằng theo mẫu động tác người dùng gửi.

Tham chiếu động tác 1–3 là các pose cũ trong `identity-v6/inputs/attack1-poses.png` đến `attack3-poses.png`. Sơ đồ cấu trúc mới mô tả các pha chuyển tiếp theo tỷ lệ người; không phải mocap hay khung trích từ video. Nhận diện và màu tóc/da/áo/giày đối chiếu trực tiếp với idle và walk anime hiện có. Các đòn dùng chung cel guard mở/đóng. Đóng gói chỉ tịnh tiến và thay đổi tỷ lệ đồng đều toàn bộ hình để cùng chiều cao đứng 484 px; không cắt ghép, uốn chi thể hay tự đổi màu bằng mã.

Đòn thẳng 2 đã vẽ lại tay sau: tay gần máy giữ cạnh mặt, cánh tay đánh nằm phía sau tay giữ. Cổ tay đấm thẳng liền trục cẳng tay; mũi giày hướng sang phải. Hai điểm chạm của giày nằm cùng mặt sàn; chân sau có thể nhấc gót nhưng mũi chân giữ tiếp xúc, kể cả khi hạ thấp người đấm đất. Trang xem có phóng to riêng nắm đấm và hai bàn chân, kèm mẫu idle để đối chiếu màu. `palette-inspection.json` ghi thống kê màu áo để hỗ trợ đối chiếu, không thay thế kiểm tra tranh bằng mắt.

Bản 02 sửa lỗi đổi chủ cánh tay ở các khung lấy đà, đấm nửa tầm và thu về của đòn 2: tay gần không kéo xuống hông, không duỗi ra đánh. Hai tay vào thế thủ, sau đó tay xa mới tiến ra và rút về; tay gần giữ cạnh mặt suốt khung 1–5. `attack2-continuity-guide.svg/png` mô tả tay gần màu cam, tay xa màu xanh để kiểm tra thứ tự trước/sau; màu chỉ xuất hiện trong sơ đồ, không tô vào nhân vật.

8 khung riêng mỗi đòn, cộng 32 khung. Giữ gần thời lượng combo trước cho ba đòn đầu: 250 ms, 250 ms, 360 ms (bộ cũ xấp xỉ 250/250/364 ms); đòn đấm đất mới 520 ms. GIF phát một lần, có bản xem chậm. JSON ghi thời lượng từng cel và khung tiếp xúc.

PNG/GIF xuất chỉ có nhân vật. Ba VFX đầu dùng nguồn đang có; ảnh VFX gốc và manifest không bị sửa. Đòn cuối có bộ VFX thử mới riêng: vòng khí mỏng sát mặt đất, vệt khí dựng lên và mảnh vỡ, tâm thoáng. `ground-impact-source.png` là 8 cel do imagegen vẽ, không xử lý màu/alpha bằng mã; `prepare-ground-fx.py` chỉ đăng ký tọa độ neo và độ mờ. Áp lực đấm thẳng gắn nắm đấm, móc đi từ chân lên, chấn động cuối phát quanh điểm nắm đấm chạm sàn. Hiển thị source-over, không thêm bloom/quầng trắng. Đây là trang duyệt tài nguyên; gameplay, hitbox và combo cũ không bị sửa.

Xuất trang và tài nguyên sang `site/attack-profile-v2.html` và `site/art/protagonist/anime-attack-profile-v2/` để không tải nhầm bitmap cũ từ cache. Trang v1 dùng cùng bản xem mới; các URL PNG/GIF v1 cũ vẫn là lưu trữ phiên bản trước. Sau `pack-preview.cjs`, chạy `measure-anchors.py`, `prepare-ground-fx.py`, rồi `stage-public.py`.

`protected-baselines.json` lưu hash idle, walk/run, chỉnh kính, dữ liệu combat cũ và bộ VFX để kiểm tra chúng giữ nguyên. `combat-plan.json` là ý đồ tư thế, không phải dữ liệu đo từ tranh. Tọa độ neo xuất được kiểm tra trực tiếp trên artwork cuối.

Kiểm tra: `python tools/validate-assets.py`, `node --test tools/timeline.test.mjs`, `node tools/browser-review.cjs` (chạy từ gốc repo và dùng đường dẫn đầy đủ tới script). Bài kiểm tra đọc ảnh/alpha/timing, điểm tiếp đất hai giày, các mốc combo và thao tác trang xem; hướng bàn tay và giải phẫu vẫn cần kiểm tra trực quan. `tools/stage-public.py` chỉ sao chép tài nguyên mới và xuất JSON tải xuống dùng tọa độ toàn atlas, không sửa dữ liệu trò chơi.
