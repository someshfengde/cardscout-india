# CardScout India

**Live site:** https://cardscout-india.someshfengade.chatgpt.site

An open, source-backed catalog for comparing Indian credit cards without the
sales pitch. CardScout India keeps fees, rewards, lounge access, forex markup,
waiver thresholds, and official issuer links in a small YAML dataset that
anyone can review.

## What is included

- 309 active card products across all 40 tracked issuers and partner programs
- 200 detailed records and 109 candidates still visibly marked `Researching`
- 22 issuer groups with every known active queue record promoted to detailed coverage
- 18 officially retired products preserved in a separate source-backed archive
- Search, issuer/use-case/fee filters, sorting, detail views, and comparisons
- A primary-source link and verification state on every card
- Schema validation, tests, CI, and weekly official-source change detection
- A contributor workflow designed for one-card pull requests

The catalog is intentionally honest about coverage. Card candidates enter
`data/discovery.yml` during the issuer-by-issuer pass, then graduate to
`data/cards.yml` only after fees and material benefits are checked.

The issuer baseline is cross-checked against the Reserve Bank of India's
[bank-wise card statistics](https://www.rbi.org.in/scripts/ATMView.aspx?atmid=169).
Partner programs are tracked separately because the issuing bank can change.

## Local development

Requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run data:build
npm run lint
npm test
npm run data:audit
npm run research:patch -- research-batch.yml
```

`research:patch` validates agent or contributor research fragments and prints an
`apply_patch`-compatible promotion patch. It never edits the catalog directly.

## Data model

- `data/cards.yml` — website card records
- `data/discovery.yml` — card-by-card discovery and verification queue
- `data/retired.yml` — officially confirmed discontinued or superseded products
- `data/issuers.yml` — India-wide issuer discovery ledger
- `data/source-state.json` — fingerprints used to detect official-page changes
- `source-audit.md` — latest human-readable audit result

Amounts are stored in Indian rupees and exclude GST unless explicitly noted.
`verified` means the fee schedule was checked against an official issuer page or
key-fact statement. `partial` means a material benefit still needs another pass.
Discovery records can include a `research_note` explaining the exact missing fact,
legacy status, or source limitation so contributors do not repeat dead-end work.
Retired records stay source-backed and auditable but are excluded from active
search, comparison, and catalog counts.

See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a correction or adding a
card.

## Automation

Pull requests run data validation, linting, production build, and rendering
tests. A scheduled weekly workflow fingerprints every official source. If a
source changes, it opens an audit pull request so the affected facts can be
reviewed rather than silently trusting brittle scraping.

## Independence and disclaimer

CardScout India has no affiliate links in the dataset. It is an informational
community project, not financial advice. Issuers can change pricing, eligibility,
caps, exclusions, and benefits without notice; always verify the official source
before applying.

## License

MIT. Card and issuer names remain the property of their respective owners.
