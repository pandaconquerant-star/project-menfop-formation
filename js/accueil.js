// ========================================
// accueil.js
// Nécessite que formations.js soit chargé AVANT ce fichier dans la page
// (voir index.html : <script src="js/formations.js"></script> avant accueil.js)
// pour avoir accès à creerCarteFormation(), formaterDate() et getBadge().
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  chargerAccueil();
});

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
      Api.getFormations(true)
        .then((updated) => {
          if (updated.success) {
            const f = updated.formations;
            afficherStatistiques(f);
            afficherFormationsAccueil(f);
            afficherCalendrier(f);
          }
        })
        .catch(() => {});
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
FORMATIONS (utilise la carte partagée de formations.js)
=========================================*/
function afficherFormationsAccueil(formations) {
  const container = document.getElementById("formationsAccueil");
  container.innerHTML = "";

  formations
    .filter((f) => f.inscriptions_ouvertes)
    .slice(0, 3)
    .forEach((f) => {
      // creerCarteFormation() est définie dans formations.js et partagée
      // entre la page d'accueil et le catalogue complet.
      const card = creerCarteFormation(f, { colClass: "col-lg-4" });
      container.appendChild(card);
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
