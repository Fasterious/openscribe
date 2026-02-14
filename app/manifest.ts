import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenScribe - Transcription gratuite & professionnelle",
    short_name: "OpenScribe",
    description:
      "Transcription pro avec identification des locuteurs. Jusqu'à 1 Go, durée illimitée. Propulsé par Voxtral (Mistral AI).",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2F40C2",
    theme_color: "#2F40C2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
