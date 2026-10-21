from PIL import Image
import numpy as np,glob,os
for f in sorted(glob.glob('tests/output/origin-*.png')):
 a=np.array(Image.open(f).convert('RGB')).astype(float); bg=a[0,0]
 for label,box in [('text',(30,320)),('arrow',(330,400))]:
  crop=a[:,box[0]:box[1]]; w=np.abs(crop-bg).max(axis=2); yy=np.arange(w.shape[0])[:,None]
  ys,xs=np.where(w>8)
  print(os.path.basename(f),label,'bbox',ys.min(),ys.max(),'centroid',round((yy*w).sum()/w.sum(),2))
