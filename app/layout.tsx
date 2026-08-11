import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const title = "Cierra — Tu vendedor IA para la web";
  const description = "Crea un asesor entrenado en tu producto, pruébalo e instálalo en tu sitio web en minutos.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: baseUrl, images: [{ url: `${baseUrl}/og.png`, width: 1536, height: 806, alt: "Cierra, tu web también puede vender" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${baseUrl}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
