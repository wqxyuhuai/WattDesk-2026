from PIL import Image
import numpy as np,glob,os
for f in sorted(glob.glob('tests/output/check-*.png')):
 a=np.array(Image.open(f).convert('RGB')).astype(int); bg=a[0,0]
 text=a[:,40:320]; arrow=a[:,340:390]
 out=[]
 for label,crop in [('text',text),('arrow',arrow)]:
  w=np.abs(crop-bg).max(axis=2); yy=np.arange(w.shape[0])[:,None]; ys,xs=np.where(w>8)
  if len(ys): out.append(f'{label}:{ys.min()}-{ys.max()} c{(yy*w).sum()/w.sum():.2f}')
  else: out.append(f'{label}:none')
 print(os.path.basename(f),*out)
