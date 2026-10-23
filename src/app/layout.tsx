import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Young_Serif } from "next/font/google";
import { ProvedorTema } from "@/components/layout/provedor-tema";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  // O Next não tem as métricas desta família para gerar a fonte reserva ajustada.
  adjustFontFallback: false,
});

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "Isis-Assist", template: "%s · Isis-Assist" },
  description: "Gestão de aluguéis do seu residencial: imóveis, inquilinos, contratos e recebimentos.",
  applicationName: "Isis-Assist",
  appleWebApp: { capable: true, title: "Isis-Assist", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1120" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${atkinson.variable} ${atkinsonMono.variable} ${youngSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ProvedorTema>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" richColors closeButton />
        </ProvedorTema>
      </body>
    </html>
  );
}
