/* Shared deterministic collision for the player and rescued coworker. */
(() => {
  const EPS=.5;
  const horizontal=(e,b,half=e.footHalf??14)=>e.x+half>b.x&&e.x-half<b.x+b.w;
  function support(e,solids){
    // A floor somewhere below is not support: the feet must touch its top.
    return solids.find(b=>Math.abs(e.y-b.y)<=EPS&&horizontal(e,b))||null;
  }
  function step(e,dt,solids,{width,gravity=1850,maxFallSpeed=1450}={}){
    const oldX=e.x,oldY=e.y,wasGrounded=e.grounded,half=e.bodyHalf??21,height=e.bodyHeight??145;
    e.x=Math.max(45,Math.min(width-45,e.x+e.vx*dt));
    for(const b of solids){
      if(e.y<=b.y+EPS||e.y-height>=b.y+b.h-EPS||!horizontal(e,b,half))continue;
      if(oldX+half<=b.x+EPS)e.x=b.x-half;
      else if(oldX-half>=b.x+b.w-EPS)e.x=b.x+b.w+half;
    }
    const standing=wasGrounded?support(e,solids):null;
    const leftGround=wasGrounded&&!standing;
    if(leftGround){e.grounded=false;e.vy=0;}
    let landing=null;
    if(!e.grounded){
      e.vy=Math.min(maxFallSpeed,e.vy+gravity*dt);e.y+=e.vy*dt;
      if(e.vy>=0){
        for(const b of solids)if(horizontal(e,b)&&oldY<=b.y+EPS&&e.y>=b.y&&(!landing||b.y<landing.y))landing=b;
        if(landing){e.y=landing.y;e.vy=0;e.grounded=true;}
      }else{
        for(const b of solids)if(horizontal(e,b,half)&&oldY-height>=b.y+b.h-EPS&&e.y-height<b.y+b.h){e.y=b.y+b.h+height;e.vy=0;break;}
      }
    }
    return{leftGround,landing,traveled:Math.abs(e.x-oldX),support:landing||standing};
  }
  const api=Object.freeze({support,step});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.DiMonPhysics=api;
})();
