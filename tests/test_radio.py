import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class IdCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])


class RadioModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "estudo.html").read_text(encoding="utf-8")
        cls.radio = (ROOT / "radio.js").read_text(encoding="utf-8")
        cls.feedback = (ROOT / "radio-feedback.js").read_text(encoding="utf-8")

    def test_radio_view_admin_and_player_exist(self):
        for expected in ('data-view="radio"', 'data-admin-tab="radio"', 'id="radio-player"', 'id="radio-content-form"'):
            self.assertIn(expected, self.html)

    def test_short_admin_form_supports_drive_cover_and_episode(self):
        for expected in ("radio-drive-url", "radio-cover-file", "radio-season-title", "radio-episode-number", "radio-access"):
            self.assertIn(f'id="{expected}"', self.html)

    def test_free_and_subscriber_rules_are_server_backed(self):
        migration = (ROOT / "supabase/migrations/202608200002_radio_external_sources.sql").read_text(encoding="utf-8")
        self.assertIn("get_puxarota_audio_playback", migration)
        self.assertIn("license_status", migration)
        self.assertIn("subscription_status", migration)
        self.assertIn("get_puxarota_audio_playback", self.radio)
        self.assertIn('view === "radio"', self.radio)
        self.assertIn("audio.pause()", self.radio)

    def test_feedback_suggestions_and_replies_exist(self):
        for value in ("theme_suggestion", "problem", "improvement", "admin_reply"):
            self.assertIn(value, self.feedback)
        self.assertIn('data-contribution-open', self.html)
        self.assertIn('data-contribution="theme"', self.html)
        self.assertEqual(1, self.html.count('data-contribution-open'))
        self.assertIn('id="reply-dialog"', self.html)

    def test_html_ids_are_unique(self):
        parser = IdCollector()
        parser.feed(self.html)
        duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
        self.assertEqual([], duplicates)

    def test_no_period_on_radio_buttons(self):
        labels = re.findall(r"<button[^>]*>([^<]+)</button>", self.html)
        radio_labels = [label.strip() for label in labels if label.strip()]
        self.assertFalse([label for label in radio_labels if label.endswith(".")])


if __name__ == "__main__":
    unittest.main()
