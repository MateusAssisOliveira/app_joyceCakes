
// LAYOUT RAIZ (ROOT LAYOUT)
//
// Propósito:
// Este arquivo define o layout raiz da aplicação. É o componente mais fundamental
// que envolve todas as páginas.
//
// Responsabilidade:
// - Definir a estrutura básica do HTML (tag <html> e <body>).
// - Carregar fontes globais (neste caso, Lora e Inter).
// - Aplicar estilos globais ao `body`, incluindo a classe do tema principal.
// - Incluir o `Toaster`, componente responsável por exibir notificações (toasts)
//   em toda a aplicação.
// - Renderizar os `children`, que são as páginas ativas da aplicação.

import type { Metadata } from "next";
import { Lora, Poppins } from "next/font/google";
import "./globals.css";
import "./printing.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lora",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Doce Caixa | Gestão para Confeitaria",
  description: "Sistema de gestão para sua confeitaria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full">
      <head />
      <body
        className={cn(
          "h-full bg-background text-foreground antialiased theme-vibrant-pink", // Aplica o novo tema aqui
          lora.variable,
          poppins.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
