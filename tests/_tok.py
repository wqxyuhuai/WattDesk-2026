import json,re
p=r'design-preview/design/figma/figma-color-source.json'
s=open(p,encoding='utf-8-sig').read()
for name in ['Labels/Primary','Labels/Secondary','Labels/Tertiary','Labels/Quaternary']:
    i=s.find('"name": "%s"'%name)
    print('===',name,i)
    print(s[max(0,i-300):i+700])
