/* Local chapter handoff. No account or server is needed. */
(() => {
  const KEY='di-mon:campaign:v1';
  function read(){try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===1?d:{version:1,completed:[],entries:{}};}catch{return{version:1,completed:[],entries:{}};}}
  function write(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}}
  function hero(d,fallback){const xp=Number(d?.xp);return{xp:Number.isFinite(xp)?Math.max(0,Math.min(1000,xp)):fallback.xp};}
  function entry(chapter,fallback){if(chapter===1)return fallback;const d=read(),query=new URLSearchParams(location.search);const handoff=query.get('from')==='chapter1'&&query.has('xp')?{xp:Number(query.get('xp'))}:null;const value=hero(handoff||d.entries?.[chapter],fallback);d.entries||={};d.entries[chapter]=value;write(d);return value;}
  function complete(chapter,stats){const d=read();d.completed=[...new Set([...(Array.isArray(d.completed)?d.completed:[]),chapter])];d.entries||={};if(chapter===1)d.entries[2]=hero(stats,{xp:235});d.lastCompleted=chapter;write(d);}
  window.DiMonCampaign=Object.freeze({entry,complete,getState:read});
})();
