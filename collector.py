#!/usr/bin/env python3
"""Coletor determinístico de oportunidades públicas para veículos agregados."""

from __future__ import annotations
import argparse, hashlib, json, re, sys, time, urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from unicodedata import normalize
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT=Path(__file__).parent
CONFIG=ROOT/"job-sources.json"
OUTPUT=ROOT/"jobs.json"
REPUTACAO=ROOT/"reputacao.json"
UA="PuxaRotaCollector/1.0 (+public job index)"
VEHICLES={
 "VUC":("vuc",),"Van":("van","fiorino"),"Utilitário":("utilitario","utilitário"),
 "3/4":("3/4","tres quartos"),"Truck":("truck",),"Toco":("toco",),
 "Carreta":("carreta","cavalo mecanico","cavalo mecânico"),"Passeio":("passeio",)
}
REGIONS=[
 (("guarulhos",),("Guarulhos, SP",-23.4543,-46.5337)),
 (("campinas",),("Campinas, SP",-22.9056,-47.0608)),
 (("sao vicente","são vicente"),("São Vicente, SP",-23.9608,-46.3960)),
 (("sorocaba",),("Sorocaba, SP",-23.5015,-47.4526)),
 (("grande sao paulo","grande são paulo","sao paulo","são paulo"),("São Paulo, SP",-23.5505,-46.6333)),
]

def now_iso(now=None): return (now or datetime.now(UTC)).replace(microsecond=0).isoformat().replace("+00:00","Z")
def simplify(s): return "".join(c for c in normalize("NFD",s.lower()) if c.isascii())
def load(path,default): return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
def reputation_for(company):
 entry=load(REPUTACAO,{}).get("companies",{}).get(company or "")
 if not entry: return None
 return {"source":"Reclame Aqui","url":entry["raUrl"],"status":entry["reputationStatus"],"label":entry["label"],"rating":entry["rating"],"complaints":entry["complaints"],"response_rate":entry["responseRate"],"solved_rate":entry["solvedRate"],"verified":entry["verified"],"trust_score":entry["trustScore"]}
def fetch(url,retries=2):
 req=urllib.request.Request(url,headers={"User-Agent":UA})
 for attempt in range(retries+1):
  try:
   with urllib.request.urlopen(req,timeout=30) as r: return r.read()
  except Exception:
   if attempt==retries: raise
   time.sleep(2)
def canonical_url(url):
 p=urlsplit(url); query=urlencode([(k,v) for k,v in parse_qsl(p.query) if not k.lower().startswith("utm_") and k.lower() not in {"fbclid","gclid"}])
 return urlunsplit((p.scheme.lower(),p.netloc.lower(),p.path.rstrip("/"),query,""))
def job_id(url): return hashlib.sha256(canonical_url(url).encode()).hexdigest()[:16]
def parse_date(value):
 if not value:return None
 try:return parsedate_to_datetime(value).astimezone(UTC)
 except (ValueError,TypeError):
  try:return datetime.fromisoformat(value.replace("Z","+00:00")).astimezone(UTC)
  except ValueError:return None
def node_text(node,name):
 x=node.find(name);return (x.text or "").strip() if x is not None else ""
def parse_feed(raw,source):
 root=ET.fromstring(raw); out=[]
 for item in root.findall("./channel/item"):
  out.append({"title":node_text(item,"title"),"url":node_text(item,"link"),"published":parse_date(node_text(item,"pubDate")),"publisher":node_text(item,"source") or source["name"]})
 ns="{http://www.w3.org/2005/Atom}"
 for item in root.findall(f"{ns}entry"):
  link=item.find(f"{ns}link");out.append({"title":node_text(item,f"{ns}title"),"url":link.get("href","") if link is not None else "","published":parse_date(node_text(item,f"{ns}updated")),"publisher":source["name"]})
 return [x for x in out if x["title"] and x["url"]]
def detect_vehicles(text,defaults=None):
 low=simplify(text); found=[name for name,terms in VEHICLES.items() if any(simplify(t) in low for t in terms)]
 return found or list(defaults or ["A confirmar"])
def detect_region(text,source):
 low=simplify(text)
 for terms,(name,lat,lng) in REGIONS:
  if any(simplify(t) in low for t in terms):return name,lat,lng
 return source.get("region","Brasil"),source.get("lat"),source.get("lng")
