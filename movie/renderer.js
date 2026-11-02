/* Deterministic, layered 2D short. New artwork and articulated actors only.
 * Every limb uses two fixed-length segments; expressions are replacement cels.
 */
'use strict';
const canvas=document.getElementById('film'),c=canvas.getContext('2d');
const W=1920,H=1080,TAU=Math.PI*2,A={};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
const hash=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453123;return x-Math.floor(x);};
const P={ink:'#101b2b',skin:'#efb080',light:'#ffd0a3',shade:'#c78265'};
function path(points,fill,stroke=P.ink,lw=3){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}}
function line(points,color,width=2){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function ellipse(x,y,rx,ry,fill,stroke=null,lw=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function glow(x,y,r,color,alpha=1){c.save();c.globalAlpha*=alpha;let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(90,190,215,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function text(str,x,y,size=32,color='#e7eeed',align='center',font='Body'){c.font=`${font==='Title'?700:400} ${size}px ${font}`;c.textAlign=align;c.fillStyle=color;c.fillText(str,x,y);}
function cover(img,z=1,dx=0,dy=0){const s=Math.max(W/img.width,H/img.height)*z;const w=img.width*s,h=img.height*s;c.drawImage(img,(W-w)/2+dx,(H-h)/2+dy,w,h);}
function room(damage=0,z=1,dx=0,dy=0){cover(A.room,z,dx,dy);if(damage){c.save();c.globalAlpha=damage;cover(A.damaged,z,dx,dy);c.restore();}}
function shadow(x,y,s=1,a=.3){c.save();c.globalAlpha=a;c.translate(x,y);c.scale(1,.13);const g=c.createRadialGradient(0,0,2,0,0,130*s);g.addColorStop(0,'#000c');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(-150*s,-150*s,300*s,300*s);c.restore();}
function bone(a,b,w1,w2,base,shade,hi,part=-1){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
 const p=(t,w)=>[a[0]+dx*t+nx*w,a[1]+dy*t+ny*w];
 if(A.limbs&&part>=0){c.save();c.translate(...a);c.rotate(Math.atan2(dy,dx)-Math.PI/2);const r=A.limbBoxes[part],fore=part===1||part===5,top=fore?.045:part%4===2?.12:0,bottom=fore?0:.07;c.drawImage(A.limbs,r[0],r[1]+r[3]*top,r[2],r[3]*(1-top-bottom),-w1*1.07,-10,w1*2.14,fore?len:len+20);c.restore();return {p,dx,dy,len};}
 path([p(0,-w1),p(.88,-w2),p(1,-w2*.85),p(1,w2*.85),p(.8,w2),p(0,w1)],base,P.ink,3.2);
 path([p(.06,w1*.55),p(.84,w2*.55),p(.98,w2*.8),p(.8,w2),p(.05,w1)],shade,null);
 line([p(.12,-w1*.55),p(.76,-w2*.55)],hi,2.3);
 return {p,dx,dy,len};
}
function ik(a,target,l1,l2,side){let dx=target[0]-a[0],dy=target[1]-a[1],d=Math.hypot(dx,dy);d=clamp(d,Math.abs(l1-l2)+1,l1+l2-1);const ang=Math.atan2(dy,dx),off=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));const mid=[a[0]+Math.cos(ang+off*side)*l1,a[1]+Math.sin(ang+off*side)*l1];return [mid,[a[0]+Math.cos(ang)*d,a[1]+Math.sin(ang)*d]];}
function hand(p,angle,open=false,woman=false){c.save();c.translate(...p);c.rotate(angle);const k=woman?.86:1;c.scale(k,k);path([[-14,-11],[-6,-17],[9,-15],[18,-7],[20,5],[11,15],[-4,15],[-14,7]],P.skin,P.ink,2.7);path([[4,-12],[14,-7],[16,4],[10,10],[1,9]],P.light,null);c.beginPath();c.moveTo(-11,2);c.quadraticCurveTo(-20,-11,-11,-13);c.quadraticCurveTo(-4,-13,-3,-4);c.strokeStyle=P.shade;c.lineWidth=2;c.stroke();if(open){line([[9,-9],[23,-13]],P.skin,8);line([[12,-3],[28,-3]],P.light,7);line([[11,4],[24,6]],P.skin,7);}else line([[4,-7],[12,-6]],P.shade,1.5);c.restore();}
function arm(a,target,woman=false,side=1,open=false){const [el,end]=ik(a,target,111,103,side),base=woman?'#52535e':'#213e68',shade=woman?'#323a49':'#152640',hi=woman?'#85818a':'#4b6088';
 bone(a,el,26,23,base,shade,hi,woman?4:0);
 const q=bone(el,end,23,17,base,shade,hi,woman?5:1);
 if(!A.limbs&&!woman)for(let t of [.72,.80,.89])line([q.p(t,-18),q.p(t,18)],'#c9d4de',4);
 else if(!A.limbs)line([q.p(.89,-17),q.p(.89,17)],'#b2b4b9',5);
 hand(end,open?-.35:Math.atan2(end[1]-el[1],end[0]-el[0])-.3,open,woman);return end;
}
function shoe(p,woman,angle=0){c.save();c.translate(...p);c.rotate(angle);if(woman){path([[-19,-12],[15,-15],[24,-8],[40,-3],[42,8],[-22,8]],'#292c36',P.ink,3);line([[-18,6],[38,6]],'#8b929d',3);}else{path([[-23,-16],[7,-21],[23,-10],[40,-7],[49,2],[47,12],[-25,12],[-28,5]],'#8992a3',P.ink,3.3);path([[-23,2],[8,1],[15,-9],[29,-6],[42,0],[45,7],[-23,7]],'#e0dce0',null);line([[-24,10],[46,10]],'#f0edf0',5);line([[2,-13],[12,-7]],'#f2eeed',3);line([[-4,-9],[5,-5]],'#e3dfe5',3);}c.restore();}
function leg(a,foot,woman,side){const [k,end]=ik(a,[foot[0],foot[1]-14],118,118,side);const base=woman?'#353b47':'#233954',sh=woman?'#202733':'#15263f',hi=woman?'#62646f':'#465571';bone(a,k,28,22,base,sh,hi,woman?6:2);bone(k,end,23,17,base,sh,hi,woman?7:3);shoe(foot,woman);}
function torso(woman){const im=A.torsos,rect=woman?A.torsoBoxes[1]:A.torsoBoxes[0];if(im&&rect){c.drawImage(im,...rect,-76,-408,155,178);return;}
 path([[-62,-407],[0,-414],[60,-399],[72,-241],[-66,-239]],woman?'#555662':'#1e3a62');
 path([[-14,-404],[24,-404],[34,-245],[-23,-245]],'#d9dce1');
 line([[-62,-253],[-23,-253]],'#cbd6de',4);line([[31,-252],[68,-252]],'#cbd6de',4);
}
function actor(o){const {x,y,s=1,face=1,woman=false,t=0,expr=0,lean=0,crouch=0,headTilt=0}=o;
 const hip=-235+crouch,breathe=1.3*Math.sin(t*2.4),pivot=[0,hip],shift=hip+235+breathe;
 const inv=world=>{const u=(world[0]-x)/(s*face),v=(world[1]-y)/s-hip;const co=Math.cos(lean),si=Math.sin(lean);return [u*co+v*si,-u*si+v*co-235];};
 const world=local=>{const u=local[0],v=local[1]+235;return [x+(u*Math.cos(lean)-v*Math.sin(lean))*s*face,y+(hip+u*Math.sin(lean)+v*Math.cos(lean))*s];};
 const target=(v,fallback)=>v?inv(v):fallback;
 c.save();c.translate(x,y);c.scale(s*face,s);
 leg([-31,hip],o.leftFoot||[-49,0],woman,1);leg([29,hip],o.rightFoot||[53,0],woman,-1);
 c.translate(0,hip);c.rotate(lean);c.translate(0,235+breathe);
 const left=target(o.leftHand,[-90,-224]),right=target(o.rightHand,[104,-235]);
 arm([-56,-385],left,woman,1,!!o.openLeft);
 // Neck, torso, then foreground arm: fixed anatomical overlaps.
 path([[-12,-424],[26,-421],[29,-390],[-12,-387]],P.skin);
 torso(woman);
 const headRects=woman?A.womanBoxes:A.heroBoxes;const r=headRects[clamp(expr,0,7)|0],h=woman?218:231,w=r[2]*h/r[3];
 c.save();c.translate(13,woman?-396:-405);c.rotate(headTilt);c.drawImage(woman?A.woman:A.hero,...r,-w*.68,-h,w,h);c.restore();
 const end=arm([53,-382],right,woman,o.elbowSide??1,!!o.openRight);
 c.restore();return {right:world(end),left:world(left),head:world([10,-525]),shift};
}
function blink(t,base=0){return Math.sin(t*1.7+1.4)>.992?1:base;}
function rain(t,amount=100,alpha=.24){c.save();c.globalAlpha=alpha;for(let i=0;i<amount;i++){let x=hash(i*2)*2100-90-((t*85)%160),y=(hash(i*3+5)*1250+t*(180+hash(i)*170))%1250-80;line([[x,y],[x-9,y+45]],'#a4bedb',.7+hash(i)*1.3);}c.restore();}
function dust(t,n=70,amp=1){c.save();for(let i=0;i<n;i++){const x=(hash(i+9)*2100+t*(hash(i+17)-.5)*45)%2100,y=(hash(i+81)*1000+t*(8+hash(i+70)*9))%1050;c.globalAlpha=amp*(.12+.32*hash(i));ellipse(x,y,1+hash(i+3)*3,1+hash(i+3)*3,'#c0c5ce');}c.restore();}
function debris(t,start=7.3,n=20){const q=t-start;c.save();for(let i=0;i<n;i++){const phase=q-hash(i+20)*2.8;if(phase<0)continue;const f=phase%3.1,x=130+hash(i+51)*1740+(hash(i)-.5)*f*110,y=-150+f*f*(105+hash(i+2)*75),r=9+hash(i+5)*31;c.save();c.translate(x,y);c.rotate(f*(hash(i+8)-.5)*5);path([[-r,-r*.4],[r*.4,-r],[r,r*.6],[-r*.6,r]],'#5a6477','#252a3b',2);path([[-r,-r*.4],[r*.4,-r],[r*.1,r*.1]],'#7d8795',null);c.restore();}c.restore();}
function crack(x,y,size,progress){c.save();c.translate(x,y);c.globalAlpha=progress;for(let i=0;i<8;i++){const a=i*TAU/8+.17,r=size*(.5+hash(i)*.5);let pts=[[0,0]];for(let j=1;j<=6;j++){const d=r*j/6;pts.push([Math.cos(a)*d+(hash(i*8+j)-.5)*35,Math.sin(a)*d*.23+(hash(i*9+j)-.5)*17]);}line(pts,'#121b2b',5);line(pts.map(p=>[p[0],p[1]+3]),'#9c9b9b55',1);}c.restore();}
function hole(x,y,rx,ry,t,foreground=false){c.save();c.translate(x,y);const points=[];for(let i=0;i<22;i++){const a=i*TAU/22,r=1+(hash(i+41)-.5)*.17;points.push([Math.cos(a)*rx*r,Math.sin(a)*ry*r]);}if(!foreground){path(points,'#030811','#677083',9);const g=c.createRadialGradient(0,0,15,0,0,rx);g.addColorStop(0,'#060713');g.addColorStop(1,'#161b27');c.fillStyle=g;c.save();c.scale(1,ry/rx);c.beginPath();c.arc(0,0,rx*.94,0,TAU);c.fill();c.restore();for(let i=0;i<9;i++)line([[(-.9+i*.2)*rx,-ry*.4],[(-.9+i*.2)*rx+10,ry*.6]],'#222b3b',3);}else{const half=points.filter((p,i)=>i<12);path([...half,[rx+15,ry+45],[-rx-15,ry+45]],'#515b70','#252a3b',4);line(half,'#818b9c',5);for(let i=0;i<7;i++){const xx=-rx+rx*2*i/7;line([[xx,ry*.7],[xx+25,ry+38]],'#272e3f',3);}}c.restore();}
function portal(t,x=1530,y=580,r=290,power=1){c.save();c.translate(x,y);c.globalAlpha=power;glow(0,0,r*1.8,'#724be65c');ellipse(0,0,r*.53,r,'#080916','#514688',2);for(let j=0;j<5;j++){c.save();c.rotate(Math.sin(t*.3+j)*.04);c.beginPath();for(let k=0;k<95;k++){const a=k/94*TAU,rr=1+.017*Math.sin(a*13+t*3+j);const xx=Math.cos(a)*(r*.53+j*4)*rr,yy=Math.sin(a)*(r+j*7)*rr;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle=['#9384c877','#afcce888','#694ac499','#5d6b9677','#d4d0ec66'][j];c.lineWidth=1.7;c.stroke();c.restore();}for(let i=0;i<24;i++){const a=hash(i)*TAU+t*.16,rr=r*(1.03+hash(i+12)*.4);ellipse(Math.cos(a)*rr*.57,Math.sin(a)*rr,1.2,3,'#9b8bbf');}c.restore();}
function claw(t,power=1,recoil=0){c.save();c.globalAlpha=power;const approach=smooth((t-20)/2.3);c.translate(lerp(1705,1615,approach)+recoil*245,650-recoil*90);c.rotate(-.05+Math.sin(t*1.4)*.018+recoil*.3);c.drawImage(A.claw,...A.clawBox,-330,-185,740,355);c.restore();}
function orb(t,x,y,power=1){c.save();c.globalAlpha=power;glow(x,y,180,'#8fe8ce50');glow(x,y,60,'#c8fff19a');ellipse(x,y,17+Math.sin(t*5)*1.4,20,'#d9fff0','#91d8c2',2);ellipse(x-5,y-7,5,7,'#fffcec');for(let i=0;i<12;i++){const a=t*(.4+hash(i)*.4)+i*TAU/12,r=35+hash(i+7)*45;ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r*.7,1.5,1.5,'#bdffdd');}c.restore();}
function wind(t,start,origin,dest){let q=t-start;if(q<0||q>1.9)return;const attack=smooth(q/.18),fade=1-smooth((q-1.1)/.8),len=lerp(20,dest[0]-origin[0],smooth(q/.5));c.save();c.globalAlpha=fade;const phase=clamp(q/1.55)*7,idx=Math.floor(phase);for(let j=0;j<2;j++){const f=A.windFrames[Math.min(7,idx+j)],alpha=j?phase-idx:1-(phase-idx);c.save();c.globalAlpha*=alpha*.64;const k=1.35,ex=f.sourceEmitter[0]-f.x,ey=f.sourceEmitter[1]-f.y;c.drawImage(A.wind,f.x,f.y,f.w,f.h,origin[0]-ex*k,origin[1]-ey*k,f.w*k,f.h*k);c.restore();}glow(origin[0]+len*.6,origin[1],len*.6,'#a3e9f02e');for(let i=0;i<18;i++){let phase=hash(i)*TAU+q*8,r=(32+hash(i+7)*105)*attack;c.beginPath();for(let k=0;k<=42;k++){let u=k/42,x=origin[0]+u*len,y=origin[1]+Math.sin(u*3.2+phase)*r*Math.sin(Math.PI*u*.85)+u*(dest[1]-origin[1]);k?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=i%3?'#b4dbe16a':'#f0f6dfbd';c.lineWidth=i%3?1.6:3.1;c.stroke();}c.save();c.translate(origin[0]+len,origin[1]+dest[1]-origin[1]);c.rotate(-.12);c.scale(.35,1);c.beginPath();c.arc(0,0,150*attack,-1.35,1.4);c.strokeStyle='#d6e7e3aa';c.lineWidth=8;c.stroke();c.restore();for(let i=0;i<26;i++){let u=(q*1.2+hash(i))%1,x=origin[0]+u*len,y=origin[1]+(hash(i+4)-.5)*250*attack;line([[x-12,y],[x+20,y-2]],'#e3efe39a',1.2);}c.restore();}
function subtitle(str,alpha=1){c.save();c.globalAlpha=alpha;c.font='400 32px Body';c.textAlign='center';c.strokeStyle='#02050be8';c.lineWidth=7;c.strokeText(str,W/2,968);c.fillStyle='#eff0df';c.fillText(str,W/2,968);c.restore();}
function desk(t){c.save();path([[0,925],[1250,925],[1525,1080],[0,1080]],'#554333','#1b1f2d',4);path([[0,939],[1254,939],[1280,956],[0,956]],'#a68b64',null);path([[1030,645],[1435,624],[1435,918],[1030,914]],'#1e2938','#0b1420',6);path([[1046,662],[1416,642],[1416,896],[1046,895]],'#314652',null);for(let i=0;i<9;i++)line([[1070,693+i*19],[1160+(i%3)*67,691+i*19]],i%3?'#639093':'#b4ac78',3);path([[1210,918],[1254,917],[1263,945],[1183,945]],'#283544');path([[738,913],[1048,913],[1112,946],[733,946]],'#273341','#101b2b',3);for(let j=0;j<3;j++)for(let i=0;i<13;i++){c.fillStyle='#6a7a80';c.fillRect(751+i*23+j*6,918+j*7,16,3);}c.restore();}
function grade(t){c.save();c.globalCompositeOperation='soft-light';c.fillStyle='#31557245';c.fillRect(0,0,W,H);c.restore();const v=c.createRadialGradient(960,480,350,960,540,1100);v.addColorStop(0,'#01070d00');v.addColorStop(1,'#01070d99');c.fillStyle=v;c.fillRect(0,0,W,H);c.fillStyle='#03070d';c.fillRect(0,0,W,66);c.fillRect(0,1014,W,66);}
function exterior(t){cover(A.exterior,1+smooth(t/3)*.055,-smooth(t/3)*18,0);rain(t,170,.27);const flash=Math.exp(-Math.pow((t-2.5)/.065,2))*.25;c.fillStyle=`rgba(179,186,231,${flash})`;c.fillRect(0,0,W,H);}
function typing(t){const q=t-3;room(0,1.18,0,60);c.fillStyle='#060e1f33';c.fillRect(0,0,W,H);const startled=smooth((q-2.7)/.4);const o={elbowSide:-1,x:850,y:1235,s:1.34,t,expr:startled>.5?2:blink(t),headTilt:lerp(.035,-.025,startled),lean:.04,leftHand:[865,922+Math.sin(t*19)*3],rightHand:[980,922+Math.sin(t*21)*4]};actor(o);desk(t);glow(1210,720,400,'#6cb4cd22');text('23:47',1675,177,22,'#a8b5b2','right');if(q>3.2){c.fillStyle=`rgba(60,35,80,${(q-3.2)*.08})`;c.fillRect(0,0,W,H);}}
function quake(t){let q=t-7,intensity=smooth(q/1.7);c.save();c.translate(Math.sin(t*43)*6*intensity,Math.cos(t*37)*4*intensity);room(smooth((q-.4)/2));portal(t,1590,580,260,smooth((q-1.2)/2));const f=smooth((q-2)/1.7);crack(1335,1003,340,smooth((q-.8)/1));if(f>0)hole(1350,1015,260*f,85*f,t);shadow(700,1025,.9);shadow(1300,1025,.8);actor({x:760,y:1025,s:.91,t,expr:q<.8?2:3,lean:.08*intensity,headTilt:-.05,rightHand:[845,750],leftHand:[646,820]});actor({x:1320,y:1020+f*120,s:.85,face:-1,woman:true,t,expr:q<1?2:4,lean:-.18*f,leftHand:[1400,705+f*70],rightHand:[1155,780+f*50],leftFoot:[-65,Math.sin(t*8)*15],rightFoot:[60,f*35]});debris(t,7.4,16);dust(t,55,.7);c.restore();if(q>2.25)subtitle('Cẩn thận!',smooth((q-2.25)/.2)*(1-smooth((q-3.6)/.3)));}
function rescue(t){const q=t-11,p=smooth((q-1.4)/3.4),grip=mix([1140,810],[1095,730],p);room(1,1.12,-70,-40);portal(t,1740,560,300,.7);hole(1470,1030,270,80,t);debris(t,10,12);shadow(940,1030,1);
 actor({x:lerp(1305,1155,p),y:lerp(1280,1000,p),s:.9,face:-1,woman:true,t,expr:p>.9?6:4,lean:lerp(-.14,.02,p),rightHand:grip,openRight:true,leftHand:[1450-p*170,1010-p*150],leftFoot:[-40,28*Math.sin(t*5)*(1-p)],rightFoot:[48,45*(1-p)]});
 actor({x:lerp(950,920,p),y:lerp(1040,1015,p),s:1.03,t,expr:p>.94?4:5,lean:lerp(.13,-.14,p),crouch:22*(1-p),rightHand:grip,leftHand:[795-p*5,870-p*60],leftFoot:[-90,0],rightFoot:[65,0],openRight:false});
 hole(1470,1030,270,80,t,true);dust(t,55,.75);if(q<2.2)subtitle('Nắm lấy tay tôi!',smooth(q/.2)*(1-smooth((q-1.7)/.4)));}
function awakening(t){let q=t-16;room(1,1.31,-180,20);c.fillStyle='#06102270';c.fillRect(0,0,W,H);const reach=smooth(q/1.3),handPos=mix([1170,940],[1200,860],reach),ox=lerp(1550,1215,smooth(q/1.4)),oy=lerp(500,775,smooth(q/1.4))+Math.sin(t*2)*7;
 const out=actor({x:865,y:1310,s:1.49,t,expr:q<.6?3:q<2.2?6:q<2.7?1:4,lean:0,rightHand:handPos,openRight:true,leftHand:[718,1035],headTilt:-.045});orb(t,ox,oy,smooth(q/.5));glow(out.head[0]+130,out.head[1]+40,180,'#a2f4d828',smooth(q/2));dust(t,45,.4);if(q>.5&&q<2.5)subtitle('Anh vẫn muốn cứu họ chứ?',smooth((q-.5)/.2)*(1-smooth((q-2.1)/.3)));if(q>2.75)subtitle('Tất nhiên.',smooth((q-2.75)/.15));}
function stand(t){const q=t-20,charge=smooth((q-1)/2),strike=smooth((q-3.8)/.17),returning=smooth((q-4.7)/.8),recoil=smooth((q-4.05)/.7);room(1,1.05,0,0);portal(t,1620,560,330,1-smooth((q-5)/1.4));claw(t,smooth(q/.65)*(1-smooth((q-5)/1)),recoil);shadow(720,996,.8);actor({x:720,y:996,s:.84,face:1,woman:true,t,expr:blink(t,2),lean:-.04,rightHand:[765,755],leftHand:[690,800]});shadow(1020,1000,1.1);const resting=[1127,830],charged=[1078,700],extended=[1280,722],target=mix(mix(resting,charged,charge),extended,strike*(1-returning));
 const out=actor({x:1020,y:1000,s:1.08,t,expr:blink(t,4),lean:lerp(-.065,.12,strike*(1-returning)),crouch:15*charge,rightHand:target,leftHand:[935,810],leftFoot:[-95,0],rightFoot:[75,0]});
 if(q<4.1)orb(t,out.right[0]+15,out.right[1]-2,.25+.55*charge);wind(t,23.82,out.right,[1635,650]);dust(t,70,.7);debris(t,20,9);
 if(q>3.85){c.save();c.globalAlpha=Math.exp(-(q-3.85)*9)*.22;c.fillStyle='#d1f0e4';c.fillRect(0,0,W,H);c.restore();}
 if(q>5.7){const a=smooth((q-5.7)/1.2);c.fillStyle=`rgba(2,8,16,${a})`;c.fillRect(0,0,W,H);}}
function end(t){let q=t-27;cover(A.exterior,1.07);c.fillStyle='#020915dc';c.fillRect(0,0,W,H);dust(t,35,.35);c.save();c.globalAlpha=smooth(q/.55)*(1-smooth((q-2.6)/.5));let spacing=12;text('D Ị   M Ô N',960,515,132,'#e4e9dd','center','Title');line([[660,558],[1260,558]],'#b3d4c4',1);text('Đ Ê M   T H Ứ C   T Ỉ N H',960,618,29,'#adcec9');text('di-mon-demo.vercel.app',960,807,21,'#7f9ba5');c.restore();}
window.renderMovie=async t=>{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.fillStyle='#030911';c.fillRect(0,0,W,H);c.save();if(t<3)exterior(t);else if(t<7)typing(t);else if(t<11)quake(t);else if(t<16)rescue(t);else if(t<20)awakening(t);else if(t<27)stand(t);else end(t);c.restore();grade(t);let fade=t<.45?1-smooth(t/.45):t>29.65?smooth((t-29.65)/.35):0;if(fade){c.fillStyle=`rgba(2,6,11,${fade})`;c.fillRect(0,0,W,H);}};
async function init(){await Promise.all([document.fonts.load("32px Body"),document.fonts.load("700 132px Title")]);await Promise.all([['room','room.png'],['damaged','damaged.png'],['exterior','exterior.png'],['hero','hero-heads.png'],['woman','woman-heads.png'],['torsos','torsos.png'],['limbs','limbs.png'],['claw','claw.png'],['wind','wind.png']].map(async([key,file])=>{const im=new Image();im.src='assets/'+file;await im.decode();A[key]=im;}));[A.heroBoxes,A.womanBoxes,A.torsoBoxes,A.limbBoxes,A.clawBox,A.windFrames]=await Promise.all(['hero-heads.json','woman-heads.json','torsos.json','limbs.json','claw.json','wind.json'].map(file=>fetch('assets/'+file).then(r=>r.json())));await renderMovie(0);window.movieReady=true;}
init().catch(e=>{window.movieError=String(e);console.error(e);});
