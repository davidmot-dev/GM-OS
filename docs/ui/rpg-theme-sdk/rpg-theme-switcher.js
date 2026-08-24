/* ==========================================================================
   RPG THEME SDK — SWITCHER (v2)
   --------------------------------------------------------------------------
   Utilisation :
     RPGTheme.set("alien");
     RPGTheme.list();            -> les thèmes réellement chargés
     RPGTheme.get();

   Les <select data-rpg-theme-selector> sont remplis ET synchronisés
   automatiquement : on ne recopie plus la liste des thèmes dans le HTML.

   --------------------------------------------------------------------------
   CE QUI CHANGE PAR RAPPORT À LA v1, ET POURQUOI
   --------------------------------------------------------------------------

   **La liste des thèmes était déclarée QUATRE fois** : `VALID_THEMES` ici,
   `themes.json`, les <link> de la preview, et ses <option>. Ajouter un jeu
   demandait quatre modifications, et en oublier une échouait **en silence** —
   `normalizeTheme` retombait sur "alien" sans rien dire, donc le thème neuf
   semblait simplement « ne pas marcher ».

   Désormais **les <link> font foi**, et c'est la seule source qui ne peut pas
   mentir : un thème dont la CSS n'est pas chargée ne peut pas s'appliquer, quoi
   qu'en dise un registre. On lit donc ce qui EST là plutôt que ce qu'on a
   déclaré ailleurs.

       <link rel="stylesheet" href="../themes/alien.css"
             data-rpg-theme="alien" data-rpg-name="ALIEN">

   `themes.json` reste le registre destiné à l'application hôte (métadonnées,
   versions) ; il ne pilote plus le switcher.
   ========================================================================== */

(() => {
  const STORAGE_KEY = "rpg-ui-theme";

  /**
   * Les thèmes réellement chargés, lus sur les <link> qui les apportent.
   *
   * Relu à chaque appel plutôt que mis en cache : une application hôte peut
   * injecter le thème d'un jeu après le premier rendu.
   */
  function themesCharges() {
    const trouves = new Map();
    document.querySelectorAll("link[data-rpg-theme]").forEach((lien) => {
      const id = (lien.dataset.rpgTheme || "").trim();
      if (id) trouves.set(id, lien.dataset.rpgName || id);
    });
    return trouves;
  }

  /** Le premier thème chargé, à défaut d'un choix explicite. */
  function themeParDefaut() {
    const premier = themesCharges().keys().next();
    return premier.done ? null : premier.value;
  }

  /**
   * Rend le thème demandé s'il est chargé, sinon le défaut — **et le dit**.
   *
   * En v1 le repli était muet : un identifiant mal orthographié rendait
   * silencieusement "alien", et on cherchait le défaut dans la CSS.
   */
  function normaliser(theme) {
    const charges = themesCharges();
    if (charges.has(theme)) return theme;

    const repli = themeParDefaut();
    if (theme) {
      console.warn(
        `[RPGTheme] Le thème « ${theme} » n'est pas chargé — aucun ` +
          `<link data-rpg-theme="${theme}"> dans la page. ` +
          (repli ? `Repli sur « ${repli} ».` : "Aucun thème disponible.")
      );
    }
    return repli;
  }

  /** Remplit et synchronise les sélecteurs, pour que le HTML n'ait rien à recopier. */
  function majSelecteurs(theme) {
    const charges = themesCharges();
    document.querySelectorAll("[data-rpg-theme-selector]").forEach((select) => {
      const attendu = [...charges.keys()].join(",");
      if (select.dataset.rpgRempli !== attendu) {
        select.textContent = "";
        for (const [id, nom] of charges) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = nom;
          select.appendChild(option);
        }
        select.dataset.rpgRempli = attendu;
      }
      if (theme && select.value !== theme) select.value = theme;
    });
  }

  function appliquer(theme, options = {}) {
    const { persist = true, emit = true } = options;
    const retenu = normaliser(theme);
    if (!retenu) return null;

    document.documentElement.dataset.theme = retenu;
    majSelecteurs(retenu);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, retenu);
      } catch (_) {
        /* navigation privée, stockage refusé : le thème s'applique quand même */
      }
    }

    if (emit) {
      document.dispatchEvent(
        new CustomEvent("rpgthemechange", { detail: { theme: retenu } })
      );
    }

    return retenu;
  }

  function themeMemorise() {
    try {
      const garde = localStorage.getItem(STORAGE_KEY);
      return themesCharges().has(garde) ? garde : null;
    } catch (_) {
      return null;
    }
  }

  function init() {
    /*
      L'ordre décide : l'attribut posé dans le HTML l'emporte sur la mémoire du
      navigateur. Une page qui déclare `data-theme="noc"` veut s'ouvrir en NOC,
      même si on a regardé Star Trek la dernière fois.

      ⚠️ **Dans une application hôte, ce n'est PAS le bon propriétaire.** GM-OS
      tient le thème dans son store, lié à la campagne : la mémoire du
      navigateur y ferait un second écrivain, et deux écrivains pour une même
      vérité est le défaut que ce projet paie le plus souvent. Voir le README,
      section « Intégration dans une application hôte ».
    */
    const declare = document.documentElement.dataset.theme;
    appliquer(declare || themeMemorise(), { persist: false, emit: false });

    document.addEventListener("change", (event) => {
      const selecteur = event.target.closest("[data-rpg-theme-selector]");
      if (selecteur) appliquer(selecteur.value);
    });
  }

  window.RPGTheme = {
    set: (theme) => appliquer(theme),
    get: () => document.documentElement.dataset.theme || null,
    /** Les thèmes réellement chargés — jamais une liste écrite à la main. */
    list: () => [...themesCharges().keys()],
    /** `[{ id, name }]`, pour construire un sélecteur ailleurs. */
    catalogue: () => [...themesCharges()].map(([id, name]) => ({ id, name })),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
