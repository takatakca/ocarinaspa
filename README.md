# Ocarina Spa — ocarinaspa.ca

Application TanStack Start / React pour le site public et les opérations Ocarina Spa (diagnostic, demandes de service, facturation Stripe, suivi et automatisation).

**Dépôt principal :** https://github.com/takatakca/ocarinaspa — branche `main`.

## Continuer le travail

1. Lire `AGENTS.md` et les dernières entrées de `WORKLOG.md` avant toute modification. Vérifier les PR ouvertes.
2. Lire `LAUNCH_CHECKLIST.md` et `PRE_LIVE_AUDIT.md` pour les contrôles de production non terminés.
3. Modifier le code existant sans réinitialiser les données ni exposer les secrets. Documenter les changements et actualiser `WORKLOG.md`.
4. Utiliser Node.js 22. Les commandes sont `npm ci`, `npm run prelive:check`, `npm run build:node` et `npm start` (après build).
5. Pour MochaHost/cPanel, lire `MOCHAHOST_DEPLOY.md`. GitHub Actions crée un artefact Node hors du serveur. Le déploiement automatique est **désactivé par défaut** jusqu'à la vérification des prérequis.
6. Ne pas considérer un `push` GitHub comme une preuve de déploiement. Consulter le journal GitHub Actions, puis vérifier le domaine et les contrôles `/admin/qa`.

## Règles de production

- TAKATAK reste la couche maîtresse de l'identité interproduits lorsqu'une intégration est ajoutée. Ocarina Spa conserve ses données et autorisations métier tenant-scopées.
- La création financière, les remboursements et les opérations sensibles restent derrière les validations d'administration.
- Les clés Stripe secrètes et les accès Supabase service role ne doivent jamais être présents dans le navigateur, dans les commits ou dans les artefacts publics.
- Les clés `VITE_*` sont publiques : vérifier les règles RLS et les restrictions fournisseurs.
- L'ancien fichier `.env` suivi par Git ne contenait que des variables Supabase publiques, mais a été retiré du suivi pour éviter l'ajout futur de secrets. L'historique Git peut conserver ses anciennes versions.
- Le backend du diagnostic IA peut encore nécessiter une migration de fournisseur : l'indépendance du build vis-à-vis de Lovable **n'implique pas** que toutes les intégrations IA aient été remplacées.

La décision de mise en production est documentée dans `LAUNCH_CHECKLIST.md` et ne doit pas être contournée.
