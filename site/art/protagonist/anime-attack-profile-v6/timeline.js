export function frameAt(action,elapsedMs) {
  for(let i=0;i<action.frames.length;i++) {
    const f=action.frames[i];if(elapsedMs<f.startMs+f.durationMs)return i;
  }
  return action.frames.length-1;
}
export function sequence(meta,selection) {
  return selection==='punches'?meta.punchCombo:
    selection==='combo'||selection==='finisher'?meta.combo:[selection];
}
export function sample(meta,selection,elapsedMs) {
  let start=0;const keys=sequence(meta,selection);
  for(const key of keys) {
    const a=meta.actions[key];
    if(elapsedMs<start+a.durationMs)return {key,index:frameAt(a,Math.max(0,elapsedMs-start)),complete:false};
    start+=a.durationMs;
  }
  const key=keys.at(-1);
  return {key,index:meta.actions[key].frames.length-1,complete:true,postElapsedMs:Math.max(0,elapsedMs-start)};
}
export function impactEvents(meta,selection) {
  let time=0;return sequence(meta,selection).map(key=>{
    const a=meta.actions[key],event={key,timeMs:time+a.impact.timeMs};time+=a.durationMs;return event;
  });
}
