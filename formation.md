Google drive sheet : Base des données 
feuille 1 : Formations

id_formation	titre	domaine	discipline	niveau_enseignement	public_cible	objectifs	competences_visees	modalite	duree_heures	lieu	date_debut	date_fin	horaire	formateur	capacite_max	inscriptions_ouvertes	date_limite_inscription	statut	certifiante	created_at	updated_at
1	Différenciation pédagogique en classe	Pédagogie	Toutes disciplines	Secondaire	Enseignants;CP	Adapter les situations d'apprentissage aux besoins réels des élèves	Différenciation, adaptation, personnalisation	Présentiel	10	CFEN	12/09/2026	13/09/2026	09:00-16:00	M. Ahmed Hassan	30	TRUE	2026-09-10	Actif	FALSE	2026-01-15 10:00:00	2026-08-20 14:30:00
2	Évaluation formative et remédiation	Pédagogie	Toutes disciplines	Secondaire	Enseignants	Utiliser l'évaluation pour réguler les apprentissages	Évaluation, remédiation, régulation	Présentiel	5	Inspection générale	20/09/2026	20/09/2026	09:00-14:00	Mme Fatima Ali	25	TRUE	2026-09-18	Actif	FALSE	2026-01-20 11:00:00	2026-08-21 09:00:00
3	Usage pédagogique de l'IA	Innovation pédagogique	TIC	Tous niveaux	Conseillers pédagogiques	Accompagner les enseignants dans un usage raisonné de l'IA	IA, pédagogie numérique, éthique	Hybride	15	Hybride	05/10/2026	07/10/2026	09:00-17:00	Dr. Omar Said	20	TRUE	2026-10-03	Actif	TRUE	2026-02-01 08:00:00	2026-08-22 10:00:00
4	Observation de classe et entretien professionnel	Accompagnement pédagogique	Toutes disciplines	Tous niveaux	Conseillers pédagogiques	Renforcer l'accompagnement pédagogique après observation	Observation, entretien, conseil	Présentiel	10	Inspection générale	18/10/2026	19/10/2026	09:00-16:00	M. Pierre Dupont	30	TRUE	2026-10-16	Actif	FALSE	2026-02-15 14:00:00	2026-08-23 11:00:00
5	Pilotage pédagogique de l'établissement	Management scolaire	Toutes disciplines	Tous niveaux	Chefs d'établissement	Renforcer le pilotage des apprentissages à l'échelle de l'établissement	Pilotage, management, évaluation	Présentiel	10	Inspection générale	02/11/2026	03/11/2026	09:00-16:00	M. Hassan Ali	25	TRUE	2026-10-30	Actif	FALSE	2026-03-01 09:00:00	2026-08-24 13:00:00
6	Vie scolaire, climat scolaire et prévention	Vie scolaire	Toutes disciplines	Tous niveaux	Surveillants	Améliorer l'encadrement des élèves et la prévention des incidents	Encadrement, prévention, climat scolaire	Présentiel	5	Inspection générale	10/11/2026	10/11/2026	09:00-14:00	Mme Aïcha Daud	30	TRUE	2026-11-08	Actif	FALSE	2026-03-15 10:00:00	2026-08-25 15:00:00
7	Accompagnement éducatif et suivi des élèves	Vie scolaire	Toutes disciplines	Tous niveaux	CPE	Renforcer l'accompagnement éducatif et le suivi personnalisé	Suivi, accompagnement, évaluation	Hybride	10	Inspection générale	17/11/2026	18/11/2026	09:00-16:00	M. Karim Hassan	25	TRUE	2026-11-15	Actif	FALSE	2026-04-01 11:00:00	2026-08-26 09:00:00
8	Culture commune de l'encadrement éducatif	Management scolaire	Toutes disciplines	Tous niveaux	Personnels d'encadrement	Renforcer la culture commune de l'encadrement éducatif	Encadrement, leadership, pédagogie	Présentiel	5	Inspection générale	24/11/2026	24/11/2026	09:00-14:00	Mme Fatouma Idriss	30	TRUE	2026-11-22	Actif	FALSE	2026-04-15 08:00:00	2026-08-27 10:00:00
9	Management des équipes pédagogiques	Management scolaire	Toutes disciplines	Tous niveaux	Chefs d'établissement;CPE	Développer le leadership pédagogique et le management d'équipe	Leadership, management, coordination	Présentiel	15	CFEN	01/12/2026	03/12/2026	09:00-17:00	Dr. Ahmed Noor	20	TRUE	2026-11-28	Actif	TRUE	2026-05-01 09:00:00	2026-08-28 14:00:00
10	Didactique des mathématiques	Pédagogie disciplinaire	Mathématiques	Secondaire	Enseignants	Renforcer les compétences en didactique des mathématiques	Didactique, résolution de problèmes, raisonnement	Présentiel	20	CFEN	07/12/2026	11/12/2026	09:00-17:00	M. Mohamed Ali	25	TRUE	2026-12-04	Actif	FALSE	2026-05-15 10:00:00	2026-08-29 11:00:00

code.gs

/**
 * Récupère toutes les formations depuis la feuille "formations" du classeur Google Sheets actif
 * et les retourne sous forme de tableau d'objets JSON structurés.
 * @return {Object} { success: boolean, total: number, formations: Array } ou { success: false, error: string }
 */
