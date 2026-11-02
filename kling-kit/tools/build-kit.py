"""Build the text handoff, browser guide and ZIP; never modifies artwork."""
from pathlib import Path
import csv, hashlib, html, json, shutil, zipfile

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
DATE='03/11/2026'
COMMON='Preserve the supplied hand-drawn 2D anime design, adult proportions, glasses, hair silhouette and clothing colors throughout. Animate believable changing poses, natural joint movement and cloth following the body. One continuous shot. Silent character acting.'
SHOTS=[
 dict(id='S01',name='Đêm muộn ngoài công ty',time='00:00–00:04',start=0,end=4,source=5,refs=[],image='S01-start.png',goal='Mưa và ánh đèn dẫn vào một đêm làm việc muộn.',
 prompt='Rain falls across the dark office tower and splashes into puddles on the empty street. Warm light remains steady in the single lit upper office window. Tree leaves sway gently in the wind. The camera makes a restrained slow push toward that lit window, keeping the building geometry stable. A faint violet flicker briefly lights the distant clouds near the end. Continuous hand-drawn 2D anime background animation, quiet suspense, one uninterrupted shot.',
 audio='Steady exterior rain, distant city air, one low distant thunder roll. No dialogue or music.',
 check='Đường thẳng tòa nhà giữ ổn định; mưa và lá có chuyển động; cửa sổ sáng không nhảy vị trí.'),
 dict(id='S02',name='Nhân viên ở lại làm việc',time='00:04–00:09',start=4,end=9,source=5,refs=['hero','coworker'],image='S02-start.png',goal='Giới thiệu nhân vật qua diễn xuất nhỏ, có chuyển động thật.',
 prompt='The man seated on the left types naturally with both hands resting at the keyboard. His shoulders move subtly with his breathing and he blinks once. After a brief pause, he stops typing, lifts his eyes from the monitor and turns his head slightly toward the woman and the faint sound behind him. The woman in the background turns her head toward the windows. Reflections of rain move softly across the glass. The camera makes a very slow push in; the man remains seated. '+COMMON,
 audio='Soft rain behind windows, a few light keyboard taps, a chair creak and a faint structural rumble near the end. No dialogue or music.',
 check='Có gõ phím, dừng tay và quay đầu; kính không tan hoặc đổi gọng; camera không chỉ lướt trên ảnh tĩnh.'),
 dict(id='S03',name='Sàn nhà rạn vỡ',time='00:09–00:14',start=9,end=14,source=5,refs=['hero','coworker'],image='S03-start.png',goal='Giữ rõ bên trái an toàn, bên phải nguy hiểm.',
 prompt='The ceiling light swings and small concrete fragments fall as the office begins to shake. The floor crack widens on the right. The woman on the right loses her footing and drops to one knee at the broken edge, bracing one palm on the remaining slab. The man on the left takes one quick grounded step toward her and reaches his right arm out. Both bodies respond to gravity with clear weight shifts. Keep the safe floor on the left and the opening on the right. The camera holds this wide composition with only a slight earthquake tremor. '+COMMON,
 audio='A deep structural rumble, cracking concrete, a rattling light fitting and a few falling fragments. No dialogue or music.',
 check='Sàn vỡ ở bên phải; không đảo vị trí hai người; nhân vật có trọng lượng và chân chạm sàn; không cần mô tả một cú rơi dài.'),
 dict(id='S04',name='Kéo đồng nghiệp lên',time='00:14–00:19',start=14,end=19,source=5,refs=['hero','coworker'],image='S04-start.png',optional_end='S04-end.png',goal='Một hành động duy nhất: kéo người lên từ tư thế đã nắm chắc.',
 prompt='The man on the left already has a secure two-handed grip on the woman\'s left forearm. He tightens that existing grip, shifts his weight back through his braced right foot and pulls her upward in one sustained effort. The woman pushes her free right palm against the ledge and brings one knee onto the safe slab on the left. She ends supported on the intact floor beside him, visibly relieved. Maintain the same forearm grip until she is supported. Keep the anatomy and contact physically continuous. The camera stays locked in this same side-view composition. '+COMMON,
 audio='Falling grit, fabric strain, a braced sneaker scraping concrete, and one relieved breath when she reaches the slab. No dialogue or music.',
 check='Hai bàn tay không hòa làm một; điểm nắm cẳng tay liên tục; chân trụ và đầu gối có điểm tì; người nữ lên được sàn an toàn.'),
 dict(id='S05',name='Tinh linh thức tỉnh',time='00:19–00:24',start=19,end=24,source=5,refs=['hero','coworker'],image='S05-start.png',goal='Cảm xúc trên khuôn mặt dẫn cảnh, ánh sáng chỉ hỗ trợ.',
 prompt='The tiny mint spirit hovering above the man\'s open palm gently circles once, trailing a few delicate translucent sparks. His open palm remains steady. His eyes follow the light; his brows gradually settle from surprise into calm determination, and his breathing becomes controlled. The spirit slowly sinks into his palm, leaving a faint mint reflection along his glasses and fingertips. The woman behind him takes a recovering breath on the safe floor. The camera slowly pushes closer to his face while keeping his eyes visible. '+COMMON,
 audio='Soft room tone, a delicate airy chime and a gentle rising breath of wind. No dialogue or music.',
 check='Có đổi ánh mắt và biểu cảm; ánh sáng không che mặt; lòng bàn tay giữ giải phẫu ổn định; tinh linh nhỏ, không biến thành khối khói trắng.'),
 dict(id='S06',name='Cú đấm khí lực bảo vệ',time='00:24–00:28',start=24,end=28,source=5,refs=['hero','coworker'],image='S06-start.png',goal='Một cú đấm rõ lực, bảo vệ người ở phía sau.',
 prompt='The dark claw advances out of the portal from the right. The man plants his rear sneaker, rotates his hips and shoulder, then delivers exactly one decisive right straight punch toward the claw. His arm extends only to its natural reach. A compact transparent air-pressure crescent bursts forward from his fist and continues beyond his hand, driving the claw back toward the portal. Fine wind filaments and a little floor dust reveal the force while his body and face remain readable. The woman stays safely behind him on the left. He finishes in a grounded protective stance. Keep the camera in this side-view composition, with a short restrained impact tremor at the strike. '+COMMON,
 audio='A brief gathering wind, a sharp air-pressure impact, a low creature recoil and scattering floor grit. No dialogue or music.',
 check='Chỉ một cú đấm; cánh tay không kéo dài thành đòn đánh; khí lực đi tiếp từ nắm đấm; không có mây trắng che người; đồng nghiệp đứng sau đường đánh.'),
]
SOURCES=[
 ('Kling Image-to-Video — Subject + Movement','https://kling.ai/quickstart/image-to-video-guide'),
 ('Start and End Frames','https://kling.ai/quickstart/ai-video-start-end-frames'),
 ('Kling 4.0 User Guide','https://kling.ai/quickstart/kling-4-model-user-guide'),
 ('Kling VIDEO 3.0 User Guide','https://kling.ai/quickstart/klingai-video-3-model-user-guide'),
 ('Element Library','https://kling.ai/quickstart/klingai-element-library-3-user-guide'),
]
NEGATIVE='extra limbs, missing limbs, extra fingers, fused hands, detached wrists, bending rubber arms, stretched arms, changing faces, changing glasses, changing costume, character duplication, sliding feet, floating feet, cutout puppet motion, static slideshow, camera cuts, photorealistic live action, 3D plastic render, opaque white fog, excessive bloom, subtitles, logo, watermark'
FALLBACK='The man maintains his existing two-handed grip on the woman\'s forearm and shifts his weight slightly backward. The woman pushes her free palm onto the ledge and raises her shoulders and one knee onto the safe slab. Both pause once she is supported. The contact point remains continuous. Locked side-view camera, natural weight and stable hand-drawn 2D anime anatomy. One continuous shot. Silent acting.'

