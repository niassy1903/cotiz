class ExpenseModel {
  const ExpenseModel({
    required this.id,
    required this.amount,
    required this.description,
    required this.date,
    required this.category,
    required this.status,
    required this.createdByAdminName,
  });

  final String id;
  final double amount;
  final String description;
  final String date;
  final String category;
  final String status;
  final String createdByAdminName;

  factory ExpenseModel.fromJson(Map<String, dynamic> json) => ExpenseModel(
        id: json['id']?.toString() ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        description: json['description']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        category: json['category']?.toString() ?? 'Autres',
        status: json['status']?.toString() ?? 'active',
        createdByAdminName: json['created_by_admin_name']?.toString() ?? '',
      );
}
