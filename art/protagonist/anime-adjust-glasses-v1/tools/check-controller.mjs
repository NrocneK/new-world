import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GlassesController,frameAtTime} from '../../../../site/art/protagonist/anime-adjust-glasses-v1/glasses-controller.js';

const metadata=JSON.parse(await readFile(new URL('../glasses-sheet.json',import.meta.url),'utf8'));
assert.equal(metadata.loop,false);
assert.equal(metadata.onComplete,'idle');
assert.equal(metadata.trigger.afterMs,8000);
const c=new GlassesController({delayMs:metadata.trigger.afterMs,durationMs:metadata.durationMs,now:0});

// A long idle period gives one whole gesture, then stays idle without repeats.
assert.equal(c.update(7999).state,'idle');
assert.equal(c.update(8000).state,'adjust-glasses');
assert.equal(c.update(8000+metadata.durationMs-1).state,'adjust-glasses');
assert.equal(c.update(8000+metadata.durationMs).state,'idle');
assert.equal(c.update(60000).state,'idle');
assert.equal(c.snapshot(60000).armed,false);

// Activities cancel an active gesture; re-entry to idle gets a fresh delay.
for(const activity of metadata.trigger.cancelOn) {
  c.enterIdle(100000);c.update(108000);c.interrupt(activity,108050);
  assert.equal(c.update(120000).state,activity);
  assert.equal(c.snapshot(120000).actionElapsedMs,0);
  c.enterIdle(121000);
  assert.equal(c.update(128999).state,'idle');
  assert.equal(c.update(129000).state,'adjust-glasses');
}

// Walking just before the threshold also cancels the pending gesture.
c.enterIdle(200000);assert.equal(c.update(207900).state,'idle');
c.interrupt('walk',207900);c.enterIdle(209000);
assert.equal(c.update(216999).state,'idle');
assert.equal(c.update(217000).state,'adjust-glasses');

assert.equal(frameAtTime(metadata.frames,0),0);
assert.equal(frameAtTime(metadata.frames,100),1);
assert.equal(frameAtTime(metadata.frames,540),4);
assert.equal(frameAtTime(metadata.frames,metadata.durationMs),7);
console.log('Glasses gesture: one shot, delay, return, interruption and fresh idle period passed.');
