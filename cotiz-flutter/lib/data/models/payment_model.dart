class PaymentModel {
  final String id;
  final String orgId;
  final String contributionId;
  final String contributionTitle;
  final String memberId;
  final String memberName;
  final double amount;
  final String method; // wave, orange_money, cash
  final String transactionId;
  final String status; // pending, validated, rejected, cancelled
  final String paymentDate;
  final String? notes;

  PaymentModel({
    required this.id,
    required this.orgId,
    required this.contributionId,
    required this.contributionTitle,
    required this.memberId,
    required this.memberName,
    required this.amount,
    required this.method,
    required this.transactionId,
    required this.status,
    required this.paymentDate,
    this.notes,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id']?.toString() ?? '',
      orgId: json['org_id']?.toString() ?? json['orgId']?.toString() ?? '',
      contributionId: json['contribution_id']?.toString() ?? json['contributionId']?.toString() ?? '',
      contributionTitle: json['contribution_title'] ?? json['contributionTitle'] ?? 'Cotisation',
      memberId: json['member_id']?.toString() ?? json['memberId']?.toString() ?? '',
      memberName: json['member_name'] ?? json['memberName'] ?? 'Membre',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      method: json['method'] ?? 'wave',
      transactionId: json['transaction_id'] ?? json['transactionId'] ?? '',
      status: json['status'] ?? 'pending',
      paymentDate: json['payment_date'] ?? json['paymentDate'] ?? DateTime.now().toIso8601String(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'org_id': orgId,
      'contribution_id': contributionId,
      'contribution_title': contributionTitle,
      'member_id': memberId,
      'member_name': memberName,
      'amount': amount,
      'method': method,
      'transaction_id': transactionId,
      'status': status,
      'payment_date': paymentDate,
      'notes': notes,
    };
  }
}
