// ==============================================
// formations.js
// Gère l'affichage des formations sous forme de cartes.
// Ce fichier est utilisé à la fois par :
//   - formations.html (catalogue complet)   -> chargerFormations()
//   - index.html (page d'accueil)           -> via creerCarteFormation() appelée depuis accueil.js
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
  // On ne lance le chargement du catalogue que si le conteneur existe sur la page
  // (évite une erreur si ce script est chargé sur index.html sans #formations)
  if (document.getElementById("formations")) {
    init();
  }
});

/* =========================================
   UTILITAIRES
   ========================================= */

function formaterDate(date) {
  if (!date) return "";
  // Gestion format ISO :
  // 2026-09-20T00:00:00.000Z
  const datePure = date.substring(0, 10);
  const morceaux = datePure.split("-");
  if (morceaux.length !== 3) {
    return date;
  }
  return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
}

/**
 * Retourne le badge HTML correspondant à la modalité de la formation.
 */
function getBadge(modalite) {
  switch (modalite) {
    case "Présentiel":
      return `<span class="badge badge-presentiel">Présentiel</span>`;
    case "Distanciel":
      return `<span class="badge badge-distanciel">Distanciel</span>`;
    case "Hybride":
      return `<span class="badge badge-hybride">Hybride</span>`;
    default:
      return `<span class="badge bg-secondary">${modalite}</span>`;
  }
}

/**
 * Retourne un badge indiquant le nombre de places disponibles,
 * avec une couleur qui change selon le niveau de remplissage.
 * NOTE : les données actuelles ne suivent pas le nombre d'inscrits réels,
 * on affiche donc capacite_max comme nombre de places disponibles.
 */
function getBadgePlaces(placesDisponibles) {
  let classe = "badge-places-ok";
  if (placesDisponibles <= 0) {
    classe = "badge-places-complet";
  } else if (placesDisponibles <= 5) {
    classe = "badge-places-limite";
  }

  const texte = placesDisponibles > 0
    ? `${placesDisponibles} place${placesDisponibles > 1 ? "s" : ""} disponible${placesDisponibles > 1 ? "s" : ""}`
    : "Complet";

  return `<span class="badge-places ${classe}">🎟️ ${texte}</span>`;
}

/* =========================================
   CARTE DE FORMATION (RÉUTILISABLE)
   ========================================= */

/**
 * Construit et retourne un élément DOM <div> représentant une carte de formation
 * avec les données essentielles + le nombre de places disponibles + un bouton
 * "Voir plus de détails" qui ouvre la page dédiée formation-details.html?id=...
 *
 * Utilisée à la fois par formations.js (catalogue) et accueil.js (page d'accueil).
 *
 * @param {Object} f - Objet formation (voir doGetFormations() côté backend)
 * @param {Object} [options] - Options d'affichage
 * @param {string} [options.colClass] - Classe de colonne Bootstrap-like (ex: "col-lg-4"). Si absent, pas de wrapper colonne.
 * @return {HTMLElement}
 */
function creerCarteFormation(f, options) {
  options = options || {};
  const placesDisponibles = Number(f.capacite_max) || 0;
  const badge = getBadge(f.modalite);
  const badgePlaces = getBadgePlaces(placesDisponibles);

  const wrapper = document.createElement("div");
  wrapper.className = options.colClass ? options.colClass : "";

  wrapper.innerHTML = `
    <div class="formation-card">
        <div class="formation-header">
            <h4>${f.titre}</h4>
            ${badge}
        </div>
        <div class="formation-body">
            <p><strong>Domaine</strong><br>${f.domaine}</p>
            <p><strong>Discipline</strong><br>${f.discipline}</p>
            <p><strong>Public</strong><br>${f.public_cible.join(", ")}</p>
            <p><strong>Durée</strong><br>${f.duree_heures} heures</p>
            <p><strong>Lieu</strong><br>${f.lieu}</p>
            <p><strong>Dates</strong><br>${formaterDate(f.date_debut)} → ${formaterDate(f.date_fin)}</p>
            <p class="formation-places">${badgePlaces}</p>
        </div>
        <div class="formation-footer">
            <a href="formation-details.html?id=${encodeURIComponent(f.id)}" class="btn btn-primary w-100">
                Voir plus de détails
            </a>
        </div>
    </div>
  `;

  return wrapper;
}

/* =========================================
   PAGE CATALOGUE (formations.html)
   ========================================= */

async function init() {
  await chargerFormations();
}

async function chargerFormations() {
  const container = document.getElementById("formations");
  container.innerHTML = `
        <div class="loading">
            Chargement des formations...
        </div>
    `;

  try {
    const data = await Api.getFormations();
    if (!data.success) {
      container.innerHTML = `
                <div class="error">
                    ${data.error}
                </div>
            `;
      return;
    }
    afficherFormations(data.formations);
  } catch (error) {
    console.error(error);
    container.innerHTML = `
            <div class="error">
                Impossible de charger les formations.
            </div>
        `;
  }
}

function afficherFormations(formations) {
  const container = document.getElementById("formations");

  if (!formations.length) {
    container.innerHTML = `
            <div class="error">
                Aucune formation disponible.
            </div>
        `;
    return;
  }

  container.innerHTML = "";
  formations.forEach((formation) => {
    const card = creerCarteFormation(formation);
    container.appendChild(card);
  });
}