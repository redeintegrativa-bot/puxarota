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

    def test_ripio_journey_has_seven_lessons_and_article(self):
        self.assertIn('id: "beneficios-ripio"', JS)
        self.assertIn("crypto-para-iniciantes-2026", JS)
        self.assertIn("ricardo_m_76", JS)
        ripio = JS.split('id: "beneficios-ripio"', 1)[1].split('id: "comunidade"', 1)[0]
        self.assertEqual(ripio.count("eyebrow:"), 7)
        self.assertIn("Cartão pré-pago: o que é", ripio)
        self.assertIn("Cripto e USDT na prática", ripio)
        self.assertIn("Parceiros e como usar o cashback", ripio)
        self.assertIn("Cashback maior em USDT", ripio)

    def test_new_routes_security_and_finance_are_playable(self):
        self.assertIn('id: "seguranca-digital"', JS)
        self.assertIn('id: "financas-estrada"', JS)
        self.assertIn('id: "guarda-estrada"', JS)
        self.assertIn('id: "caixa-estrada"', JS)
        security = JS.split('id: "seguranca-digital"', 1)[1].split('id: "financas-estrada"', 1)[0]
        finance = JS.split('id: "financas-estrada"', 1)[1].split('id: "empresa-vaga-confiavel"', 1)[0]
        self.assertEqual(security.count("eyebrow:"), 5)
        self.assertEqual(finance.count("eyebrow:"), 4)
        self.assertIn("checkpoint:", security)
        self.assertIn("bullets:", security)
        self.assertNotIn('title: "Segurança Digital"', JS.split("FUTURE_ROUTES", 1)[1])
        self.assertNotIn('title: "Finanças da Estrada"', JS.split("FUTURE_ROUTES", 1)[1])

    def test_next_event_section_with_calendar_and_facebook(self):
        self.assertIn("NEXT_EVENT", JS)
        self.assertIn("EVENTOS DA COMUNIDADE", JS)
        self.assertIn("Próximo encontro", JS)
        self.assertIn("eventSection()", JS)
        self.assertIn("googleCalendarLink(", JS)
        self.assertIn("calendar.google.com/calendar/render", JS)
        self.assertIn("Grupo no Facebook", JS)
        self.assertIn("redeintegrativafretes", JS)
        self.assertIn("aria-disabled", JS)
        self.assertIn(".next-event", CSS)
        self.assertIn(".event-card", CSS)
        self.assertIn(".event-actions", CSS)
        self.assertIn("html[data-theme=\"dark\"] .next-event", CSS)

    def test_gamification_xp_streak_daily_mission_exist(self):
        self.assertIn("state.xp", JS)
        self.assertIn("state.streak", JS)
        self.assertIn("state.lastActiveDay", JS)
        self.assertIn("class=\"daily-mission", JS)
        self.assertIn("gainXp(", JS)
        self.assertIn("touchStreak()", JS)
        self.assertIn("xpLevel()", JS)
        self.assertIn("dailyMission()", JS)
        self.assertIn("XP_LEVELS", JS)
        self.assertIn("Começar (+15 XP)", JS)
        self.assertIn("MISSÃO DO DIA", JS)
        self.assertIn("SEQUÊNCIA", JS)
        self.assertIn("journey-stats", CSS)
        self.assertIn("daily-mission", CSS)
        self.assertIn("journey-profile-meta", CSS)
        self.assertIn("xp: progress?.xp || 0", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertIn("streak: progress?.streak || 0", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertIn("missionDay: progress?.missionDay || null", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))

    def test_teach_phase_before_checkpoint(self):
        self.assertIn("function renderTeach", JS)
        self.assertIn("AULINHA", JS)
        self.assertIn("data-next-learn", JS)
        self.assertIn("Ir para o desafio", JS)
        self.assertIn("lesson-teach", CSS)
        self.assertIn("teach-dots", CSS)
        self.assertIn('lesson.learn && !seen.includes(activeLesson)', JS)
        self.assertIn("progress.seen", JS)
        ripio = JS.split('id: "beneficios-ripio"', 1)[1].split('id: "comunidade"', 1)[0]
        self.assertEqual(ripio.count("learn: ["), 5)
        self.assertIn("Cartão pré-pago", ripio)
        self.assertIn("Cashback maior em USDT", ripio)
        self.assertIn("USDT é uma cripto estável", ripio)
        self.assertIn("LIÇÃO 7 · FINAL", ripio)

    def test_lesson_navigation_and_revisit_exist(self):
        self.assertNotIn("data-prev-lesson", JS)
        self.assertNotIn("data-next-lesson", JS)
        self.assertIn("lesson-count", CSS)
        self.assertIn('<span class="lesson-count"><b>${activeLesson + 1}/${route.lessons.length}</b></span>', JS)
        self.assertIn('class="lesson-controls"><button class="lesson-done"', JS)
        self.assertIn('activeLesson = progress.complete ? 0 : Math.min(progress.step, activeRoute.lessons.length - 1)', JS)
        self.assertIn("completeLesson", JS)
        self.assertIn("if (progress.complete) {", JS)

    def test_routes_without_checkpoint_show_content_after_teach(self):
        self.assertIn('"Ver conteúdo"', JS)
        self.assertIn("renderLesson();", JS.split("data-next-learn", 1)[1])
        self.assertNotIn("else completeLesson();", JS.split("data-next-learn", 1)[1])
        self.assertIn('learn: ["A Rede Integrativa conecta motoristas, agregados e transportadoras."', JS)
        self.assertIn('learn: ["Documentos são dados sensíveis: envie só depois de validar a empresa."', JS)
        self.assertIn('learn: ["Reserva é o dinheiro que fica guardado para os imprevistos da estrada."', JS)
        self.assertIn('learn: ["Compartilhar ajuda outro profissional a descobrir a Rede."', JS)

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
        self.assertTrue((ROOT / "faro.png").exists())

    def test_progress_badges_and_events_persist(self):
        self.assertIn('Retroix.storage("puxarota-routes")', JS)
        self.assertIn("state.badges", JS)
        self.assertIn("state.events", JS)
        self.assertIn("route_completed", JS)
        self.assertIn("loadRouteProgress", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertIn("saveRouteProgress", (ROOT / "supabase-auth.js").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "supabase/migrations/202608140004_route_progress_and_public_badges.sql").exists())
        self.assertTrue((ROOT / "supabase/migrations/202608140005_user_history_hires_reviews.sql").exists())
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

    def test_camera_shots_vary_scene_per_lesson(self):
        self.assertIn('const SCENE_SHOTS = ["wide", "close", "side", "high", "travel"]', JS)
        self.assertIn('shot-${shot}', JS)
        self.assertIn("activeLesson * 2 + learnStep", JS)
        for shot in ["wide", "close", "side", "high", "travel"]:
            self.assertIn(f'.lesson-scene.shot-{shot}', CSS)

    def test_teach_phase_cycles_mascot_poses(self):
        self.assertIn('const pool = ["welcome", "teach", "happy", "focus", "selo", "next", "hint"]', JS)
        self.assertIn("activeLesson % pool.length", JS)

    def test_next_lesson_can_be_opened_from_other_screens(self):
        self.assertIn("function nextLesson()", JS)
        self.assertIn("function openNextLesson()", JS)
        self.assertIn("nextLesson, openNextLesson", JS)


if __name__ == "__main__":
    unittest.main()
