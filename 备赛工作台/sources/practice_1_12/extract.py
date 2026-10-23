from pathlib import Path
import zipfile, json, xml.etree.ElementTree as ET
from PIL import Image, ImageOps, ImageDraw
root=Path(__file__).resolve().parents[3]
out=root/'备赛工作台/sources/practice_1_12'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
src=root/'练习题参考(第三方)/任务1-12具身智能应用.docx'
with zipfile.ZipFile(src) as z:
    relroot=ET.fromstring(z.read('word/_rels/document.xml.rels'))
    rels={x.attrib['Id']:x.attrib['Target'] for x in relroot}
    doc=ET.fromstring(z.read('word/document.xml'))
    records=[]
    for n,p in enumerate(doc.findall('.//w:p',ns),1):
        txt=''.join(p.itertext()) if False else ''.join(t.text or '' for t in p.findall('.//w:t',ns))
        imgs=[]
        for b in p.findall('.//a:blip',ns):
            rid=b.attrib.get('{'+ns['r']+'}embed')
            if rid in rels:
                tgt=rels[rid]; name=Path(tgt).name
                (out/name).write_bytes(z.read('word/'+tgt))
                imgs.append(name)
        if txt or imgs: records.append({'paragraph':n,'text':txt,'images':imgs})
    (out/'paragraph_map.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
    (out/'extracted.md').write_text('\n\n'.join(f'P{x["paragraph"]}: '+x['text']+'\n'+'\n'.join('!['+i+']('+i+')' for i in x['images']) for x in records),encoding='utf8')
print(json.dumps({'records':len(records),'images':len(list(out.glob('image*')))},ensure_ascii=False))
print((out/'extracted.md').read_text(encoding='utf8'))
