const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const joints = [
  [[361,258],[361,310]], [[364,273],[330,329]],
  [[369,277],[390,347]], [[372,275],[418,332]],
  [[370,273],[420,309]], [[365,247],[430,244]],
  [[365,247],[441,207]], [[365,247],[441,207]],
];
const peakContour = [[350,237],[366,275],[405,249],[455,214],[470,151],[470,137],[478,123],[473,104],[455,98],[442,109],[446,130],[450,138],[432,175],[430,196],[390,220],[365,228]];
function project(x, y, a, b) {
  const dx=b[0]-a[0], dy=b[1]-a[1], length=Math.hypot(dx,dy);
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(length*length)));
  return {distance:(x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2,t,length};
}
export function createArmHeat(actor, action) {
  const cache = new Map();
  function build(index) {
    const f=action.frames[index], hand=f.inspectionPoint, [shoulder,elbow]=joints[index];
    const base=document.createElement('canvas'); base.width=768; base.height=640;
    const b=base.getContext('2d'); b.drawImage(actor,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const original=b.getImageData(0,0,768,640);
    const mask=document.createElement('canvas'); mask.width=768; mask.height=640;
    const q=mask.getContext('2d'); q.filter='blur(4px)'; q.fillStyle='white'; q.strokeStyle='white';
    if(index>=6){
      q.beginPath(); peakContour.forEach((p,i)=>i?q.lineTo(...p):q.moveTo(...p)); q.closePath(); q.fill();
    }else{
      q.lineCap='round'; q.lineJoin='round'; q.lineWidth=36;
      q.beginPath();q.moveTo(...shoulder);q.lineTo(...elbow);q.lineTo(...hand);q.stroke();
      q.beginPath();q.arc(...hand,19,0,Math.PI*2);q.fill();
    }
    const region=q.getImageData(0,0,768,640).data;
    const output=b.createImageData(768,640), strength=[0,.1,.32,.55,.8,.96,1,1][index];
    const l1=Math.hypot(elbow[0]-shoulder[0],elbow[1]-shoulder[1]);
    const l2=Math.hypot(hand[0]-elbow[0],hand[1]-elbow[1]);
    for(let y=70;y<400;y++)for(let x=300;x<550;x++){
      const i=(y*768+x)*4, coverage=region[i+3]/255;
      if(!coverage||!original.data[i+3])continue;
      const upper=project(x,y,shoulder,elbow), lower=project(x,y,elbow,hand);
      const along=upper.distance<lower.distance?upper.t*l1/(l1+l2):(l1+lower.t*l2)/(l1+l2);
      const heat=smooth(.1,.82,along), gold=smooth(.35,.95,heat);
      const luminance=(.2126*original.data[i]+.7152*original.data[i+1]+.0722*original.data[i+2])/255;
      const handWeight=1-smooth(18,32,Math.hypot(x-hand[0],y-hand[1]));
      const clothShade=.55+.45*smooth(.025,.22,luminance);
      const handShade=.45+.55*smooth(.12,.74,luminance);
      const shade=clothShade*(1-handWeight)+handShade*handWeight;
      output.data[i]=255*shade;
      output.data[i+1]=(90+142*gold)*shade;
      output.data[i+2]=(8+68*gold)*shade;
      output.data[i+3]=original.data[i+3]*coverage*heat*strength;
    }
    b.clearRect(0,0,768,640);b.putImageData(output,0,0);cache.set(index,base);return base;
  }
  return (context,index,opacity,x=32,y=20)=>{
    if(index===0||opacity<=0)return;
    const layer=cache.get(index)||build(index);
    context.save();context.globalAlpha=opacity;context.shadowColor='rgba(255,178,34,.5)';context.shadowBlur=8;
    context.drawImage(layer,x,y);context.restore();
  };
}
