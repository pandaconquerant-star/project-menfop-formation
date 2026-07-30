const ITEMS_PER_PAGE = 6;

let allFormations = [];
let filteredFormations = [];
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  initCatalogue();
});

async function initCatalogue() {
  try {
    const data = await Api.getFormations();
    if (!data.success) {
      afficherErreur(data.error);
      return;
    }
    allFormations = data.formations;
    remplirFiltres(allFormations);
    appliquerFiltres();
  } catch (e) {
    console.error(e);
    afficherErreur("Impossible de charger les formations.");
  }
}

function afficherErreur(msg) {
  document.querySelector(".results").innerHTML =
    `<div class="error">${msg}</div>`;
}

/* ===============================
   FILTRES DYNAMIQUES
   =============================== */

function remplirFiltres(formations) {
  remplirSelect("domaine", formations, "domaine", "Tous");
  remplirSelect("discipline", formations, "discipline", "Toutes");
  remplirSelect("niveau", formations, "niveau_enseignement", "Tous");
  remplirSelect("modalites", formations, "modalite", "Toutes");

  document.getElementById("domaine").addEventListener("change", appliquerFiltres);
  document.getElementById("discipline").addEventListener("change", appliquerFiltres);
  document.getElementById("niveau").addEventListener("change", appliquerFiltres);
  document.getElementById("modalites").addEventListener("change", appliquerFiltres);
  document.getElementById("certification").addEventListener("change", appliquerFiltres);
  document.getElementById("search-bar").addEventListener("input", appliquerFiltres);
  document.getElementById("search-button").addEventListener("click", appliquerFiltres);
  document.getElementById("sort-order").addEventListener("change", appliquerFiltres);
}

function remplirSelect(id, formations, champ, labelTous) {
  const select = document.getElementById(id);
  const valeurs = [...new Set(formations.map((f) => f[champ]).filter(Boolean))].sort();
  valeurs.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

/* ===============================
   FILTRAGE + TRI + PAGINATION
   =============================== */

function appliquerFiltres() {
  const search = document.getElementById("search-bar").value.toLowerCase();
  const domaine = document.getElementById("domaine").value;
  const discipline = document.getElementById("discipline").value;
  const niveau = document.getElementById("niveau").value;
  const modalite = document.getElementById("modalites").value;
  const certif = document.getElementById("certification").value;
  const sort = document.getElementById("sort-order").value;

  filteredFormations = allFormations.filter((f) => {
    if (search && !f.titre.toLowerCase().includes(search) && !f.domaine.toLowerCase().includes(search) && !f.discipline.toLowerCase().includes(search)) return false;
    if (domaine !== "tous" && f.domaine !== domaine) return false;
    if (discipline !== "toutes" && f.discipline !== discipline) return false;
    if (niveau !== "tous" && f.niveau_enseignement !== niveau) return false;
    if (modalite !== "toutes" && f.modalite !== modalite) return false;
    if (certif === "oui" && !f.certifiante) return false;
    if (certif === "non" && f.certifiante) return false;
    return true;
  });

  filteredFormations.sort((a, b) => {
    const da = new Date(a.created_at || 0);
    const db = new Date(b.created_at || 0);
    return sort === "decroissant" ? db - da : da - db;
  });

  currentPage = 1;
  afficherStats();
  afficherPage();
}

/* ===============================
   STATISTIQUES
   =============================== */

function afficherStats() {
  const total = filteredFormations.length;
  const inscriptions = filteredFormations.filter((f) => f.inscriptions_ouvertes).length;
  const certifiantes = filteredFormations.filter((f) => f.certifiante).length;

  document.getElementById("formations-number").textContent = total;
  document.getElementById("inscriptions-number").textContent = inscriptions;
  document.getElementById("formations-certifiantes-number").textContent = certifiantes;
  document.querySelector(".nbr-result p").textContent = `${total} formation${total > 1 ? "s" : ""}`;
}

/* ===============================
   PAGINATION
   =============================== */

function afficherPage() {
  const totalPages = Math.ceil(filteredFormations.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const debut = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageData = filteredFormations.slice(debut, debut + ITEMS_PER_PAGE);

  const container = document.querySelector(".results");
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid";
  container.appendChild(grid);

  pageData.forEach((f) => {
    const card = creerCarteFormation(f, { colClass: "" });
    grid.appendChild(card);
  });

  document.querySelector(".bar-results p").textContent = `${currentPage}/${totalPages}`;
  document.querySelector(".Previous").disabled = currentPage <= 1;
  document.querySelector(".Next").disabled = currentPage >= totalPages;
}

document.querySelector(".Previous")?.addEventListener("click", () => {
  if (currentPage > 1) { currentPage--; afficherPage(); }
});

document.querySelector(".Next")?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredFormations.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) { currentPage++; afficherPage(); }
});
