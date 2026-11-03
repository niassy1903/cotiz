class MemberModel {
  const MemberModel({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.email,
    required this.gender,
    required this.role,
    required this.status,
    required this.isGhost,
    required this.hasTransactionAccess,
    this.joinDate,
  });

  final String id;
  final String? userId;
  final String firstName;
  final String lastName;
  final String phone;
  final String email;
  final String gender;
  final String role;
  final String status;
  final bool isGhost;
  final bool hasTransactionAccess;
  final String? joinDate;

  String get fullName => '$firstName $lastName'.trim();

  factory MemberModel.fromJson(Map<String, dynamic> json) => MemberModel(
        id: json['id']?.toString() ?? '',
        userId: (json['user_id'] ?? json['userId'])?.toString(),
        firstName: json['first_name']?.toString() ??
            json['firstName']?.toString() ??
            '',
        lastName:
            json['last_name']?.toString() ?? json['lastName']?.toString() ?? '',
        phone: json['phone']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        gender: json['gender']?.toString() ?? 'M',
        role: json['role']?.toString() ?? 'member',
        status: json['status']?.toString() ?? 'active',
        isGhost: json['is_ghost'] == true || json['isGhost'] == true,
        hasTransactionAccess: json['has_transaction_access'] == true ||
            json['hasTransactionAccess'] == true,
        joinDate: (json['join_date'] ?? json['joinDate'])?.toString(),
      );
}
