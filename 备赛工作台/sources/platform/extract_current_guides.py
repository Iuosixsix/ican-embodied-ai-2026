from pathlib import Path
from pypdf import PdfReader
import json,re,subprocess,hashlib

root=Path(__file__).parent
rows=json.loads((root/'official_guide_urls_2_12.json').read_text(encoding='utf-8'))
render=root/'官方指导书页图'; render.mkdir(exist_ok=True)
records=[]
for row in rows:
 n=row['task']; pdf=root/f'任务{n}_当前平台指导书.pdf'; reader=PdfReader(pdf)
 pages=[p.extract_text() or '' for p in reader.pages]
 md='\n\n'.join(f'## 第 {i} 页\n\n{t}' for i,t in enumerate(pages,1))
 (root/f'任务{n}_当前平台指导书.md').write_text(md,encoding='utf-8')
 scoring=[i for i,t in enumerate(pages,1) if '实验评分' in t or '评分标准' in t or '评分规则' in t]
 if not scoring: scoring=[1]
 for pn in sorted(set(scoring)):
  target=render/f'task-{n:02d}-p{pn:02d}'
  subprocess.run(['pdftoppm','-f',str(pn),'-l',str(pn),'-scale-to','1500','-png','-singlefile',str(pdf),str(target)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 rec={**row,'pdf':pdf.name,'pages':len(pages),'scoring_pages':scoring,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'first_page_text':pages[0]}
 records.append(rec)
 print(f'TASK {n} | {row["title"]} | {len(pages)} pages | scoring {scoring}\n'+pages[0][:350]+'\n')
(root/'official_guide_manifest_2_12.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
