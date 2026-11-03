import 'package:flutter/material.dart';
import '../data/models/organization_model.dart';
import '../data/models/contribution_model.dart';
import '../data/models/payment_model.dart';

class CotizProvider extends ChangeNotifier {
  OrganizationModel _currentOrg = OrganizationModel(
    id: 'org-1',
    name: 'Dahira Touba Al-Falah',
    type: 'dahira',
    description: 'Regroupement spirituel et de solidarité communautaire des disciples mourides.',
    location: 'Dakar, Sénégal (Plateau)',
    memberEstimate: 65,
    adminName: 'Lamine Niassy',
    waveNumber: '+221 77 123 45 67',
    orangeMoneyNumber: '+221 78 123 45 67',
    subscriptionPlan: 'basic',
    status: 'active',
  );

  List<ContributionModel> _contributions = [
    ContributionModel(
      id: 'cotiz-1',
      orgId: 'org-1',
      title: 'Cotisation Mensuelle Ordinaire',
      amountType: 'fixed',
      amount: 5000,
      frequency: 'monthly',
      dayOfMonth: 5,
      status: 'active',
    ),
    ContributionModel(
      id: 'cotiz-2',
      orgId: 'org-1',
      title: 'Adiya Spécial Grand Magal',
      amountType: 'by_gender',
      amount: 25000,
      amountFemale: 15000,
      frequency: 'annual',
      dayOfMonth: 20,
      status: 'active',
    ),
    ContributionModel(
      id: 'cotiz-3',
      orgId: 'org-1',
      title: 'Caisse Entraide & Santé',
      amountType: 'minimum',
      amount: 2000,
      frequency: 'monthly',
      dayOfMonth: 10,
      status: 'active',
    ),
  ];

  List<PaymentModel> _payments = [
    PaymentModel(
      id: 'pay-101',
      orgId: 'org-1',
      contributionId: 'cotiz-1',
      contributionTitle: 'Cotisation Mensuelle Ordinaire',
      memberId: 'mem-2',
      memberName: 'Fatou Diop',
      amount: 5000,
      method: 'wave',
      transactionId: 'WV-261102-882194',
      status: 'validated',
      paymentDate: '2026-11-02T08:15:00Z',
    ),
    PaymentModel(
      id: 'pay-102',
      orgId: 'org-1',
      contributionId: 'cotiz-2',
      contributionTitle: 'Adiya Spécial Grand Magal',
      memberId: 'mem-3',
      memberName: 'Moussa Sow',
      amount: 25000,
      method: 'orange_money',
      transactionId: 'OM-904128472',
      status: 'pending',
      paymentDate: '2026-11-02T10:45:00Z',
    ),
  ];

  OrganizationModel get currentOrg => _currentOrg;
  List<ContributionModel> get contributions => _contributions;
  List<PaymentModel> get payments => _payments;

  double get totalCollected => _payments
      .where((p) => p.status == 'validated')
      .fold(0.0, (acc, p) => acc + p.amount);

  double get pendingAmount => _payments
      .where((p) => p.status == 'pending')
      .fold(0.0, (acc, p) => acc + p.amount);

  void recordPayment({
    required String contributionId,
    required String memberId,
    required String memberName,
    required double amount,
    required String method,
    String? notes,
  }) {
    final contrib = _contributions.firstWhere((c) => c.id == contributionId,
        orElse: () => _contributions.first);

    final payment = PaymentModel(
      id: 'pay-${DateTime.now().millisecondsSinceEpoch}',
      orgId: _currentOrg.id,
      contributionId: contributionId,
      contributionTitle: contrib.title,
      memberId: memberId,
      memberName: memberName,
      amount: amount,
      method: method,
      transactionId: method == 'wave'
          ? 'WV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'
          : method == 'orange_money'
              ? 'OM-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'
              : 'CSH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      status: 'pending',
      paymentDate: DateTime.now().toIso8601String(),
      notes: notes,
    );

    _payments.insert(0, payment);
    notifyListeners();
  }

  void validatePayment(String paymentId) {
    final index = _payments.indexWhere((p) => p.id == paymentId);
    if (index != -1) {
      final old = _payments[index];
      _payments[index] = PaymentModel(
        id: old.id,
        orgId: old.orgId,
        contributionId: old.contributionId,
        contributionTitle: old.contributionTitle,
        memberId: old.memberId,
        memberName: old.memberName,
        amount: old.amount,
        method: old.method,
        transactionId: old.transactionId,
        status: 'validated',
        paymentDate: old.paymentDate,
        notes: old.notes,
      );
      notifyListeners();
    }
  }

  void createContribution({
    required String title,
    required double amount,
    double? amountFemale,
    required String frequency,
    int? dayOfMonth,
  }) {
    final newContrib = ContributionModel(
      id: 'cotiz-${DateTime.now().millisecondsSinceEpoch}',
      orgId: _currentOrg.id,
      title: title,
      amountType: amountFemale != null ? 'by_gender' : 'fixed',
      amount: amount,
      amountFemale: amountFemale,
      frequency: frequency,
      dayOfMonth: dayOfMonth,
      status: 'active',
    );
    _contributions.insert(0, newContrib);
    notifyListeners();
  }
}
