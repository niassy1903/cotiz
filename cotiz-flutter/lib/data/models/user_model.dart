class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String gender;
  final String role;
  final String? currentOrgId;
  final String? avatar;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.gender,
    required this.role,
    this.currentOrgId,
    this.avatar,
  });

  String get fullName => '$firstName $lastName';
  bool get isAdmin => role == 'admin' || role == 'superadmin';

  UserModel copyWith({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? gender,
    String? avatar,
  }) =>
      UserModel(
        id: id,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        email: email ?? this.email,
        phone: phone ?? this.phone,
        gender: gender ?? this.gender,
        role: role,
        currentOrgId: currentOrgId,
        avatar: avatar ?? this.avatar,
      );

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      firstName: json['first_name'] ?? json['firstName'] ?? '',
      lastName: json['last_name'] ?? json['lastName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      gender: json['gender'] ?? 'M',
      role: json['role'] ?? 'member',
      currentOrgId: json['current_org_id'] ?? json['currentOrgId'],
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'gender': gender,
      'role': role,
      'current_org_id': currentOrgId,
      'avatar': avatar,
    };
  }
}
