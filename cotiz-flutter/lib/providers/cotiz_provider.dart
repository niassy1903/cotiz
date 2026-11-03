import 'package:flutter/foundation.dart';

import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../data/models/contribution_model.dart';
import '../data/models/expense_model.dart';
import '../data/models/member_model.dart';
import '../data/models/organization_model.dart';
import '../data/models/payment_model.dart';
import '../data/models/user_model.dart';

class CotizProvider extends ChangeNotifier {
  OrganizationModel? _currentOrg;
  final List<OrganizationModel> _organizations = [];
  final List<MemberModel> _members = [];
  final List<ContributionModel> _contributions = [];
  final List<PaymentModel> _payments = [];
  final List<ExpenseModel> _expenses = [];
  final List<Map<String, dynamic>> _cycles = [];
  final List<Map<String, dynamic>> _notifications = [];
  final List<Map<String, dynamic>> _auditLogs = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _currentOrgId = '';

  OrganizationModel? get currentOrg => _currentOrg;
  List<OrganizationModel> get organizations =>
      List.unmodifiable(_organizations);
  List<MemberModel> get members => List.unmodifiable(_members);
  List<ContributionModel> get contributions =>
      List.unmodifiable(_contributions);
  List<PaymentModel> get payments => List.unmodifiable(_payments);
  List<ExpenseModel> get expenses => List.unmodifiable(_expenses);
  List<Map<String, dynamic>> get cycles => List.unmodifiable(_cycles);
  List<Map<String, dynamic>> get notifications =>
      List.unmodifiable(_notifications);
  List<Map<String, dynamic>> get auditLogs => List.unmodifiable(_auditLogs);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  double get totalCollected => _payments
      .where((payment) => payment.status == 'validated')
      .fold(0, (total, payment) => total + payment.amount);

  double get pendingAmount => _payments
      .where((payment) => payment.status == 'pending')
      .fold(0, (total, payment) => total + payment.amount);

  double get totalExpenses => _expenses
      .where((expense) => expense.status == 'active')
      .fold(0, (total, expense) => total + expense.amount);

  int get unreadNotifications => _notifications
      .where((notification) => notification['read'] != true)
      .length;

