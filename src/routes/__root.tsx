import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AW_ID, GA4_ID } from "@/lib/gtag";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ocarina Spa Québec — Réparation de spas" },
      { name: "description", content: "Spécialiste en réparation, installation, ouverture, fermeture et entretien de spas. Service à domicile partout au Québec." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "format-detection", content: "telephone=yes" },
      { property: "og:title", content: "Ocarina Spa Québec — Réparation et installation de spas" },
      { name: "twitter:title", content: "Ocarina Spa Québec — Réparation et installation de spas" },
      { property: "og:description", content: "Spécialiste en réparation, installation, ouverture, fermeture et entretien de spas. Service à domicile partout au Québec." },
      { name: "twitter:description", content: "Spécialiste en réparation, installation, ouverture, fermeture et entretien de spas. Service à domicile partout au Québec." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/T4diMFkWjWfo8fJU7GOTzhR4Sju1/social-images/social-1777685087364-ChatGPT_Image_1_mai_2026,_21_24_20.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/T4diMFkWjWfo8fJU7GOTzhR4Sju1/social-images/social-1777685087364-ChatGPT_Image_1_mai_2026,_21_24_20.webp" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <head>
        <HeadContent />
        {/* Google tag — one gtag.js loader, configured for both Google Ads and GA4. */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`}></script>
        <script
          id="ocarina-google-tag"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${AW_ID}');
gtag('config', '${GA4_ID}');`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
