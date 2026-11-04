import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function buildCharacterLab(root=defaultRoot){
 const target=path.join(root,'site/art/character-lab-v11');fs.mkdirSync(target,{recursive:true});
 fs.cpSync(path.join(root,'character-lab'),target,{recursive:true});
 fs.copyFileSync(path.join(root,'character-lab.html'),path.join(root,'site/character-lab.html'));
 const actions=[];
 for(const [id,label,folder,file,anchorX,groundY] of [
  ['idle','Đứng yên','anime-idle-profile-v1','idle',192,500],
  ['walk','Đi bộ','anime-walk-profile-v2','walk',192,480],
  ['run','Chạy','anime-run-approved-v2','run',224,500],
  ['glasses','Chỉnh kính','anime-adjust-glasses-v1','glasses',192,500],
  ['jump','Nhảy','anime-jump-profile-v3','jump',192,620],
  ['airJump','Air jump','anime-air-jump-profile-v2','air-jump',192,620],
  ['dash','Dash','anime-dash-profile-v2','dash',320,420],
  ['airDash','Air dash','anime-air-dash-profile-v1','air-dash',280,620],
 ]){
  const dir='art/protagonist/'+folder,m=JSON.parse(fs.readFileSync(path.join(root,dir,file+'-sheet.json')));let time=0;
  if(['run','dash'].includes(id)){const dest=path.join(root,'site',dir);fs.mkdirSync(dest,{recursive:true});for(const name of [m.image,file+'-sheet.json',file+'-preview.gif',file+'-preview-slow.gif'])fs.copyFileSync(path.join(root,dir,name),path.join(dest,name));}
  const frames=m.frames.map(f=>{const durationMs=f.durationMs??1000/m.fps;const out={...f,startMs:time,durationMs};time+=durationMs;return out;});
  actions.push({id,label,group:'move',image:dir+'/'+m.image,frames,durationMs:time,loop:!!m.loop,anchorX,groundY,scale:.62,...(m.contentTopY!==undefined?{contentTopY:m.contentTopY}:{}),...(fs.existsSync(path.join(root,dir,file+'-preview.gif'))?{previewGif:dir+'/'+file+'-preview.gif',slowGif:dir+'/'+file+'-preview-slow.gif'}:{})});
 }
 const dir='art/protagonist/anime-attack-profile-v12',combat=JSON.parse(fs.readFileSync(path.join(root,dir,'combat-sheet.json')));
 for(const id of combat.allActions){const a=combat.actions[id];actions.push({id,label:({attack1:'Đấm phải / gần',attack2:'Đấm trái / xa',attack3:'Đấm móc',kick1:'Đá phải / gần',kick2:'Đá trái / xa',kick3:'Xoay người đá cao'})[id],group:'combat',image:dir+'/'+a.image,frames:a.frames,durationMs:a.durationMs,loop:false,anchorX:381.5,groundY:620,scale:.62,impactFrame:a.impact.frameIndex});}
 const manifest={version:11,identity:'anime-side-profile',count:actions.length,totalFrames:actions.reduce((s,a)=>s+a.frames.length,0),combatMeta:dir+'/combat-sheet.json',autoGlassesAfterMs:8000,actions};
 fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Built character lab:',manifest.count,'motions,',manifest.totalFrames,'frames');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)buildCharacterLab();
