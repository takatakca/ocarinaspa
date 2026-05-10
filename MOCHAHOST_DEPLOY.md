# Déploiement Ocarina Spa sur MochaHost (Node.js / cPanel)

## 1. Build local

```bash
npm install
npm run build:node     # produit .output/  (serveur Node autonome)
npm start              # test local sur http://localhost:3000
```

Si `npm start` fonctionne localement, le projet est prêt à téléverser.

## 2. Fichiers à téléverser sur MochaHost

Téléverse **le contenu** de la racine du projet vers le dossier de ton app Node sur cPanel
(par ex. `/home/USER/ocarinaspa/`). Tu dois inclure :

- `.output/`            ← serveur compilé (obligatoire)
- `server.js`           ← point d'entrée
- `package.json`
- `package-lock.json` ou `bun.lockb`
- `.env`                ← copié depuis `.env.example` et rempli

Tu peux **exclure** : `node_modules/`, `src/`, `tests/`, `scripts/`, `.git/`, fichiers de dev.

## 3. Configuration cPanel → "Setup Node.js App"

| Champ | Valeur |
|---|---|
| Node.js version | 20.x ou 22.x |
| Application mode | Production |
| Application root | `ocarinaspa` (ou le dossier où tu as téléversé) |
| Application URL | `ocarinaspa.ca` (ton domaine) |
| Application startup file | `server.js` |
| Passenger log file | (laisse par défaut) |

Clique **Create**, puis **Run NPM Install** (cPanel installera les deps de production).

## 4. Variables d'environnement à ajouter dans cPanel

Dans la section "Environment variables" de l'app Node :

```
NODE_ENV=production
HOST=0.0.0.0
SUPABASE_URL=https://jbdkvdowxwrwyuhglxgu.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://jbdkvdowxwrwyuhglxgu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=jbdkvdowxwrwyuhglxgu
```

`PORT` est fourni automatiquement par cPanel — ne le surcharge pas.

## 5. Démarrer

Clique **Start App** dans cPanel. Le site répondra sur ton domaine.

## Commandes résumé

| Action | Commande |
|---|---|
| Dev local (Lovable preview) | `npm run dev` |
| Build pour MochaHost | `npm run build:node` |
| Démarrer prod local | `npm start` |
| Build Lovable (Cloudflare) | `npm run build` |

## Statique vs SSR

Le serveur Node sert **toutes les routes** (incluant les 16 358 pages
ville×service) en SSR. Refresh sur `/reparation-spa/montreal` fonctionne,
liens directs fonctionnent, sitemap dynamique sur `/sitemap.xml`
fonctionne.
