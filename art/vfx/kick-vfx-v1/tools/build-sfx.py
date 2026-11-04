"""Original short air-cut sounds for the three kicks; no pitched electric sweep."""
from pathlib import Path
import numpy as np,wave
from scipy.signal import butter,sosfilt
root=Path(__file__).resolve().parents[4];out=root/'site/art/kick-vfx-v1';sr=44100
for key,duration,weight,seed in [('kick1',.28,.9,212),('kick2',.30,1,313),('kick3',.42,1.2,414)]:
 rng=np.random.default_rng(seed);n=int(sr*duration);t=np.arange(n)/sr
 def band(lo,hi):
  x=sosfilt(butter(3,[lo,hi],btype='bandpass',fs=sr,output='sos'),rng.normal(size=n));return x/(np.std(x)+1e-8)
 env=(1-np.exp(-t/.012))*np.exp(-t/(duration*.23))
 air=band(350,4200)*env*.22;body=band(100,700)*env*.09
 u=np.maximum(0,t-.038);contact=np.sin(2*np.pi*90*u)*np.exp(-u*47)*(t>=.038)*.09
 y=np.tanh((air+body+contact)*weight)*.82;y*=np.minimum(1,(duration-t)/.018)
 with wave.open(str(out/(key+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((y*32767).astype('<i2').tobytes())
 print(key,'duration',duration,'peak',round(float(abs(y).max()),3))
