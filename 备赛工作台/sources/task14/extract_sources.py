from pathlib import Path
from zipfile import ZipFile
from lxml import etree
import json
import pdfplumber

root=Path(__file__).resolve().parents[3]
src=root/'练习题参考(第三方)'
out=root/'备赛工作台'/'sources'/'task14'
out.mkdir(parents=True,exist_ok=True)
names=['任务十四 功能模块改造与集成.docx','任务14-节点整理说明.docx','任务14-节点截图整理.docx']
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
for name in names:
    folder=out/Path(name).stem; folder.mkdir(exist_ok=True)
    with ZipFile(src/name) as z:
        doc=etree.fromstring(z.read('word/document.xml'))
        rels=etree.fromstring(z.read('word/_rels/document.xml.rels'))
        mapping={r.get('Id'):r.get('Target') for r in rels}
        lines=[]; images=[]
        for i,p in enumerate(doc.findall('.//w:p',ns),1):
            t=''.join(p.xpath('.//w:t/text()',namespaces=ns))
            if t: lines.append(f'[段落 {i}] {t}')
            for blip in p.findall('.//a:blip',ns):
                rid=blip.get('{'+ns['r']+'}embed'); target=mapping.get(rid,'')
                if target:
                    basename=Path(target).name
                    (folder/basename).write_bytes(z.read('word/'+target))
                    lines.append(f'[段落 {i} 图片] {basename}')
                    images.append({'paragraph':i,'image':basename})
        (folder/'text.md').write_text('\n\n'.join(lines),encoding='utf-8')
        (folder/'images.json').write_text(json.dumps(images,ensure_ascii=False,indent=2),encoding='utf-8')
        print(name, 'paragraphs',len(doc.findall('.//w:p',ns)),'images',len(images))
pdf=pdfplumber.open(src/'任务14指导书.pdf')
folder=out/'任务14指导书';folder.mkdir(exist_ok=True)
lines=[]
for n,p in enumerate(pdf.pages,1):
    lines.append(f'## 第 {n} 页\n\n'+(p.extract_text() or ''))
    p.to_image(resolution=110).save(folder/f'page-{n:02d}.png')
(folder/'text.md').write_text('\n\n'.join(lines),encoding='utf-8')
print('pdf pages',len(pdf.pages))
