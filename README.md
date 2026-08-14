# CardScout India

An open, source-backed catalog for comparing Indian credit cards without the
sales pitch. CardScout India keeps fees, rewards, lounge access, forex markup,
waiver thresholds, and official issuer links in a small YAML dataset that
anyone can review.

## What is included

- 62 detailed card records across 10 issuers
- 28 issuers in the public discovery ledger
- Search, issuer/use-case/fee filters, sorting, detail views, and comparisons
- A primary-source link and verification state on every card
- Schema validation, tests, CI, and weekly official-source change detection
- A contributor workflow designed for one-card pull requests

The catalog is intentionally honest about coverage. An issuer can be tracked in
`data/issuers.yml` before its cards graduate into the detailed catalog.

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
```

## Data model

- `data/cards.yml` — website card records
- `data/issuers.yml` — India-wide issuer discovery ledger
- `data/source-state.json` — fingerprints used to detect official-page changes
- `source-audit.md` — latest human-readable audit result

Amounts are stored in Indian rupees and exclude GST unless explicitly noted.
`verified` means the fee schedule was checked against an official issuer page or
key-fact statement. `partial` means a material benefit still needs another pass.

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
