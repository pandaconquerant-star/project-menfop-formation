function doGetFormations() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('formations');

    if (!sheet) {
      return { success: false, error: "La feuille 'formations' n'existe pas" };
    }

    var data = sheet.getDataRange().getValues();
    var formations = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;

      formations.push({
        id: parseInt(row[0], 10) || i,
        titre: row[1] || '',
        domaine: row[2] || '',
        discipline: row[3] || '',
        niveau_enseignement: row[4] || '',
        public_cible: row[5] ? String(row[5]).split(';').map(function (item) { return item.trim(); }).filter(Boolean) : [],
        objectifs: row[6] || '',
        competences_visees: row[7] || '',
        modalite: row[8] || '',
        duree_heures: parseInt(row[9], 10) || 0,
        lieu: row[10] || '',
        date_debut: row[11] || '',
        date_fin: row[12] || '',
        horaire: row[13] || '',
        formateur: row[14] || '',
        capacite_max: parseInt(row[15], 10) || 0,
        inscriptions_ouvertes: row[16] === true || String(row[16]).toUpperCase() === 'VRAI' || String(row[16]).toUpperCase() === 'TRUE',
        date_limite_inscription: row[17] || '',
        statut: row[18] || 'Actif',
        certifiante: row[19] === true || String(row[19]).toUpperCase() === 'VRAI' || String(row[19]).toUpperCase() === 'TRUE',
        created_at: row[20] || '',
        updated_at: row[21] || ''
      });
    }

    return { success: true, total: formations.length, formations: formations };
  } catch (error) {
    Logger.log(error.toString());
    return { success: false, error: error.toString() };
  }
}

function doGet(e) {
  var result = doGetFormations();
  var id = e && e.parameter ? e.parameter.id : null;

  if (id && result.success) {
    var formation = result.formations.filter(function (item) { return String(item.id) === String(id); })[0];
    result = formation ? { success: true, formation: formation } : { success: false, error: 'Formation introuvable' };
  }

  var json = JSON.stringify(result);
  var callback = e && e.parameter ? e.parameter.callback : null;

  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function testGetFormations() {
  Logger.log(JSON.stringify(doGetFormations()));
}
