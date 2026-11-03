import {createArmHeat} from '../fire-punch-v9/arm-heat.js';
export async function createCombatRenderer(meta,actors){
 const c=document.createElement('canvas');c.width=896;c.height=920;const g=c.getContext('2d');
 const CAMERA_Y=160,base=new URL('../',import.meta.url);
 async function image(path){const v=new Image();v.src=new URL(path,base);await v.decode();return v;}
 const [fire,wallImage]=await Promise.all([image('fire-punch-v6/aura-trail.png'),image('fire-punch-v9/gold-wall.png')]);
 let key='attack1',a=meta.actions[key],points=a.frames.map(f=>f.inspectionPoint),mode='still';
const anchors=[[230,232],[695,236],[1190,238],[1662,238],[316,682],[727,688],[1170,686],[1660,685]];
const cells=anchors.map((p,i)=>{const col=i%4,row=Math.floor(i/4),sx=Math.round(col*fire.width/4),sy=Math.round(row*fire.height/2),w=Math.round((col+1)*fire.width/4)-sx,h=Math.round((row+1)*fire.height/2)-sy,ax=p[0]-sx,ay=p[1]-sy;
 function layer(front){const v=document.createElement('canvas');v.width=w;v.height=h;const x=v.getContext('2d');x.drawImage(fire,sx,sy,w,h,0,0,w,h);x.globalCompositeOperation='destination-in';const fade=x.createLinearGradient(front?ax-100:0,0,front?ax-40:45,0);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=fade;x.fillRect(0,0,w,h);return v;}
 return{back:layer(false),front:layer(true),ax,ay,w,h};});
const tailCache=new Map(),armCache=new Map(),occluders=new Map();
const armHeat=createArmHeat(actors.get('attack3'),meta.actions.attack3);
function tail(i){if(tailCache.has(i))return tailCache.get(i);const v=cells[i],c=document.createElement('canvas');c.width=v.w;c.height=v.h;const x=c.getContext('2d');x.drawImage(v.back,0,0);x.globalCompositeOperation='destination-in';const fade=x.createLinearGradient(v.ax-140,0,v.ax-30,0);fade.addColorStop(0,'black');fade.addColorStop(1,'transparent');x.fillStyle=fade;x.fillRect(0,0,v.w,v.h);tailCache.set(i,c);return c;}
function flame(i,x,y,opacity,index,target=g){const v=cells[i];target.save();target.translate(x,y);target.globalAlpha=opacity*.57;if(i>=2&&i<=6)target.drawImage(tail(i),-v.ax*.96,-v.ay*.30,v.w*.96,v.h*.30);target.drawImage(v.back,-v.ax*.48,-v.ay*.48,v.w*.48,v.h*.48);target.restore();}
const farLayer=document.createElement('canvas');farLayer.width=896;farLayer.height=760;
function farFire(f,fx,x,y,opacity,index){const z=farLayer.getContext('2d');z.clearRect(0,0,896,760);flame(fx,x,y,opacity,index,z);let mask=occluders.get(index);if(!mask){mask=document.createElement('canvas');mask.width=768;mask.height=640;const q=mask.getContext('2d');q.drawImage(actors.get('attack2'),f.x,f.y,f.w,f.h,0,0,f.w,f.h);const d=q.getImageData(0,0,768,640);for(let k=0;k<d.data.length;k+=4){d.data[k]=d.data[k+1]=d.data[k+2]=0;d.data[k+3]=Math.min(255,Math.round(d.data[k+3]*255/240));}q.putImageData(d,0,0);q.globalCompositeOperation='destination-out';const cuts=[{x:432,y:220,w:55,h:90},{x:436,y:225,w:65,h:70},{x:436,y:215,w:115,h:85},{x:436,y:220,w:155,h:65},{x:436,y:220,w:125,h:65},{x:436,y:215,w:90,h:75},{x:432,y:205,w:42,h:65},{x:432,y:220,w:55,h:90}];const cut=cuts[index],blend=q.createLinearGradient(cut.x,0,cut.x+18,0);blend.addColorStop(0,'transparent');blend.addColorStop(1,'black');q.fillStyle=blend;q.fillRect(cut.x,cut.y,cut.w,cut.h);q.globalCompositeOperation='source-over';occluders.set(index,mask);}z.globalCompositeOperation='destination-out';z.drawImage(mask,32,20);z.globalCompositeOperation='source-over';g.drawImage(farLayer,0,0);}
function sweep(u){const v=1-u,x=v*v*v*260+3*v*v*u*510+3*v*u*u*760+u*u*u*650,y=v*v*v*630+3*v*v*u*640+3*v*u*u*420+u*u*u*180,dx=3*v*v*250+6*v*u*250-3*u*u*110,dy=3*v*v*10-6*v*u*220-3*u*u*240;return{x,y,angle:Math.atan2(dy,dx)+Math.PI/2};}
const layer=document.createElement('canvas');layer.width=896;layer.height=920;{const x=layer.getContext('2d');x.drawImage(wallImage,146.96575342465752,-12.429417571569616,wallImage.width*0.5582191780821918,wallImage.height*0.7571569595261599);x.clearRect(0,800,896,120);}
const revealed=document.createElement('canvas');revealed.width=896;revealed.height=920;const revealContext=revealed.getContext('2d');
function drawWall(index,opacity,elapsed){if(index<2)return;const progress=mode==='play'?Math.max(0,Math.min(1,(elapsed-a.frames[2].startMs)/(a.frames[6].startMs-a.frames[2].startMs))):[0,0,.2,.37,.55,.75,1,1][index];const clock=mode==='play'?elapsed:index*75;
 const x=revealContext;x.globalCompositeOperation='source-over';x.clearRect(0,0,896,920);x.drawImage(layer,Math.sin(clock*.012)*1.2,0);x.globalCompositeOperation='destination-in';const top=640-802*progress+CAMERA_Y,fade=x.createLinearGradient(0,top-28,0,top+22);fade.addColorStop(0,'transparent');fade.addColorStop(1,'black');x.fillStyle=fade;x.fillRect(0,0,896,920);
 g.save();g.globalAlpha=opacity*(.82+Math.sin(clock*.019)*.025);g.drawImage(revealed,0,-CAMERA_Y);g.globalAlpha=opacity*.75;for(let j=0;j<15;j++){const age=(clock*.001+j*.137)%1,u=Math.min(progress,.15+age*.85),q=sweep(u);g.fillStyle=j%3?'#ffaf35':'#ffe46f';g.beginPath();g.ellipse(q.x+Math.sin(j*2.7)*65,640+(q.y-640)*1.3-age*45,1+(j%2),2.5,age,0,Math.PI*2);g.fill();}g.restore();}

 return {draw(action,index,elapsed,enabled,inspect=false){
 key=action;a=meta.actions[key];points=a.frames.map(f=>f.inspectionPoint);mode=inspect?'still':'play';
 const post=elapsed-a.durationMs,opacity=post>=0?Math.max(0,1-post/220):1;
 const f=a.frames[index],p=f.inspectionPoint,trail=!inspect&&post>=0?points[key==='attack3'?6:4]:p;
 let fx=key==='attack3'?[0,1,1,2,2,3,3,4][index]:index;if(post>=0)fx=Math.min(7,5+Math.floor(post/65));
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.translate(0,CAMERA_Y);
 g.drawImage(actors.get(key),f.x,f.y,f.w,f.h,32,20,f.w,f.h);
 if(enabled&&opacity>0){if(key==='attack2')farFire(f,fx,32+trail[0],20+trail[1],opacity,index);else if(key==='attack3'){armHeat(g,index,opacity);drawWall(index,opacity,elapsed);}else if(key==='attack1')flame(fx,32+trail[0],20+trail[1],opacity,index);}
 return c;
 }};
}
