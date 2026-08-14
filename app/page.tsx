import catalog from "./generated/catalog.json";
import CardExplorer from "./components/CardExplorer";

export default function Home() {
  return <CardExplorer catalog={catalog} />;
}
