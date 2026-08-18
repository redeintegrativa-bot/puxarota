import unittest
import re
from pathlib import Path

ROOT = Path(__file__).parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
JS = (ROOT / "app.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")
AUTH = (ROOT / "supabase-auth.js").read_text(encoding="utf-8")

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

    def test_member_session_has_a_visible_identity_and_logout(self):
        self.assertIn('id="member-card"', HTML)
        self.assertIn('id="member-name"', HTML)
        self.assertIn('id="member-state"', HTML)
        self.assertIn('id="member-logout"', HTML)

    def test_active_member_hides_login_onboarding_copy(self):
        self.assertIn('id="auth-intro"', HTML)
        self.assertIn('id="how-it-works"', HTML)
        self.assertIn('if (intro) intro.hidden = true', AUTH)
        self.assertIn('if (steps) steps.hidden = true', AUTH)

    def test_signup_continues_without_email_confirmation(self):
        self.assertIn('if (!data.session)', AUTH)
        self.assertIn('Conta criada. Complete seu perfil para continuar.', AUTH)
        self.assertNotIn('Confirme o e-mail', AUTH)

    def test_approved_administrator_has_a_visible_management_action(self):
        self.assertIn('id="member-admin" hidden', HTML)
        self.assertIn('account?.account_type === "admin" && account.is_approved === true', AUTH)
        self.assertIn('q("#member-admin").onclick', JS)

    def test_admin_can_see_accounts_without_a_completed_profile(self):
        self.assertIn('id="admin-accounts-list"', HTML)
        self.assertIn('puxarota_accounts").select("user_id,account_type,display_name,is_approved,created_at,last_login_at,last_seen_at")', AUTH)
        self.assertIn('puxarota_accounts").select("user_id,email_snapshot")', AUTH)
        self.assertIn('function reviewAccount(userId, isApproved)', AUTH)
        self.assertIn('data-account-approve', JS)
        self.assertIn('const escapeText', JS)

    def test_admin_has_safe_contact_actions_when_data_exists(self):
        self.assertIn('function contactActions(contact)', JS)
        self.assertIn('data-copy-contact', JS)
        self.assertIn('https://wa.me/', JS)
        self.assertIn('mailto:', JS)
        self.assertIn('E-mail: ${escapeText(account?.email_snapshot', JS)
        self.assertIn('WhatsApp: ${escapeText(r.whatsapp', JS)
        self.assertIn('id="account-recovery"', HTML)

    def test_required_profile_fields_are_not_hidden(self):
        self.assertNotIn('#profile-form label:has(#profile-region)', CSS)
        self.assertNotIn('#profile-form label:has(#profile-vehicle)', CSS)

    def test_vehicle_is_a_single_selectable_tag(self):
        self.assertIn('id="profile-vehicle" type="hidden" required', HTML)
        self.assertIn('data-vehicle="Van"', HTML)
        self.assertIn('data-vehicle="VUC"', HTML)
        self.assertIn('function selectVehicle(vehicle)', JS)
        self.assertIn('button.dataset.vehicle === vehicle', JS)

    def test_profile_offers_suggestions_without_blocking_free_text(self):
        self.assertIn('id="region-options"', HTML)
        self.assertIn('id="availability-options"', HTML)
        self.assertIn('id="cargo-options"', HTML)
        self.assertIn('id="route-options"', HTML)
        self.assertIn('id="profile-region" list="region-options"', HTML)
        self.assertIn('id="profile-cargo" list="cargo-options"', HTML)

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

    def test_public_opportunities_do_not_offer_interest_submission(self):
        self.assertNotIn('id="interest-open"', HTML)
        self.assertNotIn('id="interest-form"', HTML)
        self.assertNotIn('submitInterest?.(j.id', JS)

    def test_public_profile_catalog_has_real_filters(self):
        self.assertIn('id="driver-region-filter"', HTML)
        self.assertIn('id="driver-vehicle-filter"', HTML)
        self.assertIn('id="driver-license-filter"', HTML)
        self.assertIn('id="driver-cargo-filter"', HTML)
        self.assertIn('addEventListener("change", renderDrivers)', JS)
        self.assertIn('publicProfiles.filter', JS)
        self.assertIn('driver-tags', CSS)

    def test_public_profiles_mask_full_name_and_show_tags(self):
        self.assertIn('full.split(/\\s+/)[0]', JS)
        self.assertIn('tag-vehicle', JS)
        self.assertIn('tag-license', JS)
        self.assertIn('tag-cargo', JS)
        self.assertIn('tag-region', JS)
        self.assertIn('driver-avatar', JS)

    def test_professionals_show_next_lesson_summary(self):
        self.assertIn('id="drivers-journey-summary"', HTML)
        self.assertIn("renderDriversJourneySummary", JS)
        self.assertIn("openNextLesson", JS)
        self.assertIn("Logo chegarão novas lições", JS)

    def test_lgpd_migration_returns_only_first_name_from_public_rpc(self):
        migration = (ROOT / "supabase/migrations/202608150001_lgpd_first_name_and_tags.sql").read_text(encoding="utf-8")
        self.assertIn("split_part(coalesce(p.display_name", migration)
        self.assertIn("p.license_category", migration)

    def test_phone_normalization_and_validation_exist(self):
        self.assertIn("normalizeBrPhone", JS)
        self.assertIn("phoneError", JS)
        self.assertIn("maskPhoneInput()", JS)
        self.assertIn("validWhatsApp()", JS)
        self.assertIn("(11) 99999-9999", JS)

    def test_opportunity_review_queue_is_protected(self):
        migration = (ROOT / "supabase/migrations/202608140003_opportunities_and_interests.sql").read_text(encoding="utf-8")
        sync = (ROOT / "scripts/sync_opportunity_review_queue.mjs").read_text(encoding="utf-8")
        self.assertIn('puxarota_opportunities', migration)
        self.assertIn('queue_puxarota_interest_notification', migration)
        self.assertIn('initialStatus: \'pending\'', sync)

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
        self.assertIn("nominatim.openstreetmap.org/reverse", JS)
        self.assertIn("nominatim.openstreetmap.org/search", JS)
        self.assertIn("Atuação nacional", JS)

    def test_cep_geocoding_uses_viacep(self):
        self.assertIn("geocodeCep", JS)
        self.assertIn("viacep.com.br/ws/", JS)
        self.assertIn("/^\d{5}-?\d{3}$/.test(city.trim())", JS)

    def test_position_sorts_by_profile_match(self):
        self.assertIn("profileMatchScore", JS)
        self.assertIn("userProfile", JS)
        self.assertIn("VEHICLE_GROUPS", JS)
        self.assertIn("profileMatchScore(b) - profileMatchScore(a)", JS)

    def test_profile_load_updates_sorting(self):
        self.assertIn('userProfile = { vehicle: profile.vehicle || "", cargo: profile.cargo_preference || "" }', JS)
        self.assertIn("if (pos) sortForPosition()", JS)

    def test_match_tag_rendered_on_card(self):
        self.assertIn('driverTag("tag-match", tagIcon("Combina com seu perfil"), "Perfil", "Combina com seu perfil")', JS)
        self.assertIn(".driver-tags .tag-match{", CSS)

