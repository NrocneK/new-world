export function frameAt(action,elapsedMs) {
  for(let i=0;i<action.frames.length;i++){const f=action.frames[i];if(elapsedMs<f.startMs+f.durationMs)return i;}
  return action.frames.length-1;
}
export function segments(meta,selection) {
  const name=selection==='finisher'?'combo':selection;
  const requested=meta.playbackSequences?.[name]??(name==='punches'?meta.punchCombo:name==='combo'?meta.combo:[name]).map(key=>({key}));
  return requested.map(s=>{const a=meta.actions[s.key],endFrame=s.endFrame??a.frames.length-1;return {...s,endFrame,durationMs:a.frames[endFrame].startMs+(s.lastFrameDurationMs??a.frames[endFrame].durationMs)};});
}
export function sequence(meta,selection){return segments(meta,selection).map(s=>s.key);}
export function sample(meta,selection,elapsedMs) {
  let start=0;const list=segments(meta,selection);
  for(const s of list){if(elapsedMs<start+s.durationMs)return {key:s.key,index:Math.min(s.endFrame,frameAt(meta.actions[s.key],Math.max(0,elapsedMs-start))),complete:false};start+=s.durationMs;}
  const last=list.at(-1);return {key:last.key,index:last.endFrame,complete:true,postElapsedMs:Math.max(0,elapsedMs-start)};
}
export function impactEvents(meta,selection) {
  let time=0;const out=[];for(const s of segments(meta,selection)){const a=meta.actions[s.key];if(a.impact.frameIndex<=s.endFrame)out.push({key:s.key,timeMs:time+a.impact.timeMs});time+=s.durationMs;}return out;
}
