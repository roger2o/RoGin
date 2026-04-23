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
- Enter how much Juniper infusion you have available and the app calculates all other ingredient amounts automatically.
- Start a new recipe from a previous batch (amounts scale to your current Juniper quantity) or use the AI Distiller wizard.
- Adjust any ingredient amount in real time while tasting during a mixing session. The Juniper amount is also editable -- changing it rescales all other botanicals proportionally.
- Ingredients are sorted by amount (largest first, with Juniper always at the top) so the most significant botanicals are immediately visible.
- All amounts are shown in millilitres, rounded to the nearest 5 ml for practical measuring.
- Add new botanicals on the fly -- either manually through the recipe editor or when the AI suggests something you have not used before. New botanicals are saved to the database for future use.
- Save the finished recipe to the Batch Log with a name, date, and tasting notes.

### AI Recipe Wizard ("RoGin AI Distiller")
- A conversational assistant powered by the Claude AI that acts as an experienced gin distiller.
- Asks thoughtful, open-ended questions about your flavour preferences, the occasion, and what you liked or disliked in past batches -- not a rigid checklist.
- Reviews your entire batch history and tasting notes before making suggestions, so it avoids repeating past mistakes and builds on successes.
- Generates a concrete starting recipe with ingredient amounts based on your available Juniper quantity.
- Tasting notes suggested by the AI are automatically carried into the save flow, pre-filling the tasting notes field so nothing is lost.
- Can recommend new botanicals the user has not tried, including Hebrew names so they can be found at Israeli spice markets. Any new botanicals the AI suggests are saved to the database so they are available in future recipes.

### Batch Log
- A chronological record of every gin-making session: date, recipe name, ingredient amounts, total volume, and free-text tasting notes.
- Pre-loaded with ten historical batches (July 2022 through September 2025) and two named recipes from the original spreadsheet.
- Tap any batch to see full details; select any batch as a starting point for a new recipe.
- Tasting notes can be edited after the fact.

### Beginner Guide
- A standalone reference page with a step-by-step method for making simple single-jar gin using vodka and botanicals.
- Includes an ingredient shopping list with English and Hebrew names.
- Offers flavour variation tips (e.g., "swap rosemary for thyme for earthier notes") to help newcomers experiment.
- Not connected to the batch log or recipe builder -- purely educational.

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
- Deployed to Netlify with Turso hosted database.

The project has nine commits, progressing from initial scaffolding through feature build-out to deployment configuration and polish. The most recent work (April 2026) made the Juniper amount editable directly in the recipe editor with automatic rescaling, updated the app icon and favicon to a custom tumbler glass design, and refined several deployment details for the Netlify and Turso production environment.

The AI wizard now uses Anthropic prompt caching. The static portion of the system prompt (the distiller persona, botanical library, recipe format rules, and past-batch observations) is cached between requests; only the dynamic batch history is re-processed on each call. On a first call the cache is written (1,314 tokens, ~1.25× cost) and subsequent calls within the 5-minute TTL read those tokens from cache at roughly 10% of full cost, translating to ~57% cheaper per cached call and ~1-2 seconds faster time-to-first-token. Usage figures are logged server-side on every wizard call so cache hit rates remain observable.

---

## Open Questions

- **Automated testing.** A detailed test plan exists in the project description but has not been implemented. When and how should automated tests be added?
- **Authentication timeline.** The database is ready for multi-user support, but no login system exists. When is this needed, and should it use Google sign-in as planned?
- **Cost monitoring.** How will Claude API usage and costs be tracked over time? Are there budget thresholds that should trigger alerts?
- **Backup strategy.** What is the backup and recovery plan for the Turso production database?
- **Future features.** The project description lists several enhancements not yet in scope: botanical inventory tracking, batch comparison views, insights and charts, and recipe export/sharing. Which of these should be prioritised next?
- **UI consistency and colour palette.** Accent colours (the warm beige and burgundy that define RoGin's look) are currently applied per component. This is a gap against the shared `ui-consistency` skill. Consolidate to a shared palette file (`src/lib/colors.ts`) with semantic names, and align with TDAI (its sibling Next.js + LLM project, which shares the cream-and-burgundy visual language). Because RoGin is small, this can be a quick, clean pass when next touching the UI.
