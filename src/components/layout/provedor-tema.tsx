"use client";

import { ThemeProvider } from "next-themes";

/** Claro, escuro ou "igual ao celular" (padrão). */
export function ProvedorTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
