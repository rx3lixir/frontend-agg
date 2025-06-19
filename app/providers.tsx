"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/providers/modal-provider";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
      >
        <Toaster position="bottom-right" />
        <ModalProvider />
        {children}
      </NextThemesProvider>
    </AuthProvider>
  );
}
