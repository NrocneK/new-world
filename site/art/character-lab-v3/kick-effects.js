const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
function curve(points,u){
 const at=Math.min(points.length-2,Math.floor(u*(points.length-1))),t=Math.min(1,u*(points.length-1)-at);
 const p0=points[Math.max(0,at-1)],p1=points[at],p2=points[at+1],p3=points[Math.min(points.length-1,at+2)];
 return [0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t));
}
function triangle(ctx,image,src,dst){
 const [s0,s1,s2]=src,[d0,d1,d2]=dst,den=(s1[0]-s0[0])*(s2[1]-s0[1])-(s2[0]-s0[0])*(s1[1]-s0[1]);
 if(Math.abs(den)<1e-6)return;
 const a=((d1[0]-d0[0])*(s2[1]-s0[1])-(d2[0]-d0[0])*(s1[1]-s0[1]))/den;
 const c=((s1[0]-s0[0])*(d2[0]-d0[0])-(s2[0]-s0[0])*(d1[0]-d0[0]))/den;
 const b=((d1[1]-d0[1])*(s2[1]-s0[1])-(d2[1]-d0[1])*(s1[1]-s0[1]))/den;
 const d=((s1[0]-s0[0])*(d2[1]-d0[1])-(s2[0]-s0[0])*(d1[1]-d0[1]))/den;
 ctx.save();ctx.beginPath();ctx.moveTo(...d0);ctx.lineTo(...d1);ctx.lineTo(...d2);ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,d0[0]-a*s0[0]-c*s0[1],d0[1]-b*s0[0]-d*s0[1]);ctx.drawImage(image,0,0);ctx.restore();
}
export async function createKickEffects(meta,actors){
 const root=new URL('../kick-vfx-v1/',import.meta.url),spec=await (await fetch(new URL('effect.json',root))).json(),texture=new Image();texture.src=new URL('slash.png',root);await texture.decode();
 const cache=new Map(),farMasks=new Map(),farLayer=make(768,640),far=farLayer.getContext('2d');
 function ribbon(key,progress){
  const name=key+':'+progress;if(cache.has(name))return cache.get(name);
  const plan=spec.actions[key],n=spec.segments,positions=[];
  for(let i=0;i<=n;i++){
   const u=progress*i/n,p=curve(plan.points,u),before=curve(plan.points,Math.max(0,u-.001)),after=curve(plan.points,Math.min(1,u+.001));
   const angle=Math.atan2(after[1]-before[1],after[0]-before[0])+Math.PI/2;
   positions.push({p,n:[Math.cos(angle),Math.sin(angle)],width:plan.width*(.25+.75*Math.sin(Math.PI/2*i/n))});
  }
  const xs=positions.map(p=>p.p[0]),ys=positions.map(p=>p.p[1]),padding=plan.width+10;
  const left=Math.floor(Math.min(...xs)-padding),top=Math.floor(Math.min(...ys)-padding),right=Math.ceil(Math.max(...xs)+padding),bottom=Math.ceil(Math.max(...ys)+padding),canvas=make(right-left,bottom-top),ctx=canvas.getContext('2d');
  ctx.translate(-left,-top);ctx.imageSmoothingEnabled=true;
  for(const [offset,widthScale,alpha] of [[0,1,.95],[-16,.35,.4],[15,.28,.3]]){
   ctx.globalAlpha=alpha;
   for(let i=0;i<n;i++){
    const a=positions[i],b=positions[i+1],x0=spec.textureRange[0]+(spec.textureRange[1]-spec.textureRange[0])*i/n,x1=spec.textureRange[0]+(spec.textureRange[1]-spec.textureRange[0])*(i+1)/n;
    const y0=spec.centerline[i],y1=spec.centerline[i+1],h=spec.bandHeight/2;
    const corners=(v)=>[-1,1].map(sign=>[v.p[0]+v.n[0]*(offset+sign*v.width*widthScale/2),v.p[1]+v.n[1]*(offset+sign*v.width*widthScale/2)]);
    const [at,ab]=corners(a),[bt,bb]=corners(b);
    triangle(ctx,texture,[[x0,y0-h],[x1,y1-h],[x1,y1+h]],[at,bt,bb]);triangle(ctx,texture,[[x0,y0-h],[x1,y1+h],[x0,y0+h]],[at,bb,ab]);
   }
  }
  const result={canvas,left,top,end:positions.at(-1).p};cache.set(name,result);return result;
 }
 function farMask(index){
  if(farMasks.has(index))return farMasks.get(index);
  const a=meta.actions.kick2,f=a.frames[index],canvas=make(768,640),ctx=canvas.getContext('2d');ctx.drawImage(actors.get('kick2'),f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  const d=ctx.getImageData(0,0,768,640);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=0;d.data[i+3]=Math.min(255,Math.round(d.data[i+3]*255/240));}ctx.putImageData(d,0,0);
  ctx.globalCompositeOperation='destination-out';const fade=ctx.createLinearGradient(489,0,505,0);fade.addColorStop(0,'transparent');fade.addColorStop(1,'black');ctx.fillStyle=fade;ctx.fillRect(489,140,240,340);farMasks.set(index,canvas);return canvas;
 }
 function paint(ctx,layer,x,y){
  ctx.save();ctx.globalAlpha*=.32;ctx.filter='blur(3px)';ctx.drawImage(layer.canvas,x,y);ctx.restore();
  ctx.drawImage(layer.canvas,x,y);
 }
 return {draw(ctx,key,index,elapsed,inspect=false){
  const plan=spec.actions[key],pose=plan?.poses[index];if(!pose)return {active:false};
  const layer=ribbon(key,pose.progress),action=meta.actions[key];let opacity=pose.opacity;
  if(!inspect&&opacity<.8){const f=action.frames[index];opacity*=Math.max(0,1-(elapsed-f.startMs)/f.durationMs);}
  ctx.save();ctx.globalAlpha=opacity;
  if(key==='kick2'){
   far.clearRect(0,0,768,640);far.globalCompositeOperation='source-over';paint(far,layer,layer.left,layer.top);far.globalCompositeOperation='destination-out';far.drawImage(farMask(index),0,0);far.globalCompositeOperation='source-over';ctx.drawImage(farLayer,32,20);
  }else paint(ctx,layer,32+layer.left,20+layer.top);
  ctx.restore();return {active:true,head:layer.end,progress:pose.progress,layer:key==='kick2'?'far-leg-over-body-under':'foreground'};
 }};
}
