export function frameAt(action,elapsedMs) {
  for(let i=0;i<action.frames.length;i++) {
    const f=action.frames[i];if(elapsedMs<f.startMs+f.durationMs)return i;
  }
  return action.frames.length-1;
}
export function sequence(metadata,selection) {
  return selection==='combo'?metadata.combo:selection==='finisher'?['attack3','attack4']:[selection];
}
export function sample(metadata,selection,elapsedMs) {
  const keys=sequence(metadata,selection);let start=0;
  for(let i=0;i<keys.length;i++) {
    const key=keys[i],a=metadata.actions[key];
    if(elapsedMs<start+a.durationMs)return {key,index:frameAt(a,Math.max(0,elapsedMs-start)),localMs:Math.max(0,elapsedMs-start),complete:false};
    start+=a.durationMs;
  }
  const key=keys[keys.length-1];return {key,index:7,localMs:metadata.actions[key].durationMs,complete:true};
}
export function impactEvents(metadata,selection) {
  let start=0;return sequence(metadata,selection).map(key=>{
    const a=metadata.actions[key],event={key,timeMs:start+a.impact.timeMs};start+=a.durationMs;return event;
  });
}
