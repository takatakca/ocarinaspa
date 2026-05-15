Je vais appliquer uniquement les ajustements de déploiement MochaHost demandés, sans toucher à l’UI ni aux fonctionnalités.

## Plan

1. **Créer/remplacer le wrapper cPanel `server.cjs`**
   - Ajouter un point d’entrée CommonJS compatible cPanel.
   - Le wrapper pointera vers :
     ```text
     dist/server/server.js
     ```
   - Garder `server.cjs` comme fichier de démarrage MochaHost.

2. **Aligner `package.json`**
   - Mettre `npm start` sur :
     ```text
     node server.cjs
     ```
   - Conserver `sirv` dans les dependencies pour que `Run NPM Install` l’installe en production.

3. **Corriger la documentation MochaHost**
   - Remplacer les références à `server.js` comme startup file par `server.cjs`.
   - Corriger la structure attendue : `dist/client`, `dist/server/server.js`, `node_modules`.
   - Ajouter le rappel : si `sirv` manque encore sur cPanel, supprimer `node_modules` puis relancer `Run NPM Install`.

4. **Vérifier localement**
   - Lancer les vérifications nécessaires après modification, notamment `npm install`, `npm run build:node`, puis tester que `npm start` lance bien le serveur Node avec le bon chemin serveur.