import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/employer_provider.dart';
import 'providers/time_entry_provider.dart';
import 'database/database_helper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DatabaseHelper.instance.database;
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => EmployerProvider()..load()),
        ChangeNotifierProvider(create: (_) => TimeEntryProvider()),
      ],
      child: const ZeiterfassungApp(),
    ),
  );
}
