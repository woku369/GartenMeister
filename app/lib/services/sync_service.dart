import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/time_entry.dart';
import '../database/database_helper.dart';

class SyncResult {
  final int pushed;
  final int pulled;
  final List<String> errors;
  SyncResult({required this.pushed, required this.pulled, this.errors = const []});
}

class SyncService {
  static final SyncService instance = SyncService._();
  SyncService._();

  Future<SyncResult> sync({required String baseUrl, String? apiKey}) async {
    final db = DatabaseHelper.instance;
    final headers = {
      'Content-Type': 'application/json',
      if (apiKey != null && apiKey.isNotEmpty) 'x-api-key': apiKey,
    };
    final url = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;

    // 1. Push unsynced entries
    final unsynced = await db.getUnsyncedEntries();
    final errors = <String>[];
    var pushed = 0;

    if (unsynced.isNotEmpty) {
      try {
        final resp = await http.post(
          Uri.parse('$url/api/entries/sync'),
          headers: headers,
          body: jsonEncode({'entries': unsynced.map((e) => e.toJson()).toList()}),
        ).timeout(const Duration(seconds: 30));
        if (resp.statusCode == 200) {
          await db.markAsSynced(unsynced.map((e) => e.id).toList());
          pushed = unsynced.length;
        } else {
          errors.add('Push fehlgeschlagen: HTTP ${resp.statusCode}');
        }
      } catch (e) {
        errors.add('Push fehlgeschlagen: $e');
      }
    }

    // 2. Pull all entries from server
    var pulled = 0;
    try {
      final resp = await http
          .get(Uri.parse('$url/api/entries'), headers: headers)
          .timeout(const Duration(seconds: 30));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final list = data['entries'] as List<dynamic>;
        final serverEntries = list
            .map((e) => TimeEntry.fromJson(e as Map<String, dynamic>))
            .toList();
        await db.insertOrUpdateEntries(serverEntries);
        pulled = serverEntries.length;
      } else {
        errors.add('Pull fehlgeschlagen: HTTP ${resp.statusCode}');
      }
    } catch (e) {
      errors.add('Pull fehlgeschlagen: $e');
    }

    return SyncResult(pushed: pushed, pulled: pulled, errors: errors);
  }

  Future<bool> testConnection({required String baseUrl, String? apiKey}) async {
    final headers = {
      if (apiKey != null && apiKey.isNotEmpty) 'x-api-key': apiKey,
    };
    final url = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    try {
      final resp = await http
          .get(Uri.parse('$url/api/health'), headers: headers)
          .timeout(const Duration(seconds: 10));
      return resp.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
