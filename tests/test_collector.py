import unittest
from datetime import UTC, datetime
import collector

RSS="""<rss><channel>
<item><title>Transportadora agrega VUC em Guarulhos</title><link>https://example.com/vaga?utm_source=x</link><pubDate>Sun, 09 Aug 2026 12:00:00 GMT</pubDate><source>Empresa Teste</source></item>
<item><title>Notícia sem relação com transporte</title><link>https://example.com/noticia</link></item>
</channel></rss>""".encode()

class CollectorTests(unittest.TestCase):
 def test_canonical_removes_tracking(self):
  self.assertEqual(collector.canonical_url("HTTPS://Example.com/vaga/?utm_source=x&a=1"),"https://example.com/vaga?a=1")
 def test_parse_and_relevance(self):
  entries=collector.parse_feed(RSS,{"name":"Busca"})
  self.assertEqual(len(entries),2);self.assertTrue(collector.relevant(entries[0]["title"]));self.assertFalse(collector.relevant(entries[1]["title"]))
 def test_detects_vehicle_and_region(self):
  self.assertEqual(collector.detect_vehicles("Agrega VUC e van"),["VUC","Van"])
  self.assertEqual(collector.detect_region("vaga em Guarulhos",{})[0],"Guarulhos, SP")
 def test_collect_deduplicates_and_keeps_static(self):
  config={"sources":[
   {"name":"Oficial","type":"static","url":"https://official.test/agregados","title":"Agregados","region":"Brasil","area":"Brasil","vehicles":["Truck"],"detail":"Cadastro oficial"},
   {"name":"Feed","type":"rss","url":"https://feed.test/rss","region":"Brasil","expires_days":30}
  ]}
  result=collector.collect(config,fetcher=lambda url:b"ok" if "official" in url else RSS,now=datetime(2026,8,10,tzinfo=UTC))
  self.assertEqual(result["total"],2)
  self.assertEqual({x["type"] for x in result["jobs"]},{"official_registration","announcement"})
  announcement=next(x for x in result["jobs"] if x["type"]=="announcement")
  self.assertEqual(announcement["vehicles"],["VUC"]);self.assertEqual(announcement["origin"],"Guarulhos, SP")
 def test_failed_source_does_not_delete_unexpired_announcement(self):
  previous={"jobs":[{"id":"abc","type":"announcement","status":"active","expires_at":"2026-08-20T00:00:00Z","published_at":"2026-08-09T00:00:00Z"}]}
  result=collector.collect({"sources":[{"name":"Falha","type":"rss","url":"https://fail"}]},previous,fetcher=lambda _:(_ for _ in ()).throw(OSError("offline")),now=datetime(2026,8,10,tzinfo=UTC))
  self.assertEqual(result["jobs"][0]["status"],"unverified");self.assertEqual(len(result["errors"]),1)
 def test_review_sources_stay_out_of_public_feed_until_requested(self):
  config={"sources":[{"name":"Revisar","type":"static","review_required":True,"url":"https://review.test/agregados","title":"Agregados","region":"Brasil","area":"Brasil","vehicles":["Truck"],"detail":"Cadastro oficial"}]}
  public=collector.collect(config,fetcher=lambda _:b"ok",now=datetime(2026,8,10,tzinfo=UTC))
  review=collector.collect(config,fetcher=lambda _:b"ok",now=datetime(2026,8,10,tzinfo=UTC),include_review=True)
  self.assertEqual(public["total"],0)
  self.assertEqual(review["total"],1)
 def test_known_company_gets_reputation(self):
  config={"sources":[{"name":"JSL","type":"static","url":"https://jsl.com.br/agregados/","title":"Agregados","region":"Brasil","area":"Brasil","vehicles":["Truck"],"detail":"Cadastro oficial"}]}
  result=collector.collect(config,fetcher=lambda _:b"ok",now=datetime(2026,8,10,tzinfo=UTC))
  job=result["jobs"][0]
  self.assertEqual(job["company"],"JSL")
  self.assertIn("reputation",job)
  self.assertEqual(job["reputation"]["source"],"Reclame Aqui")
  self.assertEqual(job["reputation"]["trust_score"],8)
 def test_unknown_company_has_no_reputation(self):
  config={"sources":[{"name":"Empresa Sem RA","type":"static","url":"https://semra.test/agregados","title":"Agregados","region":"Brasil","area":"Brasil","vehicles":["Truck"],"detail":"Cadastro"}]}
  result=collector.collect(config,fetcher=lambda _:b"ok",now=datetime(2026,8,10,tzinfo=UTC))
  self.assertNotIn("reputation",result["jobs"][0])

if __name__=="__main__":unittest.main()
