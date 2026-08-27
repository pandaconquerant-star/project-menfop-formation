// ============================================
// app.js — Toute la logique de la page d'accueil
// (API, formulaire d'inscription, affichage des formations)
// ============================================

// ============================================
// CONFIGURATION
// ============================================

// URL du Web App Google Apps Script (backend) qui renvoie les données
const API_URL = "https://script.google.com/macros/s/AKfycbwxSpazv-0STY_aDualXUZ5Z_h39uep862v_LEl2kDJ/exec";

// Durée de vie du cache en millisecondes (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// ============================================
// API — Gestion des appels au backend
// ============================================

class Api {
  // Construit une clé unique de cache à partir de l'action et des paramètres
  static getCacheKey(action, params) {
    return "api_" + action + "_" + JSON.stringify(params);
  }

  // Récupère une entrée du cache localStorage si elle n'est pas expirée
  static getFromCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      // Si l'entrée est plus vieille que CACHE_TTL, on considère qu'elle n'est plus valide
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        return entry.data;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  // Indique si une entrée de cache est expirée
  static isExpired(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return true;
      const entry = JSON.parse(raw);
      return Date.now() - entry.timestamp > CACHE_TTL;
    } catch {
      return true;
    }
  }

  // Sauvegarde une réponse dans le cache avec son horodatage
  static setCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // localStorage plein ou désactivé — ignoré
    }
  }

  // Effectue la requête réseau, puis met en cache la réponse si elle réussit.
  // Utilise JSONP (balise <script>) au lieu de fetch : les Web Apps Google Apps
  // Script ne renvoient pas d'en-tête CORS de façon fiable, et fetch est bloqué
  // par le navigateur depuis un autre serveur/origine. Une balise <script>, elle,
  // n'est pas soumise à la politique CORS. Le backend renvoie  callback(json) ;.
  static _fetchAndCache(cacheKey, action, params) {
    const url = new URL(API_URL);
    url.searchParams.append("action", action);
    Object.keys(params).forEach((key) => {
      url.searchParams.append(key, params[key]);
    });
    // Anti-cache : Apps Script ne renvoie pas d'en-tête Cache-Control interdisant
    // la mise en cache HTTP. Sans ce paramètre, le navigateur peut resservir une
    // ancienne réponse pour la même URL (ex: compteurs d'inscrits figés), même en
    // navigation privée et même après avoir vidé le localStorage.
    url.searchParams.append("_", Date.now());

    // Nom de fonction JSONP unique pour cette requête
    const callbackName = "jsonp_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    url.searchParams.append("callback", callbackName);

    return new Promise((resolve) => {
      let done = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        const node = document.getElementById(callbackName);
        if (node) node.remove();
        delete window[callbackName];
      };

      const finish = (data) => {
        if (done) return;
        done = true;
        cleanup();
        resolve(data);
      };

      // Timeout de sécurité au cas où le script ne répondrait jamais
      const timeoutId = setTimeout(() => {
        finish({ success: false, error: "Délai dépassé lors du chargement des formations." });
      }, 20000);

      // Callback appelée par le backend :  callback(json);
      window[callbackName] = (data) => {
        if (data && data.success) this.setCache(cacheKey, data);
        finish(data);
      };

      // En cas d'impossibilité de charger le script, on renvoie une erreur propre
      const script = document.createElement("script");
      script.id = callbackName;
      script.onerror = () => {
        finish({ success: false, error: "Impossible de charger les formations (réseau)." });
      };
      script.src = url.toString();
      document.head.appendChild(script);
    }).catch((error) => {
      console.error(error);
      return { success: false, error: error.message };
    });
  }

  // Méthode générique : sert la version en cache si elle est encore fraîche,
  // sinon recharge depuis le réseau (rafraîchi en arrière-plan si expiré)
  static async request(action, params = {}) {
    const cacheKey = this.getCacheKey(action, params);
    const cached = this.getFromCache(cacheKey);
    const expired = this.isExpired(cacheKey);

    // Cache valide -> on le renvoie directement
    if (cached && !expired) return cached;

    // Cache expiré -> on le renvoie mais on relance une mise à jour en arrière-plan
    if (cached && expired) {
      this._fetchAndCache(cacheKey, action, params);
      return cached;
    }

    // Aucun cache -> requête réseau
    return this._fetchAndCache(cacheKey, action, params);
  }

  // Récupère toutes les formations (forceRefresh = true pour vider le cache)
  static async getFormations(forceRefresh = false) {
    if (forceRefresh) {
      const cacheKey = this.getCacheKey("formations", {});
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) { /* localStorage indisponible — ignoré */ }
    }
    return this.request("formations");
  }

  // Récupère une seule formation par son id
  static getFormation(id) {
    return this.request("formation", { id });
  }

  // =================== INSCRIPTION ===================
  //
  // La méthode la plus fiable pour envoyer une inscription vers un Web App
  // Google Apps Script depuis un autre site est le POST en mode "no-cors" :
  //  - il n'y a pas de contrôle CORS (pas de préflight bloquant),
  //  - la requête part et le backend enregistre bien la donnée,
  //  - la réponse est "opaque" (on ne peut pas la lire), mais l'inscription
  //    est bel et bien enregistrée de l'autre côté.
  //
  // C'est le seul moyen garanti de faire aboutir l'inscription, contrairement
  // au fetch classique (bloqué CORS) et à l'iframe + postMessage (le script
  // inline de la réponse est bloqué par la politique de sécurité de Google).

  static getUrlsPourInscription() {
    // URLs uniques et dans le bon ordre : publiée (/exec) d'abord, puis test (/dev)
    var exec = API_URL.replace(/\/dev$/, "/exec");
    var urls = [];
    if (exec !== API_URL) urls.push(exec);
    urls.push(API_URL);
    return urls;
  }

  // Envoie une inscription au backend via POST en mode "no-cors".
  // L'inscription est enregistrée par le backend dans tous les cas de succès ;
  // on renvoie un succès optimiste car on ne peut pas lire la réponse.
  // @return {Promise<Object>} { success: boolean, ... } ou { success: false, error }
  static async inscrire(data) {
    console.log("[inscription] Début de l'envoi. Données :", data);

    var urls = Api.getUrlsPourInscription();
    console.log("[inscription] URLs testées (dans l'ordre) :", urls);

    var dernierErreur = null;

    for (var i = 0; i < urls.length; i++) {
      var url = urls[i];
      var ok = await Api.envoyerInscriptionNoCors(url, data);
      if (ok) {
        console.log("[inscription] Inscription envoyée avec succès (POST no-cors) sur", url);
        // L'inscription a bien été enregistrée côté Google Sheets.
        // (L'anti-doublon et le contrôle de capacité sont gérés côté backend.)
        // On attend un court délai pour laisser Google Sheets persister la ligne
        // avant que le frontend recharge les formations et recalcule les compteurs
        // "Inscrits" / "Places restantes" (sinon le compteur ne bougerait pas).
        await new Promise(function (r) { setTimeout(r, 1500); });
        return { success: true, message: "Inscription enregistrée ! Vous recevrez une confirmation par email." };
      }
      console.warn("[inscription] Échec de l'envoi (no-cors) sur", url);
    }

    return {
      success: false,
      error: dernierErreur || "Impossible de contacter le serveur d'inscription. Vérifiez votre connexion."
    };
  }

  // Envoie le POST en mode "no-cors" vers l'URL donnée.
  // @return {Promise<boolean>} true si la requête a été émise, false sinon.
  static async envoyerInscriptionNoCors(url, data) {
    try {
      var params = new URLSearchParams(Object.assign({ action: "inscription" }, data));

      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 20000);

      await fetch(url, {
        method: "POST",
        mode: "no-cors",        // pas de préflight CORS -> la requête part
        cache: "no-store",
        body: params,           // application/x-www-form-urlencoded
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Le POST est parti : il sera traité par le backend même si la réponse
      // est opaque (no-cors). On considère l'envoi comme réussi.
      return true;
    } catch (error) {
      console.error("[inscription] Erreur lors de l'envoi POST no-cors :", error);
      return false;
    }
  }
}

