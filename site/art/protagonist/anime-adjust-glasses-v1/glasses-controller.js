/** Independent one-shot state. Call enterIdle on a new uninterrupted idle period. */
export class GlassesController {
  constructor({delayMs=8000,durationMs=1360,now=0}={}) {
    this.delayMs=delayMs;
    this.durationMs=durationMs;
    this.enterIdle(now);
  }
  enterIdle(now) {
    this.state='idle';this.idleSince=now;this.actionSince=null;
    this.armed=true;this.reason=null;
  }
  interrupt(activity,now) {
    if(activity==='idle') {this.enterIdle(now);return;}
    this.state=activity;this.idleSince=null;this.actionSince=null;
    this.armed=false;this.reason='interrupted';
  }
  update(now) {
    if(this.state==='idle'&&this.armed&&now-this.idleSince>=this.delayMs) {
      this.state='adjust-glasses';this.actionSince=now;this.armed=false;
      this.reason='prolonged-idle';
    }
    if(this.state==='adjust-glasses'&&now-this.actionSince>=this.durationMs) {
      this.state='idle';this.actionSince=null;this.reason='completed';
    }
    return this.snapshot(now);
  }
  snapshot(now) {
    return {state:this.state,armed:this.armed,reason:this.reason,
      idleElapsedMs:this.idleSince===null?0:Math.max(0,now-this.idleSince),
      actionElapsedMs:this.actionSince===null?0:Math.max(0,now-this.actionSince),
      remainingMs:this.state==='idle'&&this.armed?Math.max(0,this.delayMs-(now-this.idleSince)):null};
  }
}

export function frameAtTime(frames,elapsedMs) {
  let end=0;
  for(let i=0;i<frames.length;i++) {end+=frames[i].durationMs;if(elapsedMs<end)return i;}
  return frames.length-1;
}