GUIDE='''# DỊ MÔN — Gói tạo phim bằng Kling AI

**Đêm thức tỉnh · 30 giây · ngang 16:9 · hướng anime 2D cinematic**

Đây là tài nguyên đầu vào để bạn tạo video trong Kling: ảnh cảnh hoàn chỉnh, ảnh tham chiếu nhân vật, prompt và hướng dẫn dựng. Các clip Kling chưa được tạo hoặc chạy thử bằng tài khoản Kling; ảnh trong gói là keyframe, không phải video đã sinh.

## Làm thử cảnh cứu người trước

1. Mở https://kling.ai/app/ và vào **Video Generation / Image-to-Video** hoặc chế độ **Frames** tương ứng.
2. Chọn **Kling 4.0** nếu tài khoản có; **VIDEO 3.0** là phương án dự phòng cho start/end frames và tham chiếu nhân vật. Giữ cùng một model khi tạo các cảnh có người.
3. Upload `02-scene-images/S04-start.png` vào **Start Frame**. Đây là ảnh cảnh hoàn chỉnh. Ảnh `hero.png` là ảnh tham chiếu, không dùng thay ảnh mở đầu cảnh này.
4. Nếu có **Add End Frame**, thêm `02-scene-images/S04-end.png`. Hai ảnh dùng cùng góc máy và điểm nắm cẳng tay. Nếu chế độ bạn chọn không hỗ trợ ảnh kết thúc, chỉ dùng ảnh Start và prompt chính.
5. Đặt **5 giây**, **16:9**, ưu tiên **1080p / chất lượng cao** nếu gói có. Nếu có **Multi-Shot**, tắt để giữ một góc máy. Khi làm nháp, có thể dùng mức chất lượng thấp hơn rồi tạo lại take chốt ở 1080p.
6. Mở `03-prompts/S04.txt`, chép toàn bộ nội dung vào ô prompt. Mỗi file đã đủ hướng dẫn; không cần ghép thêm prompt chung.
7. Tạo 1 take, kiểm tra điểm nắm tay và trọng lượng cơ thể. Nếu sai, dùng `S04-simple-retry.txt`, giảm hành động về một lần kéo ngắn. Khi bản có End Frame bị chuyển cảnh hoặc biến hình, thử bỏ End Frame và giữ camera đứng yên.
8. Chỉ tiếp tục các cảnh khác sau khi bạn thấy chất lượng chuyển động chấp nhận được. Số credit phụ thuộc model, thời lượng, chất lượng và số lần thử; xem mức hiển thị trước khi Generate.

Tên nút và lựa chọn có thể thay đổi theo model/gói tài khoản. Hướng dẫn này đi theo các chức năng được mô tả trong tài liệu chính thức, không giả định mọi tài khoản đều có cùng giao diện.

## Giữ nhân vật đồng nhất giữa các cảnh

Các ảnh đã được vẽ lại theo phong cách anime: giữ tóc nâu vuốt lệch, kính tròn đen, áo varsity xanh đậm viền trắng của nam chính; giữ tóc cột thấp, blazer xám và dây thẻ đỏ của đồng nghiệp. Tỷ lệ cơ thể được chuyển sang anime người trưởng thành để phù hợp diễn xuất phim.

- `01-references/hero.png` và `hero-face.png`: toàn thân và cận mặt nam chính.
- `01-references/coworker.png` và `coworker-face.png`: toàn thân và cận mặt đồng nghiệp.
- Nếu có **Element Library**, tạo một element tên `DiMonHero` từ 2 ảnh của nam chính, và một element `DiMonCoworker` từ 2 ảnh đồng nghiệp. Hướng dẫn Element Library hiện mô tả tối thiểu 2 ảnh cho một multi-image element.
- Nếu workflow hỗ trợ **Start Frame + Element Reference**, gắn đúng 2 element này vào các cảnh S02–S06. Chọn element bằng giao diện; chỉ gõ tên vào prompt sẽ không tự đính kèm tham chiếu.
- Nếu không có Elements, vẫn dùng từng ảnh Start và prompt. Kiểm tra mặt, tóc, kính, áo ở từng take trước khi chọn; không đổi model tùy tiện giữa các cảnh.
- Không upload sheet có nhiều người/biểu cảm làm Start Frame. Không dùng sprite hoặc từng bộ phận cơ thể để làm ảnh đầu vào cho các cảnh này.

## Tạo đủ 6 clip

Mỗi cảnh sinh một clip nguồn 5 giây. Dùng ảnh Start cùng mã và prompt cùng mã. Dùng nhịp trong `04-editing/timeline.csv` để cắt còn 28 giây hình phim, thêm 2 giây tên game thành 30 giây.

Kling 4.0 có thể hỗ trợ thời lượng dài hơn và nhiều keyframe. Chia clip 5 giây ở đây là lựa chọn sản xuất để dễ duyệt và tạo lại từng cảnh, không phải giới hạn thời lượng của model.

- Prompt tiếng Anh đã nêu rõ **ai làm gì**, giữ một shot, diễn xuất không lời. Không cần thêm lời thoại hoặc yêu cầu camera quay vòng.
- Nếu có ô **Negative Prompt**, có thể dùng `03-prompts/negative.txt`. Nếu không có, bỏ qua; không bắt buộc ghép danh sách này vào prompt chính.
- Nếu bật **Native Audio**, nối đoạn tương ứng trong `03-prompts/native-audio.txt` vào cuối prompt cảnh. Yêu cầu chỉ âm thanh môi trường, không thoại và không nhạc, để dễ dựng nhạc xuyên suốt sau đó. Nếu tắt Native Audio, dùng cue sheet để bổ sung âm thanh trong phần mềm dựng.
- Xuất take được chọn và đổi tên **S01.mp4 … S06.mp4**. Giữ bản gốc, không nén qua ứng dụng chat trước khi dựng.

## Dựng thành phim 30 giây

1. Mở DaVinci Resolve hoặc trình dựng bạn quen; tạo timeline **1920×1080, 30 fps** trước khi thả clip.
2. Ghép theo thứ tự S01 → S06. Lấy 4 giây của S01; 5 giây mỗi cảnh S02–S05; 4 giây của S06. Thay đổi điểm In trong clip nguồn nếu nhịp hành động tốt hơn ở đoạn khác, nhưng giữ độ dài cảnh theo bảng.
3. Thêm `04-editing/end-title.png` ở **00:28–00:30**. Không gửi logo/title card vào Kling để tạo chuyển động nhân vật. Có thể thêm fade 6–8 frame trong trình dựng.
4. Dùng cắt thẳng giữa các cảnh. Giữ nhịp gõ phím → rung chấn → cứu người → im ngắn ở tinh linh → cú đấm. Không phủ transition xoay hoặc zoom lên các điểm đổi cảnh.
5. File `timeline.edl` là khung dựng tham khảo 30 fps với tên clip S01.mp4…S06.mp4 và đoạn nền đen 2 giây ở cuối. Một số trình dựng cần relink clip thủ công; nếu import không khớp, dùng bảng CSV. Thay đoạn đen cuối bằng ảnh title.
6. `dialogue-optional.srt` chứa lời thoại phụ đề tùy chọn, chưa có bản lồng tiếng. Import thành subtitle track và chỉnh điểm vào/ra theo take thực tế. Có thể bỏ toàn bộ thoại để làm bản landing chỉ hình và âm thanh.
7. Dùng `sound-cues.csv` để đặt mưa, gõ phím, sàn nứt, tiếng kéo người và cú khí lực. Đặt một bài nhạc xuyên suốt thay vì để mỗi clip tự sinh một bài khác nhau. Gói này không kèm bản nhạc thu sẵn.
8. Xuất **MP4, H.264, 1920×1080, 30 fps, khoảng 12 Mb/s; âm thanh AAC 48 kHz**. Độ dài cuối đúng **30 giây**. Chọn clip nguồn 1080p cho bản chốt.

## Khi kết quả chưa đạt

| Vấn đề | Cách thử tiếp |
| --- | --- |
| Camera chạy nhưng người đứng im | Giữ câu hành động nhân vật ở đầu prompt; bỏ bớt chuyển động camera; dùng lại ảnh Start. |
| Cứu người bị dính hoặc thừa tay | Giữ điểm nắm cẳng tay có sẵn, dùng prompt S04 đơn giản, camera khóa; không thêm ôm, xoay hoặc đổi tay. |
| Kính, mặt hay áo thay đổi | Kiểm tra ảnh Start; gắn đúng Element nếu có; giữ cùng model; tạo lại take sai trước khi dựng. |
| Hai ảnh Start/End gây chuyển cảnh | Bỏ End Frame, dùng Start + prompt; hoặc giảm mức thay đổi tư thế. |
| Cú đấm biến thành tay dài hoặc nhiều đòn | Chỉ giữ một cú đấm thẳng; tay dừng ở tầm với tự nhiên, luồng khí mới là phần đi tiếp. |
| VFX trắng xóa che mặt | Giữ yêu cầu khí trong, sợi khí mảnh và ít bụi; giảm/loại bỏ yêu cầu glow, explosion hoặc smoke. |
| Clip có thoại lạ | Dùng silent acting; tắt thoại/âm thanh sinh nếu chế độ cho phép, hoặc mute clip và dựng lại âm thanh. |
| Hai cảnh lệch màu | Chọn take có tông đèn vàng / cửa sổ xanh gần nhau rồi cân màu nhẹ ở trình dựng. |

## Kiểm tra trước khi chốt take

Xem video ở tốc độ thật, sau đó dừng ở các điểm tiếp xúc. Kiểm tra: nhân vật có thực sự hành động; mặt/tóc/kính giữ nhận diện; tay chân đúng và không cao su; chân trụ bám sàn; điểm nắm cẳng tay không đứt; đồng nghiệp đã ở bên an toàn; cú đấm chỉ xảy ra một lần; hiệu ứng không che nhân vật.

## Nguồn hướng dẫn

Đã đối chiếu tài liệu chính thức ngày 03/11/2026. Cấu hình hiển thị trong tài khoản thực tế là căn cứ cuối cùng cho model và tính năng khả dụng.
'''

