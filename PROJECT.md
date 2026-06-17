# RoGin -- Gin Recipe Builder

A mobile-friendly web app for home gin makers who use the advanced botanical infusion method, helping them build recipes, log batches, and get AI-powered recipe suggestions.

---

## Business Purpose

RoGin replaces a manually maintained spreadsheet that has been used to track homemade gin recipes since 2022. It turns that static record into a living tool that can scale recipes automatically, remember what worked (and what did not), and use artificial intelligence to suggest new recipes based on the maker's history and taste preferences. The app makes the hands-on mixing session smoother by running on a phone in the kitchen, showing real-time amounts as ingredients are adjusted.

---

## Target Users

- **Primary user:** A single experienced home gin maker based in Israel who uses the "advanced" infusion method (each botanical infused separately in vodka, then blended).
- **Secondary audience:** Friends or newcomers who want to try a simpler, beginner-friendly single-jar infusion method. The app includes a standalone beginner guide for this purpose.
- **Future consideration:** The database is structured to support multiple users if the app is ever opened up beyond the original creator.

---

## Features

### Recipe Builder
- Start a new recipe by picking a previous batch or an AI-generated draft from the Batch Log, or by opening the AI Distiller wizard to generate a fresh draft. There is no separate "enter your Juniper amount" screen -- the editor opens with the source recipe's Juniper amount already loaded.
- Adjust any ingredient amount in real time while tasting during a mixing session. The Juniper amount is editable directly in the editor -- changing it rescales all other botanicals proportionally and live.
- Ingredients are sorted by amount (largest first, with Juniper always at the top) so the most significant botanicals are immediately visible.
- All amounts are shown in millilitres, rounded to the nearest 5 ml for practical measuring.
- Add new botanicals on the fly -- either manually through the recipe editor or when the AI suggests something you have not used before. New botanicals are saved to the database for future use.
- Save the finished recipe to the Batch Log with a name, date, and tasting notes.

### AI Recipe Wizard ("RoGin AI Distiller")
- A conversational assistant powered by the Claude AI that acts as an experienced gin distiller.
- Opens straight into the chat -- the wizard no longer asks for a Juniper amount, because it works in ratios rather than millilitres. The user only commits to a real Juniper quantity later, when they actually mix the recipe.
- Asks thoughtful, open-ended questions about your flavour preferences, the occasion, and what you liked or disliked in past batches -- not a rigid checklist.
- Reviews your entire batch history and tasting notes before making suggestions, so it avoids repeating past mistakes and builds on successes.
- Generates a concrete recipe as a set of botanical ratios with a short description of the recipe's character.
- The AI's suggestion is saved as a **draft** in the Batch Log via a single "Save as draft" action. There is no longer a separate "Use this recipe" handoff -- the wizard's job ends at saving the draft. When ready to mix, the user opens the draft from the log and the Recipe Builder rescales it to their real Juniper amount.
- Can recommend new botanicals the user has not tried, including Hebrew names so they can be found at Israeli spice markets. Any new botanicals the AI suggests are saved to the database so they are available in future recipes.