class PublicSignalsTests(unittest.TestCase):
    def test_signals_fetch_uses_public_endpoint_not_private_raw(self):
        self.assertIn("https://monitor-noticias-cyan.vercel.app/api/puxarota-signals", JS)
        self.assertNotIn("raw.githubusercontent.com/redeintegrativa-bot/monitor-noticias", JS)

class AdminOrganizationTests(unittest.TestCase):
    def test_admin_has_tabs_for_each_section(self):
        for tab in ("opportunities", "profiles", "accounts", "history"):
            self.assertIn('data-admin-tab="' + tab + '"', HTML)
            self.assertIn('data-admin-pane="' + tab + '"', HTML)

    def test_admin_tab_counts_exist(self):
        self.assertIn('id="admin-tab-count-opportunities"', HTML)
        self.assertIn('id="admin-tab-count-profiles"', HTML)
        self.assertIn('id="admin-tab-count-accounts"', HTML)

    def test_admin_tabs_switch_panes(self):
        self.assertIn("switchAdminTab", JS)
        self.assertIn('pane.hidden = pane.dataset.adminPane !== tabName', JS)

    def test_opportunities_have_status_filters_and_search(self):
        self.assertIn('id="admin-opportunity-search"', HTML)
        self.assertIn('id="admin-opportunity-chips"', HTML)
        self.assertIn("OPPORTUNITY_STATUSES", JS)
        self.assertIn("adminOpportunityFilter", JS)
        self.assertIn("adminOpportunitySearch", JS)
        self.assertIn("data-opportunity-filter", JS)

    def test_pending_counts_highlight_tab(self):
        self.assertIn("has-pending", JS)
        self.assertIn("counts.pending > 0", JS)

    def test_old_single_column_sections_removed(self):
        self.assertNotIn("admin-accounts-title", HTML)

