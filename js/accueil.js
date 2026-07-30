// ========================================
// accueil.js
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  chargerAccueil();
});

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

async function chargerAccueil() {
  try {
    const data = await Api.getFormations();

    if (!data.success) {
      console.error(data.error);

      return;
    }

    const formations = data.formations;

    afficherStatistiques(formations);

    afficherFormationsAccueil(formations);

    afficherCalendrier(formations);

    // Rafraîchir en arrière-plan si les données viennent du cache
    const cacheKey = Api.getCacheKey("formations", {});
    const fromCache = Api.getFromCache(cacheKey);
    if (fromCache) {
      Api.getFormations(true).then(updated => {
        if (updated.success) {
          const f = updated.formations;
          afficherStatistiques(f);
          afficherFormationsAccueil(f);
          afficherCalendrier(f);
        }
      }).catch(() => {});
    }
  } catch (e) {
    console.error(e);
  }
}

/*=========================================
STATISTIQUES
=========================================*/

function afficherStatistiques(formations) {
  document.getElementById("nbFormations").textContent = formations.length;

  let places = 0;

  let certifiantes = 0;

  const domaines = new Set();

  formations.forEach((f) => {
    places += Number(f.capacite_max);

    domaines.add(f.domaine);

    if (f.certifiante) certifiantes++;
  });

  document.getElementById("nbPlaces").textContent = places;

  document.getElementById("nbDomaines").textContent = domaines.size;

  document.getElementById("nbCertifiantes").textContent = certifiantes;
}

/*=========================================
FORMATIONS
=========================================*/

function afficherFormationsAccueil(formations) {
  const container = document.getElementById("formationsAccueil");

  container.innerHTML = "";

  formations
    .filter((f) => f.inscriptions_ouvertes)
    .slice(0, 3)
    .forEach((f) => {
      const badge = getBadge(f.modalite);

      container.innerHTML += `

            <div class="col-lg-4">

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

                        <p><strong>Formateur</strong><br>${f.formateur}</p>

                        <p><strong>Dates</strong><br>${formaterDate(f.date_debut)} → ${formaterDate(f.date_fin)}</p>

                    </div>

                    <div class="formation-footer">

                        <a
                            href="formations.html"
                            class="btn btn-primary w-100">

                            Voir la formation

                        </a>

                    </div>

                </div>

            </div>

            `;
    });
}

/*=========================================
CALENDRIER
=========================================*/

function afficherCalendrier(formations) {
  const container = document.getElementById("calendrierAccueil");

  container.innerHTML = "";

  formations
    .slice()
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
    .slice(0, 5)
    .forEach((f) => {
      container.innerHTML += `

            <div class="col-md-6 col-lg-4 mb-3">

                <div class="card h-100">

                    <div class="card-body">

                        <h5>${f.titre}</h5>

                        <p>

                            <i class="bi bi-calendar-event"></i>

                            ${formaterDate(f.date_debut)}

                        </p>

                        <p>

                            <i class="bi bi-geo-alt"></i>

                            ${f.lieu}

                        </p>

                    </div>

                </div>

            </div>

            `;
    });
}

/*=========================================
BADGE MODALITE
=========================================*/

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

/*=========================================
RECHERCHE AVEC CACHE + DEBOUNCE
=========================================*/

const recherche = document.getElementById("rechercheAccueil");

if (recherche) {
  let debounceTimer;

  recherche.addEventListener("keyup", function () {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      const mot = this.value.toLowerCase();

      const data = await Api.getFormations();

      if (!data.success) return;

      const resultat = data.formations.filter(
        (f) =>
          f.titre.toLowerCase().includes(mot) ||
          f.domaine.toLowerCase().includes(mot) ||
          f.discipline.toLowerCase().includes(mot),
      );

      afficherFormationsAccueil(resultat);
    }, 300);
  });
}
