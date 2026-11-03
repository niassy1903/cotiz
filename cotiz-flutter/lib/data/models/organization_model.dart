class OrganizationModel {
  final String id;
  final String name;
  final String type; // dahira, tontine, association
  final String? description;
  final String location;
  final int memberEstimate;
  final String adminName;
  final String waveNumber;
  final String orangeMoneyNumber;
  final String subscriptionPlan;
  final String status;

  OrganizationModel({
    required this.id,
    required this.name,
    required this.type,
    this.description,
    required this.location,
    required this.memberEstimate,
    required this.adminName,
    required this.waveNumber,
    required this.orangeMoneyNumber,
    required this.subscriptionPlan,
    required this.status,
  });

  factory OrganizationModel.fromJson(Map<String, dynamic> json) {
    return OrganizationModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'dahira',
      description: json['description'],
      location: json['location'] ?? '',
      memberEstimate: json['member_estimate'] ?? json['memberEstimate'] ?? 0,
      adminName: json['admin_name'] ?? json['adminName'] ?? 'Admin',
      waveNumber: json['wave_number'] ?? json['waveNumber'] ?? '',
      orangeMoneyNumber: json['orange_money_number'] ?? json['orangeMoneyNumber'] ?? '',
      subscriptionPlan: json['subscription_plan'] ?? json['subscriptionPlan'] ?? 'free',
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'description': description,
      'location': location,
      'member_estimate': memberEstimate,
      'admin_name': adminName,
      'wave_number': waveNumber,
      'orange_money_number': orangeMoneyNumber,
      'subscription_plan': subscriptionPlan,
      'status': status,
    };
  }
}
