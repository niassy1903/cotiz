import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  static const String tokenKey = 'cotiz_auth_token';
  static const Duration _timeout = Duration(seconds: 30);

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(tokenKey);
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String url) => _request('GET', url);

  static Future<dynamic> post(String url, [Map<String, dynamic>? body]) =>
      _request('POST', url, body);

  static Future<dynamic> patch(String url, Map<String, dynamic> body) =>
      _request('PATCH', url, body);

  static Future<dynamic> put(String url, Map<String, dynamic> body) =>
      _request('PUT', url, body);

  static Future<dynamic> delete(String url) => _request('DELETE', url);

  static Future<dynamic> _request(
    String method,
    String url, [
    Map<String, dynamic>? body,
  ]) async {
    try {
      final headers = await _getHeaders();
      final uri = Uri.parse(url);
      final encodedBody = body == null ? null : jsonEncode(body);
      final response = switch (method) {
        'GET' => await http.get(uri, headers: headers).timeout(_timeout),
        'POST' => await http
            .post(uri, headers: headers, body: encodedBody)
            .timeout(_timeout),
        'PATCH' => await http
            .patch(uri, headers: headers, body: encodedBody)
            .timeout(_timeout),
        'PUT' => await http
            .put(uri, headers: headers, body: encodedBody)
            .timeout(_timeout),
        'DELETE' => await http.delete(uri, headers: headers).timeout(_timeout),
        _ => throw ArgumentError.value(
            method, 'method', 'Unsupported HTTP method'),
      };

      final decoded = response.body.isEmpty ? null : jsonDecode(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _errorMessage(decoded, response.statusCode),
          statusCode: response.statusCode,
        );
      }

      if (decoded is Map<String, dynamic> && decoded.containsKey('data')) {
        return decoded['data'];
      }
      return decoded;
    } on ApiException {
      rethrow;
    } on SocketException {
      throw const ApiException(
          'Connexion au serveur impossible. Vérifiez votre réseau.');
    } on TimeoutException {
      throw const ApiException(
          'Le serveur met trop de temps à répondre. Réessayez.');
    } on FormatException {
      throw const ApiException('La réponse du serveur est invalide.');
    } on http.ClientException {
      throw const ApiException('Connexion au serveur impossible. Réessayez.');
    }
  }

  static String _errorMessage(dynamic payload, int statusCode) {
    if (payload is Map<String, dynamic>) {
      final errors = payload['errors'];
      if (errors is Map) {
        for (final value in errors.values) {
          if (value is List && value.isNotEmpty) return value.first.toString();
        }
      }
      final message = payload['message'];
      if (message is String && message.isNotEmpty) return message;
    }
    return 'La requête a échoué (HTTP $statusCode).';
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
  }
}
