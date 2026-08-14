"use client";

import { useMemo, useState } from "react";

type Card = {
  id: string; issuer: string; name: string; network: string;
  joining_fee: number; annual_fee: number; waiver_spend: number | null;
  reward: string; categories: string[]; highlights: string[];
  lounge: string; forex_markup: number; verification: string; source: string;
};
type Catalog = {
  meta: { updatedAt: string; cardCount: number; issuerCount: number; detailedIssuerCount: number; verifiedCount: number };
  issuers: { name: string; coverage: string; catalog: string }[];
  cards: Card[];
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const label = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (match) => match.toUpperCase());
const palette = ["sage", "sky", "clay", "sand", "lavender", "aqua"];

export default function CardExplorer({ catalog }: { catalog: Catalog }) {
  const [query, setQuery] = useState("");
  const [issuer, setIssuer] = useState("all");
  const [category, setCategory] = useState("all");
  const [fee, setFee] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [visible, setVisible] = useState(12);
  const [selected, setSelected] = useState<Card | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const issuers = useMemo(() => [...new Set(catalog.cards.map((card) => card.issuer))].sort(), [catalog.cards]);
  const categories = useMemo(() => [...new Set(catalog.cards.flatMap((card) => card.categories))].sort(), [catalog.cards]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = catalog.cards.filter((card) => {
      const haystack = [card.name, card.issuer, card.reward, card.network, ...card.categories, ...card.highlights].join(" ").toLowerCase();
      const feeMatch = fee === "all" || (fee === "free" ? card.annual_fee === 0 : fee === "under1000" ? card.annual_fee < 1000 : card.annual_fee >= 1000);
      return (!normalized || haystack.includes(normalized)) && (issuer === "all" || card.issuer === issuer) && (category === "all" || card.categories.includes(category)) && feeMatch;
    });
    return result.sort((a, b) => sort === "fee-low" ? a.annual_fee - b.annual_fee : sort === "forex" ? a.forex_markup - b.forex_markup : sort === "name" ? a.name.localeCompare(b.name) : Number(b.verification === "verified") - Number(a.verification === "verified") || a.annual_fee - b.annual_fee);
  }, [catalog.cards, query, issuer, category, fee, sort]);

  const reset = () => { setQuery(""); setIssuer("all"); setCategory("all"); setFee("all"); setVisible(12); };
  const toggleCompare = (id: string) => setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  const compareCards = compare.map((id) => catalog.cards.find((card) => card.id === id)).filter(Boolean) as Card[];
  const updatedLabel = date.format(new Date(`${catalog.meta.updatedAt}T12:00:00+05:30`));

  return (
    <main id="top">
      <header className="nav-shell">
        <a className="brand" href="#top" aria-label="CardScout India home"><span className="brand-mark">CS</span><span>CardScout <em>India</em></span></a>
        <nav aria-label="Main navigation"><a href="#cards">Explore cards</a><a href="#coverage">Coverage</a><a href="#method">Method</a><a className="contribute" href="https://github.com/someshfengde/cardscout-india" target="_blank" rel="noreferrer">Contribute ↗</a></nav>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> Independent · source-backed · community maintained</div>
        <h1>Find a credit card<br />that earns its <i>place.</i></h1>
        <p className="lede">Compare fees, rewards, lounge access and fine print across India—without the sales pitch.</p>
        <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Search cards, banks or benefits…" aria-label="Search credit cards" /><kbd>{filtered.length} found</kbd></label>
        <div className="quick-links"><span>Popular:</span>{["cashback", "lifetime-free", "travel", "rupay-upi"].map((item) => <button className={category === item ? "active" : ""} onClick={() => { setCategory(item); setVisible(12); }} key={item}>{label(item)}</button>)}</div>
      </section>

      <section className="trust-strip" aria-label="Catalog statistics">
        <div><strong>{catalog.meta.cardCount}</strong><span>Cards documented</span></div>
        <div><strong>{catalog.meta.issuerCount}</strong><span>Issuers tracked</span></div>
        <div><strong>{catalog.meta.verifiedCount}</strong><span>Officially verified records</span></div>
        <div><strong>Weekly</strong><span>Source-change audits</span></div>
      </section>

      <section className="catalog" id="cards">
        <div className="section-heading"><div><span className="section-kicker">THE OPEN CATALOG</span><h2>Compare Indian credit cards</h2><p>Fees exclude GST. Always recheck the issuer page before applying.</p></div><div className="catalog-meta"><span className="updated-date"><b>●</b> Last updated {updatedLabel}</span><span className="result-count">{filtered.length} {filtered.length === 1 ? "card" : "cards"}</span></div></div>
        <div className="filters" aria-label="Card filters">
          <label><span>Issuer</span><select value={issuer} onChange={(event) => { setIssuer(event.target.value); setVisible(12); }}><option value="all">All detailed issuers</option>{issuers.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label><span>Best for</span><select value={category} onChange={(event) => { setCategory(event.target.value); setVisible(12); }}><option value="all">Every use case</option>{categories.map((item) => <option value={item} key={item}>{label(item)}</option>)}</select></label>
          <label><span>Annual fee</span><select value={fee} onChange={(event) => { setFee(event.target.value); setVisible(12); }}><option value="all">Any annual fee</option><option value="free">Lifetime free</option><option value="under1000">Under ₹1,000</option><option value="premium">₹1,000 and above</option></select></label>
          <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Verified first</option><option value="fee-low">Lowest fee</option><option value="forex">Lowest forex markup</option><option value="name">Card name</option></select></label>
        </div>

        {filtered.length ? <div className="card-grid">
          {filtered.slice(0, visible).map((card, index) => <article className="credit-card" key={card.id}>
            <button className={`visual-card ${palette[index % palette.length]}`} onClick={() => setSelected(card)} aria-label={`View details for ${card.name}`}>
              <span className="issuer-name">{card.issuer}</span><span className="network">{card.network}</span><span className="visual-name">{card.name}</span><span className="chip" aria-hidden="true" /><span className="waves" aria-hidden="true" />
            </button>
            <div className="card-copy">
              <div className="status-row"><span className={card.verification === "verified" ? "verified" : "partial"}>{card.verification === "verified" ? "● OFFICIAL SOURCE CHECKED" : "◐ PARTIALLY VERIFIED"}</span><button className={compare.includes(card.id) ? "compare active" : "compare"} onClick={() => toggleCompare(card.id)} disabled={!compare.includes(card.id) && compare.length >= 3}>{compare.includes(card.id) ? "✓ Added" : "+ Compare"}</button></div>
              <button className="title-button" onClick={() => setSelected(card)}><h3>{card.name}</h3><span>{card.issuer}</span></button>
              <p className="reward">{card.reward}</p>
              <div className="tag-row">{card.categories.slice(0, 3).map((item) => <span key={item}>{label(item)}</span>)}</div>
              <dl className="facts"><div><dt>Annual fee</dt><dd>{card.annual_fee === 0 ? "Lifetime free" : money.format(card.annual_fee)}</dd></div><div><dt>Forex markup</dt><dd>{card.forex_markup}%</dd></div></dl>
              <button className="details-link" onClick={() => setSelected(card)}>Full details <span>→</span></button>
            </div>
          </article>)}
        </div> : <div className="empty"><strong>No cards match those filters.</strong><p>Try a broader search or clear the filters.</p><button onClick={reset}>Clear filters</button></div>}

        {visible < filtered.length && <button className="load-more" onClick={() => setVisible((count) => count + 12)}>Show 12 more <span>↓</span></button>}
      </section>

      <section className="coverage" id="coverage">
        <div className="coverage-copy"><span className="section-kicker">HONEST ABOUT THE GAPS</span><h2>India-wide discovery,<br /><i>in public.</i></h2><p>We track {catalog.meta.issuerCount} issuers. {catalog.meta.detailedIssuerCount} currently meet the detailed-data bar; the rest stay visible in the research queue until their cards are source-checked.</p><a href="https://github.com/someshfengde/cardscout-india/blob/main/data/issuers.yml" target="_blank" rel="noreferrer">View the discovery ledger →</a></div>
        <div className="issuer-cloud">{catalog.issuers.map((item) => <a key={item.name} href={item.catalog} target="_blank" rel="noreferrer" className={item.coverage}>{item.name}<small>{item.coverage === "detailed" ? "Detailed" : "Research queue"}</small></a>)}</div>
      </section>

      <section className="method" id="method"><div><span className="section-kicker">HOW IT STAYS TRUSTWORTHY</span><h2>Sources, not slogans.</h2></div><div className="method-steps"><article><span>01</span><h3>Primary sources first</h3><p>Fees and material benefits must link to the bank, issuer, or an official key-fact statement.</p></article><article><span>02</span><h3>Changes get flagged</h3><p>A weekly routine fingerprints every official page and opens a review when the source changes.</p></article><article><span>03</span><h3>Community reviewed</h3><p>Anyone can propose a card update through a small, validated YAML change and pull request.</p></article></div></section>

      <section className="contribute-banner"><div><span>FOUND SOMETHING OUTDATED?</span><h2>Help the next person choose better.</h2></div><a href="https://github.com/someshfengde/cardscout-india/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer">Contribute a correction ↗</a></section>
      <footer><a className="brand" href="#top"><span className="brand-mark">CS</span><span>CardScout <em>India</em></span></a><p>Information, not financial advice. Card terms can change without notice.</p><span>Data refreshed {updatedLabel}</span></footer>

      {compareCards.length > 0 && <aside className="compare-tray" aria-label="Comparison tray"><div><strong>Compare cards</strong><span>{compareCards.map((card) => card.name).join(" · ")}</span></div><button onClick={() => setShowCompare(true)}>Compare ({compareCards.length}/3)</button><button className="tray-close" onClick={() => setCompare([])} aria-label="Clear comparison">×</button></aside>}

      {showCompare && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowCompare(false)}><section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title"><button className="modal-close" onClick={() => setShowCompare(false)} aria-label="Close comparison">×</button><span className="section-kicker">SIDE BY SIDE</span><h2 id="compare-title">Your shortlist</h2><div className="comparison-grid"><div className="comparison-labels"><strong>Card</strong><span>Annual fee</span><span>Fee waiver</span><span>Forex markup</span><span>Lounge</span><span>Best for</span><span>Official source</span></div>{compareCards.map((card) => <div className="comparison-column" key={card.id}><strong>{card.name}<small>{card.issuer}</small></strong><span>{card.annual_fee ? money.format(card.annual_fee) : "Lifetime free"}</span><span>{card.waiver_spend ? money.format(card.waiver_spend) : "—"}</span><span>{card.forex_markup}%</span><span>{label(card.lounge)}</span><span>{card.categories.slice(0, 2).map(label).join(", ")}</span><a href={card.source} target="_blank" rel="noreferrer">Open ↗</a><button onClick={() => toggleCompare(card.id)}>Remove</button></div>)}</div><p className="disclaimer">This comparison is informational. Check current issuer terms, exclusions and eligibility before applying.</p></section></div>}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button><span className={selected.verification === "verified" ? "verified" : "partial"}>{selected.verification === "verified" ? "● OFFICIAL SOURCE CHECKED" : "◐ PARTIALLY VERIFIED"}</span><p className="modal-issuer">{selected.issuer} · {selected.network}</p><h2 id="detail-title">{selected.name}</h2><p className="modal-reward">{selected.reward}</p><dl className="modal-facts"><div><dt>Joining fee</dt><dd>{selected.joining_fee === 0 ? "₹0" : money.format(selected.joining_fee)}</dd></div><div><dt>Annual fee</dt><dd>{selected.annual_fee === 0 ? "₹0" : money.format(selected.annual_fee)}</dd></div><div><dt>Fee waiver spend</dt><dd>{selected.waiver_spend ? money.format(selected.waiver_spend) : "Not listed"}</dd></div><div><dt>Forex markup</dt><dd>{selected.forex_markup}%</dd></div><div><dt>Lounge access</dt><dd>{label(selected.lounge)}</dd></div><div><dt>Network</dt><dd>{selected.network}</dd></div></dl><h3>Key benefits</h3><ul>{selected.highlights.map((item) => <li key={item}>{item}</li>)}</ul><div className="modal-actions"><a href={selected.source} target="_blank" rel="noreferrer">Check official source ↗</a><button className={compare.includes(selected.id) ? "active" : ""} onClick={() => toggleCompare(selected.id)}>{compare.includes(selected.id) ? "✓ In comparison" : "+ Add to comparison"}</button></div><p className="disclaimer">Terms, exclusions, caps and eligibility apply. Verify the live issuer page before applying.</p></section></div>}
    </main>
  );
}
