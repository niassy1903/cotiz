import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../models/user_model.dart';

class LoginChallenge {
  const LoginChallenge({required this.challenge, required this.expiresAt});

  final String challenge;
  final String expiresAt;

  factory LoginChallenge.fromJson(Map<String, dynamic> json) => LoginChallenge(
        challenge: json['challenge']?.toString() ?? '',
        expiresAt: json['expires_at']?.toString() ?? '',
      );
}

class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final UserModel user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final token = json['token'];
    if (user is! Map<String, dynamic> || token is! String || token.isEmpty) {
      throw const ApiException('La réponse de connexion est incomplète.');
    }
    return AuthSession(token: token, user: UserModel.fromJson(user));
  }
}

class AuthRepository {
  Future<LoginChallenge> login(String email, String password) async {
    final response = await ApiClient.post(ApiEndpoints.login, {
      'email': email,
      'password': password,
    });
    if (response is! Map<String, dynamic>) {
      throw const ApiException('La réponse de connexion est invalide.');
    }
    return LoginChallenge.fromJson(response);
  }

  Future<AuthSession> verifyLogin(String challenge, String code) async {
    final response = await ApiClient.post(ApiEndpoints.verifyLogin, {
      'challenge': challenge,
      'code': code,
    });
    if (response is! Map<String, dynamic>) {
      throw const ApiException('La réponse de connexion est invalide.');
    }
    return AuthSession.fromJson(response);
  }

  Future<LoginChallenge> resendLogin(String challenge) async {
    final response = await ApiClient.post(ApiEndpoints.resendLogin, {
      'challenge': challenge,
    });
    if (response is! Map<String, dynamic>) {
      throw const ApiException('La réponse du serveur est invalide.');
    }
    return LoginChallenge.fromJson(response);
  }

  Future<AuthSession> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String gender,
    required String password,
    String? organizationName,
    String? invitationToken,
    String? referralCode,
  }) async {
    final response = await ApiClient.post(ApiEndpoints.register, {
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'gender': gender,
      'password': password,
      'password_confirmation': password,
      if (organizationName != null && organizationName.isNotEmpty)
        'organization_name': organizationName,
      if (invitationToken != null && invitationToken.isNotEmpty)
        'invite_token': invitationToken,
      if (referralCode != null && referralCode.isNotEmpty)
        'referral_code': referralCode,
    });
    if (response is! Map<String, dynamic>) {
      throw const ApiException('La réponse d’inscription est invalide.');
    }
    return AuthSession.fromJson(response);
  }

  Future<UserModel> currentUser() async {
    final response = await ApiClient.get(ApiEndpoints.me);
    if (response is! Map<String, dynamic>) {
      throw const ApiException('Le profil reçu du serveur est invalide.');
    }
    return UserModel.fromJson(response);
  }

  Future<void> forgotPassword(String email) async {
    await ApiClient.post(ApiEndpoints.forgotPassword, {'email': email});
  }

  Future<void> logout() async {
    await ApiClient.post(ApiEndpoints.logout);
  }
}
