# Contributing to CardScout India

Thank you for helping make Indian credit-card information easier to verify.
Small, source-backed pull requests are the fastest to review.

## Correct an existing card

1. Edit only the relevant record in `data/cards.yml`.
2. Link the issuer's product page, MITC, schedule of charges, or key-fact
   statement in `source`.
3. Explain the old and new value in the pull-request description.
4. Include the effective date when the issuer publishes one.
5. Run `npm run data:build` and `npm test`.

## Add a card

Copy this shape into the `cards` list and keep the ID lowercase with hyphens:

```yaml
- id: issuer-card-name
  issuer: Issuer name exactly as listed in data/issuers.yml
  name: Public card name
  network: Visa
  joining_fee: 0
  annual_fee: 0
  waiver_spend: null
  reward: One factual sentence describing the core earn rate
  categories: [lifetime-free, rewards]
  highlights:
    - A material benefit
    - A second material benefit or important limitation
  lounge: none
  forex_markup: 3.5
  verification: partial
  source: https://issuer.example/official-card-page
```

Use one of `none`, `conditional`, `included`, or `unlimited` for `lounge`.
Start at `partial`; a maintainer will change it to `verified` after checking the
fee schedule and material claims.

## Source policy

Preferred sources, in order:

1. Official key-fact statement or schedule of charges
2. Official issuer product page
3. Official terms-and-conditions PDF

Blogs, aggregators, Reddit posts, videos, and referral pages are useful leads,
but they cannot be the sole source for a published claim. Do not add referral
links, tracking parameters, copied marketing prose, eligibility guesses, or
personal customer data.

## Review checklist

- Fees are numbers in rupees and exclude GST
- Waiver thresholds are annual retail-spend amounts, or `null`
- Caps and spend conditions are mentioned when material
- The source opens without a login
- The card is currently issued, or its status is clearly explained
- Generated data and tests pass

By contributing, you agree that your changes may be distributed under the MIT
License.
