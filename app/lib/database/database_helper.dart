import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/time_entry.dart';
import '../models/employer.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _db;
  DatabaseHelper._init();

  Future<Database> get database async => _db ??= await _initDB();

  Future<Database> _initDB() async {
    final path = join(await getDatabasesPath(), 'zeiterfassung.db');
    return openDatabase(path, version: 1, onCreate: _create);
  }

  Future<void> _create(Database db, int _) async {
    await db.execute('''
      CREATE TABLE employers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        weekly_hours REAL NOT NULL DEFAULT 40.0,
        nas_url TEXT,
        nas_api_key TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE time_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        break_minutes INTEGER NOT NULL DEFAULT 0,
        work_type TEXT NOT NULL DEFAULT 'homeoffice',
        day_type TEXT NOT NULL DEFAULT 'workday',
        note TEXT DEFAULT '',
        distance_km REAL,
        start_lat REAL,
        start_lng REAL,
        end_lat REAL,
        end_lng REAL,
        is_synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> insertEntry(TimeEntry e) async {
    final db = await database;
    await db.insert('time_entries', e.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateEntry(TimeEntry e) async {
    final db = await database;
    await db.update('time_entries', e.toMap(), where: 'id = ?', whereArgs: [e.id]);
  }

  Future<void> deleteEntry(String id) async {
    final db = await database;
    await db.delete('time_entries', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<TimeEntry>> getEntriesForMonth(int year, int month) async {
    final db = await database;
    final start = '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-01';
    final endMonth = month == 12 ? 1 : month + 1;
    final endYear = month == 12 ? year + 1 : year;
    final end = '${endYear.toString().padLeft(4, '0')}-${endMonth.toString().padLeft(2, '0')}-01';
    final rows = await db.query(
      'time_entries',
      where: 'date >= ? AND date < ?',
      whereArgs: [start, end],
      orderBy: 'start_time DESC',
    );
    return rows.map(TimeEntry.fromMap).toList();
  }

  Future<List<TimeEntry>> getEntriesForDateRange(DateTime from, DateTime to) async {
    final db = await database;
    final rows = await db.query(
      'time_entries',
      where: 'date >= ? AND date <= ?',
      whereArgs: [from.toIso8601String().substring(0, 10), to.toIso8601String().substring(0, 10)],
      orderBy: 'start_time ASC',
    );
    return rows.map(TimeEntry.fromMap).toList();
  }

  Future<List<TimeEntry>> getUnsyncedEntries() async {
    final db = await database;
    final rows = await db.query('time_entries', where: 'is_synced = 0');
    return rows.map(TimeEntry.fromMap).toList();
  }

  Future<void> markAsSynced(List<String> ids) async {
    if (ids.isEmpty) return;
    final db = await database;
    final placeholders = ids.map((_) => '?').join(',');
    await db.rawUpdate(
      'UPDATE time_entries SET is_synced = 1 WHERE id IN ($placeholders)',
      ids,
    );
  }

  Future<void> insertOrUpdateEntries(List<TimeEntry> entries) async {
    final db = await database;
    final batch = db.batch();
    for (final e in entries) {
      batch.insert('time_entries', e.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertEmployer(Employer e) async {
    final db = await database;
    await db.insert('employers', e.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateEmployer(Employer e) async {
    final db = await database;
    await db.update('employers', e.toMap(), where: 'id = ?', whereArgs: [e.id]);
  }

  Future<void> deleteEmployer(String id) async {
    final db = await database;
    await db.delete('employers', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<Employer>> getEmployers() async {
    final db = await database;
    final rows = await db.query('employers');
    return rows.map(Employer.fromMap).toList();
  }
}
