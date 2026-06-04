# Google Ads & GA4 Conversion Tracking — OcarinaSpa.ca

## Identifiants

- **Google Ads ID** : `AW-18182973757`
- **Google Analytics 4 Measurement ID** : `G-8YYZKVZBW0`
- Tag global (`gtag.js`) chargé dans `<head>` via `src/routes/__root.tsx` — actif sur **toutes les pages**.
- Helpers de tracking : `src/lib/gtag.ts`.

> **Configuration combinée** : un seul script `gtag.js` est chargé (avec l'ID GA4). Les deux propriétés sont configurées côte à côte :
> ```js
> gtag('config', 'AW-18182973757');
> gtag('config', 'G-8YYZKVZBW0');
> ```

## Événements suivis

| Nom de l'événement      | Catégorie    | Label affiché        | Quand il se déclenche                                  |
|-------------------------|--------------|----------------------|--------------------------------------------------------|
| `phone_call`            | Ocarina Spa  | Phone Click          | Clic sur n'importe quel lien `tel:8199137727`          |
| `form_submit`           | Ocarina Spa  | Form Submit          | Soumission réussie du formulaire de demande de service |
| `quick_submission`      | Ocarina Spa  | Quick Submission     | Clic sur les boutons "Soumission rapide / Demander"   |
| `diagnostic_complete`   | Ocarina Spa  | Diagnostic Complete  | L'AI a renvoyé un résultat sur `/diagnostic`           |

Chaque événement est **dédupliqué** par clic / soumission (voir `trackEvent` dans `gtag.ts`)
pour éviter les doubles déclenchements.

## Où c'est branché dans le code

| Événement              | Fichiers                                                                                              |
|------------------------|-------------------------------------------------------------------------------------------------------|
| `trackPhoneCall`       | `Header.tsx`, `StickyCallButton.tsx`, `EmergencyBanner.tsx`, `Footer.tsx`, routes (`index`, `contact`, `diagnostic`, `marques`, `urgence-spa`, `pieces`, `piscine`, `vente-spas`, `en`) |
| `trackFormSubmit`      | `ServiceRequestForm.tsx` (callback `onSubmit` après succès)                                           |
| `trackQuickSubmission` | `RepairsGrid.tsx`, `CityServicePage.tsx`, `diagnostic.tsx` (CTA "Demander une soumission")            |
| `trackDiagnosticComplete` | `routes/diagnostic.tsx` (après réception du résultat de `diagnoseSpaIssue`)                        |

## Système à 2 couches (Google Ads + GA4)

Le helper `trackEvent` envoie **toujours** un événement nommé qui remonte à la fois dans :
- **Google Analytics 4** (comme événement custom : `phone_call`, `form_submit`, etc.)
- **Google Tag Assistant** (pour le débogage)

```js
gtag('event', 'phone_call', {
  event_category: 'Ocarina Spa',
  event_label: 'Phone Click'
});
```

Et, **si un vrai label Google Ads est configuré**, il envoie en plus la
conversion officielle Google Ads :

```js
gtag('event', 'conversion', {
  send_to: 'AW-18182973757/abcDEF123_XYZ',
  event_category: 'Ocarina Spa',
  event_label: 'phone_call'
});
```

Tant que les labels ne sont pas remplis, **rien n'est cassé** : les événements
continuent à remonter dans GA4 (Temps réel > Événements) et dans Google Tag Assistant.

## Comment remplacer les labels Google Ads

1. Dans Google Ads, créer 4 actions de conversion :
   - Phone Call
   - Form Submit
   - Quick Submission
   - Diagnostic Complete
2. Pour chacune, Google fournit un snippet du style :
   ```js
   send_to: 'AW-18182973757/abcDEF123_XYZ'
   ```
3. Copier **uniquement la partie après le `/`** (ex. `abcDEF123_XYZ`).
4. Ouvrir `src/lib/gtag.ts` et remplacer dans `AW_LABELS` :

   ```ts
   export const AW_LABELS: Record<EventName, string> = {
     phone_call: "abcDEF123_XYZ",
     form_submit: "REMPLACER_LABEL_ICI",
     quick_submission: "REMPLACER_LABEL_ICI",
     diagnostic_complete: "REMPLACER_LABEL_ICI",
   };
   ```

5. Republier le site. Aucun autre changement nécessaire.

## Tester avec Google Tag Assistant

1. Installer l'extension Chrome **Tag Assistant Companion**.
2. Ouvrir https://tagassistant.google.com/ → **Add domain** → entrer `https://ocarinaspa.ca`.
3. Naviguer sur le site dans la fenêtre Tag Assistant.
4. Vérifier que :
   - Le tag `AW-18182973757` apparaît en **Loaded** sur chaque page.
   - Cliquer sur le numéro `819-913-7727` → un événement `phone_call` apparaît.
   - Soumettre le formulaire → un événement `form_submit`.
   - Cliquer "Demander une soumission" → `quick_submission`.
   - Compléter le diagnostic AI → `diagnostic_complete`.
5. Une fois les labels Ads remplis, un événement supplémentaire **conversion**
   apparaît avec le bon `send_to`.

### Diagnostic Google Ads

Dans Google Ads → **Outils → Diagnostics du tag** : confirmer que la balise
`AW-18182973757` est détectée comme **Active — Recent activity**.
