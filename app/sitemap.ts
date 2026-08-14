import type { MetadataRoute } from "next";
import catalog from "./generated/catalog.json";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: "https://cardscout-india.someshfengade.chatgpt.site",
    lastModified: new Date(`${catalog.meta.updatedAt}T00:00:00+05:30`),
    changeFrequency: "weekly",
    priority: 1,
  }];
}