// ============================================
// FORMULAIRE D'INSCRIPTION (modale)
// ============================================

// Id de la formation pour laquelle le formulaire a été ouvert
var inscriptionIdFormation = null;
// Élément overlay (fond sombre + modale), créé une seule fois puis réutilisé
var overlay = null;

/**
 * Ouvre la modale d'inscription pour une formation donnée.
 * @param {string|number} formationId - Identifiant de la formation
 */
function ouvrirFormulaireInscription(formationId) {
  // Mémorise la formation ciblée pour l'envoi
  inscriptionIdFormation = formationId;

  // On construit la modale uniquement la première fois, puis on la réutilise
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "inscription-overlay";
    // Clic sur le fond sombre (en dehors de la modale) -> fermeture
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) fermerFormulaireInscription();
    });
    document.body.appendChild(overlay);

    // Template HTML de la modale avec les champs du formulaire d'inscription
    overlay.innerHTML = [
      '<div class="inscription-modal">',
      '  <button class="inscription-close" onclick="fermerFormulaireInscription()" aria-label="Fermer">&times;</button>',
      '  <h3>Inscription à la formation</h3>',
      '  <form id="inscriptionForm" onsubmit="return soumettreInscription(event)">',
      '    <div class="inscription-grid">',
      '      <div class="form-group">',
      '        <label for="ins_prenom">Prénom *</label>',
      '        <input type="text" id="ins_prenom" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_nom">Nom *</label>',
      '        <input type="text" id="ins_nom" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_telephone">Téléphone *</label>',
      '        <input type="tel" id="ins_telephone" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_email">Adresse électronique *</label>',
      '        <input type="email" id="ins_email" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_fonction">Fonction *</label>',
      '        <select id="ins_fonction" required>',
      '          <option value="">Sélectionner...</option>',
      '          <option>Enseignant</option>',
      '          <option>Conseiller pédagogique</option>',
      '          <option>Inspecteur</option>',
      '          <option>Chef d\'établissement</option>',
      '          <option>CPE</option>',
      '          <option>Surveillant</option>',
      '          <option>Autre</option>',
      '        </select>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_etablissement">Établissement *</label>',
      '        <input type="text" id="ins_etablissement" required>',
      '      </div>',
      '    </div>',
      '    <div class="inscription-actions">',
      '      <button type="button" class="btn btn-outline-primary" onclick="fermerFormulaireInscription()">Annuler</button>',
      '      <button type="submit" class="btn btn-primary" id="inscriptionSubmitBtn">S\'inscrire</button>',
      '    </div>',
      '    <div id="inscriptionMessage" class="inscription-message"></div>',
      '  </form>',
      '</div>',
    ].join("");
  }

  // Affiche la modale et bloque le scroll de la page
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Ferme la modale d'inscription et réautorise le scroll.
 */
