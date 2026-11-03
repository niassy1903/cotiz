import 'package:intl/intl.dart';

class CurrencyFormatter {
  static String formatFCFA(num amount) {
    final formatter = NumberFormat("#,###", "fr_FR");
    final formatted = formatter.format(amount.round()).replaceAll(',', ' ');
    return '$formatted FCFA';
  }
}
