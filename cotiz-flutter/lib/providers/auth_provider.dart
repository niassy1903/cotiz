import 'package:flutter/foundation.dart';

import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';
class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    initialize();
  }

  final AuthRepository _repo = AuthRepository();
  UserModel? _currentUser;
  LoginChallenge? _loginChallenge;
  bool _isLoading = true;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  LoginChallenge? get loginChallenge => _loginChallenge;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> initialize() async {
    final token = await ApiClient.getToken();
    if (token == null || token.isEmpty) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      _currentUser = await _repo.currentUser();
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await ApiClient.clearToken();
      } else {
        _errorMessage = error.message;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      _loginChallenge = await _repo.login(email.trim(), password);
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> verifyLoginOtp(String code) async {
    final challenge = _loginChallenge;
    if (challenge == null) {
      _errorMessage = 'La demande de connexion a expiré. Recommencez.';
      notifyListeners();
      return false;
    }

    _setLoading(true);
    try {
      final session = await _repo.verifyLogin(challenge.challenge, code.trim());
      await ApiClient.saveToken(session.token);
      _currentUser = session.user;
      _loginChallenge = null;
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> resendLoginOtp() async {
    final challenge = _loginChallenge;
    if (challenge == null) {
      _errorMessage = 'La demande de connexion a expiré. Recommencez.';
      notifyListeners();
      return false;
    }

    _setLoading(true);
    try {
      _loginChallenge = await _repo.resendLogin(challenge.challenge);
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register({
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
    _setLoading(true);
    try {
      final session = await _repo.register(
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender: gender,
        password: password,
        organizationName: organizationName?.trim(),
        invitationToken: invitationToken,
        referralCode: referralCode,
      );
      await ApiClient.saveToken(session.token);
      _currentUser = session.user;
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> forgotPassword(String email) async {
    _setLoading(true);
    try {
      await _repo.forgotPassword(email.trim());
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _setLoading(true);
    try {
      final response = await ApiClient.patch(
        ApiEndpoints.profile,
        updates,
      );
      if (response is! Map<String, dynamic>) {
        throw const ApiException('Le profil reçu du serveur est invalide.');
      }
      _currentUser = UserModel.fromJson(response);
      _errorMessage = null;
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    try {
      if (await ApiClient.getToken() != null) await _repo.logout();
    } finally {
      await ApiClient.clearToken();
      _currentUser = null;
      _loginChallenge = null;
      _errorMessage = null;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