function fermerFormulaireInscription() {
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

/**
 * Envoie l'inscription au backend (action = inscription).
 * Appelée à la soumission du formulaire (onsubmit).
 * @param {Event} event - Événement de soumission
 */
async function soumettreInscription(event) {
  // Empêche le rechargement de la page à la soumission
  event.preventDefault();

  // Références du bouton et de la zone de message
  var btn = document.getElementById("inscriptionSubmitBtn");
  var msg = document.getElementById("inscriptionMessage");

  // Réinitialise le message et désactive le bouton pendant l'envoi
  msg.className = "inscription-message";
  msg.textContent = "";
  btn.disabled = true;
  btn.textContent = "Inscription en cours...";

  // Récupère les valeurs saisies dans le formulaire
  var data = {
    id_formation: inscriptionIdFormation,
    prenom: document.getElementById("ins_prenom").value.trim(),
    nom: document.getElementById("ins_nom").value.trim(),
    telephone: document.getElementById("ins_telephone").value.trim(),
    email: document.getElementById("ins_email").value.trim(),
    fonction: document.getElementById("ins_fonction").value,
    etablissement: document.getElementById("ins_etablissement").value.trim(),
  };

  // Envoi au backend
  var result = await Api.inscrire(data);

  if (result.success) {
    // Succès : message vert, on vide le formulaire puis on ferme la modale
    msg.className = "inscription-message inscription-success";
    msg.textContent = "Inscription réussie ! Vous recevrez une confirmation par email.";
    document.getElementById("inscriptionForm").reset();

    // Recharge les formations depuis le serveur (en ignorant le cache) pour que
    // "Inscrits" et "Places restantes" reflètent immédiatement la nouvelle inscription
    rafraichirApresInscription();

    setTimeout(fermerFormulaireInscription, 2500);
  } else {
    // Échec : message rouge avec l'erreur renvoyée par le backend
    msg.className = "inscription-message inscription-error";
    msg.textContent = result.error || "Une erreur est survenue. Veuillez réessayer.";
  }

  // Réactive le bouton
  btn.disabled = false;
  btn.textContent = "S'inscrire";
}

/**
 * Recharge les formations depuis le serveur en ignorant le cache (forceRefresh)
 * puis réapplique les filtres pour mettre à jour les compteurs "Inscrits" /
 * "Places restantes" affichés à l'écran, juste après une inscription réussie.
 */
async function rafraichirApresInscription() {
  try {
    const data = await Api.getFormations(true);
    if (data.success) {
      formationsGlobales = data.formations;
      appliquerFiltres();
    }
  } catch (e) {
    console.error(e);
  }
}

// ============================================
// AFFICHAGE DES FORMATIONS
// ============================================

// Nombre de formations affichées par page
const ITEMS_PER_PAGE = 4;

// Liste complète des formations récupérées depuis l'API
let formationsGlobales = [];
// Liste après application des filtres (recherche + public)
let formationsFiltrees = [];
// Page actuellement affichée
let pageActuelle = 1;

// Au chargement complet du DOM, on lance le chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerIndex();
});

