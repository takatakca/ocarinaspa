# OcarinaSpa.ca — Checklist de lancement

Guide pratique pour mettre le site en production et opérer les factures, l'expérience client et le suivi.

---

## 1. Secrets requis

À configurer dans **Backend → Secrets** (jamais dans le code, jamais dans GitHub) :

### Admin
| Secret | Description |
|---|---|
| `ADMIN_EMAILS` | Emails admin séparés par virgules (ex. `owner@ocarinaspa.ca`) |

### Stripe (mode live pour production)
| Secret | Où le trouver |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → endpoint `whsec_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (safe côté client) |

### Interac
| Secret | Notes |
|---|---|
| `INTERAC_RECIPIENT_EMAIL` | Courriel Interac officiel Ocarina Spa |
| `INTERAC_RECIPIENT_NAME` | `Ocarina Spa` |
| `INTERAC_SECURITY_QUESTION` | **Laisser vide si autodépôt activé** |
| `INTERAC_SECURITY_ANSWER` | **Laisser vide si autodépôt activé** |

### Liens publics (VITE_ = exposés côté client, c'est OK)
| Secret | Exemple |
|---|---|
| `VITE_GOOGLE_REVIEW_URL` | `https://g.page/r/CXXXXXXX/review` |
| `VITE_FACEBOOK_PAGE_URL` | `https://facebook.com/ocarinaspa` |

⚠️ **Sécurité** :
- `sk_live_`, `whsec_`, `SUPABASE_SERVICE_ROLE_KEY` : **jamais** côté frontend.
- Révoquer toute clé partagée dans un chat, email ou repo public.
- Rotation recommandée à chaque changement d'équipe.

---

## 2. Configuration Stripe

### Webhook
1. Stripe Dashboard → Developers → **Webhooks** → Add endpoint
2. URL : `https://ocarinaspa.ca/api/public/stripe-webhook`
3. Événements à sélectionner :
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.voided`
4. Copier `whsec_...` → mettre dans `STRIPE_WEBHOOK_SECRET`

### Mode test → live
1. Basculer le toggle **Test / Live** dans Stripe
2. Régénérer `sk_...` et `pk_...` en mode live
3. Recréer le webhook côté live (le webhook secret est différent)
4. Mettre à jour les secrets dans Backend
5. Faire une facture réelle de 1 $ pour valider le flow complet

---

## 3. Configuration Interac

Si **autodépôt activé** (recommandé) :
- Renseigner uniquement `INTERAC_RECIPIENT_EMAIL` et `INTERAC_RECIPIENT_NAME`
- Laisser `INTERAC_SECURITY_QUESTION` **vide**
- Le panneau client affichera automatiquement « Autodépôt activé, aucune question requise »

Sinon :
- Renseigner la question ET la réponse
- La réponse n'est **jamais** montrée au client — Ocarina Spa la communique séparément (SMS, appel)

---

## 4. Comment créer une facture (admin)

1. Se connecter avec un email listé dans `ADMIN_EMAILS`
2. Aller sur `/admin/factures`
3. Cliquer **Créer une facture**
4. Renseigner :
   - Nom / courriel / téléphone du client
   - Description du service
   - Montant (CAD)
5. Copier le **numéro de facture** (ex. `OCAR-0042`)
6. Le communiquer au client (SMS, courriel, appel) avec le lien `ocarinaspa.ca/payer-facture`

---

## 5. Comment un client paie

1. Client va sur `/payer-facture`
2. Entre son **numéro de facture** + son **email OU téléphone** (vérification d'identité)
3. Voit sa facture et choisit :
   - **Carte** → redirection Stripe hosted invoice
   - **Interac** → coordonnées de virement affichées
4. Après paiement → `/paiement-confirme` :
   - Note 1-5 étoiles
   - 4-5 étoiles : proposition avis Google + sondage
   - 1-3 étoiles : alerte admin + recueil du problème

---

## 6. Gérer les paiements Interac

1. Client clique « J'ai envoyé le virement » → facture passe en `pending_interac`
2. Ocarina Spa reçoit le virement dans sa banque
3. Admin va sur `/admin/factures`, filtre `pending_interac`
4. Clique **Interac reçu** sur la facture correspondante
5. La facture passe à `interac_received` (puis `paid`) et le lien de sondage est copié dans le presse-papiers
6. Envoyer ce lien au client pour l'inviter à laisser un avis

---

## 7. Gérer les crédits 10%

`/admin/experience` → onglet **Crédits**

- Chaque sondage complété génère un code `OCARINA10-XXXX` (10 % de la facture, valide 90 jours)
- Applicable **en magasin Ocarina Spa uniquement**
- Action **Marquer utilisé** quand le client réclame le crédit
- Filtres : actifs / utilisés / expirés

---

## 8. Consulter `/admin/experience`

Sections disponibles :
- **Vue d'ensemble** : note moyenne, crédits actifs, suivis en attente
- **Sondages** : filtrer par note (1-3 = insatisfaits, 4-5 = ambassadeurs)
- **Crédits** : suivi complet des `OCARINA10-XXXX`
- **Questions service** : questions techniques envoyées après paiement
- **Suivis à faire** : clients 1-3 étoiles à rappeler → action **Résoudre**

---

## 9. Tracking Google Ads / GA4

IDs actifs :
- Google Ads : `AW-18182973757`
- GA4 : `G-8YYZKVZBW0`

Un seul `gtag.js` (chargé dans `src/routes/__root.tsx`).

Événements clés à surveiller dans Tag Assistant / GA4 :
- `invoice_payment_page_view`, `invoice_lookup`, `invoice_found`
- `invoice_pay_click`, `invoice_paid`
- `invoice_interac_selected`, `invoice_interac_received`
- `post_payment_rating_submitted`
- `google_review_click`, `survey_submitted`, `credit_issued`
- `facebook_follow_click`, `service_question_submitted`

---

## 10. Sécurité — vérifications finales

- [x] `/admin/factures` protégé (auth + `has_role('admin')`)
- [x] `/admin/experience` protégé (auth + `has_role('admin')`)
- [x] `/payer-facture` public mais protégé par numéro + email/téléphone
- [x] Aucun accès public aux listes de factures / crédits / sondages complets
- [x] Aucune clé secrète Stripe côté frontend
- [x] RLS actif sur toutes les tables (`stripe_invoices`, `customer_surveys`, `customer_credits`, `service_questions`, `user_roles`)
- [x] Webhook Stripe vérifie la signature (`stripe.webhooks.constructEvent`)
- [x] Rôle admin stocké dans table dédiée `user_roles` (jamais sur profile)

---

## 11. Passage test → live (dernière étape)

1. Configurer tous les secrets `sk_live` / `whsec_` / `pk_live` en mode live
2. Créer une **vraie facture** de petit montant (1-5 $)
3. Se payer soi-même avec une vraie carte
4. Vérifier :
   - Redirection `/paiement-confirme`
   - Événement `invoice.paid` reçu par le webhook (Stripe Dashboard → Events)
   - Statut passé à `paid` dans `/admin/factures`
   - Événements GA4 déclenchés
5. Rembourser la facture test depuis Stripe Dashboard
6. **Prêt pour production réelle.**

---

## Support

- Numéro d'urgence spa : voir footer du site
- Stripe support : dashboard.stripe.com
- Interac troubleshoot : contacter la banque émettrice du virement
