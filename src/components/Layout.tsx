import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyCallButton } from "./StickyCallButton";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <StickyCallButton />
      {/* Spacer so sticky mobile bar doesn't cover content */}
      <div className="lg:hidden h-16" aria-hidden="true" />
    </div>
  );
}
