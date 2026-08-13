import unittest
import re
from pathlib import Path

ROOT = Path(__file__).parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
JS = (ROOT / "app.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")

class FrontendStructureTests(unittest.TestCase):
    def test_separated_into_three_files(self):
        self.assertIn('<link rel="stylesheet" href="styles.css">', HTML)
        self.assertIn('<script src="app.js"></script>', HTML)

    def test_official_logo_is_used_in_header_and_favicon(self):
        self.assertIn('<img class="logo" src="logo-1.jpg" alt="PuxaRota">', HTML)
        self.assertIn('<link rel="icon" type="image/jpeg" href="logo-1.jpg">', HTML)
        self.assertTrue((ROOT / "logo-1.jpg").exists())
        self.assertIn("width:68px;height:68px", CSS)
        self.assertIn("border:0;border-radius:50%", CSS)

    def test_no_large_inline_style_or_script(self):
        self.assertNotRegex(HTML, r"<style>.*?:root", re.S)
        self.assertNotRegex(HTML, r"<script>", re.S)

    def test_primary_menus_are_explicit(self):
        self.assertEqual(HTML.count('data-screen="'), 5)
        self.assertIn('data-screen="jobs"', HTML)
        self.assertIn('data-screen="saves"', HTML)
        self.assertIn('data-screen="profile"', HTML)
        self.assertIn('data-screen="drivers"', HTML)

    def test_simulated_screens_removed(self):
        for removed in ("data-panel=\"route\"", "data-panel=\"credits\"", "data-panel=\"truck\"", "id=\"modal\""):
            self.assertNotIn(removed, HTML)
        self.assertNotIn("Enviar meu perfil", HTML)
        self.assertNotIn("Abrir conversa", HTML)

    def test_initial_state_uses_native_hidden(self):
        self.assertIn('class="screen active" data-panel="jobs"', HTML)
        self.assertIn('data-panel="saves" id="screen-saves" hidden', HTML)
        self.assertIn('[hidden]{display:none!important}', CSS)

class FrontendButtonTests(unittest.TestCase):
    def setUp(self):
        self.buttons = {
            "locate": "navigator.geolocation.getCurrentPosition",
            "theme": 'q("#theme").onclick',
            "city": 'q("#city").onclick',
            "skip": 'q("#skip").onclick',
            "save": 'q("#save").onclick',
            "openAction": 'id="openAction"',
            "scope": 'q("#scope").onclick',
            "nav": 'qa(".nav button")',
        }

    def test_every_visible_button_has_real_handler_or_opens_source(self):
        for name, marker in self.buttons.items():
            self.assertTrue(marker in (HTML + JS) or marker in JS, f"botão {name} sem função real")

    def test_save_persists_to_localStorage(self):
        self.assertIn('localStorage.setItem(KEY', JS)
        self.assertIn('localStorage.getItem(KEY', JS)

    def test_theme_follows_device_and_persists_user_choice(self):
        self.assertIn('id="theme"', HTML)
        self.assertIn('prefers-color-scheme: dark', JS)
        self.assertIn('puxarota.theme.v1', JS)
        self.assertIn('html[data-theme="dark"]', CSS)

    def test_primary_action_opens_source_not_submits(self):
        self.assertNotIn('id="openCard"', HTML)
        self.assertEqual(HTML.count('id="openAction"'), 1)
        self.assertNotIn("sendBeacon", JS)
        self.assertNotIn("FormData", JS)

    def test_whatsapp_supports_users_and_new_companies_without_duplicate_buttons(self):
        self.assertIn('id="supportLink"', HTML)
        self.assertEqual(HTML.count("wa.me/5511990163686"), 1)
        self.assertIn("FALE COM A REDE INTEGRATIVA", HTML)
        self.assertIn("responsável pelo PuxaRota", HTML)
        self.assertIn("novas transportadoras", HTML)
        self.assertIn("motoristas e agregados", HTML)

    def test_card_remains_in_document_flow(self):
        self.assertIn(".deck{min-height:0}.job{position:relative}", CSS)

    def test_overlay_and_modal_css_removed(self):
        self.assertNotIn(".overlay", CSS)
        self.assertNotIn(".sheet", CSS)

class FeedMappingTests(unittest.TestCase):
    def test_feed_maps_confidence_to_verified(self):
        self.assertIn('x.type === "official_registration"', JS)

    def test_saved_list_renders_open_and_remove(self):
        self.assertIn('data-unsave', JS)
        self.assertIn('target="_blank" rel="noopener nofollow"', JS)

    def test_null_coordinates_do_not_break_distance(self):
        self.assertIn('(pos && j.lat && j.lng)', JS)

    def test_location_actually_sorts_and_resolves_place(self):
        self.assertIn("sortForPosition", JS)
        self.assertIn("reverse-geocode-client", JS)
        self.assertIn("nominatim.openstreetmap.org/search", JS)
        self.assertIn("Atuação nacional", JS)

if __name__ == "__main__":
    unittest.main()
