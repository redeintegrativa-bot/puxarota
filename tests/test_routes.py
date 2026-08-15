import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
JS = (ROOT / "routes.js").read_text(encoding="utf-8")
CSS = (ROOT / "routes.css").read_text(encoding="utf-8")


class GamifiedRoutesTests(unittest.TestCase):
    def test_routes_engine_and_retroix_are_loaded(self):
        self.assertIn('id="routes-app"', HTML)
        self.assertIn('src="vendor/retroix.js"', HTML)
        self.assertIn('src="routes.js"', HTML)
        self.assertIn('href="routes.css"', HTML)

    def test_ripio_journey_has_five_lessons_and_article(self):
        self.assertIn('id: "beneficios-ripio"', JS)
        self.assertIn("crypto-para-iniciantes-2026", JS)
        self.assertIn("ricardo_m_76", JS)
        ripio = JS.split('id: "beneficios-ripio"', 1)[1].split('id: "comunidade"', 1)[0]
        self.assertEqual(ripio.count("eyebrow:"), 5)

    def test_mobile_interactions_and_feedback_exist(self):
        self.assertIn("data-answer", JS)
        self.assertIn("navigator.vibrate", JS)
        self.assertIn('audio.jingle("levelup")', JS)
        self.assertIn("prefers-reduced-motion", CSS)
        self.assertIn("rupi-next.png", JS)
        self.assertIn("rupi-hint.png", JS)
        self.assertIn("rupi-badge.png", JS)
        self.assertIn("faro.png", JS)
        self.assertIn("carcara-scout.png", JS)
        self.assertIn("carcara-flight.png", JS)
        self.assertTrue((ROOT / "rupi-mascot.png").exists())

    def test_progress_badges_and_events_persist(self):
        self.assertIn('Retroix.storage("puxarota-routes")', JS)
        self.assertIn("state.badges", JS)
        self.assertIn("state.events", JS)
        self.assertIn("route_completed", JS)
        self.assertIn("loadRouteProgress", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertIn("saveRouteProgress", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "supabase/migrations/20260814_route_progress_and_public_badges.sql").exists())
        self.assertTrue((ROOT / "supabase/migrations/20260814_user_history_hires_reviews.sql").exists())
        self.assertIn('audience: "company"', JS)
        self.assertIn("availableRoutes()", JS)

    def test_profile_contains_journey_collection(self):
        self.assertIn('id="journey-profile"', HTML)
        self.assertIn("Minha Jornada".upper(), JS.upper())
        self.assertIn("profile-badges", CSS)

    def test_routes_require_authenticated_session(self):
        self.assertIn('window.addEventListener("puxarota:auth"', JS)
        self.assertIn("authenticated ? renderHub() : renderLocked()", JS)
        self.assertIn("Criar meu acesso grátis", JS)
        self.assertIn("routes-gate", CSS)


if __name__ == "__main__":
    unittest.main()
