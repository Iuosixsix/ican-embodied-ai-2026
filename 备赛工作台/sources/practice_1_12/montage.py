from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
p=Path(__file__).parent
imgs=sorted(p.glob('image*'),key=lambda f:int(f.stem.replace('image','')))
for j in range(0,len(imgs),12):
    batch=imgs[j:j+12]
    canvas=Image.new('RGB',(1800,4*440),'white'); d=ImageDraw.Draw(canvas)
    for k,f in enumerate(batch):
        im=Image.open(f).convert('RGB'); im.thumbnail((590,405))
        x=(k%3)*600;y=(k//3)*440
        canvas.paste(im,(x,y+30)); d.text((x+8,y+5),f.name,fill='black')
    canvas.save(p/f'montage_{j+1:02d}.jpg')