  Future<void> refresh({String? organizationId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final selectedId = organizationId ?? _currentOrgId;
      final uri = Uri.parse(ApiEndpoints.bootstrap).replace(
        queryParameters:
            selectedId.isEmpty ? null : {'organization_id': selectedId},
      );
      final payload = await ApiClient.get(uri.toString());
      if (payload is! Map<String, dynamic>) {
        throw const ApiException(
            'Les données reçues du serveur sont invalides.');
      }
      _applyBootstrap(payload);
    } on ApiException catch (error) {
      _errorMessage = error.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _applyBootstrap(Map<String, dynamic> data) {
    _currentOrgId = data['current_org_id']?.toString() ?? '';
    _organizations
      ..clear()
      ..addAll(_readList(data['organizations'], OrganizationModel.fromJson));
    _currentOrg =
        _organizations.where((org) => org.id == _currentOrgId).firstOrNull ??
            (_organizations.isEmpty ? null : _organizations.first);
    _members
      ..clear()
      ..addAll(_readList(data['members'], MemberModel.fromJson));
    _contributions
      ..clear()
      ..addAll(_readList(data['contributions'], ContributionModel.fromJson));
    _cycles
      ..clear()
      ..addAll(_readMapList(data['cycles']));
    _payments
      ..clear()
      ..addAll(_readList(data['payments'], (json) {
        final contribution = _contributions
            .where((item) =>
                item.id ==
                (json['contribution_id'] ?? json['contributionId']).toString())
            .firstOrNull;
        final member = _members
            .where((item) =>
                item.id == (json['member_id'] ?? json['memberId']).toString())
            .firstOrNull;
        return PaymentModel.fromJson({
          ...json,
          'contribution_title':
              json['contribution_title'] ?? contribution?.title ?? 'Cotisation',
          'member_name': json['member_name'] ?? member?.fullName ?? 'Membre',
        });
      }));
    _expenses
      ..clear()
      ..addAll(_readList(data['expenses'], ExpenseModel.fromJson));
    _notifications
      ..clear()
      ..addAll(_readMapList(data['notifications']));
    _auditLogs
      ..clear()
      ..addAll(_readMapList(data['audit_logs']));
  }

  List<T> _readList<T>(
    dynamic value,
    T Function(Map<String, dynamic>) parse,
  ) {
    if (value is! List) return [];
    return value
        .whereType<Map<String, dynamic>>()
        .map(parse)
        .toList(growable: true);
  }

  List<Map<String, dynamic>> _readMapList(dynamic value) {
    if (value is! List) return [];
    return value.whereType<Map<String, dynamic>>().toList(growable: true);
  }

  String _organizationPath(String suffix) {
    final organization = _currentOrg;
    if (organization == null) {
      throw const ApiException(
          'Aucune organisation active n’est sélectionnée.');
    }
    return '${ApiEndpoints.baseUrl}/organizations/${organization.id}/$suffix';
  }

  Future<void> _mutate(Future<dynamic> Function() operation) async {
    _errorMessage = null;
    try {
      await operation();
      await refresh(organizationId: _currentOrgId);
      if (_errorMessage != null) throw ApiException(_errorMessage!);
    } on ApiException catch (error) {
      _errorMessage = error.message;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> selectOrganization(String id) async {
    await refresh(organizationId: id);
  }

  Future<void> updateOrganization(Map<String, dynamic> updates) async {
    final organization = _currentOrg;
    if (organization == null) {
      throw const ApiException('Aucune organisation active n’est sélectionnée.');
    }
    await _mutate(() =>
        ApiClient.patch('${ApiEndpoints.baseUrl}/organizations/${organization.id}', updates));
  }

  Future<void> updateSubscriptionPlan(String plan) async {
    final organization = _currentOrg;
    if (organization == null) {
      throw const ApiException('Aucune organisation active n’est sélectionnée.');
    }
    await _mutate(() => ApiClient.patch(
          '${ApiEndpoints.baseUrl}/organizations/${organization.id}/subscription',
          {'subscription_plan': plan},
        ));
  }

  Future<void> createOrganization(Map<String, dynamic> data) async {
    final result = await ApiClient.post(ApiEndpoints.organizations, data);
    if (result is! Map<String, dynamic> || result['id'] == null) {
      throw const ApiException('Le serveur n’a pas retourné la nouvelle organisation.');
    }
    await refresh(organizationId: result['id'].toString());
    if (_errorMessage != null) throw ApiException(_errorMessage!);
  }

  Future<void> recordPayment({
    required String contributionId,
    required String memberId,
    required double amount,
    required String method,
    String? cycleId,
    String? transactionId,
    String? notes,
  }) async {
    await _mutate(() => ApiClient.post(_organizationPath('payments'), {
          'contribution_id': contributionId,
          if (cycleId != null) 'cycle_id': cycleId,
          'member_id': memberId,
          'amount': amount,
          'method': method,
          if (transactionId != null && transactionId.isNotEmpty)
            'transaction_id': transactionId,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        }));
  }

  Future<void> validatePayment(String paymentId, {String? notes}) async {
    await _mutate(() => ApiClient.post(
          _organizationPath('payments/$paymentId/validate'),
          {if (notes != null && notes.isNotEmpty) 'notes': notes},
        ));
  }

  Future<void> rejectPayment(String paymentId, String reason) async {
    await _mutate(() => ApiClient.post(
          _organizationPath('payments/$paymentId/reject'),
          {'reason': reason},
        ));
  }

  Future<void> cancelPayment(String paymentId) async {
    await _mutate(
        () => ApiClient.post(_organizationPath('payments/$paymentId/cancel')));
  }

  Future<void> createContribution({
    required String title,
    required double amount,
    required String frequency,
    required String startDate,
    String amountType = 'fixed',
    double? amountFemale,
    int? dayOfMonth,
    String targetType = 'all',
  }) async {
    await _mutate(() => ApiClient.post(_organizationPath('contributions'), {
          'title': title,
          'amount_type': amountType,
          'amount': amount,
          if (amountFemale != null) 'amount_female': amountFemale,
          'frequency': frequency,
          if (dayOfMonth != null) 'day_of_month': dayOfMonth,
          'start_date': startDate,
          'target_type': targetType,
        }));
  }

  Future<void> closeCycle(String cycleId) async {
    await _mutate(
      () => ApiClient.post(_organizationPath('cycles/$cycleId/close')),
    );
  }

  Future<void> createExpense({
    required double amount,
    required String description,
    required String date,
    required String category,
  }) async {
    await _mutate(() => ApiClient.post(_organizationPath('expenses'), {
          'amount': amount,
          'description': description,
          'date': date,
          'category': category,
        }));
  }

  Future<void> cancelExpense(String expenseId) async {
    await _mutate(
        () => ApiClient.post(_organizationPath('expenses/$expenseId/cancel')));
  }

  Future<void> addMember({
    required String firstName,
    required String lastName,
    required String phone,
    required String gender,
    required String role,
    required bool isGhost,
    String? email,
  }) async {
    await _mutate(() => ApiClient.post(_organizationPath('members'), {
          'first_name': firstName,
          'last_name': lastName,
          'phone': phone,
          'gender': gender,
          'role': role,
          'is_ghost': isGhost,
          if (email != null && email.isNotEmpty) 'email': email,
        }));
  }

  Future<void> updateMember(
      String memberId, Map<String, dynamic> updates) async {
    await _mutate(
        () => ApiClient.patch(_organizationPath('members/$memberId'), updates));
  }

  Future<void> archiveMember(String memberId) async {
    await _mutate(
        () => ApiClient.delete(_organizationPath('members/$memberId')));
  }

  Future<void> acceptMember(String memberId) async {
    await _mutate(
        () => ApiClient.post(_organizationPath('members/$memberId/accept')));
  }

  Future<void> rejectMember(String memberId) async {
    await _mutate(
        () => ApiClient.post(_organizationPath('members/$memberId/reject')));
  }

  Future<void> toggleMemberTransactionAccess(String memberId) async {
    await _mutate(() => ApiClient.patch(
          _organizationPath('members/$memberId/transaction-access'),
          {},
        ));
  }

  Future<void> transferAdmin(String memberId) async {
    await _mutate(() => ApiClient.post(
          _organizationPath('members/$memberId/transfer-admin'),
        ));
  }

  Future<void> markNotificationRead(String notificationId) async {
    await _mutate(() => ApiClient.post(
          _organizationPath('notifications/$notificationId/read'),
        ));
  }

  Future<void> markAllNotificationsRead() async {
    await _mutate(
      () => ApiClient.post(_organizationPath('notifications/read-all')),
    );
  }

  Future<Map<String, dynamic>> fetchReferrals() async {
    final result = await ApiClient.get(ApiEndpoints.referrals);
    if (result is! Map<String, dynamic>) {
      throw const ApiException(
          'Les données de parrainage reçues sont invalides.');
    }
    return result;
  }

  Future<Map<String, dynamic>> rotateReferralCode() async {
    final result = await ApiClient.post('${ApiEndpoints.referrals}/rotate');
    if (result is! Map<String, dynamic>) {
      throw const ApiException(
          'Les données de parrainage reçues sont invalides.');
    }
    return result;
  }

  Future<String> createInvitation() async {
    final result = await ApiClient.post(_organizationPath('invitations'));
    if (result is! Map<String, dynamic> || result['url'] is! String) {
      throw const ApiException('Le serveur n’a pas retourné de lien d’invitation.');
    }
    return result['url'] as String;
  }

  String? memberIdForUser(UserModel? user) {
    if (user == null) return null;
    return _members.where((member) => member.userId == user.id).firstOrNull?.id;
  }
}
