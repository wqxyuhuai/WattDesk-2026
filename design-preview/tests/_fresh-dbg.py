from PIL import Image
import numpy as np,os
for f in ['tests/output/fresh-dpr1-Devicetool-open.png','tests/output/fresh-dpr1-Devicetool-closed.png','tests/output/fresh-dpr4-Teams-open.png','tests/output/fresh-dpr4-Teams-closed.png']:
 a=np.array(Image.open(f).convert('RGB')).astype(int); bg=a[0,0]; m=np.abs(a-bg).max(axis=2)>8
 tx=m.copy(); tx[:,75:]=False
 ar=m.copy(); ar[:,:75]=False
 for label,c in [('text',tx),('arrow',ar)]:
  ys,xs=np.where(c)
  if len(ys): print(os.path.basename(f),label,'bbox',ys.min(),ys.max(),'c',round((np.arange(ys.size)+0).sum() and (ys[:,None]*c[np.where(c)[0],:]).sum()/c.sum(),2) if False else '')
