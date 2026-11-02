/* Chapter Two: escort, break the invasion anchors, reach evacuation. */
(() => {
  const ground=584,width=7600;
  const mob=(id,x,hp,minX,maxX,kind)=>({id,x,y:ground,floor:0,hp,minX,maxX,kind});
  window.DI_MON_CHAPTER=Object.freeze({
    chapter:2,id:'city-evacuation-v1',saveKey:'di-mon:chapter-two:v1',width,height:820,ground,startX:220,
    worldManifest:'art/chapter-two/manifest.json',
    backgrounds:{office:'art/chapter-two/city-night.png',lobby:'art/chapter-two/evacuation-night.png'},
    startRescued:true,startFire:true,startXP:235,
    levelRules:[{xp:80,level:2,maxHp:115},{xp:320,level:3,maxHp:130},{xp:500,level:4,maxHp:145}],
    floors:[{index:0,number:0,y:ground,name:'ĐẠI LỘ ĐÊM XÂM LẤN',hole:null,entryX:220}],
    groundSections:[[0,2660],[2840,5160],[5320,width]],
    platforms:[{x:1460,y:514,w:200,h:70,kind:'wreck',floor:0},{x:4140,y:490,w:220,h:94,kind:'bus',floor:0}],
    checkpoints:[{id:0,floor:0,x:220},{id:1,floor:0,x:1180},{id:2,floor:0,x:2400},{id:3,floor:0,x:4540},{id:4,floor:0,x:6120}],
    rescueFloor:0,rescueX:120,medicalX:2350,exitX:7340,
    encounters:[
      mob('street-hound',930,66,700,1120),
      mob('clinic-spitter',1820,56,1820,1820,'spitter'),
      mob('clinic-guard',2070,72,1930,2180),
      mob('anchor-guard-a',3310,72,3130,3490),
      {...mob('anchor-a',3650,130,3650,3650,'nest'),reward:30},
      mob('anchor-spitter-a',3890,66,3890,3890,'spitter'),
      mob('anchor-guard-b',5450,78,5350,5520),
      {...mob('anchor-b',5660,160,5660,5660,'nest'),reward:35},
      mob('anchor-spitter-b',5900,72,5900,5900,'spitter'),
      {...mob('pursuer',6790,420,6350,7080,'hunter'),boss:true,elite:true,reward:60}
    ],
    intro:[
      ['ĐỒNG NGHIỆP','Ngoài đường cũng đầy quái… Có đèn cứu hộ ở phía trước.'],
      ['TINH LINH','Đưa cô ấy tới trạm cứu thương. Hỏa năng và phong năng của anh vẫn còn. Sau đó chúng ta phải mở đường tới khu sơ tán.']
    ],
    delivery:[
      ['TỔ CỨU HỘ','Để cô ấy lại đây, chúng tôi sẽ chăm sóc. Nhưng hai ổ dị giới đang làm nhiễu toàn bộ tuyến đường.'],
      ['ĐỒNG NGHIỆP','Tôi sẽ ở lại giúp họ. Anh hãy cẩn thận.'],
      ['TINH LINH','Mục tiêu mới: phá hai ổ dị giới để hạ màn chắn. Chúng có thể bị phá bằng đòn đánh hoặc nguyên tố.']
    ],
    bossIntro:[
      ['TINH LINH','Hai ổ dị giới đã bị phá. Nhưng Kẻ Truy Sát đang chắn lối tới khu sơ tán.'],
      ['NHÂN VIÊN 01','Vậy thì chúng ta dọn nốt con đường này.']
    ],
    ending:[
      ['TỔ CỨU HỘ','Tuyến sơ tán đã thông! Những người còn lại có thể di chuyển rồi.'],
      ['TINH LINH','Nhiệm vụ hoàn thành: mở tuyến sơ tán. Từ phía trung tâm thành phố, một cánh cổng lớn hơn đang gọi.']
    ]
  });
})();
