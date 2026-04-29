import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';
import '../providers/time_entry_provider.dart';
import '../providers/employer_provider.dart';
import '../services/export_service.dart';
import '../services/import_service.dart';
import '../services/sync_service.dart';
import '../models/time_entry.dart';
import '../models/work_type.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _exporting = false;
  bool _importing = false;
  bool _syncing = false;

  Future<void> _exportXlsx() async {
    setState(() => _exporting = true);
    try {
      final tp = context.read<TimeEntryProvider>();
      final employer = context.read<EmployerProvider>().active;
      final entries = await _entriesForExport(tp);
      final file = await ExportService.instance.exportMonth(
        entries: entries,
        year: tp.selectedYear,
        month: tp.selectedMonth,
        employerName: employer?.name ?? '',
        weeklyHours: employer?.weeklyHours ?? 40,
      );
      if (!mounted) return;
      await Share.shareXFiles([XFile(file.path)], text: 'Zeiterfassung Export');
    } catch (e) {
      if (mounted) _showError('Export fehlgeschlagen: $e');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<List<TimeEntry>> _entriesForExport(TimeEntryProvider tp) async {
    // Return current month entries (already loaded)
    return List.from(tp.entries);
  }

  Future<void> _importXlsx() async {
    setState(() => _importing = true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls'],
        withData: true,
      );
      if (result == null || result.files.single.bytes == null) {
        setState(() => _importing = false);
        return;
      }
      final bytes = result.files.single.bytes!;
      final importResult = ImportService.instance.importFromXlsx(bytes);

      if (!mounted) return;

      final ok = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Import-Vorschau'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${importResult.entries.length} Einträge gefunden'),
              if (importResult.errors.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('${importResult.errors.length} Warnung(en):',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                ...importResult.errors.take(5).map((e) => Text(e,
                    style: const TextStyle(fontSize: 12, color: Colors.orange))),
              ],
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Abbrechen')),
            if (importResult.entries.isNotEmpty)
              FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Importieren')),
          ],
        ),
      );

      if (ok == true && mounted) {
        final tp = context.read<TimeEntryProvider>();
        for (final e in importResult.entries) {
          await tp.addEntry(e);
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${importResult.entries.length} Einträge importiert')));
        }
      }
    } catch (e) {
      if (mounted) _showError('Import fehlgeschlagen: $e');
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  Future<void> _sync() async {
    final employer = context.read<EmployerProvider>().active;
    if (employer?.nasUrl == null || employer!.nasUrl!.isEmpty) {
      _showError('Bitte NAS-URL in den Einstellungen konfigurieren.');
      return;
    }
    setState(() => _syncing = true);
    try {
      final result = await SyncService.instance.sync(
        baseUrl: employer.nasUrl!,
        apiKey: employer.nasApiKey,
      );
      if (!mounted) return;
      final msg = result.errors.isEmpty
          ? '${result.pushed} hochgeladen, ${result.pulled} empfangen'
          : 'Fehler: ${result.errors.first}';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      await context.read<TimeEntryProvider>().refresh();
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Theme.of(context).colorScheme.error));
  }

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<TimeEntryProvider>();
    final employer = context.watch<EmployerProvider>().active;
    final entries = tp.entries;
    final monthHours = tp.totalHoursForMonth();
    final weeklyTarget = employer?.weeklyHours ?? 40.0;
    final weeksInMonth = _weeksInMonth(tp.selectedYear, tp.selectedMonth);
    final monthTarget = weeklyTarget / 5 * _workdaysInMonth(tp.selectedYear, tp.selectedMonth);
    final diff = monthHours - monthTarget;
    final byType = <WorkType, double>{};
    for (final e in entries) {
      byType[e.workType] = (byType[e.workType] ?? 0) + e.totalHours;
    }
    final df = DateFormat('MMMM yyyy', 'de_AT');

    return Scaffold(
      appBar: AppBar(
        title: Text(df.format(DateTime(tp.selectedYear, tp.selectedMonth))),
        actions: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () {
              final prev = DateTime(tp.selectedYear, tp.selectedMonth - 1);
              tp.loadMonth(prev.year, prev.month);
            },
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () {
              final next = DateTime(tp.selectedYear, tp.selectedMonth + 1);
              tp.loadMonth(next.year, next.month);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Monatszusammenfassung
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Monatszusammenfassung', style: Theme.of(context).textTheme.titleMedium),
                const Divider(),
                _SummaryRow('Ist-Stunden', _fmtH(monthHours)),
                _SummaryRow('Soll-Stunden (geschätzt)', _fmtH(monthTarget)),
                _SummaryRow(
                  diff >= 0 ? 'Mehrarbeit' : 'Minderstunden',
                  '${diff >= 0 ? '+' : ''}${_fmtH(diff)}',
                  color: diff > 0 ? Colors.orange.shade700 : diff < 0 ? Colors.red : null,
                ),
                _SummaryRow('Einträge', '${entries.length}'),
                if (tp.totalKmForMonth() > 0)
                  _SummaryRow('Fahrtstrecke', '${tp.totalKmForMonth().toStringAsFixed(1)} km'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Nach Tätigkeit
          if (byType.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Nach Tätigkeitsart', style: Theme.of(context).textTheme.titleMedium),
                  const Divider(),
                  ...byType.entries.map((kv) =>
                    _SummaryRow(kv.key.label, _fmtH(kv.value))),
                ],
              ),
            ),
          const SizedBox(height: 12),
          // Nach Tagtyp
          if (entries.any((e) => e.dayType != DayType.workday))
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Besondere Tage', style: Theme.of(context).textTheme.titleMedium),
                  const Divider(),
                  ...DayType.values.where((d) => d != DayType.workday).map((d) {
                    final h = entries.where((e) => e.dayType == d).fold(0.0, (s, e) => s + e.totalHours);
                    if (h == 0) return const SizedBox.shrink();
                    return _SummaryRow(d.label, _fmtH(h), color: Colors.orange.shade700);
                  }),
                ],
              ),
            ),
          const SizedBox(height: 20),
          // Aktionen
          Text('Aktionen', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.download_outlined,
            title: 'XLSX exportieren',
            subtitle: 'Monatsansicht als Excel-Datei',
            loading: _exporting,
            onTap: _exportXlsx,
          ),
          _ActionTile(
            icon: Icons.upload_outlined,
            title: 'XLSX importieren',
            subtitle: 'Aus Stempeluhr 2.1 oder kompatiblem Format',
            loading: _importing,
            onTap: _importXlsx,
          ),
          _ActionTile(
            icon: Icons.sync,
            title: 'Mit NAS synchronisieren',
            subtitle: employer?.nasUrl != null ? employer!.nasUrl! : 'NAS-URL in Einstellungen konfigurieren',
            loading: _syncing,
            onTap: _sync,
          ),
        ],
      ),
    );
  }

  String _fmtH(double h) {
    final neg = h < 0;
    final abs = h.abs();
    final hh = abs.floor();
    final mm = ((abs - hh) * 60).round();
    return '${neg ? '-' : ''}${hh}h ${mm.toString().padLeft(2, '0')}m';
  }

  int _workdaysInMonth(int year, int month) {
    final days = DateUtils.getDaysInMonth(year, month);
    var count = 0;
    for (var d = 1; d <= days; d++) {
      final wd = DateTime(year, month, d).weekday;
      if (wd < 6) count++;
    }
    return count;
  }

  int _weeksInMonth(int year, int month) {
    final days = DateUtils.getDaysInMonth(year, month);
    final first = DateTime(year, month, 1).weekday;
    return ((days + first - 1) / 7).ceil();
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _SummaryRow(this.label, this.value, {this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool loading;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.title, required this.subtitle, required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: loading ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)) : Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: const Icon(Icons.chevron_right),
        onTap: loading ? null : onTap,
      ),
    );
  }
}
