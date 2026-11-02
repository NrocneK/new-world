/* Descend from floor 7 to the street. All platforms use world-space heights. */
(() => {
  const ground=584,gap=650,width=2000;
  const names=['KHU LÀM VIỆC','HÀNH LANG VỠ','PHÒNG HỌP','KHU SƠ TÁN','VĂN PHÒNG ĐỔ NÁT','KHU KỸ THUẬT','SẢNH THANG MÁY','SẢNH TẦNG TRỆT'];
  const floors=Array.from({length:8},(_,index)=>({
    index,number:7-index,y:ground+index*gap,name:names[index],
    hole:index===7?null:index%2===0?[1580,1960]:[40,420],
    entryX:index===0?240:index%2===1?1710:290
  }));
  const encounters=[];
  for(const f of floors){
    if(f.index===7){encounters.push({id:'gatekeeper',floor:7,x:930,y:f.y,hp:360,boss:true,elite:true,minX:480,maxX:1530});continue;}
    const guard=f.index===3;
    for(let i=0;i<2;i++)encounters.push({
      id:guard?'guard-'+i:'floor-'+f.number+'-'+i,floor:f.index,
      x:i===0?760:1280,y:f.y,hp:f.index<2?54:f.index<5?66:72,
      minX:i===0?500:1050,maxX:i===0?970:1480
    });
  }
  window.DI_MON_CHAPTER=Object.freeze({
    id:'office-descent-7-v2',width,height:floors.at(-1).y+180,ground,gap,startX:240,
    floors,encounters,
    platforms:[
      {x:920,y:floors[0].y-84,w:180,h:84,kind:'cabinet',floor:0},
      {x:1020,y:floors[2].y-70,w:170,h:70,kind:'rubble',floor:2},
      {x:880,y:floors[4].y-74,w:180,h:74,kind:'cabinet',floor:4},
      {x:1050,y:floors[6].y-60,w:160,h:60,kind:'rubble',floor:6}
    ],
    checkpoints:[
      {id:0,floor:0,x:240},
      {id:1,floor:1,x:1710},
      {id:2,floor:3,x:1710},
      {id:3,floor:5,x:1710},
      {id:4,floor:7,x:1710}
    ],
    rescueFloor:3,rescueX:1090,exitX:150,
    intro:[
      ['NHÂN VIÊN 01','Tòa nhà đang sập… Thang máy và cầu thang đều bị chặn rồi.'],
      ['TINH LINH','Chúng ta đang ở tầng 7. Các sàn vỡ có thể dẫn xuống dưới. Tìm người còn sống, rồi đến cửa ra ở tầng trệt.']
    ],
    rescue:[
      ['ĐỒNG NGHIỆP','Anh tới thật rồi… Lối cầu thang đã sập. Chỉ còn những khoảng sàn vỡ để xuống dưới.'],
      ['NHÂN VIÊN 01','Đi sát theo tôi. Chúng ta sẽ cùng ra ngoài.'],
      ['TINH LINH','Đã cứu một đồng nghiệp. Phong năng mở khóa. Tôi sẽ dẫn cô ấy qua các tầng. Có một sinh vật lớn đang giữ cửa tầng trệt.']
    ],
    bossIntro:[
      ['TINH LINH','Tầng trệt. Kẻ Gác Cửa đã phát hiện chúng ta. Né cú lao của nó; nhảy lên khi sóng chấn động lan trên sàn.'],
      ['ĐỒNG NGHIỆP','Cửa ra ở phía trái! Tôi sẽ chờ ở nơi an toàn.']
    ],
    ending:[
      ['ĐỒNG NGHIỆP','Từ tầng bảy… cuối cùng cũng ra được. Cảm ơn anh vì đã quay lại cứu tôi.'],
      ['TINH LINH','Nhiệm vụ hoàn thành: thoát khỏi tòa nhà. Nhưng những cánh cổng ngoài kia vẫn đang mở.']
    ]
  });
})();
