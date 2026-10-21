from PIL import Image
files=['tests/output/final-open-54.png','tests/output/final-closed-54.png']
ims=[Image.open(f).convert('RGB') for f in files]
w,h=ims[0].size
out=Image.new('RGB',(w,h*2+12),(28,28,30))
for i,im in enumerate(ims): out.paste(im,(0,i*(h+12)))
out.save('tests/output/final-stack.png')
