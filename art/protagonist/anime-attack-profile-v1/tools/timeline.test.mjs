import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sample,impactEvents} from '../../../../site/art/protagonist/anime-attack-profile-v2/timeline.js';

const meta=JSON.parse(readFileSync(new URL('../combat-sheet.json',import.meta.url)));

test('combo changes actions at their boundaries, then holds the shared guard',()=>{
  for(const [time,key,index,complete] of [
    [0,'attack1',0,false],[249,'attack1',7,false],
    [250,'attack2',0,false],[500,'attack3',0,false],
    [860,'attack4',0,false],[1379,'attack4',7,false],
    [1380,'attack4',7,true],[9000,'attack4',7,true],
  ]) {
    const s=sample(meta,'combo',time);
    assert.deepEqual([s.key,s.index,s.complete],[key,index,complete]);
  }
});

test('each action reaches every cel and finishes once, without looping',()=>{
  for(const key of meta.combo) {
    const a=meta.actions[key];
    for(const f of a.frames) {
      assert.equal(sample(meta,key,f.startMs).index,f.index);
      assert.equal(sample(meta,key,f.startMs+f.durationMs-1).index,f.index);
    }
    assert.equal(sample(meta,key,a.durationMs).complete,true);
    assert.equal(sample(meta,key,a.durationMs*5).index,7);
  }
});

test('VFX events begin on the actual contact cels, in combo order',()=>{
  assert.deepEqual(impactEvents(meta,'combo'),[
    {key:'attack1',timeMs:70},{key:'attack2',timeMs:320},
    {key:'attack3',timeMs:660},{key:'attack4',timeMs:1080},
  ]);
  for(const key of meta.combo) {
    const a=meta.actions[key],hit=a.impact.timeMs;
    assert.equal(sample(meta,key,hit).index,a.impact.frameIndex);
    assert.ok(sample(meta,key,hit-1).index<a.impact.frameIndex);
    assert.deepEqual(impactEvents(meta,key),[{key,timeMs:hit}]);
  }
});
