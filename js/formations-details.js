// ==============================================
// formation-details.js
// Charge et affiche TOUTES les données d'une formation précise
// sur sa page dédiée (formation-details.html?id=...)
// Nécessite api.js et formations.js (pour formaterDate/getBadge) chargés avant.
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  const container = document.getElementById("formationDetails");
  const id = getIdDepuisUrl();

  if (!id) {
    afficherErreur(container, "Aucune formation sélectionnée. Retournez au catalogue et cliquez sur 'Voir plus de détails'.");
    return;
  }

  container.innerHTML = `<div class="loading">Chargement des détails...</div>`;

  try {
    const data = await Api.getFormation(id);

    if (!data.success) {
      afficherErreur(container, data.error || "Formation introuvable.");
      return;
    }

    afficherDetailsFormation(container, data.formation);
  } catch (error) {
    console.error(error);
    afficherErreur(container, "Impossible de charger les détails de la formation.");
  }
}

/**
 * Récupère le paramètre ?id=... de l'URL courante.
 */
function getIdDepuisUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function afficherErreur(container, message) {
  container.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * Affiche l'intégralité des champs d'une formation dans la page de détails.
 * @param {HTMLElement} container
 * @param {Object} f - Objet formation complet renvoyé par l'API
 */
function afficherDetailsFormation(container, f) {
  const placesDisponibles = Number(f.capacite_max) || 0;
  const badgeModalite = getBadge(f.modalite);
  const badgePlaces = getBadgePlaces(placesDisponibles);

  container.innerHTML = `
    <div class="formation-details-card">
        <div class="formation-details-header">
            <h1>${f.titre}</h1>
            <div class="formation-details-badges">
                ${badgeModalite}
                ${badgePlaces}
                <span class="badge bg-secondary">${f.statut}</span>
                ${f.certifiante ? '<span class="badge badge-certifiante">🏅 Certifiante</span>' : ""}
            </div>
        </div>

        <div class="formation-details-grid">
            <div class="detail-item">
                <strong>Domaine</strong>
                <p>${f.domaine}</p>
            </div>
            <div class="detail-item">
                <strong>Discipline</strong>
                <p>${f.discipline}</p>
            </div>
            <div class="detail-item">
                <strong>Niveau d'enseignement</strong>
                <p>${f.niveau_enseignement}</p>
            </div>
            <div class="detail-item">
                <strong>Public cible</strong>
                <p>${f.public_cible.join(", ")}</p>
            </div>
            <div class="detail-item">
                <strong>Modalité</strong>
                <p>${f.modalite}</p>
            </div>
            <div class="detail-item">
                <strong>Durée</strong>
                <p>${f.duree_heures} heures</p>
            </div>
            <div class="detail-item">
                <strong>Lieu</strong>
                <p>${f.lieu}</p>
            </div>
            <div class="detail-item">
                <strong>Formateur</strong>
                <p>${f.formateur}</p>
            </div>
            <div class="detail-item">
                <strong>Dates</strong>
                <p>${formaterDate(f.date_debut)} → ${formaterDate(f.date_fin)}</p>
            </div>
            <div class="detail-item">
                <strong>Horaire</strong>
                <p>${f.horaire}</p>
            </div>
            <div class="detail-item">
                <strong>Capacité maximale</strong>
                <p>${f.capacite_max}</p>
            </div>
            <div class="detail-item">
                <strong>Places disponibles</strong>
                <p>${placesDisponibles}</p>
            </div>
            <div class="detail-item">
                <strong>Inscriptions ouvertes</strong>
                <p>${f.inscriptions_ouvertes ? "Oui" : "Non"}</p>
            </div>
            <div class="detail-item">
                <strong>Date limite d'inscription</strong>
                <p>${formaterDate(f.date_limite_inscription)}</p>
            </div>
            <div class="detail-item">
                <strong>Certifiante</strong>
                <p>${f.certifiante ? "Oui" : "Non"}</p>
            </div>
            <div class="detail-item">
                <strong>Statut</strong>
                <p>${f.statut}</p>
            </div>
        </div>

        <div class="detail-item detail-item-full">
            <strong>Objectifs</strong>
            <p>${f.objectifs}</p>
        </div>

        <div class="detail-item detail-item-full">
            <strong>Compétences visées</strong>
            <p>${f.competences_visees}</p>
        </div>

        <div class="formation-details-meta">
            <small>Créée le ${formaterDate(f.created_at)} — Mise à jour le ${formaterDate(f.updated_at)}</small>
        </div>
    </div>

    <div class="inscription-action-bar">
        <button class="btn btn-primary btn-lg" onclick="ouvrirFormulaireInscription('${f.id}')">
            S'inscrire à cette formation
        </button>
    </div>
  `;
}