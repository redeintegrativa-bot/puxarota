import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StoryModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "estudo.html").read_text(encoding="utf-8")
        cls.radio = (ROOT / "radio.js").read_text(encoding="utf-8")
        cls.stories = (ROOT / "stories.js").read_text(encoding="utf-8")
        cls.migration = (ROOT / "supabase/migrations/202608200006_written_and_community_stories.sql").read_text(encoding="utf-8")

    def test_official_story_uses_authorized_rpc(self):
        self.assertIn("get_puxarota_written_story", self.migration)
        self.assertIn("get_puxarota_written_story", self.stories)
        self.assertIn("has_written_story", self.radio)

    def test_community_stories_require_moderation(self):
        self.assertIn("status = 'pending'", self.migration)
        self.assertIn("public_visible = false", self.migration)
        self.assertIn("status === \"approved\"", self.stories)

    def test_submission_consent_and_admin_review_exist(self):
        for expected in ("community-story-form", "community-consent", "story-review-form", 'data-admin-tab="stories"'):
            self.assertIn(expected, self.html)

    def test_reports_and_withdrawal_exist(self):
        self.assertIn("puxarota_story_reports", self.migration)
        self.assertIn("withdraw_community_story", self.migration)
        self.assertIn("data-story-report", self.stories)

    def test_no_direct_publication_by_member(self):
        self.assertNotIn('status: "approved", public_visible: true', self.stories)
        self.assertIn('status: "pending", public_visible: false', self.stories)


if __name__ == "__main__":
    unittest.main()
