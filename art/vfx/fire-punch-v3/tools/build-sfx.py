"""Original synthesized combustion bursts: warm roar, air rush, sparse crackles."""
from pathlib import Path
import numpy as np,wave
from scipy.signal import butter,sosfilt
out=Path(__file__).resolve().parents[4]/'site/art/fire-punch-v3';sr=44100
for name,dur,power,seed in [('attack1',.64,1,21),('attack2',.70,1.08,43),('attack3',1.04,1.4,79)]:
 rng=np.random.default_rng(seed);n=int(sr*dur);t=np.arange(n)/sr
 def noise(low,high):
  v=sosfilt(butter(3,[low,high],fs=sr,btype='bandpass',output='sos'),rng.normal(size=n));return v/(np.std(v)+1e-9)
 attack=.035 if name!='attack3' else .065
 env=(1-np.exp(-t/attack))*np.exp(-t/(dur*.25));roar=noise(45,700)*env*.26;air=noise(350,2600)*env*.11
 # Modulate the roar with slowly changing turbulence, without tonal sweeps.
 mod=sosfilt(butter(2,18,fs=sr,output='sos'),rng.normal(size=n));mod/=max(abs(mod).max(),1e-9);roar*=1+.4*mod
 crack=np.zeros(n)
 for j in range(15 if name=='attack3' else 9):
  pos=int(rng.uniform(.06,dur*.8)*sr);length=min(int(rng.uniform(.005,.024)*sr),n-pos);u=np.arange(length)/sr
  pop=sosfilt(butter(2,3500,fs=sr,output='sos'),rng.normal(size=length))*np.exp(-u*240)*rng.uniform(.08,.22)
  crack[pos:pos+length]+=pop
 impactTime=.10 if name!='attack3' else .19;u=np.maximum(0,t-impactTime);thump=np.sin(2*np.pi*65*u)*np.exp(-u*26)*(t>=impactTime)*(.16 if name!='attack3' else .24)
 y=(roar+air+crack+thump)*power;y*=np.minimum(1,(dur-t)/.025);y=np.tanh(y*1.15)*.82
 with wave.open(str(out/(name+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((y*32767).astype('<i2').tobytes())
 print(name,'duration',dur,'peak',round(float(abs(y).max()),3),'RMS',round(float(np.sqrt(np.mean(y*y))),3))
