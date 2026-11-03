class ContributionModel {
  final String id;
  final String orgId;
  final String title;
  final String amountType;
  final double amount;
  final double? amountFemale;
  final String frequency;
  final int? dayOfMonth;
  final String status;

  ContributionModel({
    required this.id,
    required this.orgId,
    required this.title,
    required this.amountType,
    required this.amount,
    this.amountFemale,
    required this.frequency,
    this.dayOfMonth,
    required this.status,
  });

  factory ContributionModel.fromJson(Map<String, dynamic> json) {
    return ContributionModel(
      id: json['id']?.toString() ?? '',
      orgId: json['org_id']?.toString() ?? json['orgId']?.toString() ?? '',
      title: json['title'] ?? '',
      amountType: json['amount_type'] ?? json['amountType'] ?? 'fixed',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      amountFemale: (json['amount_female'] as num?)?.toDouble() ?? (json['amountFemale'] as num?)?.toDouble(),
      frequency: json['frequency'] ?? 'monthly',
      dayOfMonth: json['day_of_month'] ?? json['dayOfMonth'],
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'org_id': orgId,
      'title': title,
      'amount_type': amountType,
      'amount': amount,
      'amount_female': amountFemale,
      'frequency': frequency,
      'day_of_month': dayOfMonth,
      'status': status,
    };
  }
}