### Batch Log
- A chronological record of every gin-making session: date, recipe name, ingredient amounts, total volume, and free-text tasting notes.
- Pre-loaded with ten historical batches (July 2022 through September 2025) and two named recipes from the original spreadsheet.
- Holds both **real batches** (gin you have actually mixed) and **drafts** (AI suggestions you have saved for later but not yet mixed). Drafts are visually marked with a "Draft" pill and show the AI's description instead of tasting notes. They omit a total volume because their amounts are stored against a placeholder Juniper quantity that gets rescaled when the user loads the draft into the builder.
- Tap any entry to see full details; select any batch or draft as a starting point for a new recipe.
- Tasting notes can be edited after the fact (for drafts, the field shows the AI's recipe description and is editable in the same way).
- Either a batch or a draft can be deleted from the log with an inline confirmation step.

### Beginner Guide
- A standalone reference page with a step-by-step method for making simple single-jar gin using vodka and botanicals.
- Includes an ingredient shopping list with English and Hebrew names.
- Offers flavour variation tips (e.g., "swap rosemary for thyme for earthier notes") to help newcomers experiment.
- Not connected to the batch log or recipe builder -- purely educational.

### Ingredient Distilling Manager (planned)
- A feature to manage the distilling and infusion of individual ingredients -- the upstream step before a recipe can be built.
- Track which botanicals are currently infusing in vodka, when each jar was started, and when it will be ready to use.
- Record the quantity available for each infusion so the Recipe Builder knows what is actually on hand.
- Surface alerts when an infusion is ready, nearing readiness, or running low.
- Scope, UI, and data model still to be defined.

---

## UX Considerations

- **Mobile-first design.** The primary use case is standing in a kitchen during a mixing session, using a phone one-handed. Large tap targets, readable font sizes, and no horizontal scrolling on small screens.
- **Warm, earthy visual style.** Beige and cream backgrounds, dark grey text, deep burgundy accent colour. Clean and subtle -- no neon effects or dark-mode glows. Consistent with the user's other app (TDAI cocktail app).
- **Real-time feedback.** Ingredient amounts update instantly as values are changed, so the user can see totals without waiting or pressing a button.
- **Practical rounding.** All displayed amounts snap to the nearest 5 ml because precise measurement below 5 ml is impractical with kitchen equipment.
- **Bilingual ingredient names.** Botanicals are shown with both English and Hebrew names throughout the app, since the user shops at Israeli markets.

---

## Key Architecture Decisions

- **Single-user by default, multi-user ready.** There is no login system today. The app assumes one user. However, the database includes a user identity field on all relevant records so that login and multi-user support can be added later without restructuring the data.
- **Recipes stored as ratios, displayed as millilitres.** Internally, each botanical's proportion is stored relative to the Juniper base (which equals 1.0). The app converts these ratios into concrete millilitre amounts for display, based on whatever Juniper quantity the user enters. This means the same recipe works whether you have 500 ml or 2000 ml of Juniper infusion.
- **AI integration via server-side API.** The AI wizard runs through a server-side endpoint that calls the Claude API. The user's API key never reaches the browser. A rate limiter (20 requests per minute) prevents runaway costs.
- **Seed data on first run.** Historical batch data from the original spreadsheet is imported into the database automatically, so the app is immediately useful from day one.
- **Beginner section is independent.** The beginner guide is static content with no connection to the recipe builder or batch log, keeping it simple for newcomers.
- **Drafts are Batch rows with an `isDraft` flag, not a separate model.** When the AI Distiller suggests a recipe, it is saved into the same `Batch` table as a real batch, just with `isDraft = true`. *Why:* the Batch Log is the single canonical "list of recipes I care about", and drafts conceptually belong there alongside real batches — separate tables would have forced parallel UI, two separate APIs, and two separate "use as starting point" paths. Storing drafts at a 500 ml placeholder Juniper amount means the existing rescale logic in the Recipe Builder works unchanged when a draft is loaded.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Application framework | Next.js (with React and TypeScript) |
| Styling | Tailwind CSS (mobile-first approach) |
| Database | SQLite for local development; Turso (hosted SQLite) for production |
| Data access layer | Prisma (an intermediary that handles all database communication) |
| AI engine | Claude API via the Anthropic software toolkit |
| Hosting | Netlify (cloud hosting platform) |
| Authentication | None currently; planned for future (Google sign-in) |

---

## Security Considerations

- **API key protection.** The Claude AI key is stored as a server-side environment variable and is never sent to the user's browser.
- **Rate limiting.** The AI wizard endpoint limits requests to 20 per minute to prevent excessive API costs.
- **Input validation.** Numeric fields reject non-numeric input. Text fields (recipe names, tasting notes) are length-limited. All database queries go through Prisma, which automatically protects against injection attacks.
- **No sensitive personal data.** The app stores only recipe and batch data -- no passwords, payment information, or personal identifiers.
- **Dependency auditing.** The project uses a lock file for deterministic builds, and standard security auditing tools can be run before deployment.
- **Error handling.** API error responses are designed not to expose internal details like file paths or stack traces.

---

## Performance Requirements

- Recipe builder input changes should feel instantaneous (under 100 milliseconds response time).
- Batch log should load within one second, even with 50 or more entries.
- AI wizard responses should arrive within a few seconds (the system uses the Claude API, so response times depend partly on that external service).
- Pages should load within three seconds on a mobile 4G connection.
- SQLite/Turso is more than adequate for the single-user workload; no complex database scaling is needed.

---

## Dependencies & Risks

- **Claude API availability.** The AI wizard depends on Anthropic's Claude API. If the service is down or slow, the wizard feature will not work. The rest of the app (recipe builder, batch log, beginner guide) is fully functional without AI.
- **Claude API cost.** Each wizard conversation involves multiple API calls. The rate limiter mitigates runaway costs, but usage should be monitored. Prompt caching is now enabled for the static portion of the wizard system prompt, reducing per-call token cost by roughly 57% on repeat calls within a 5-minute window.
- **Single hosting provider.** The app is deployed on Netlify with a Turso database. An outage at either provider would take the app offline.
- **No automated testing.** The project description includes a detailed test plan, but no automated test suite has been implemented yet. Testing is currently manual.
- **Single-user assumption.** If the app is shared with others before authentication is added, all users would read and write the same data.

---

## Current Status

The application is **built and deployed**. All core features described above are functional:

- Recipe Builder with Juniper-driven scaling and real-time editing -- complete.
- AI Distiller wizard with Claude integration and batch history awareness -- complete.
- Batch Log with historical seed data, expandable detail view, and editable tasting notes -- complete.
- Beginner Guide with shopping list, method, and flavour variations -- complete.
- Ingredient Distilling Manager -- planned, not yet built.
- Deployed to Netlify with Turso hosted database.

The project has nine commits, progressing from initial scaffolding through feature build-out to deployment configuration and polish. The most recent work (April 2026) made the Juniper amount editable directly in the recipe editor with automatic rescaling, updated the app icon and favicon to a custom tumbler glass design, and refined several deployment details for the Netlify and Turso production environment.

The AI wizard now uses Anthropic prompt caching. The static portion of the system prompt (the distiller persona, botanical library, recipe format rules, and past-batch observations) is cached between requests; only the dynamic batch history is re-processed on each call. On a first call the cache is written (1,314 tokens, ~1.25× cost) and subsequent calls within the 5-minute TTL read those tokens from cache at roughly 10% of full cost, translating to ~57% cheaper per cached call and ~1-2 seconds faster time-to-first-token. Usage figures are logged server-side on every wizard call so cache hit rates remain observable.

In May 2026 the builder underwent a UI improvement pass driven by an evaluation of two design skills (`/emil-design-eng` and `/impeccable`) — both retired afterwards with their substantive findings promoted into the shared `/ui-consistency` skill. The pass landed on RoGin: tinted-warm neutrals (no pure white/black), focus-visible rings on every interactive element, `:active` press-feedback scale, hover effects gated for touch devices, a `prefers-reduced-motion` block, a semantic `<table>` for the AI-generated recipe rows, `aria-live` on the chat region, skeleton placeholders in place of "Loading…" text, and a fix to the wizard route's previously-redundant re-asking for the Juniper amount. Pure CSS and semantic HTML — no new dependencies.

Later in May 2026 the wizard and Batch Log workflow were tightened. The AI Distiller no longer asks for a Juniper amount at all — it works purely in ratios, since absolute millilitres only matter at mixing time. Its only exit is now a "Save as draft" action that writes the suggestion into the Batch Log as a draft entry (a Batch row with a new `isDraft` flag), pre-filled with the AI's recipe description as its notes. The log distinguishes drafts with a pill, shows the AI description instead of tasting notes, hides the misleading "Total Volume" line (draft amounts use a 500 ml Juniper placeholder), and switches the action button to "Use this Draft" which loads the draft into the Recipe Builder for rescaling and saving as a real batch. Either a batch or a draft can be deleted from the log with an inline confirmation. A small `/api/drafts` endpoint accepts the wizard's ratio-based shape directly and auto-creates any unknown botanicals before saving. The schema gained `Batch.isDraft Boolean @default(false)`; the column was applied to Turso via a single `ALTER TABLE` (the production database is shared with TDAI but the two apps' tables never overlap).

Immediately after, the Recipe Builder's old "How much Juniper?" entry screen was removed. The Juniper amount has been editable directly inside the recipe editor (with live rescaling) since an earlier commit, so the upfront screen was redundant and was also causing a brief flash on screens that loaded a batch or draft from the log via `?from=`. The builder is now a clean two-step flow: pick a starting point, then edit and save. When a batch or draft is loaded, the editor opens with that source recipe's own Juniper amount as the starting value, which the user can adjust live.

---

## Open Questions

- **Automated testing.** A detailed test plan exists in the project description but has not been implemented. When and how should automated tests be added?
- **Authentication timeline.** The database is ready for multi-user support, but no login system exists. When is this needed, and should it use Google sign-in as planned?
- **Cost monitoring.** How will Claude API usage and costs be tracked over time? Are there budget thresholds that should trigger alerts?
- **Backup strategy.** What is the backup and recovery plan for the Turso production database?
- **Future features.** The project description lists several enhancements not yet in scope: botanical inventory tracking, batch comparison views, insights and charts, and recipe export/sharing. The newly added **Ingredient Distilling Manager** (see Features section) is also pending. Which of these should be prioritised next?
- **UI consistency — palette file.** RoGin's warm-earthy palette now lives in `src/app/globals.css` as CSS variables (cream, burgundy, warm-tinted neutrals). Aligning to the `ui-consistency` skill's preferred pattern (a `src/lib/colors.ts` exporting semantic names) is still pending — a quick, clean pass next time the UI is touched. Should align with TDAI (its sibling Next.js + LLM project, which shares the cream-and-burgundy visual language).
- **Convert RoGin into a Progressive Web App?** RoGin is not currently a PWA — no `manifest.json`, no service worker, no PWA plugin. But the use case is textbook PWA territory: phone propped on a kitchen counter mid-mixing-session, ideally fullscreen with no browser chrome, ideally launchable from the home screen, ideally tolerant of flaky kitchen Wi-Fi.
    - **Pros:** "Add to Home Screen" gives app-like fullscreen launch (more screen real-estate for ingredient amounts); service worker can cache the batch log and beginner guide so they remain readable offline; app-shell caching makes reopen feel instant instead of waiting on Turso; small visual upgrade (custom splash, theme colour, status-bar tint).
    - **Cons:** modest engineering lift (manifest, icon set in multiple sizes, plugin choice between `next-pwa` and `serwist`, hooks for service-worker lifecycle); cache invalidation discipline needed on every deploy (stale clients seeing old code is a real footgun); iOS PWA has known quirks (no background sync, limited storage, splash-screen image set must be exhaustive); the AI Distiller wizard depends on Claude API so it cannot work offline regardless; same for any save-to-Turso action — so the offline benefit is limited to *viewing* the batch log and beginner guide, not creating or saving anything.
    - **Net read:** real UX upgrade for daily-use mode (home-screen launch, fullscreen, faster reopen). Offline value is genuine but narrow. Decision deferred — discuss before committing.

Capture smoke-test — please ignore this note.
