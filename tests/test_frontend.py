import unittest
from pathlib import Path

HTML = (Path(__file__).parents[1] / "index.html").read_text(encoding="utf-8")

class FrontendInitialStateTests(unittest.TestCase):
    def test_modal_is_natively_hidden_on_first_paint(self):
        self.assertIn('class="overlay hidden" id="modal" hidden', HTML)
        self.assertIn('[hidden]{display:none!important}', HTML)

    def test_only_jobs_panel_is_visible_initially(self):
        self.assertIn('class="screen active" data-panel="jobs"', HTML)
        for panel in ("route", "credits", "truck"):
            self.assertIn(f'class="screen" data-panel="{panel}" hidden', HTML)

    def test_navigation_explicitly_controls_hidden_state(self):
        self.assertIn("qa('.screen').forEach(x=>x.hidden=true)", HTML)
        self.assertIn("panel.hidden=false", HTML)

    def test_profile_modal_opens_only_from_interest_action(self):
        self.assertIn("q('#interest').onclick=()=>{q('#modal').hidden=false", HTML)

    def test_overlay_css_is_complete(self):
        self.assertNotIn(".overlay{position:fixed;inset:0;z-index\n", HTML)
        self.assertIn(".overlay{position:fixed;inset:0;z-index:5;", HTML)
        self.assertIn(".sheet{width:min(450px,100%);", HTML)
        self.assertIn(".hidden{display:none!important}", HTML)

    def test_card_remains_in_document_flow(self):
        self.assertIn(".deck{min-height:0}.job{position:relative}", HTML)

if __name__ == "__main__":
    unittest.main()
