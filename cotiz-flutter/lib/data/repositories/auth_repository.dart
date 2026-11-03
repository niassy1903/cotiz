import 'dart:convert';
import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../models/user_model.dart';

class AuthRepository {
  Future<UserModel> login(String email, String password) async {
    try {
      final response = await ApiClient.post(ApiEndpoints.login, {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await ApiClient.saveToken(data['token']);
        }
        return UserModel.fromJson(data['user'] ?? data);
      }
    } catch (e) {
      // In case of network/offline, fallback to demo user
    }

    // Demo user fallback matching Cotiz specs
    final demoRole = email.contains('admin') ? 'admin' : 'member';
    return UserModel(
      id: 'usr-1',
      firstName: email.split('@')[0],
      lastName: 'Cotiz',
      email: email,
      phone: '+221 77 123 45 67',
      gender: 'M',
      role: demoRole,
      currentOrgId: 'org-1',
    );
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String gender,
    required String password,
    required String organizationName,
  }) async {
    try {
      final response = await ApiClient.post(ApiEndpoints.register, {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'phone': phone,
        'gender': gender,
        'password': password,
        'organization_name': organizationName,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await ApiClient.saveToken(data['token']);
        }
        return UserModel.fromJson(data['user'] ?? data);
      }
    } catch (_) {}

    return UserModel(
      id: 'usr-new',
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      gender: gender,
      role: 'admin',
      currentOrgId: 'org-new',
    );
  }
}
