import 'package:excel/excel.dart';
import 'package:uuid/uuid.dart';
import '../models/time_entry.dart';
import '../models/work_type.dart';

class ImportResult {
  final List<TimeEntry> entries;
  final List<String> errors;
  ImportResult({required this.entries, required this.errors});
}

class ImportService {
  static final ImportService instance = ImportService._();
  ImportService._();

  // Import aus Stempeluhr 2.1 XLSX (und kompatibler Formate)
  ImportResult importFromXlsx(List<int> bytes) {
    final Excel excel;
    try {
      excel = Excel.decodeBytes(bytes);
    } catch (e) {
      return ImportResult(entries: [], errors: ['Datei konnte nicht geöffnet werden: $e']);
    }

    final sheetName = excel.tables.keys.first;
    final sheet = excel.tables[sheetName]!;
    final rows = sheet.rows;
    if (rows.isEmpty) return ImportResult(entries: [], errors: ['Tabelle ist leer']);

    // Detect header row (first row with date-like content OR explicit headers)
    final colMap = _detectColumns(rows);
    if (colMap['date'] == null || colMap['start'] == null) {
      return ImportResult(entries: [], errors: ['Spalten "Datum" und "Beginn" konnten nicht erkannt werden. Bitte prüfen Sie das Format.']);
    }

    final entries = <TimeEntry>[];
    final errors = <String>[];
    final headerRow = colMap['_headerRow'] as int? ?? 0;

    for (var i = headerRow + 1; i < rows.length; i++) {
      final row = rows[i];
      if (row.isEmpty) continue;

      try {
        final dateStr = _cellString(row, colMap['date']!);
        if (dateStr.isEmpty) continue;

        final date = _parseDate(dateStr);
        if (date == null) {
          errors.add('Zeile ${i + 1}: Datum "$dateStr" nicht erkannt');
          continue;
        }

        final startStr = _cellString(row, colMap['start']!);
        final startTime = _parseTime(date, startStr);
        if (startTime == null) {
          errors.add('Zeile ${i + 1}: Startzeit "$startStr" nicht erkannt');
          continue;
        }

        DateTime? endTime;
        if (colMap['end'] != null) {
          final endStr = _cellString(row, colMap['end']!);
          if (endStr.isNotEmpty) {
            endTime = _parseTime(date, endStr);
            if (endTime != null && endTime.isBefore(startTime)) {
              endTime = endTime.add(const Duration(days: 1));
            }
          }
        }

        int breakMinutes = 0;
        if (colMap['break'] != null) {
          breakMinutes = _parseBreak(_cellString(row, colMap['break']!));
        }

        String note = '';
        if (colMap['note'] != null) {
          note = _cellString(row, colMap['note']!);
        }

        final wd = date.weekday;
        final dayType = wd == 6 ? DayType.saturday : wd == 7 ? DayType.sunday : DayType.workday;

        entries.add(TimeEntry(
          id: const Uuid().v4(),
          date: date,
          startTime: startTime,
          endTime: endTime,
          breakMinutes: breakMinutes,
          workType: WorkType.other,
          dayType: dayType,
          note: note,
          createdAt: DateTime.now(),
        ));
      } catch (e) {
        errors.add('Zeile ${i + 1}: Fehler beim Einlesen ($e)');
      }
    }

    return ImportResult(entries: entries, errors: errors);
  }

  Map<String, dynamic> _detectColumns(List<List<Data?>> rows) {
    const dateNames = ['datum', 'date', 'tag'];
    const startNames = ['beginn', 'start', 'von', 'anfang', 'kommen'];
    const endNames = ['ende', 'end', 'bis', 'gehen'];
    const breakNames = ['pause', 'break', 'unterbrechung'];
    const noteNames = ['notiz', 'bemerkung', 'kommentar', 'tätigkeit', 'beschreibung', 'text', 'info'];

    for (var ri = 0; ri < rows.length.clamp(0, 5); ri++) {
      final row = rows[ri];
      final result = <String, dynamic>{'_headerRow': ri};
      for (var ci = 0; ci < row.length; ci++) {
        final val = row[ci]?.value?.toString().toLowerCase().trim() ?? '';
        if (dateNames.any((n) => val.contains(n))) result['date'] = ci;
        if (startNames.any((n) => val.contains(n))) result['start'] = ci;
        if (endNames.any((n) => val.contains(n))) result['end'] = ci;
        if (breakNames.any((n) => val.contains(n))) result['break'] = ci;
        if (noteNames.any((n) => val.contains(n)) && result['note'] == null) result['note'] = ci;
      }
      if (result['date'] != null && result['start'] != null) return result;
    }

    // Fallback: assume Stempeluhr 2.1 column order: date, start, end, break, total, note
    return {'_headerRow': 0, 'date': 0, 'start': 1, 'end': 2, 'break': 3, 'note': 5};
  }

  String _cellString(List<Data?> row, int col) {
    if (col >= row.length) return '';
    final v = row[col]?.value;
    if (v == null) return '';
    if (v is DateCellValue) {
      final d = DateTime(v.year, v.month, v.day);
      return '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
    }
    if (v is TimeCellValue) return '${v.hour.toString().padLeft(2, '0')}:${v.minute.toString().padLeft(2, '0')}';
    if (v is DoubleCellValue) return v.value.toString();
    if (v is IntCellValue) return v.value.toString();
    return v.toString().trim();
  }

  DateTime? _parseDate(String s) {
    s = s.trim();
    // DD.MM.YYYY
    final r1 = RegExp(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$');
    var m = r1.firstMatch(s);
    if (m != null) return DateTime(int.parse(m[3]!), int.parse(m[2]!), int.parse(m[1]!));
    // YYYY-MM-DD
    final r2 = RegExp(r'^(\d{4})-(\d{2})-(\d{2})');
    m = r2.firstMatch(s);
    if (m != null) return DateTime(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!));
    // DD/MM/YYYY
    final r3 = RegExp(r'^(\d{1,2})/(\d{1,2})/(\d{4})$');
    m = r3.firstMatch(s);
    if (m != null) return DateTime(int.parse(m[3]!), int.parse(m[2]!), int.parse(m[1]!));
    return null;
  }

  DateTime? _parseTime(DateTime date, String s) {
    s = s.trim();
    final r = RegExp(r'^(\d{1,2}):(\d{2})(:(\d{2}))?');
    final m = r.firstMatch(s);
    if (m == null) return null;
    return DateTime(date.year, date.month, date.day, int.parse(m[1]!), int.parse(m[2]!));
  }

  int _parseBreak(String s) {
    s = s.trim();
    if (s.isEmpty) return 0;
    final asNum = double.tryParse(s.replaceAll(',', '.'));
    if (asNum != null) return asNum < 10 ? (asNum * 60).round() : asNum.round();
    final r = RegExp(r'^(\d{1,2}):(\d{2})');
    final m = r.firstMatch(s);
    if (m != null) return int.parse(m[1]!) * 60 + int.parse(m[2]!);
    return 0;
  }
}
