from PIL import Image
import numpy as np,glob,os
for f in sorted(glob.glob('tests/output/page-*.png')):
 a=np.array(Image.open(f).convert('RGB')).astype(int); bg=a[0,0]
 print(os.path.basename(f),'size',a.shape[1],a.shape[0])
 for label,box in [('text',(30,320)),('arrow',(325,420))]:
  crop=a[:,box[0]:box[1]]; w=np.abs(crop-bg).max(axis=2); yy=np.arange(w.shape[0])[:,None]; ys,xs=np.where(w>8)
  if len(ys): print(' ',label,ys.min(),ys.max(),'c',round((yy*w).sum()/w.sum(),2))
  else: print(' ',label,'none')
