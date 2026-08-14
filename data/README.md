# Card data

`cards.yml` is the source of truth for cards shown on the website. Amounts are in
Indian rupees and exclude GST unless a record explicitly says otherwise.

Each record links to a primary issuer source. `verification: verified` means the
fee schedule was checked against an official issuer page or key-fact statement;
`partial` means at least one material benefit still needs a second pass.

`issuers.yml` is the discovery ledger. `coverage: discovery` means the issuer is
tracked but its individual cards have not yet passed the project's data-quality
bar. This keeps the completeness gap visible instead of silently omitting banks.

Never use referral or affiliate pages as the sole source for a fee, waiver,
reward rate, eligibility rule, or benefit.
