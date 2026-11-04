export function createScene(ctx,{width:W,height:H,ground:GROUND,targetX:TARGET_X}){
 let state;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ambient=Array.from({length:30},(_,i)=>({x:(i*163+47)%W,y:(i*73+81)%510,size:i%5===0?3:2,phase:i*1.7}));
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function line(x1, y1, x2, y2, color, width = 1) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function text(value, x, y, size = 12, color = '#849285', align = 'left') {
    ctx.font = size + 'px Consolas, monospace'; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
  }

  function drawScene() {
    rect(0, 0, W, H, '#111a1b');
    const sky = ctx.createLinearGradient(0, 0, 0, 475);
    sky.addColorStop(0, '#111b20'); sky.addColorStop(1, '#263335');
    ctx.fillStyle = sky; ctx.fillRect(47, 65, 1187, 450);
    ctx.fillStyle = '#bbc7a1'; ctx.beginPath(); ctx.arc(349, 168, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#263337'; ctx.beginPath(); ctx.arc(366, 156, 33, 0, Math.PI * 2); ctx.fill();
    // The city outside the office: rectilinear silhouettes and sparse lit windows.
    for (let i = 0; i < 17; i++) {
      const x = 52 + i * 74;
      const height = 76 + (i * 47) % 160;
      rect(x, 470 - height, 60, height, i % 2 ? '#19272b' : '#1c2b2f');
      for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) {
        if ((i + j * 2 + k) % 4 === 0) rect(x + 10 + k * 15, 486 - height + j * 27, 4, 9, '#6f77604d');
      }
    }
    rect(0, 0, W, 63, '#131b1d'); rect(0, 487, W, 73, '#172224');
    rect(0, 60, W, 7, '#35403a'); rect(0, 70, W, 2, '#b6b58c25');
    rect(49, 68, 7, 420, '#3e4943'); rect(1230, 68, 7, 420, '#3e4943');
    for (const x of [273, 520, 768, 1016]) { rect(x, 68, 8, 420, '#323e3b'); rect(x + 8, 68, 2, 420, '#0b171b'); }
    rect(50, 312, 1187, 6, '#34413d'); rect(50, 484, 1187, 7, '#485348');
    // Ceiling fixtures, cables and the evacuated office.
    for (const x of [175, 621, 1080]) {
      rect(x, 0, 2, 68, '#42504a'); rect(x - 45, 62, 94, 8, '#535f4f');
      rect(x - 39, 70, 80, 3, '#d2cd9b');
    }
    rect(58, 419, 174, 13, '#536051'); rect(72, 432, 7, 112, '#34433d'); rect(211, 432, 7, 112, '#34433d');
    rect(104, 368, 67, 42, '#101b1f'); rect(108, 372, 59, 33, '#2c433f'); rect(131, 410, 10, 9, '#3c4b40');
    rect(140, 382, 3, 11, '#b5cb8e'); rect(114, 382, 20, 2, '#5c7965'); rect(114, 390, 14, 2, '#5c7965');
    rect(67, 417, 15, 4, '#bac1a2');
    rect(296, 512, 38, 39, '#23312c'); rect(300, 515, 30, 3, '#475142');
    rect(304, 523, 23, 19, '#192823'); line(303, 523, 325, 542, '#46513e');
    // Dim scratches and structural seams make the room feel inhabited.
    for (let i = 0; i < 10; i++) rect(71 + i * 113, 500 + i % 3 * 12, 21 + i % 3 * 5, 1, '#53614d30');
    drawPortal();
    rect(0, GROUND - 3, W, 6, '#667358'); rect(0, GROUND + 3, W, 8, '#28372e');
    const floor = ctx.createLinearGradient(0, GROUND + 11, 0, H);
    floor.addColorStop(0, '#1a2823'); floor.addColorStop(1, '#131d1a');
    ctx.fillStyle = floor; ctx.fillRect(0, GROUND + 11, W, H - GROUND);
    for (let x = -50; x < W + 100; x += 100) line(x, GROUND + 12, (x - W / 2) * 1.5 + W / 2, H, '#30403170');
    for (const y of [596, 650, 714]) line(0, y, W, y, '#30403170');
    for (const x of [100, 1160]) { rect(x, GROUND + 24, 3, 20, '#74825c'); rect(x + 7, GROUND + 24, 3, 20, '#74825c'); }
    text('07', 65, 137, 18, '#66765c'); text('THOÁT HIỂM', 94, 137, 10, '#738466');
    line(69, 149, 192, 149, '#56654f');
    text('CỔNG 01 / CHƯA ỔN ĐỊNH', 1052, 605, 10, '#7c9b94', 'center');
    text('A / D  DI CHUYỂN', 74, 676, 11, '#62745f');
    text('SPACE  NHẢY ×2    L  DASH    J  ĐẤM    K  ĐÁ', 1205, 676, 11, '#62745f', 'right');
    if (state.effectsEnabled) for (const p of ambient) {
      const t = reducedMotion ? 0 : state.time;
      const y = 65 + ((p.y - t * (4 + p.size) + 500) % 440 + 440) % 440;
      ctx.globalAlpha = 0.18 + Math.sin(p.phase + t) * 0.1;
      rect(p.x, y, p.size, p.size, '#d6d7a8');
    }
    ctx.globalAlpha = 1;
  }

  function drawPortal() {
    const x = 1070, y = 336;
    rect(x - 94, 126, 12, 428, '#263336'); rect(x + 81, 126, 12, 428, '#263336');
    rect(x - 95, 126, 189, 13, '#4c615b'); rect(x - 95, 546, 189, 8, '#4c615b');
    ctx.fillStyle = '#101e25'; ctx.beginPath(); ctx.ellipse(x, y, 73, 197, 0, 0, Math.PI * 2); ctx.fill();
    const time = state.effectsEnabled && !reducedMotion ? state.time : 0;
    const glow = ctx.createRadialGradient(x, y, 12, x, y, 193);
    glow.addColorStop(0, '#243c4a'); glow.addColorStop(0.48, '#1d3642'); glow.addColorStop(1, '#476a6500');
    ctx.fillStyle = glow; ctx.fillRect(x - 140, 135, 280, 410);
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 ? '#8bc2af' : '#577f8f'; ctx.globalAlpha = 0.3 + i * 0.09; ctx.lineWidth = i === 4 ? 2 : 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 52 + i * 5, 169 + i * 5, Math.sin(time * 0.2 + i) * 0.025, time * 0.3 + i * 0.6, time * 0.3 + i * 0.6 + Math.PI * 1.6); ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + time * 0.26;
      rect(Math.cos(a) * 71, Math.sin(a) * 185, 3, 7, '#a1d1bb');
    }
    ctx.restore();
  }

  function drawTarget(){
 const x=TARGET_X+state.targetKick;
 ctx.fillStyle='#07130f88';ctx.beginPath();ctx.ellipse(TARGET_X,GROUND+8,52,9,0,0,Math.PI*2);ctx.fill();
 rect(x-24,GROUND-5,48,6,'#566050');rect(x-6,GROUND-94,12,94,'#475348');
 rect(x-34,GROUND-237,68,150,state.targetFlash>0?'#b58d59':'#35483d');
 rect(x-37,GROUND-230,6,130,'#56634d');rect(x+31,GROUND-230,6,130,'#56634d');
 rect(x-24,GROUND-290,48,48,state.targetFlash>0?'#e2c48c':'#465a48');
 rect(x-17,GROUND-273,34,5,'#14251e');ctx.strokeStyle=state.targetFlash>0?'#fff1c1':'#c4a46e';ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(x,GROUND-195,18,0,Math.PI*2);ctx.stroke();rect(x-4,GROUND-199,8,8,'#cbb681');
 text('MỤC TIÊU TẬP',TARGET_X,GROUND+34,10,'#8c9c7b','center');
 }
return value=>{state=value;drawScene();drawTarget();};
}
