var inscriptionIdFormation = null;

var overlay = null;

function ouvrirFormulaireInscription(formationId) {
  inscriptionIdFormation = formationId;
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "inscription-overlay";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) fermerFormulaireInscription();
    });
    document.body.appendChild(overlay);
    overlay.innerHTML = [
      '<div class="inscription-modal">',
      '  <button class="inscription-close" onclick="fermerFormulaireInscription()" aria-label="Fermer">&times;</button>',
      '  <h3>Inscription à la formation</h3>',
      '  <form id="inscriptionForm" onsubmit="return soumettreInscription(event)">',
      '    <div class="inscription-grid">',
      '      <div class="form-group">',
      '        <label for="ins_nom">Nom *</label>',
      '        <input type="text" id="ins_nom" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_prenom">Prénom *</label>',
      '        <input type="text" id="ins_prenom" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_matricule">Matricule *</label>',
      '        <input type="text" id="ins_matricule" required>',
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
      '      <div class="form-group">',
      '        <label for="ins_circonscription">Circonscription *</label>',
      '        <input type="text" id="ins_circonscription" required>',
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
      '        <label for="ins_discipline">Discipline *</label>',
      '        <input type="text" id="ins_discipline" required>',
      '      </div>',
      '      <div class="form-group">',
      '        <label for="ins_niveau">Niveau d\'enseignement *</label>',
      '        <select id="ins_niveau" required>',
      '          <option value="">Sélectionner...</option>',
      '          <option>Primaire</option>',
      '          <option>Collège</option>',
      '          <option>Lycée</option>',
      '          <option>Tous niveaux</option>',
      '        </select>',
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
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function fermerFormulaireInscription() {
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

async function soumettreInscription(event) {
  event.preventDefault();
  var btn = document.getElementById("inscriptionSubmitBtn");
  var msg = document.getElementById("inscriptionMessage");
  msg.className = "inscription-message";
  msg.textContent = "";
  btn.disabled = true;
  btn.textContent = "Inscription en cours...";
  var data = {
    id_formation: inscriptionIdFormation,
    nom: document.getElementById("ins_nom").value.trim(),
    prenom: document.getElementById("ins_prenom").value.trim(),
    matricule: document.getElementById("ins_matricule").value.trim(),
    fonction: document.getElementById("ins_fonction").value,
    etablissement: document.getElementById("ins_etablissement").value.trim(),
    circonscription: document.getElementById("ins_circonscription").value.trim(),
    telephone: document.getElementById("ins_telephone").value.trim(),
    email: document.getElementById("ins_email").value.trim(),
    discipline: document.getElementById("ins_discipline").value.trim(),
    niveau_enseignement: document.getElementById("ins_niveau").value,
  };
  var result = await Api.inscrire(data);
  if (result.success) {
    msg.className = "inscription-message inscription-success";
    msg.textContent = "Inscription réussie ! Vous recevrez une confirmation par email.";
    document.getElementById("inscriptionForm").reset();
    setTimeout(fermerFormulaireInscription, 2500);
  } else {
    msg.className = "inscription-message inscription-error";
    msg.textContent = result.error || "Une erreur est survenue. Veuillez réessayer.";
  }
  btn.disabled = false;
  btn.textContent = "S'inscrire";
}
