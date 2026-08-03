/**
 * Receives the twice-daily member roster from the WhatsApp auto-approver
 * and writes it into this spreadsheet.
 *
 * SETUP (one time):
 *  1. Open your Google Sheet > Extensions > Apps Script
 *  2. Delete the default code, paste this whole file, Save
 *  3. Deploy > New deployment > type "Web app"
 *       Execute as: Me
 *       Who has access: Anyone
 *     Deploy, authorise, then COPY THE WEB APP URL
 *  4. Paste that URL into ROSTER_WEBHOOK_URL in index.js and restart the bot
 *
 * Each run replaces the "Roster" tab with the current snapshot and appends a
 * one-line record to "Roster History" so you can see trends over time.
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const header = payload.header || [];
    const rows = payload.rows || [];
    const stamp = payload.generatedAt || new Date().toISOString();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- Current snapshot ---
    let sheet = ss.getSheetByName('Roster') || ss.insertSheet('Roster');
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    }
    sheet.getRange(1, header.length + 2).setValue('Generated: ' + stamp);
    sheet.setFrozenRows(1);
    if (sheet.getFilter()) sheet.getFilter().remove();
    if (rows.length) sheet.getRange(1, 1, rows.length + 1, header.length).createFilter();

    // Highlight anyone in a group without a matching payment
    const statusCol = header.indexOf('payment_status') + 1;
    if (statusCol > 0 && rows.length) {
      const range = sheet.getRange(2, statusCol, rows.length, 1);
      const rules = sheet.getConditionalFormatRules();
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('PAID').setBackground('#d9ead3').setRanges([range]).build());
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('NO RECORD').setBackground('#f4cccc').setRanges([range]).build());
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('NOT PAID').setBackground('#fce5cd').setRanges([range]).build());
      sheet.setConditionalFormatRules(rules);
    }

    // --- History: one summary row per run ---
    let hist = ss.getSheetByName('Roster History') || ss.insertSheet('Roster History');
    if (hist.getLastRow() === 0) {
      hist.getRange(1, 1, 1, 5).setValues([['run_at', 'total_members', 'paid', 'not_paid', 'unresolved']])
          .setFontWeight('bold');
    }
    let paid = 0, notPaid = 0, unresolved = 0;
    rows.forEach(function (r) {
      const s = String(r[statusCol - 1] || '');
      if (s.indexOf('PAID') === 0) paid++;
      else if (s.indexOf('UNRESOLVED') === 0) unresolved++;
      else notPaid++;
    });
    hist.appendRow([stamp, rows.length, paid, notPaid, unresolved]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Roster endpoint is live. POST roster data here.');
}
