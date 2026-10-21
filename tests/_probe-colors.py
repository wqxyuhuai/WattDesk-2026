from PIL import Image
im=Image.open(r'C:\Users\Administrator\.codex\visualizations\2026\10\20\01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d\figma-date-picker.png').convert('RGB')
for name,cx,cy in [('row5day4',1029,239),('row5day9',994,239),('row5day10',1029,239),('row1day4',1029,207),('row2day5',843,239),('row1day1',961,152),('day12',843,270)]:
    print(name,cx,cy,im.getpixel((cx,cy)))
# grid: weekly columns centres
xs=[843,878,911,945,978,1012,1046]
ys=[151,181,209,239,270,301,332,365]
print('   ',[ (x) for x in xs])
for y in ys:
    print(y,[im.getpixel((x,y))[0] for x in xs])
