// Österreichische Feiertage (bundesweit)
class HolidayService {
  static final HolidayService instance = HolidayService._();
  HolidayService._();

  final Map<int, Set<String>> _cache = {};

  Set<String> _holidaysForYear(int year) {
    if (_cache.containsKey(year)) return _cache[year]!;
    final easter = _easterDate(year);
    final holidays = <String>{
      '$year-01-01', // Neujahr
      '$year-01-06', // Heilige Drei Könige
      _fmt(easter.add(const Duration(days: 1))),   // Ostermontag
      '$year-05-01', // Staatsfeiertag
      _fmt(easter.add(const Duration(days: 39))),  // Christi Himmelfahrt
      _fmt(easter.add(const Duration(days: 50))),  // Pfingstmontag
      _fmt(easter.add(const Duration(days: 60))),  // Fronleichnam
      '$year-08-15', // Mariä Himmelfahrt
      '$year-10-26', // Nationalfeiertag
      '$year-11-01', // Allerheiligen
      '$year-12-08', // Mariä Empfängnis
      '$year-12-25', // Christtag
      '$year-12-26', // Stefanitag
    };
    _cache[year] = holidays;
    return holidays;
  }

  bool isHoliday(DateTime date) {
    final key = _fmt(date);
    return _holidaysForYear(date.year).contains(key);
  }

  String? holidayName(DateTime date) {
    final key = _fmt(date);
    if (!_holidaysForYear(date.year).contains(key)) return null;
    final year = date.year;
    final easter = _easterDate(year);
    final named = {
      '$year-01-01': 'Neujahr',
      '$year-01-06': 'Heilige Drei Könige',
      _fmt(easter.add(const Duration(days: 1))): 'Ostermontag',
      '$year-05-01': 'Staatsfeiertag',
      _fmt(easter.add(const Duration(days: 39))): 'Christi Himmelfahrt',
      _fmt(easter.add(const Duration(days: 50))): 'Pfingstmontag',
      _fmt(easter.add(const Duration(days: 60))): 'Fronleichnam',
      '$year-08-15': 'Mariä Himmelfahrt',
      '$year-10-26': 'Nationalfeiertag',
      '$year-11-01': 'Allerheiligen',
      '$year-12-08': 'Mariä Empfängnis',
      '$year-12-25': 'Christtag',
      '$year-12-26': 'Stefanitag',
    };
    return named[key];
  }

  List<DateTime> holidaysInMonth(int year, int month) {
    return _holidaysForYear(year)
        .map(DateTime.parse)
        .where((d) => d.month == month)
        .toList()
      ..sort();
  }

  // Gauß'sche Osterformel (anonymer Gregor)
  DateTime _easterDate(int year) {
    final a = year % 19;
    final b = year ~/ 100;
    final c = year % 100;
    final d = b ~/ 4;
    final e = b % 4;
    final f = (b + 8) ~/ 25;
    final g = (b - f + 1) ~/ 3;
    final h = (19 * a + b - d - g + 15) % 30;
    final i = c ~/ 4;
    final k = c % 4;
    final l = (32 + 2 * e + 2 * i - h - k) % 7;
    final m = (a + 11 * h + 22 * l) ~/ 451;
    final month = (h + l - 7 * m + 114) ~/ 31;
    final day = ((h + l - 7 * m + 114) % 31) + 1;
    return DateTime(year, month, day);
  }

  String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
