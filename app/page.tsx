import catalog from "./generated/catalog.json";
import CardExplorer from "./components/CardExplorer";

export default function Home() {
  const siteUrl = "https://cardscout-india.someshfengade.chatgpt.site";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "CardScout India credit card catalog",
    description: `A source-backed catalog of ${catalog.meta.cardCount} Indian credit cards across ${catalog.meta.issuerCount} issuers and partner programs.`,
    url: siteUrl,
    dateModified: catalog.meta.updatedAt,
    isAccessibleForFree: true,
    license: "https://github.com/someshfengde/cardscout-india/blob/main/LICENSE",
    creator: { "@type": "Organization", name: "CardScout India", url: siteUrl },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/yaml", contentUrl: "https://github.com/someshfengde/cardscout-india/blob/main/data/cards.yml" },
      { "@type": "DataDownload", encodingFormat: "text/yaml", contentUrl: "https://github.com/someshfengde/cardscout-india/blob/main/data/discovery.yml" },
    ],
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} /><CardExplorer catalog={catalog} /></>;
}