def esc(s):return html.escape(str(s),quote=True)
def make_readme():
 text=GUIDE+'\n\n## Bảng cảnh\n\n| Mã | Vị trí trong phim | Ảnh đầu | Mục tiêu |\n| --- | --- | --- | --- |\n'
 for s in SHOTS:text+=f"| {s['id']} | {s['time']} | `02-scene-images/{s['image']}` | {s['goal']} |\n"
 text+='\n'+''.join(f'- [{name}]({url})\n' for name,url in SOURCES)
 text+='\n## Prompt sẵn để chép\n\n'
 for s in SHOTS:text+=f"### {s['id']} — {s['name']}\n\n{s['prompt']}\n\n**Duyệt:** {s['check']}\n\n"
 return text

def main():
 for d in ['03-prompts','04-editing']: (ROOT/d).mkdir(exist_ok=True)
 for s in SHOTS:(ROOT/'03-prompts'/f"{s['id']}.txt").write_text(s['prompt']+'\n')
 (ROOT/'03-prompts/negative.txt').write_text(NEGATIVE+'\n')
 (ROOT/'03-prompts/S04-simple-retry.txt').write_text(FALLBACK+'\n')
 (ROOT/'03-prompts/native-audio.txt').write_text('\n\n'.join(s['id']+' — append only when Native Audio is enabled:\nSound: '+s['audio'] for s in SHOTS)+'\n')
 (ROOT/'README-VI.md').write_text(make_readme())
 with (ROOT/'04-editing/timeline.csv').open('w',newline='') as f:
  w=csv.writer(f);w.writerow(['shot','record_in_seconds','record_out_seconds','used_seconds','source_seconds','filename','purpose'])
  for s in SHOTS:w.writerow([s['id'],s['start'],s['end'],s['end']-s['start'],5,s['id']+'.mp4',s['name']])
  w.writerow(['TITLE',28,30,2,'still','end-title.png','Tên game'])
 edl='TITLE: DI MON - DEM THUC TINH\nFCM: NON-DROP FRAME\n\n'
 def tc(sec):return f'00:00:{sec:02d}:00'
 for i,s in enumerate(SHOTS,1):edl+=f"{i:03d}  {s['id']:<8} V     C        00:00:00:00 {tc(s['end']-s['start'])} {tc(s['start'])} {tc(s['end'])}\n* FROM CLIP NAME: {s['id']}.mp4\n\n"
 edl+='007  BL       V     C        00:00:00:00 00:00:02:00 00:00:28:00 00:00:30:00\n* REPLACE THIS BLACK SEGMENT WITH end-title.png\n'
 (ROOT/'04-editing/timeline.edl').write_text(edl)
 (ROOT/'04-editing/dialogue-optional.srt').write_text('1\n00:00:11,000 --> 00:00:12,200\nCẩn thận!\n\n2\n00:00:14,300 --> 00:00:16,600\nNắm lấy tay tôi!\n\n3\n00:00:20,000 --> 00:00:21,900\nAnh vẫn muốn cứu họ chứ?\n\n4\n00:00:22,100 --> 00:00:23,500\nTất nhiên.\n')
 with (ROOT/'04-editing/sound-cues.csv').open('w',newline='') as f:
  w=csv.writer(f);w.writerow(['time_seconds','cue','note'])
  for row in [(0,'Mưa ngoài trời','Mở rộng stereo, sau cut vào phòng hạ nhỏ'),(4,'Gõ phím, mưa qua kính','Không đặt nhạc quá lớn'),(8,'Rung chấn bắt đầu','Dẫn âm thanh qua điểm cắt'),(9,'Sàn rạn, đèn rung','Tránh tiếng nổ phủ kín cảnh'),(14,'Sỏi rơi, vải căng, giày ma sát','Đồng bộ điểm kéo và đầu gối chạm sàn'),(19,'Khoảng lặng ngắn và tinh linh','Tiếng ngân mỏng, giảm tiếng rền'),(24,'Khí tụ','Theo bàn tay nhân vật'),(26,'Khí lực bật ra, móng vuốt bị đẩy','Dời theo đúng frame nắm đấm phát lực của take'),(28,'Âm kết tên game','Đuôi âm tắt dần trước 30 giây')]:w.writerow(row)
 manifest={'title':'Dị Môn — Đêm thức tỉnh','date':DATE,'runtime_seconds':30,'aspect_ratio':'16:9','timeline_fps':30,'status':'input-art-and-prompts; Kling generation not run','shots':SHOTS,'sources':[{'title':n,'url':u} for n,u in SOURCES]}
 (ROOT/'shot-plan.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 # The web guide is built as a readable handoff, never as a fake video preview.
 from markdown_it import MarkdownIt
 md=MarkdownIt('commonmark',{'html':False}).enable('table')
 guide_html=md.render("## Làm thử cảnh cứu người trước"+GUIDE.split("## Làm thử cảnh cứu người trước",1)[1])
 cards=[]
 for s in SHOTS:
  extra=f'<a href="02-scene-images/{esc(s["optional_end"])}" download>Ảnh kết thúc tùy chọn ↓</a>' if s.get('optional_end') else ''
  endpic=f'<details><summary>Xem ảnh kết thúc</summary><img loading="lazy" src="02-scene-images/{esc(s["optional_end"])}" alt="Tư thế kết thúc cảnh cứu người"></details>' if s.get('optional_end') else ''
  cards.append(f'''<article id="{s['id']}" class="shot"><div class="shot-head"><span>{s['id']} / {s['time']}</span><h3>{esc(s['name'])}</h3></div><img loading="lazy" src="02-scene-images/{s['image']}" alt="Ảnh mở đầu {esc(s['name'])}"><p>{esc(s['goal'])}</p><div class="links"><a href="02-scene-images/{s['image']}" download>Ảnh mở đầu PNG ↓</a>{extra}<a href="03-prompts/{s['id']}.txt" download>Prompt TXT ↓</a></div><label for="prompt-{s['id']}">Prompt chuyển động — chép nguyên đoạn</label><textarea id="prompt-{s['id']}" readonly>{esc(s['prompt'])}</textarea><pre class="print-prompt">{esc(s['prompt'])}</pre><button type="button" data-copy="prompt-{s['id']}">Chép prompt {s['id']}</button><p class="check"><strong>Duyệt take:</strong> {esc(s['check'])}</p>{endpic}</article>''')
 css='''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#09141c;color:#e2e8e7;font:16px/1.7 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:38px 24px 70px}a{color:#addecf;text-underline-offset:4px}h1,h2,h3{line-height:1.25;color:#f0f2e9}h1{font-size:clamp(32px,5vw,58px);margin:16px 0}h2{margin-top:46px;font-size:27px}h3{font-size:23px;margin:10px 0 18px}.eyebrow{font-size:12px;letter-spacing:3px;color:#a5c7bd}.lead{max-width:780px;color:#b8c9ca}.actions,.links{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.button,button{display:inline-block;border:1px solid #4a746c;border-radius:6px;background:#183138;color:#d7eee4;padding:11px 16px;font:600 14px system-ui;text-decoration:none;cursor:pointer}.primary{background:#b5ddc7;color:#102e29}.refs{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.refs img{width:100%;aspect-ratio:2/3;object-fit:contain;background:#28384b;border:1px solid #3b5360}.refs a{font-size:13px}.notice{border-left:3px solid #9fceba;padding:12px 18px;background:#13262f;color:#c6d5d4}.shot{background:#10222c;border:1px solid #304953;border-radius:10px;padding:22px;margin-top:28px;break-inside:avoid}.shot-head>span{font-size:12px;letter-spacing:2px;color:#a1c6b9}.shot>img,details img{display:block;width:100%;height:auto;border-radius:5px}.shot textarea{display:block;resize:vertical;width:100%;min-height:155px;margin:12px 0;background:#09161e;color:#d2e5e1;padding:16px;border:1px solid #41606b;border-radius:5px;font:13px/1.6 ui-monospace,monospace}.shot label{font-size:13px;color:#abccc1}.check{font-size:14px;color:#b8d0ca}.links a{font-size:13px}.guide table{border-collapse:collapse;width:100%;font-size:14px}.guide td,.guide th{border:1px solid #3a505b;padding:10px;text-align:left}code{font-size:.88em;overflow-wrap:anywhere;background:#1a303b;padding:2px 5px;border-radius:3px}.guide li{margin:9px 0}.guide p{max-width:1000px}.sources{margin-top:36px}footer{border-top:1px solid #304953;margin-top:42px;padding-top:22px;font-size:12px;color:#90aaa9}summary{cursor:pointer}.print-prompt{display:none}.status{min-height:24px;font-size:13px;color:#a9dfc6}a:focus-visible,button:focus-visible,textarea:focus-visible{outline:2px solid #b5ddc7;outline-offset:3px}@media(max-width:650px){main{padding:24px 14px}.refs{grid-template-columns:repeat(2,1fr)}.shot{padding:14px}.guide{overflow-wrap:anywhere}.guide table{font-size:12px}.guide td,.guide th{padding:6px}.shot textarea{min-height:240px}}@media print{@page{size:A4;margin:16mm}body{background:white;color:#17202b;font-size:10pt;line-height:1.5}main{padding:0;max-width:none}h1,h2,h3{color:#102735}h1{font-size:30pt}h2{font-size:17pt;margin-top:25px}h3{font-size:14pt}a{color:#123f58}.actions,button,.status{display:none}.notice,.shot{background:#f3f6f6;border-color:#bacbca;color:#17202b}.shot{padding:14px;break-inside:auto;page-break-before:always}.shot>img{max-height:85mm;object-fit:contain}.shot textarea{height:52mm;min-height:0;resize:none;border:none;background:#f0f2f2;color:#182936;overflow:hidden;font-size:8.4pt;padding:9px}.refs img,.shot>img{display:none}.shot textarea{display:none}.print-prompt{display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:8.8pt/1.5 ui-monospace,monospace;background:#f0f2f2;padding:12px}.shot label,.check,.eyebrow,.shot-head>span{color:#345b63}.refs{grid-template-columns:repeat(4,1fr)}.guide table{font-size:8pt}.guide td,.guide th{border-color:#aabbbb}code{background:#edf0f0}details{display:none}footer{color:#345b63}.sources{page-break-inside:avoid}}'''
 refs=''.join(f'<div><a href="01-references/{file}.png" download><img src="01-references/{file}.png" alt="{esc(label)}">{esc(label)} ↓</a></div>' for file,label in [('hero','Nam chính — toàn thân'),('hero-face','Nam chính — cận mặt'),('coworker','Đồng nghiệp — toàn thân'),('coworker-face','Đồng nghiệp — cận mặt')])
 sources=''.join(f'<li><a href="{esc(u)}" target="_blank" rel="noopener noreferrer">{esc(n)}</a></li>' for n,u in SOURCES)
 page=f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Bộ ảnh cảnh, tham chiếu nhân vật và hướng dẫn tạo phim Dị Môn bằng Kling AI."><title>Dị Môn — Gói tạo phim bằng Kling AI</title><script>if(location.protocol!=="file:"){{const b=document.createElement("base");b.href="/kling-kit/";document.head.append(b);}}</script><style>{css}</style></head><body><main><header><div class="eyebrow">DỊ MÔN / KLING AI PRODUCTION KIT</div><h1>Đêm thức tỉnh.</h1><p class="lead">Ảnh đầu vào và hướng dẫn tạo phim anime 2D: 6 cảnh, 30 giây, khung ngang 16:9.</p><div class="actions"><a class="button primary" href="https://github.com/NrocneK/new-world/raw/refs/heads/codex/vfx-v5-downloads/site/downloads/di-mon-kling-kit-v1.zip">Tải trọn bộ ZIP ↓</a><a class="button" href="HUONG-DAN-KLING.pdf" download>Hướng dẫn PDF ↓</a><a class="button" href="#howto">Bắt đầu tạo video</a><a class="button" href="https://kling.ai/app/" target="_blank" rel="noopener noreferrer">Mở Kling AI ↗</a></div><p class="notice">Đây là tài nguyên để sinh video trong Kling. Các ảnh dưới đây là keyframe hoàn chỉnh; chưa có clip Kling được tạo hoặc kiểm thử bằng tài khoản Kling.</p></header><section><h2>Nhận diện nhân vật</h2><div class="refs">{refs}</div></section><section id="howto" class="guide">{guide_html}</section><section id="shots"><h2>Ảnh mở đầu &amp; prompt từng cảnh</h2>{''.join(cards)}</section><section><h2>Tệp dựng kèm theo</h2><div class="links"><a href="04-editing/end-title.png" download>Ảnh tên game PNG ↓</a><a href="04-editing/timeline.csv" download>Bảng dựng CSV ↓</a><a href="04-editing/timeline.edl" download>Khung dựng EDL ↓</a><a href="04-editing/dialogue-optional.srt" download>Phụ đề SRT ↓</a><a href="04-editing/sound-cues.csv" download>Gợi ý âm thanh CSV ↓</a></div></section><section class="sources"><h2>Tài liệu Kling đã đối chiếu</h2><ul>{sources}</ul><p>Tra cứu ngày {DATE}. Tính năng khả dụng theo model và tài khoản thực tế.</p></section><footer>Gói v1 · Ảnh đầu vào do AI tạo mới theo nhận diện Dị Môn · Không chứa footage gameplay hoặc hoạt hình ghép bộ phận.<div id="copy-status" class="status" aria-live="polite"></div></footer></main><script>for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',async()=>{{const t=document.getElementById(b.dataset.copy);try{{await navigator.clipboard.writeText(t.value);document.getElementById('copy-status').textContent='Đã chép prompt.';b.textContent='Đã chép ✓';}}catch{{t.focus();t.select();document.getElementById('copy-status').textContent='Đã chọn prompt. Nhấn Ctrl+C hoặc giữ để sao chép.';}}}});</script></body></html>'''
 (ROOT/'index.html').write_text(page)
 print('Built guide, six prompts, editing timeline and shot plan.')

if __name__=='__main__':main()
