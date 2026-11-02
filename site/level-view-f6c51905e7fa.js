/* One projection for artwork, collision space, effects and camera framing. */
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function create({canvasWidth=1280,canvasHeight=720,worldWidth,worldHeight,ground,zoom=1,groundLine=520,lockY=false}){
    const width=canvasWidth/zoom,height=canvasHeight/zoom,maxX=Math.max(0,worldWidth-width),baseY=ground-groundLine/zoom;
    const target=p=>({x:clamp(p.x-width/2,0,maxX),y:lockY?baseY:clamp(p.y-(p.vy>200?410:groundLine)/zoom,0,Math.max(0,worldHeight-height))});
    const project=(x,y,camera)=>({x:(x-camera.x)*zoom,y:(y-camera.y)*zoom});
    return Object.freeze({zoom,width,height,maxX,baseY,target,project});
  }
  function panorama(view,{imageWidth,imageHeight,ground,cameraX,curb=.8,depth=50,parallax=.16,margin=40}){
    const aspect=imageWidth/imageHeight;
    // Uniformly fit one image to the entire camera journey. No repeat, switch,
    // crossfade or uncovered viewport at either end of the street.
    const minHeight=(ground-depth-view.baseY)/curb+16;
    const width=Math.max(view.width+view.maxX*parallax+margin*2,minHeight*aspect),height=width/aspect;
    const speed=view.maxX>0?(width-view.width-margin*2)/view.maxX:0;
    return{x:-margin-cameraX*speed,y:ground-depth-height*curb,width,height,parallax:speed};
  }
  const api=Object.freeze({create,panorama});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.DiMonView=api;
})();
