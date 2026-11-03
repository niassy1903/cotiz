import 'package:flutter/material.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo = AuthRepository();

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _repo.login(email, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String gender,
    required String password,
    required String organizationName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _repo.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        gender: gender,
        password: password,
        organizationName: organizationName,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  void switchDemoRole(String role) {
    if (_currentUser == null) {
      _currentUser = UserModel(
        id: 'usr-1',
        firstName: role == 'admin' ? 'Lamine' : 'Fatou',
        lastName: role == 'admin' ? 'Niassy' : 'Diop',
        email: role == 'admin' ? 'niassy.lamine10@gmail.com' : 'fatou.diop@cotiz.sn',
        phone: '+221 77 123 45 67',
        gender: role == 'admin' ? 'M' : 'F',
        role: role,
        currentOrgId: 'org-1',
      );
    } else {
      _currentUser = UserModel(
        id: _currentUser!.id,
        firstName: _currentUser!.firstName,
        lastName: _currentUser!.lastName,
        email: _currentUser!.email,
        phone: _currentUser!.phone,
        gender: _currentUser!.gender,
        role: role,
        currentOrgId: _currentUser!.currentOrgId,
      );
    }
    notifyListeners();
  }
}
