from PIL import Image
import numpy as np,glob,os
for f in sorted(glob.glob('tests/output/final-*.png')):
 a=np.array(Image.open(f).convert('RGB')).astype(float); bg=a[0,0]
 out=[]
 for label,box in [('text',(30,320)),('arrow',(330,400))]:
  crop=a[:,box[0]:box[1]]; w=np.abs(crop-bg).max(axis=2); yy=np.arange(w.shape[0])[:,None]; ys,xs=np.where(w>8)
  out.append(f'{label}:{ys.min()}-{ys.max()} c{(yy*w).sum()/w.sum():.2f}')
 print(os.path.basename(f),*out)
