# Vantage University Selection

Vantage is a research-oriented university selection workspace. It helps students compare their academic profile with a target program, explore institutions around the world, and keep high-school records organized in one private browser-based dashboard.

The product is designed around honest context rather than false precision. When live research services are unavailable, the report APIs return a clearly labelled global simulation so the experience remains usable during development and demonstrations.

## Features

### Fit Report

- Enter a school, program or department, GPA, test score, and personal context.
- Build a structured report with a verdict, summary, strengths, gaps, and next steps.
- Compare up to three saved programs side by side.
- Copy a report as text or print it as a PDF.
- Save generated reports in browser local storage.

### Reality Check

- Add grade level, GPA, courses, activities, and notes.
- Receive an honest planning review with a standing, focus areas, stretch goals, and encouragement.
- View the result alongside a separate historical benchmark from the bundled sample data.
- Save and reload previous checks from the browser.

### Around the World

- Browse continents, countries, provinces or states, and institutions.
- Explore universities and colleges from the bundled world directory.
- Filter institutions by type.
- Search institutions by name or city.
- Use the interactive atlas map or breadcrumb navigation to move through the hierarchy.

### High-School Report Vault

- Select a high-school year and upload transcripts, recommendation letters, portfolios, or other records.
- Drag and drop multiple files or browse from the file picker.
- View file type, size, year, and upload date.
- Download or delete saved records.
- Store files in IndexedDB in the current browser; files are not uploaded to the application server.

## Live Research and Simulation

The API routes at `/api/fit` and `/api/reality-check` can use:

- **SerpApi** for live web search results about admissions requirements and program context.
- **Groq** for structured report generation from the retrieved evidence.

If either provider is unavailable, the application uses `lib/simulations.ts`. The fallback is deterministic and draws from a named 24-university cohort spanning North America, South America, Europe, Africa, Asia, and Oceania. Simulated values are marked in the response with `simulated: true` and in the interface with `SIMULATED GLOBAL RESEARCH`.

Simulated results are for product demos and planning flow only. They are not official admissions statistics, live university data, or a prediction of admission.

## Technology

- **Next.js 13.5** with the App Router and server API routes
- **React 18** for client-side forms, tabs, filtering, and saved report state
- **TypeScript** with strict checking
- **Tailwind CSS** and custom CSS in `app/globals.css` for the visual system
- **Radix UI** primitives for reusable accessible interface components
- **Recharts** for chart-capable UI dependencies
- **Lucide React** for icon support
- **IndexedDB** through the browser storage layer for uploaded records
- **Local storage** for saved fit reports and reality checks
- **SerpApi** and **Groq** as optional live integrations
- **Netlify Next.js plugin** for deployment

## Project Structure

```text
app/
	page.tsx                    Fit Report homepage
	dashboard/page.tsx          Dashboard tabs
	api/fit/route.ts            Fit report API
	api/reality-check/route.ts  Reality check API
	globals.css                 Global styles and design tokens
components/
	around-the-world.tsx        World directory and filtering
	world-map.tsx               Interactive atlas map
	reality-check.tsx           Reality Check workflow
	report-manager.tsx          Browser-only file vault
	site-nav.tsx                Shared navigation
components/ui/                Radix-based UI primitives
data/
	world.json                  Continent, country, region, and institution data
	benchmark.json              Bundled historical benchmark records
lib/
	benchmark.ts                Benchmark calculations
	report-store.ts             IndexedDB file storage
	simulations.ts              Global fallback research responses
```

## Getting Started

### Requirements

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validate and build

```bash
npm run typecheck
npm run build
```

The available scripts are:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run build` | Create the production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the configured Next.js lint command |

## Environment Variables

Create a local `.env` file for live integrations:

```env
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_api_key
```

Never commit `.env` or expose API keys in client-side code. After changing environment variables, restart the development server so Next.js reloads them.

With no valid live credentials, the application will use simulations for the API-backed workflows.

## Deployment

The repository includes `netlify.toml` configured for the Netlify Next.js plugin. Configure `SERPAPI_KEY` and `GROQ_API_KEY` as Netlify environment variables, then deploy with:

```bash
npx next build
```

The Netlify plugin handles the Next.js runtime and API routes. Keep the simulation fallback enabled so the user experience remains available if a provider reaches its quota or has an outage.

## Privacy and Data Notes

- Fit reports and reality checks are saved in the browser's local storage.
- Uploaded school records are stored in browser IndexedDB and are not sent to the server.
- If live mode is enabled, the submitted profile and search query are sent to the server API route, which contacts the configured third-party providers.
- Live provider responses should be treated as research assistance and checked against official university pages before making application decisions.

## Limitations

- The global directory is a curated bundled dataset, not a complete list of every institution worldwide.
- Simulated admissions values are illustrative and must not be treated as published facts.
- Live search quality depends on SerpApi availability and the quality of public web sources.
- The benchmark dataset is historical context and is not a school-specific admissions probability model.
