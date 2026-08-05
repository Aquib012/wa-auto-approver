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
    sheet.setFrozenRows(1);
  }
  // Always refresh the header row so new columns appear automatically.
  sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
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
        ['timestamp', 'group', 'group_name', 'name', 'phone', 'amount', 'funnel', 'method']);
      apSheet.appendRow(payload.row);
      return ok_({ appended: 1 });
    }

    // --- One row per pending (not approved) requester, once per day ---
    if (type === 'pending') {
      var pdSheet = getOrCreate_(ss, 'Pending',
        ['timestamp', 'group', 'group_name', 'name', 'phone', 'amount', 'funnel', 'status']);
      pdSheet.appendRow(payload.row);
      return ok_({ appended: 1 });
    }

    // --- Mark earlier Pending rows APPROVED once the person gets in ---
    if (type === 'pending_resolve') {
      var prSheet = ss.getSheetByName('Pending');
      var updated = 0;
      if (prSheet && prSheet.getLastRow() > 1) {
        var data = prSheet.getRange(2, 1, prSheet.getLastRow() - 1, 8).getValues();
        for (var j = 0; j < data.length; j++) {
          if (String(data[j][4]) === String(payload.phone) &&
              String(data[j][1]) === String(payload.group) &&
              String(data[j][7]).indexOf('no payment') === 0) {
            prSheet.getRange(j + 2, 8).setValue('APPROVED ✓ (' + (payload.method || '') + ')');
            updated++;
          }
        }
      }
      return ok_({ updated: updated });
    }

    // --- Daily summary: one row per date, updated in place after every sweep ---
    if (type === 'daily') {
      var dySheet = getOrCreate_(ss, 'Daily_Summary',
        ['date', 'approved_today', 'pending_now', 'approved_names']);
      var dateVal = String(payload.row[0]);
      var lastRow = dySheet.getLastRow();
      var target = -1;
      if (lastRow > 1) {
        var dates = dySheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < dates.length; i++) {
          if (String(dates[i][0]) === dateVal) { target = i + 2; break; }
        }
      }
      if (target === -1) target = lastRow + 1;
      dySheet.getRange(target, 1, 1, payload.row.length).setValues([payload.row]);
      return ok_({ updatedRow: target });
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
