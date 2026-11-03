class ApiEndpoints {
  // Base URL provided by user
  static const String baseUrl = 'https://cotiz-api.onrender.com/api/v1';

  // Auth
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String me = '$baseUrl/auth/me';
  static const String logout = '$baseUrl/auth/logout';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';

  // Organizations
  static const String organizations = '$baseUrl/organizations';

  // Contributions
  static const String contributions = '$baseUrl/contributions';

  // Payments
  static const String payments = '$baseUrl/payments';
  static const String validatePayment = '$baseUrl/payments/validate';

  // Expenses
  static const String expenses = '$baseUrl/expenses';

  // Members
  static const String members = '$baseUrl/members';

  // Dashboard & Reports
  static const String dashboard = '$baseUrl/dashboard';
}
