import 'dart:io';
import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import '../models/time_entry.dart';
import '../models/work_type.dart';

class ExportService {
  static final ExportService instance = ExportService._();
  ExportService._();

  Future<File> exportMonth({
    required List<TimeEntry> entries,
    required int year,
    required int month,
    String employerName = '',
    double weeklyHours = 40,
  }) async {
    final excel = Excel.createExcel();
    excel.rename('Sheet1', 'Zeiterfassung');
    final sheet = excel['Zeiterfassung'];

    // Header
    final headers = ['Datum', 'Wochentag', 'Beginn', 'Ende', 'Pause (min)', 'Netto (h)', 'Tätigkeit', 'Tagtyp', 'Notiz', 'km'];
    for (var i = 0; i < headers.length; i++) {
      final cell = sheet.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: 0));
      cell.value = TextCellValue(headers[i]);
      cell.cellStyle = CellStyle(
        bold: true,
        backgroundColorHex: ExcelColor.fromHexString('#1565C0'),
        fontColorHex: ExcelColor.fromHexString('#FFFFFF'),
      );
    }

    final df = DateFormat('dd.MM.yyyy');
    final tf = DateFormat('HH:mm');
    final wdf = DateFormat('EEEE', 'de_AT');

    final sorted = List<TimeEntry>.from(entries)
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    int rowIdx = 1;
    double weekTotal = 0;
    DateTime? currentWeekMonday;

    for (final entry in sorted) {
      final monday = entry.date.subtract(Duration(days: entry.date.weekday - 1));
      final mondayKey = monday.toIso8601String().substring(0, 10);
      final prevKey = currentWeekMonday?.toIso8601String().substring(0, 10);

      if (prevKey != null && prevKey != mondayKey && weekTotal > 0) {
        _addSubtotalRow(sheet, rowIdx++, weekTotal, 'KW-Summe');
        weekTotal = 0;
      }
      currentWeekMonday = monday;

      final isWeekend = entry.dayType == DayType.saturday ||
          entry.dayType == DayType.sunday ||
          entry.dayType == DayType.holiday;

      final cells = [
        TextCellValue(df.format(entry.date)),
        TextCellValue(wdf.format(entry.date)),
        TextCellValue(tf.format(entry.startTime)),
        TextCellValue(entry.endTime != null ? tf.format(entry.endTime!) : ''),
        IntCellValue(entry.breakMinutes),
        DoubleCellValue(double.parse(entry.totalHours.toStringAsFixed(2))),
        TextCellValue(entry.workType.label),
        TextCellValue(entry.dayType.label),
        TextCellValue(entry.note),
        entry.distanceKm != null ? DoubleCellValue(entry.distanceKm!) : TextCellValue(''),
      ];

      for (var i = 0; i < cells.length; i++) {
        final cell = sheet.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: rowIdx));
        cell.value = cells[i];
        if (isWeekend) {
          cell.cellStyle = CellStyle(backgroundColorHex: ExcelColor.fromHexString('#FFF3E0'));
        }
      }
      weekTotal += entry.totalHours;
      rowIdx++;
    }

    if (weekTotal > 0) {
      _addSubtotalRow(sheet, rowIdx++, weekTotal, 'KW-Summe');
    }

    final monthTotal = entries.fold(0.0, (s, e) => s + e.totalHours);
    final totalKm = entries.fold(0.0, (s, e) => s + (e.distanceKm ?? 0));
    _addSubtotalRow(sheet, rowIdx++, monthTotal, 'Monatssumme', bold: true, km: totalKm > 0 ? totalKm : null);

    // Column widths
    sheet.setColumnWidth(0, 12);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 8);
    sheet.setColumnWidth(3, 8);
    sheet.setColumnWidth(8, 30);

    final dir = await getApplicationDocumentsDirectory();
    final monthStr = DateFormat('yyyy-MM').format(DateTime(year, month));
    final name = employerName.isNotEmpty ? '${employerName}_$monthStr' : 'Zeiterfassung_$monthStr';
    final file = File('${dir.path}/$name.xlsx');
    final bytes = excel.encode();
    if (bytes == null) throw Exception('XLSX-Kodierung fehlgeschlagen');
    await file.writeAsBytes(bytes);
    return file;
  }

  void _addSubtotalRow(Sheet sheet, int row, double hours, String label, {bool bold = false, double? km}) {
    final hh = hours.floor();
    final mm = ((hours - hh) * 60).round();
    final values = [label, '', '', '', '', TextCellValue('${hh}h ${mm.toString().padLeft(2, '0')}m')];
    for (var i = 0; i < 10; i++) {
      final cell = sheet.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: row));
      if (i < values.length) {
        final v = values[i];
        cell.value = v is String ? TextCellValue(v) : v as CellValue;
      }
      if (i == 9 && km != null) cell.value = DoubleCellValue(km);
      cell.cellStyle = CellStyle(
        bold: bold,
        backgroundColorHex: ExcelColor.fromHexString(bold ? '#E3F2FD' : '#F5F5F5'),
      );
    }
  }
}