def relevant(title):
 low=simplify(title)
 has_vehicle=any(simplify(t) in low for terms in VEHICLES.values() for t in terms)
 has_intent=any(x in low for x in ("agreg","veiculo proprio","motorista parceiro","transportadora"))
 return has_intent and (has_vehicle or "agreg" in low)
def normalize_feed(entry,source,checked):
 region,lat,lng=detect_region(entry["title"],source); published=entry["published"]
 return {"id":job_id(entry["url"]),"type":"announcement","status":"active","company":entry["publisher"],"title":entry["title"],"origin":region,"lat":lat,"lng":lng,"area":region,"routine":"Condições no anúncio original","vehicles":detect_vehicles(entry["title"],source.get("vehicles")),"model":"Agregamento","payment":"A confirmar","detail":"Oportunidade encontrada em fonte pública. Confirme disponibilidade, valores e requisitos diretamente com o anunciante.","url":canonical_url(entry["url"]),"source":source["name"],"published_at":now_iso(published) if published else None,"discovered_at":checked,"last_checked_at":checked,"expires_at":now_iso((published or datetime.now(UTC))+timedelta(days=source.get("expires_days",30))),"confidence":source.get("confidence",55)}
def normalize_static(source,checked,old=None):
 return {"id":job_id(source["url"]),"type":"official_registration","status":"active","company":source["name"],"title":source["title"],"origin":source["region"],"lat":source.get("lat"),"lng":source.get("lng"),"area":source["area"],"routine":source.get("routine","Conforme disponibilidade"),"vehicles":source["vehicles"],"model":source.get("model","Cadastro de agregado"),"payment":source.get("payment","A confirmar"),"detail":source["detail"],"url":canonical_url(source["url"]),"source":source["name"],"published_at":None,"discovered_at":(old or {}).get("discovered_at",checked),"last_checked_at":checked,"expires_at":None,"confidence":source.get("confidence",85)}
def collect(config,previous=None,fetcher=fetch,now=None,include_review=False):
 current=now or datetime.now(UTC);checked=now_iso(current);previous=previous or {"jobs":[]};old={x["id"]:x for x in previous.get("jobs",[])};items=[];errors=[]
 for source in config["sources"]:
  try:
   if source.get("review_required") and not include_review:
    continue
   raw=fetcher(source["url"])
   if source["type"]=="static":
    items.append(normalize_static(source,checked,old.get(job_id(source["url"]))))
   else:
    for entry in parse_feed(raw,source):
     if relevant(entry["title"]):
      job=normalize_feed(entry,source,checked); prior=old.get(job["id"])
      if prior:job["discovered_at"]=prior.get("discovered_at",job["discovered_at"])
      items.append(job)
  except Exception as e: errors.append({"source":source["name"],"error":str(e)[:180]})
 dedup={x["id"]:x for x in items}
 for ident,item in old.items():
  if ident in dedup or item.get("type")!="announcement":continue
  expiry=parse_date(item.get("expires_at",""))
  if expiry and expiry>current:
   item=dict(item);item["status"]="unverified";dedup[ident]=item
 for job in dedup.values():
  rep=reputation_for(job.get("company"))
  if rep: job["reputation"]=rep
 jobs=sorted(dedup.values(),key=lambda x:(x["status"]=="active",x.get("published_at") or x["last_checked_at"]),reverse=True)
 return {"schema_version":1,"generated_at":checked,"total":len(jobs),"errors":errors,"jobs":jobs}
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--config",type=Path,default=CONFIG);ap.add_argument("--output",type=Path,default=OUTPUT);ap.add_argument("--check",action="store_true");ap.add_argument("--include-review",action="store_true");args=ap.parse_args()
 config=load(args.config,{});previous=load(OUTPUT,{"jobs":[]});result=collect(config,previous,include_review=args.include_review)
 if not result["jobs"]:raise SystemExit("Coleta sem resultados; arquivo anterior preservado.")
 if args.check:
  print(json.dumps({"total":result["total"],"errors":result["errors"]},ensure_ascii=False));return
 args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"{result['total']} oportunidades; {len(result['errors'])} fontes com erro")
if __name__=="__main__":main()