class TrustBadgeTests(unittest.TestCase):
    def test_card_has_a_trust_placeholder(self):
        self.assertIn('id="trust"', HTML)
        self.assertIn('q("#trust").innerHTML = renderProvenance(j);', JS)

    def test_render_trust_builds_colored_badge(self):
        self.assertIn("renderTrust", JS)
        self.assertIn("trust-high", JS)
        self.assertIn("trust-mid", JS)
        self.assertIn("trust-low", JS)
        self.assertIn("trust-none", JS)
        self.assertIn("trust-badge", JS)

    def test_provenance_badge_distinguishes_ai_and_company(self):
        self.assertIn("renderProvenance", JS)
        self.assertIn('provenance === "company"', JS)
        self.assertIn("Empresa cadastrada no app", JS)
        self.assertIn("Trazida pela IA do PuxaRota", JS)

    def test_admin_opportunities_show_trust_badge(self):
        self.assertIn("renderTrust(item.reputation)", JS)
        self.assertIn("reputationByCompany", JS)
        self.assertIn("withReputation", JS)
        self.assertIn('fetch("reputacao.json"', JS)

    def test_feed_maps_reputation_field(self):
        self.assertIn("reputation: x.reputation", JS)

    def test_trust_badge_css_exists(self):
        self.assertIn(".trust-badge{", CSS)
        self.assertIn(".trust-high{", CSS)
        self.assertIn(".trust-none{", CSS)
        self.assertIn('html[data-theme="dark"] .trust-high', CSS)

class InterestFlowFixTests(unittest.TestCase):
    def test_interest_ui_is_reserved_for_future_company_postings(self):
        self.assertNotIn('q("#interest-open")', JS)
        self.assertNotIn('q("#interest-message")', JS)

    def test_open_profile_uses_live_onboarding_role_selector(self):
        self.assertIn('qa(".onboarding-role-choice").forEach((b) => b.classList.toggle("active", b.dataset.kind === kind));', JS)
        self.assertNotIn('qa(".role-choice")', JS)

class AuthFlowTests(unittest.TestCase):
    def test_auth_reloads_the_account_and_profile_after_a_session(self):
        self.assertIn('db.auth.getUser()', AUTH)
        self.assertIn('profileFor(db, user.id)', AUTH)
        self.assertIn('showMember(user, account, profile)', AUTH)
        self.assertIn('onAuthStateChange', AUTH)

    def test_profile_save_uses_supabase_without_whatsapp_fallback(self):
        profile_handler = JS.split('q("#profile-form").onsubmit', 1)[1].split('window.addEventListener("puxarota:auth"', 1)[0]
        self.assertIn('saveProfile', profile_handler)
        self.assertNotIn('window.open(', profile_handler)

    def test_admin_does_not_keep_a_fake_local_dashboard(self):
        self.assertNotIn('puxarota-admin-records', JS)
        self.assertNotIn('id="admin-form"', HTML)
        self.assertIn('renderRemoteAdminProfiles', JS)

    def test_location_attempts_to_fill_the_postal_code(self):
        self.assertIn('reversePositionDetails', JS)
        self.assertIn('postalCode: address.postcode', JS)
        self.assertIn('q("#profile-cep").value = details.postalCode', JS)

    def test_filled_profile_hides_form_and_shows_summary(self):
        self.assertIn("if (details) details.hidden = Boolean(profile)", AUTH)
        self.assertIn('id="member-summary"', HTML)
        self.assertIn("summary.hidden = !profile || parts.length === 0", AUTH)

    def test_edit_button_reopens_the_form(self):
        self.assertIn('q("#member-edit")?.addEventListener("click", () => { const details = q("#profile-details"); if (details) details.hidden = false', AUTH)
        self.assertIn('q("#profile-name-new")?.focus()', AUTH)

    def test_empty_profile_shows_form_to_complete(self):
        self.assertIn('setText("#profile-data-title", profile ? "Editar dados" : "Agora, vamos completar seu perfil")', AUTH)

if __name__ == "__main__":
    unittest.main()