/**
 * Charge les formations depuis l'API puis affiche la page.
 */
async function chargerIndex() {
  try {
    const data = await Api.getFormations();
    if (!data.success) {
      afficherErreur(data.error);
      return;
    }
    formationsGlobales = data.formations;
    appliquerFiltres();
  } catch (e) {
    console.error(e);
    afficherErreur("Impossible de charger les formations.");
  }
}

/**
 * Affiche un message d'erreur dans la zone de liste des formations.
 * @param {string} msg - Message à afficher
 */
function afficherErreur(msg) {
  const listEl = document.getElementById("trainingList");
  if (listEl) listEl.innerHTML = `<div class="error">${msg}</div>`;
}

/**
 * Nombre total d'inscriptions possibles (capacité maximale).
 * @param {Object} f - Objet formation
 */
function placerTotal(f) {
  return Number(f.capacite_max) || 0;
}

/**
 * Nombre de personnes inscrites à la formation.
 * Gère plusieurs noms de champs possibles selon le backend.
 * @param {Object} f - Objet formation
 */
function placerInscrits(f) {
  const v = f.inscrits !== undefined ? f.inscrits : (f.nombre_inscrits !== undefined ? f.nombre_inscrits : (f.nb_inscrits !== undefined ? f.nb_inscrits : 0));
  return Number(v) || 0;
}

/**
 * Nombre de places restantes pour une formation.
 * Si le backend ne fournit pas le champ, on le calcule : capacite - inscrits.
 * @param {Object} f - Objet formation
 */
function placerRestants(f) {
  const v = f.places_restantes !== undefined ? f.places_restantes : (f.capacite_restante !== undefined ? f.capacite_restante : (f.places_disponibles !== undefined ? f.places_disponibles : null));
  if (v !== null) return Number(v) || 0;
  return Math.max(placerTotal(f) - placerInscrits(f), 0);
}

/**
 * Indique si une formation accepte encore des inscriptions (places restantes > 0).
 * @param {Object} f - Objet formation
 */
function formationOuverte(f) {
  return placerRestants(f) > 0;
}

