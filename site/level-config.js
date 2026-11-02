/* World coordinates and authored encounters for the opening chapter. */
window.DI_MON_CHAPTER = Object.freeze({
  id: 'office-07-v1', width: 6500, ground: 584, startX: 240,
  groundSections: [[0,2320],[2620,6500]],
  platforms: [
    { x:1360, y:500, w:200, h:84, kind:'cabinet' },
    { x:3940, y:510, w:180, h:74, kind:'rubble' }
  ],
  checkpointX: 2820, rescueX: 3530, exitX: 6240,
  encounters: [
    { id:'scout', x:1030, hp:54, minX:720, maxX:1320 },
    { id:'stalker', x:1780, hp:72, minX:1580, maxX:2100 },
    { id:'guard-a', x:3030, hp:72, minX:2760, maxX:3220 },
    { id:'guard-b', x:3290, hp:72, minX:3040, maxX:3430 },
    { id:'rift-a', x:4550, hp:72, minX:4210, maxX:4800 },
    { id:'warden', x:4930, hp:180, elite:true, minX:4590, maxX:5380 },
    { id:'rift-b', x:5420, hp:72, minX:5100, maxX:5670 }
  ],
  intro: [
    ['NHÂN VIÊN 01','…Mất điện? Không. Có thứ gì đó đang bò ra từ khe nứt.'],
    ['TINH LINH','Cổng dị giới đã mở. Sức mạnh của anh vừa thức tỉnh. Hãy tìm người còn sống và rời khỏi tầng này.']
  ],
  rescue: [
    ['ĐỒNG NGHIỆP','Anh cũng còn sống… Tôi cứ nghĩ sẽ không ai tới. Cầu thang phía đông vẫn chưa bị sập.'],
    ['NHÂN VIÊN 01','Đi cùng tôi. Đừng lại gần khe nứt.'],
    ['TINH LINH','Nhiệm vụ hoàn thành: cứu một đồng nghiệp. Phong năng đã mở khóa. Hãy dọn đường tới cầu thang thoát hiểm.']
  ],
  ending: [
    ['ĐỒNG NGHIỆP','Chúng ta ra được rồi… Nhưng bên ngoài, những cánh cổng đó…'],
    ['TINH LINH','Đây mới chỉ là cánh cổng đầu tiên. Hệ thống đã ghi nhận sự thức tỉnh của anh.']
  ]
});
