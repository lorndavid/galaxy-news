import { watch, type Ref } from "vue";

export interface JsonLd {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

interface SeoOptions {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article";
  /** Structured data to emit as <script type="application/ld+json">. */
  jsonLd?: JsonLd[];
}

const SEO_META_SELECTOR =
  'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]';

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function clearJsonLd() {
  document.head
    .querySelectorAll('script[data-seo="jsonld"]')
    .forEach((el) => el.remove());
}

function setJsonLd(items: JsonLd[] | undefined) {
  clearJsonLd();
  for (const item of items ?? []) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "jsonld";
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  }
}

/** Strip SEO meta tags left over from the previous route. */
function clearLegacyMeta() {
  document.head
    .querySelectorAll(SEO_META_SELECTOR)
    .forEach((el) => el.remove());
}

export function useSeo(options: Ref<SeoOptions> | SeoOptions) {
  const apply = () => {
    const o = "value" in options ? options.value : options;

    // Remove meta/canonical from the previous page so stale tags never linger.
    clearLegacyMeta();

    document.title = o.title;

    setMeta("name", "description", o.description ?? "");
    setMeta("property", "og:title", o.title);
    setMeta("property", "og:description", o.description ?? "");
    setMeta("property", "og:type", o.type ?? "website");
    if (o.url) setMeta("property", "og:url", o.url);
    if (o.image) setMeta("property", "og:image", o.image);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", o.title);
    setMeta("name", "twitter:description", o.description ?? "");
    if (o.image) setMeta("name", "twitter:image", o.image);

    if (o.url) upsertLink("canonical", o.url);

    setJsonLd(o.jsonLd);
  };

  if ("value" in options) {
    watch(options, apply, { immediate: true, deep: true });
  } else {
    apply();
  }
}
