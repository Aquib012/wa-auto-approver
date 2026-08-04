/**
 * Receives ALL bot data from the WhatsApp auto-approver and writes it into
 * this spreadsheet: activity logs, approvals, alternate-number approvals,
 * and the twice-daily member roster.
 *
 * SETUP (one time):
 *  1. Open your master Google Sheet > Extensions > Apps Script
 *  2. Delete the default code, paste this whole file, Save
 *  3. Deploy > New deployment > type "Web app"
 *       Execute as: Me
 *       Who has access: Anyone
 *     Deploy, authorise, then COPY THE WEB APP URL
 *  4. On the bot machine, put that URL in .env as:
 *       SHEET_WEBHOOK_URL=<the url>
 *     and restart the bot.
 *
 * Tabs created automatically:
 *   Bot_Logs             — every log line (timestamp + message)
 *   Approvals            — one row per approved member
 *   Alternate_Approvals  — approvals via alt-number form or name-match
 *   Roster / Roster History — member audit snapshots
 */

function getOrCreate_(ss, name, header) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var type = payload.type || 'roster';

    // --- Activity log lines (batched, once a minute) ---
    if (type === 'logs') {
      var logSheet = getOrCreate_(ss, 'Bot_Logs', ['timestamp', 'message']);
      var lines = payload.lines || [];
      if (lines.length) {
        logSheet.getRange(logSheet.getLastRow() + 1, 1, lines.length, 2).setValues(lines);
      }
      // Keep the tab manageable: trim to the newest ~20,000 rows
      var last = logSheet.getLastRow();
      if (last > 21000) logSheet.deleteRows(2, last - 20000);
      return ok_({ appended: lines.length });
    }

    // --- One row per approved member ---
    if (type === 'approval') {
      var apSheet = getOrCreate_(ss, 'Approvals',
        ['timestamp', 'group', 'name', 'phone', 'amount', 'funnel']);
      apSheet.appendRow(payload.row);
      return ok_({ appended: 1 });
    }

    // --- Alternate-number / name-match approvals (audit trail) ---
    if (type === 'alt_approval') {
      var altSheet = getOrCreate_(ss, 'Alternate_Approvals',
        ['timestamp', 'group', 'requester_phone', 'matched_name', 'paid_phone', 'amount', 'funnel', 'method']);
      altSheet.appendRow(payload.row);
      return ok_({ appended: 1 });
    }

    // --- Roster snapshot (original behaviour) ---
    var header = payload.header || [];
    var rows = payload.rows || [];
    var stamp = payload.generatedAt || new Date().toISOString();

    var sheet = ss.getSheetByName('Roster') || ss.insertSheet('Roster');
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    }
    sheet.getRange(1, header.length + 2).setValue('Generated: ' + stamp);
    sheet.setFrozenRows(1);
    if (sheet.getFilter()) sheet.getFilter().remove();
    if (rows.length) sheet.getRange(1, 1, rows.length + 1, header.length).createFilter();

    var statusCol = header.indexOf('payment_status') + 1;
    if (statusCol > 0 && rows.length) {
      var range = sheet.getRange(2, statusCol, rows.length, 1);
      var rules = sheet.getConditionalFormatRules();
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('PAID').setBackground('#d9ead3').setRanges([range]).build());
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('NO RECORD').setBackground('#f4cccc').setRanges([range]).build());
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith('NOT PAID').setBackground('#fce5cd').setRanges([range]).build());
      sheet.setConditionalFormatRules(rules);
    }

    var hist = ss.getSheetByName('Roster History') || ss.insertSheet('Roster History');
    if (hist.getLastRow() === 0) {
      hist.getRange(1, 1, 1, 5).setValues([['run_at', 'total_members', 'paid', 'not_paid', 'unresolved']])
          .setFontWeight('bold');
    }
    var paid = 0, notPaid = 0, unresolved = 0;
    rows.forEach(function (r) {
      var s = String(r[statusCol - 1] || '');
      if (s.indexOf('PAID') === 0) paid++;
      else if (s.indexOf('UNRESOLVED') === 0) unresolved++;
      else notPaid++;
    });
    hist.appendRow([stamp, rows.length, paid, notPaid, unresolved]);

    return ok_({ rows: rows.length });
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ok_(extra) {
  var out = { ok: true };
  for (var k in extra) out[k] = extra[k];
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Bot logging endpoint is live. POST data here.');
}