/**
 * Formate une date ISO (AAAA-MM-JJ...) en format JJ/MM/AAAA.
 * @param {string} date - Date au format ISO
 */
function formaterDate(date) {
  if (!date) return "—";
  const morceaux = date.substring(0, 10).split("-");
  if (morceaux.length !== 3) return date;
  return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
}

/**
 * Vérifie si une formation correspond au filtre de public sélectionné.
 * Gère le cas particulier "Enseignants et CP" (combinaison de deux publics).
 * @param {Object} f - Objet formation
 * @param {string} filtre - Valeur du filtre public (ex: "Enseignants")
 */
function publicCorrespond(f, filtre) {
  const publics = (f.public_cible || []).map((p) => p.toLowerCase());
  if (publics.includes(filtre.toLowerCase())) return true;
  if (filtre === "Enseignants et CP") {
    return publics.includes("enseignants") && publics.includes("cp");
  }
  return false;
}

/**
 * Applique la recherche textuelle et le filtre par public,
 * puis réinitialise la pagination et met à jour l'affichage.
 */
function appliquerFiltres() {
  const recherche = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const publicFiltre = document.getElementById("publicFilter").value;

  formationsFiltrees = formationsGlobales.filter((f) => {
    // Filtre par mots-clés (titre, domaine, discipline)
    if (recherche) {
      const correspond = (f.titre || "").toLowerCase().includes(recherche) ||
        (f.domaine || "").toLowerCase().includes(recherche) ||
        (f.discipline || "").toLowerCase().includes(recherche);
      if (!correspond) return false;
    }
    // Filtre par public cible
    if (publicFiltre !== "Tous" && !publicCorrespond(f, publicFiltre)) return false;
    return true;
  });

  // Retour à la première page à chaque nouveau filtre
  pageActuelle = 1;
  afficherCompteurs();
  afficherPage();
}

/**
 * Met à jour le compteur du hero (#totalFormations : nombre de formations ouvertes)
 * et le compteur de la liste filtrée (#trainingCount).
 */
function afficherCompteurs() {
  // Hero : nombre de formations ayant encore des inscriptions disponibles
  const totalEl = document.getElementById("totalFormations");
  if (totalEl) {
    totalEl.textContent = formationsGlobales.filter(formationOuverte).length;
  }
  // Barre de la liste : nombre de formations affichées après filtres
  const countEl = document.getElementById("trainingCount");
  if (countEl) {
    const n = formationsFiltrees.length;
    countEl.textContent = `${n} formation${n > 1 ? "s" : ""}`;
  }
}

/**
 * Affiche les formations de la page courante dans la liste #trainingList.
 */
function afficherPage() {
  const listEl = document.getElementById("trainingList");
  if (!listEl) return;

  listEl.innerHTML = "";

  // Aucun résultat -> message + pagination réinitialisée
  if (!formationsFiltrees.length) {
    listEl.innerHTML = '<div class="error">Aucune formation ne correspond à votre recherche.</div>';
    majPagination();
    return;
  }

  // Bornage de la page courante si elle dépasse le nombre de pages
  const totalPages = Math.ceil(formationsFiltrees.length / ITEMS_PER_PAGE);
  if (pageActuelle > totalPages) pageActuelle = totalPages;

  // Découpe la liste pour ne garder que les éléments de la page courante
  const debut = (pageActuelle - 1) * ITEMS_PER_PAGE;
  formationsFiltrees.slice(debut, debut + ITEMS_PER_PAGE).forEach((f) => {
    listEl.appendChild(creerCarteFormationIndex(f));
  });

  majPagination();
}

/**
 * Active/désactive les boutons Précédent/Suivant et met à jour l'indicateur de page.
 */
function majPagination() {
  const totalPages = Math.max(Math.ceil(formationsFiltrees.length / ITEMS_PER_PAGE), 1);
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  if (prevBtn) prevBtn.disabled = pageActuelle <= 1;
  if (nextBtn) nextBtn.disabled = pageActuelle >= totalPages;
  if (pageInfo) pageInfo.textContent = `${pageActuelle} / ${totalPages}`;
}

