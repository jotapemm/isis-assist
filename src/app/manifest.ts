import type { MetadataRoute } from "next";

/** Manifesto do PWA: permite "Adicionar à tela inicial" e abrir como app, sem barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Isis-Assist",
    short_name: "Isis-Assist",
    description: "Gestão de aluguéis do seu residencial.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5f9",
    theme_color: "#2c3fa3",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
