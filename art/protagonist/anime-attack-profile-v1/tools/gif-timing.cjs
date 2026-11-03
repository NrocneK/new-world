function setGifDelays(input,durations){
 const out=Buffer.from(input);if(!/^GIF8[79]a$/.test(out.toString('ascii',0,6)))throw Error('Not GIF');
 let i=13+((out[10]&128)?3*(1<<((out[10]&7)+1)):0),frame=0,images=0;
 function skipBlocks(j){while(out[j])j+=1+out[j];return j+1;}
 while(i<out.length){
  if(out[i]===0x3b)break;
  if(out[i]===0x21){
   if(out[i+1]===0xf9){if(out[i+2]!==4||frame>=durations.length)throw Error('Unexpected GCE');out.writeUInt16LE(Math.round(durations[frame++]/10),i+4);i+=8;}
   else i=skipBlocks(i+2);
  }else if(out[i]===0x2c){const p=out[i+9];i+=10+((p&128)?3*(1<<((p&7)+1)):0);i=skipBlocks(i+1);images++;}
  else throw Error('Unexpected GIF block at '+i);
 }
 if(frame!==durations.length||images!==durations.length)throw Error('Frame count differs');
 return out;
}

module.exports={setGifDelays};
