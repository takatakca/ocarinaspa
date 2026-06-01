export type ErrorCode = {
  code: string;
  title: string;
  meaning: string;
  causes: string[];
  action: string;
};

export const SPA_ERROR_CODES: ErrorCode[] = [
  {
    code: "FLO",
    title: "FLO — débit d'eau insuffisant",
    meaning: "Le capteur de débit ne détecte plus de circulation d'eau dans le spa.",
    causes: ["Filtre bouché ou sale", "Pompe de circulation morte", "Vanne fermée", "Air dans la plomberie", "Capteur de débit (flow switch) défectueux"],
    action: "Vérifier le filtre, purger l'air, puis appeler un technicien si le code persiste.",
  },
  {
    code: "FLC",
    title: "FLC — capteur de débit collé",
    meaning: "Le capteur de débit envoie un signal alors qu'aucune pompe ne fonctionne.",
    causes: ["Capteur de débit défectueux", "Relais collé", "Carte électronique défaillante"],
    action: "Remplacement du flow switch ou diagnostic du pack électronique requis.",
  },
  {
    code: "OH",
    title: "OH — surchauffe du spa",
    meaning: "La température de l'eau dépasse 42 °C (108 °F). Le spa coupe par sécurité.",
    causes: ["Pompe qui tourne trop longtemps", "Sonde de température défectueuse", "Filtre obstrué", "Couvercle laissé fermé en été"],
    action: "Couper l'alimentation, retirer le couvercle, laisser refroidir. Si récurrent : sonde à remplacer.",
  },
  {
    code: "DR",
    title: "DR / DRY — manque d'eau (chauffe-eau à sec)",
    meaning: "Le chauffe-eau ne détecte plus d'eau et coupe par sécurité.",
    causes: ["Niveau d'eau bas", "Air dans la plomberie", "Pompe désamorcée", "Vanne fermée"],
    action: "Remettre de l'eau, purger les pompes, redémarrer. Sinon : diagnostic technicien.",
  },
  {
    code: "SN",
    title: "SN / SNA / SNB — sonde de température défectueuse",
    meaning: "Une sonde (température ou haute limite) ne lit plus correctement.",
    causes: ["Sonde défectueuse", "Câble pincé ou corrodé", "Connexion lâche sur la carte"],
    action: "Remplacement de la sonde — pièce courante Balboa / Gecko.",
  },
  {
    code: "ICE",
    title: "ICE — risque de gel",
    meaning: "La température approche du point de congélation. Mode protection activé.",
    causes: ["Spa non chauffé en hiver", "Panne électrique", "Chauffe-eau brûlé"],
    action: "Réparation URGENTE en hiver pour éviter le gel de la plomberie. Service d'urgence 24/7.",
  },
  {
    code: "HL",
    title: "HL — limite haute (high limit)",
    meaning: "Le capteur de haute limite a coupé l'alimentation du chauffe-eau.",
    causes: ["Surchauffe", "Sonde défectueuse", "Circulation insuffisante"],
    action: "Identique à OH — couper, refroidir, faire diagnostiquer.",
  },
  {
    code: "LF",
    title: "LF — débit persistant insuffisant",
    meaning: "Plusieurs erreurs FLO consécutives — le spa désactive le chauffage.",
    causes: ["Filtre très bouché", "Pompe usée", "Capteur de débit à remplacer"],
    action: "Nettoyer ou remplacer le filtre. Si persistant : intervention technique requise.",
  },
];
