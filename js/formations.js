// ==============================================
// formations.js
// ==============================================

document.addEventListener("DOMContentLoaded", init);

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
    const card = creerCarte(formation);

    container.appendChild(card);
  });
}

function creerCarte(f) {
  const card = document.createElement("div");

  card.className = "formation-card";

  card.innerHTML = `

        <div class="formation-header">

            <h2>${f.titre}</h2>

            <span class="badge">
                ${f.domaine}
            </span>

        </div>

        <div class="formation-body">

            <p>
                📖 <strong>Discipline :</strong><br>
                ${f.discipline}
            </p>

            <p>
                🎓 <strong>Niveau :</strong><br>
                ${f.niveau_enseignement}
            </p>

            <p>
                👥 <strong>Public :</strong><br>
                ${f.public_cible.join(", ")}
            </p>

            <p>
                👤 <strong>Formateur :</strong><br>
                ${f.formateur}
            </p>

            <p>
                📍 <strong>Lieu :</strong><br>
                ${f.lieu}
            </p>

            <p>
                ⏱️ <strong>Durée :</strong><br>
                ${f.duree_heures} heures
            </p>

            <p>
                📅 <strong>Début :</strong><br>
                ${f.date_debut}
            </p>

            <p>
                📅 <strong>Fin :</strong><br>
                ${f.date_fin}
            </p>

            <p>
                📝 <strong>Objectif :</strong><br>
                ${f.objectifs}
            </p>

        </div>

        <div class="formation-footer">

            <button class="btn-detail">
                Voir les détails
            </button>

        </div>

    `;

  card.querySelector(".btn-detail").addEventListener("click", () => {
    afficherDetails(f);
  });

  return card;
}

function afficherDetails(f) {
  alert(`

${f.titre}

----------------------------

Domaine :
${f.domaine}

Discipline :
${f.discipline}

Niveau :
${f.niveau_enseignement}

Public :
${f.public_cible.join(", ")}

Objectifs :
${f.objectifs}

Compétences :
${f.competences_visees}

Modalité :
${f.modalite}

Durée :
${f.duree_heures} heures

Lieu :
${f.lieu}

Dates :
${f.date_debut} ➜ ${f.date_fin}

Horaire :
${f.horaire}

Formateur :
${f.formateur}

Capacité :
${f.capacite_max}

Statut :
${f.statut}

Certifiante :
${f.certifiante ? "Oui" : "Non"}

`);
}
