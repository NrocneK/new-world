"""Original 30-second film score and environmental Foley. No stock audio."""
from pathlib import Path
import wave
import numpy as np
SR=48000;D=30;rng=np.random.default_rng(1102)
mix=np.zeros((SR*D,2),np.float64)
def add(start,sig,pan=0):
 a=round(start*SR);n=min(len(sig),len(mix)-a)
 if n<=0:return
 mix[a:a+n,0]+=sig[:n]*np.sqrt((1-pan)/2)
 mix[a:a+n,1]+=sig[:n]*np.sqrt((1+pan)/2)
def noise(dur,smooth=1):
 x=rng.normal(0,1,round(dur*SR))
 return np.convolve(x,np.ones(smooth)/smooth,'same') if smooth>1 else x
def pad(start,dur,notes,amp=.025):
 t=np.arange(round(dur*SR))/SR
 env=np.maximum(0,np.minimum(t/.65,1)*np.minimum((dur-t)/.85,1))
 for j,f in enumerate(notes):
  vibrato=.18*np.sin(t*1.4+j)
  p=2*np.pi*f*t+vibrato
  # Warm bowed harmonics with gradual, deliberately restrained attacks.
  sig=(np.sin(p)+.24*np.sin(p*2+.05*np.sin(t*3))+.09*np.sin(p*3))
  add(start,sig*env*amp,(-.55,.45,-.25,.6)[j%4])
for args in [(0,7.2,[73.416,146.832,174.614,220],.018),
 (6.2,5.6,[58.27,116.54,174.61,233.08],.026),
 (10.8,5.8,[49,98,146.832,220],.029),
 (16,4.9,[73.416,146.832,220,293.664],.022),
 (20,4.7,[55,110,164.814,220],.034),
 (23.8,3.6,[73.416,146.832,174.614,293.664],.045),
 (27,3,[73.416,146.832,220,293.664],.031)]:pad(*args)
def bell(start,f,dur=2,amp=.06):
 t=np.arange(round(dur*SR))/SR;env=(1-np.exp(-t*100))*np.exp(-t*2.3)
 sig=(np.sin(2*np.pi*f*t)+.21*np.sin(2*np.pi*f*2.01*t)+.08*np.sin(2*np.pi*f*3.95*t))*env*amp
 add(start,sig,(-.25 if f<500 else .3))
for a,f in [(1.15,293.664),(3.7,220),(5.2,261.626),(16.7,587.33),(17.25,880),(18,1174.66),(19.3,440),(20.5,293.664),(21.3,349.228),(22.1,440),(23,587.33),(27.15,293.664),(27.65,440),(28.2,587.33)]:bell(a,f,2,.035 if a<16 else .055)
def impact(start,amp=.2,heavy=False,pan=0):
 dur=1.5 if heavy else .4;t=np.arange(round(dur*SR))/SR
 p=2*np.pi*np.cumsum(38+95*np.exp(-t*22))/SR
 sig=(np.sin(p)*np.exp(-t*(3 if heavy else 14))+noise(dur,12)*.7*np.exp(-t*25))*amp*(1-np.exp(-t*600))
 add(start,sig,pan)
def whoosh(start,dur=.5,amp=.08,pan=0):
 t=np.arange(round(dur*SR))/SR;env=np.sin(np.pi*t/dur)**1.4
 add(start,(noise(dur,5)+.08*np.sin(2*np.pi*(200*t+350*t*t)))*env*amp,pan)
# Steady rain: independent channels, softened indoors after the exterior cut.
t=np.arange(SR*D)/SR
for pan in [-.8,.8]:
 rain=noise(D,3)*.022
 rain*=np.where(t<3,1,.3)*np.clip((29.6-t)/1.2,0,1)
 add(0,rain,pan)
# Keyboard and chair Foley; no regular gameplay beat.
for i,a in enumerate(np.arange(3.15,5.85,.145)):
 dur=.045;tt=np.arange(round(dur*SR))/SR
 add(float(a),noise(dur,2)*np.exp(-tt*100)*.037,-.22)
whoosh(5.9,.6,.035,-.4)
# Structural rumble, light fittings and concrete pieces.
dur=8;t=np.arange(round(dur*SR))/SR
env=np.minimum(t/1.5,1)*np.minimum((dur-t)/2,1)
sig=(np.sin(2*np.pi*36*t)+.4*np.sin(2*np.pi*49*t)+noise(dur,90)*2)*env*.065
add(6.3,sig)
impact(7.35,.13,True,.1)
for i,a in enumerate([7.9,8.4,8.7,9.3,9.85,10.25,11.3,12.2,13.4]):
 impact(a,.055+i%3*.018,False,(-.6,.5,.25)[i%3])
whoosh(10.2,.9,.12,.45);impact(10.65,.18,True,.4)
# Fabric effort and feet shifting in the rescue shot.
for a in [11.2,12.3,13.8,14.5]:whoosh(a,.28,.035,-.15)
impact(15.55,.07,False,.2)
# The spirit approaches, then a sustained tension rise before the air strike.
whoosh(16.1,1.6,.04,.6)
dur=3.5;t=np.arange(round(dur*SR))/SR
rise=(np.sin(2*np.pi*(110*t+70*t*t))*.025+noise(dur,10)*.09)*np.sin(np.pi*t/dur)**1.2
add(20.4,rise,.1)
whoosh(23.72,.5,.3,.25);impact(24.02,.3,True,.25)
whoosh(24.1,1.7,.13,.6)
impact(27,.15,True)
# A room tail with stereo reflections. Leave clear dynamic headroom.
for delay,gain in [(.089,.15),(.163,.09),(.293,.05)]:
 shift=round(delay*SR);mix[shift:]+=mix[:-shift,::-1].copy()*gain
t=np.arange(len(mix))/SR
mix*=np.minimum(t/.4,1)[:,None]*np.clip((30-t)/1,0,1)[:,None]
mix=np.tanh(mix*1.15);mix*=.84/max(.001,np.max(np.abs(mix)))
out=Path('movie/output/score.wav');out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
print('Wrote original film score and environmental sound:',out)