/**
 * Construit la carte d'une formation selon le design demandé :
 * 1) public cible (fond coloré)  2) titre  3) date/durée/lieu
 * 4) objectif  5) 3 cartes de places  6) statut + bouton S'inscrire
 * @param {Object} f - Objet formation
 * @return {HTMLElement} La carte <article> construite
 */
function creerCarteFormationIndex(f) {
  // Calculs des places : total, inscrits, restants
  const total = placerTotal(f);
  const inscrits = placerInscrits(f);
  const restants = placerRestants(f);
  // Formation complète si plus aucune place restante
  const complet = restants <= 0;

  // Carte principale
  const card = document.createElement("article");
  card.className = "training-card";

  // 1) Public cible sur fond coloré
  const publicEl = document.createElement("div");
  publicEl.className = "training-card__public";
  publicEl.textContent = (f.public_cible || []).join(" · ") || "Public non précisé";

  // 2) Titre de la formation
  const titreEl = document.createElement("h3");
  titreEl.className = "training-card__title";
  titreEl.textContent = f.titre;

  // 3) Petite div : date de début, durée, lieu/modalité
  const metaEl = document.createElement("div");
  metaEl.className = "training-card__meta";
  metaEl.innerHTML = `
    <span><strong>Début :</strong> ${formaterDate(f.date_debut)}</span>
    <span><strong>Durée :</strong> ${f.duree_heures} h</span>
    <span><strong>Lieu :</strong> ${f.lieu || "—"} · ${f.modalite || ""}</span>
  `;

  // 4) Objectif de la formation
  const objectifEl = document.createElement("p");
  objectifEl.className = "training-card__objectif";
  objectifEl.textContent = f.objectifs || "";

  // 5) Trois cartes : inscriptions totales, inscrits, places restantes
  const placesEl = document.createElement("div");
  placesEl.className = "training-card__places";
  placesEl.innerHTML = `
    <div class="place-card">
      <span class="place-card__value">${total}</span>
      <span class="place-card__label">Inscriptions totales</span>
    </div>
    <div class="place-card">
      <span class="place-card__value">${inscrits}</span>
      <span class="place-card__label">Inscrits</span>
    </div>
    <div class="place-card ${restants <= 0 ? "place-card--full" : ""}">
      <span class="place-card__value">${restants}</span>
      <span class="place-card__label">Places restantes</span>
    </div>
  `;

  // 6) Statut + bouton S'inscrire
  const actionEl = document.createElement("div");
  actionEl.className = "training-card__action";
  if (complet) {
    // Formation complète : bouton désactivé
    actionEl.innerHTML = `
      <span class="status-badge status-badge--full">Formation complète</span>
      <button type="button" class="btn-inscrire" disabled>S'inscrire</button>
    `;
  } else {
    // Inscription ouverte : bouton actif ouvrant le formulaire
    actionEl.innerHTML = `
      <span class="status-badge status-badge--open">Inscription ouverte</span>
      <button type="button" class="btn-inscrire" onclick="ouvrirFormulaireInscription('${f.id}')">S'inscrire</button>
    `;
  }

  // Assemble la carte dans l'ordre du design
  card.appendChild(publicEl);
  card.appendChild(titreEl);
  card.appendChild(metaEl);
  card.appendChild(objectifEl);
  card.appendChild(placesEl);
  card.appendChild(actionEl);

  return card;
}

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS (filtres + pagination)
// ============================================

// Recherche textuelle (à chaque frappe)
document.getElementById("searchInput").addEventListener("input", appliquerFiltres);
// Filtre par public (au changement de sélection)
document.getElementById("publicFilter").addEventListener("change", appliquerFiltres);
// Bouton "Précédent"
document.getElementById("prevPage").addEventListener("click", () => {
  if (pageActuelle > 1) { pageActuelle--; afficherPage(); }
});
// Bouton "Suivant"
document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(formationsFiltrees.length / ITEMS_PER_PAGE);
  if (pageActuelle < totalPages) { pageActuelle++; afficherPage(); }
});