function doGetFormations() {
  try {
    // Récupère le classeur (spreadsheet) actuellement ouvert/associé au script
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Cherche l'onglet nommé "formations"
    var sheet = ss.getSheetByName('formations');

    // Sécurité : si l'onglet n'existe pas, on retourne une erreur propre plutôt qu'un plantage
    if (!sheet) {
      return { success: false, error: "La feuille 'formations' n'existe pas" };
    }

    // Récupère TOUTES les cellules utilisées de la feuille (y compris l'en-tête)
    // sous forme de tableau 2D : data[ligne][colonne]
    var data = sheet.getDataRange().getValues();
    var formations = [];

    // On commence à i = 1 pour sauter la ligne d'en-tête (i = 0 = titres de colonnes)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Si la colonne A (id) est vide, on considère la ligne comme vide/inexploitable → on l'ignore
      if (!row[0]) continue;

      formations.push({
        // parseInt sur la colonne A ; si ça échoue (NaN), on utilise l'index de ligne comme id de secours
        id: parseInt(row[0], 10) || i,

        // Champs texte simples : on met une chaîne vide si la cellule est vide
        titre: row[1] || '',
        domaine: row[2] || '',
        discipline: row[3] || '',
        niveau_enseignement: row[4] || '',

        // Colonne "public_cible" : les valeurs sont stockées sous forme de texte séparé par des ";"
        // (ex: "Étudiants; Professionnels; Adultes")
        // -> on transforme cette chaîne en tableau, on enlève les espaces autour de chaque item (trim)
        // -> filter(Boolean) supprime les éléments vides (ex: si point-virgule en trop)
        public_cible: row[5]
          ? String(row[5]).split(';').map(function (item) { return item.trim(); }).filter(Boolean)
          : [],

        objectifs: row[6] || '',
        competences_visees: row[7] || '',
        modalite: row[8] || '',

        // Conversion en nombre entier ; 0 par défaut si la valeur n'est pas un nombre valide
        duree_heures: parseInt(row[9], 10) || 0,

        lieu: row[10] || '',
        date_debut: row[11] || '',
        date_fin: row[12] || '',
        horaire: row[13] || '',
        formateur: row[14] || '',
        capacite_max: parseInt(row[15], 10) || 0,

        // Booléen : Google Sheets peut stocker une vraie valeur booléenne (true/false)
        // OU un texte "VRAI"/"FAUX" (français) ou "TRUE"/"FALSE" (anglais) selon la langue du tableur
        // On gère les 2 cas pour être robuste peu importe la locale de la feuille
        inscriptions_ouvertes: row[16] === true
          || String(row[16]).toUpperCase() === 'VRAI'
          || String(row[16]).toUpperCase() === 'TRUE',

        date_limite_inscription: row[17] || '',

        // Valeur par défaut "Actif" si le statut n'est pas renseigné
        statut: row[18] || 'Actif',

        // Même logique de booléen multi-format que "inscriptions_ouvertes"
        certifiante: row[19] === true
          || String(row[19]).toUpperCase() === 'VRAI'
          || String(row[19]).toUpperCase() === 'TRUE',

        created_at: row[20] || '',
        updated_at: row[21] || ''
      });
    }

    // Retourne le résultat avec le nombre total de formations trouvées
    return { success: true, total: formations.length, formations: formations };

  } catch (error) {
    // En cas d'erreur inattendue (ex: feuille corrompue, API indisponible),
    // on log l'erreur pour le débogage et on retourne une réponse structurée plutôt qu'un plantage
    Logger.log(error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Point d'entrée HTTP GET du Web App Google Apps Script.
 * Appelé automatiquement quand quelqu'un fait une requête GET sur l'URL du script déployé.
 * Supporte 2 usages :
 *  - Récupérer TOUTES les formations : ?  (aucun paramètre id)
 *  - Récupérer UNE formation précise : ?id=123
 *  - Support JSONP via ?callback=maFonction (utile pour contourner CORS depuis un navigateur)
 *
 * @param {Object} e - Objet événement Apps Script contenant les paramètres de la requête (e.parameter)
 */
function doGet(e) {
  // Récupère d'abord toutes les formations
  var result = doGetFormations();

  // Vérifie si un paramètre "id" a été passé dans l'URL (ex: ?id=5)
  var id = e && e.parameter ? e.parameter.id : null;

  // Si un id est demandé ET que la récupération globale a réussi,
  // on filtre pour ne garder que la formation correspondante
  if (id && result.success) {
    // String(...) === String(...) : comparaison en tant que texte pour éviter les soucis
    // de type (number vs string) entre l'id de l'URL et l'id stocké dans les données
    var formation = result.formations.filter(function (item) {
      return String(item.id) === String(id);
    })[0]; // [0] car filter retourne un tableau, on prend le premier élément trouvé

    // Si trouvée, on renvoie l'objet formation seul ; sinon message d'erreur
    result = formation
      ? { success: true, formation: formation }
      : { success: false, error: 'Formation introuvable' };
  }

  // Convertit le résultat final en chaîne JSON
  var json = JSON.stringify(result);

  // Récupère un éventuel paramètre "callback" (utilisé pour le JSONP)
  var callback = e && e.parameter ? e.parameter.callback : null;

  // JSONP : technique historique pour appeler une API depuis un navigateur en évitant les
  // restrictions CORS, en enveloppant la réponse JSON dans un appel de fonction JS.
  // La regex vérifie que le nom de callback est un identifiant JS valide
  // (lettres, chiffres, _ ou $, ne commence pas par un chiffre) → évite l'injection de code
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Cas standard : renvoie simplement le JSON avec le bon type MIME
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fonction de test manuelle, à exécuter directement depuis l'éditeur Apps Script
 * (menu "Exécuter"). Permet de vérifier que doGetFormations() fonctionne
 * et d'afficher le résultat dans les logs (Affichage > Journaux / Logger).
 */
function testGetFormations() {
  Logger.log(JSON.stringify(doGetFormations()));
}