from pathlib import Path

target = Path(__file__).parent / "radio.js"
text = target.read_text(encoding="utf-8")
text = text.replace(
    '    const stories = state.items.filter((item) => item.kind === "story");\n    const daily = state.items.filter((item) => item.kind === "road_life" || item.kind === "daily");',
    '    const stories = state.items.filter((item) => item.kind === "story" && item.id !== featured.id);\n    const daily = state.items.filter((item) => (item.kind === "road_life" || item.kind === "daily") && item.id !== featured.id);\n    const featuredGroup = featured.kind === "daily" ? "road_life" : featured.kind;'
)
text = text.replace(
    '<section class="radio-featured">',
    '<section class="radio-featured" data-radio-featured="${featured.id}" data-radio-featured-kind="${featuredGroup}">',
    1,
)
text = text.replace(
    '<div><span class="eyebrow">NO AR HOJE</span>',
    '<div><span class="eyebrow">${featured.featured_today ? "NO AR HOJE" : "EM DESTAQUE"}</span>',
    1,
)
text = text.replace(
    '<section class="radio-block" data-radio-group="story" ${stories.length ? "" : "hidden"}>',
    '<section class="radio-block" data-radio-group="story" data-radio-count="${stories.length}" ${stories.length ? "" : "hidden"}>',
    1,
)
text = text.replace(
    '<section class="radio-block" data-radio-group="road_life" ${daily.length ? "" : "hidden"}>',
    '<section class="radio-block" data-radio-group="road_life" data-radio-count="${daily.length}" ${daily.length ? "" : "hidden"}>',
    1,
)
old = '''      qa("[data-radio-group]").forEach((group) => {
        if (value === "all") group.hidden = false;
        else if (value === "saved") {
          group.hidden = false;
          qa(".radio-card", group).forEach((card) => card.hidden = !state.saves.has(card.dataset.radioId));
        } else group.hidden = group.dataset.radioGroup !== value;
      });
      if (value !== "saved") qa(".radio-card").forEach((card) => card.hidden = false);'''
new = '''      const featured = q("[data-radio-featured]");
      if (featured) {
        if (value === "all") featured.hidden = false;
        else if (value === "saved") featured.hidden = !state.saves.has(featured.dataset.radioFeatured);
        else featured.hidden = featured.dataset.radioFeaturedKind !== value;
      }
      qa("[data-radio-group]").forEach((group) => {
        const hasItems = Number(group.dataset.radioCount) > 0;
        if (value === "all") group.hidden = !hasItems;
        else if (value === "saved") {
          qa(".radio-card", group).forEach((card) => { card.hidden = !state.saves.has(card.dataset.radioId); });
          group.hidden = !hasItems || qa(".radio-card", group).every((card) => card.hidden);
        } else group.hidden = !hasItems || group.dataset.radioGroup !== value;
      });
      if (value !== "saved") qa(".radio-card").forEach((card) => { card.hidden = false; });'''
assert old in text
target.write_text(text.replace(old, new, 1), encoding="utf-8")
