# Admin Setup — Ocarina Spa

Guide court pour créer le premier compte admin et tester le flow facturation.

## 1. Attribution du rôle admin

Le rôle `admin` est stocké dans la table `user_roles` (protégée par RLS —
seuls les admins existants ou le service role peuvent y écrire). Aucun
utilisateur public ne peut s'auto-attribuer `admin`.

Deux façons d'accorder l'accès admin :

### A) Bootstrap sécurisé via `ADMIN_EMAILS` (recommandé pour le 1er admin)

1. Dans Lovable Cloud → Backend → Secrets, ajouter la variable :
   ```
   ADMIN_EMAILS=proprio@ocarinaspa.ca
   ```
   Plusieurs emails séparés par virgule sont acceptés :
   `admin1@ocarinaspa.ca,admin2@ocarinaspa.ca`

2. La personne crée son compte sur `/auth` avec **exactement** cet email.

3. Elle visite `/admin/factures`. Le serveur vérifie sa session JWT, compare
   l'email vérifié à `ADMIN_EMAILS`, et si ça correspond, insère le rôle
   `admin` via le service role (bypass RLS). L'accès est ouvert immédiatement.

Sécurité :
- L'email doit provenir du JWT Supabase (session valide) — pas d'un champ
  contrôlable par le client.
- `ADMIN_EMAILS` n'est jamais exposé au frontend (server-only).
- Retirer l'email de `ADMIN_EMAILS` après le bootstrap si désiré ; le rôle
  déjà inséré reste actif.

### B) Insertion manuelle via SQL (compte déjà créé)

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'proprio@ocarinaspa.ca'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 2. Vérifier le rôle admin

```sql
SELECT u.email, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id;
```

## 3. Protection des routes

- `/admin/factures` → sous `_authenticated/`
  - Non connecté → redirection `/auth`
  - Connecté sans rôle admin → écran "Accès refusé"
  - Admin → accès complet
- `/payer-facture` → public, seule route utilisable par les clients
- Aucune liste de factures n'est exposée publiquement (RLS bloque `anon`)
- Aucune clé Stripe secrète dans le frontend (`STRIPE_SECRET_KEY` server-only)

## 4. Tester `/admin/factures`

1. Se connecter sur `/auth`
2. Aller sur `/admin/factures`
3. Créer une facture test (client, description, montant)
4. Copier le **numéro de facture** affiché
5. Optionnel : cliquer "Envoyer au client" pour l'email Stripe

## 5. Tester `/payer-facture` (côté client)

1. Ouvrir `/payer-facture`
2. Entrer le numéro de facture + email OU 7 derniers chiffres du téléphone
3. Cliquer "Payer" → redirection vers la page hébergée Stripe sécurisée
4. Payer avec carte test Stripe : `4242 4242 4242 4242`, date future, CVC libre
5. Le webhook `invoice.paid` met à jour le statut local dans `stripe_invoices`
6. Rafraîchir `/admin/factures` → statut "Payée"

## 6. Variables d'environnement requises

Server-only (Lovable Cloud secrets) :
- `STRIPE_SECRET_KEY` — clé secrète Stripe (`sk_test_...` ou `sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` — signing secret du webhook (`whsec_...`)
- `ADMIN_EMAILS` — optionnel, allow-list pour bootstrap admin
- `SUPABASE_SERVICE_ROLE_KEY` — géré automatiquement par Lovable Cloud

Aucune variable Stripe côté frontend n'est nécessaire.
