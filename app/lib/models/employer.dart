class Employer {
  final String id;
  final String name;
  final double weeklyHours;
  final String? nasUrl;
  final String? nasApiKey;

  const Employer({
    required this.id,
    required this.name,
    this.weeklyHours = 40.0,
    this.nasUrl,
    this.nasApiKey,
  });

  Employer copyWith({
    String? id,
    String? name,
    double? weeklyHours,
    String? nasUrl,
    String? nasApiKey,
  }) =>
      Employer(
        id: id ?? this.id,
        name: name ?? this.name,
        weeklyHours: weeklyHours ?? this.weeklyHours,
        nasUrl: nasUrl ?? this.nasUrl,
        nasApiKey: nasApiKey ?? this.nasApiKey,
      );

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'weekly_hours': weeklyHours,
    'nas_url': nasUrl,
    'nas_api_key': nasApiKey,
  };

  factory Employer.fromMap(Map<String, dynamic> m) => Employer(
    id: m['id'] as String,
    name: m['name'] as String,
    weeklyHours: (m['weekly_hours'] as num?)?.toDouble() ?? 40.0,
    nasUrl: m['nas_url'] as String?,
    nasApiKey: m['nas_api_key'] as String?,
  );

  Map<String, dynamic> toJson() => toMap();
  factory Employer.fromJson(Map<String, dynamic> json) => Employer.fromMap(json);
}
