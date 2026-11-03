import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../home/main_navigation_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  bool _obscurePassword = true;
  bool _awaitingOtp = false;
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Connexion',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Espace Cotiz Mobile',
                  style: TextStyle(
                      color: AppColors.primaryDark,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _awaitingOtp
                    ? 'Vérifiez votre adresse e-mail'
                    : 'Bon retour parmi nous !',
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                _awaitingOtp
                    ? 'Saisissez le code à 6 chiffres envoyé à ${_emailController.text.trim()}.'
                    : 'Connectez-vous pour accéder aux cotisations de votre Dahira ou Tontine.',
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              if (auth.errorMessage != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    auth.errorMessage!,
                    style:
                        const TextStyle(color: AppColors.error, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Email field
              if (!_awaitingOtp) ...[
                const Text('Adresse Email',
                    style:
                        TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    hintText: 'votre.email@cotiz.sn',
                    prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Mot de passe',
                    style:
                        TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    hintText: '••••••••',
                    prefixIcon:
                        const Icon(Icons.lock_outline_rounded, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: auth.isLoading
                        ? null
                        : () async {
                            final messenger = ScaffoldMessenger.maybeOf(context);
                            final success = await auth
                                .forgotPassword(_emailController.text);
                            if (!mounted) return;
                            if (messenger == null) return;
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(
                                  success
                                      ? 'Si cette adresse possède un compte, un lien de réinitialisation lui a été envoyé.'
                                      : auth.errorMessage ??
                                          'La demande a échoué.',
                                ),
                              ),
                            );
                          },
                    child: const Text('Mot de passe oublié ?',
                        style: TextStyle(color: AppColors.primary)),
                  ),
                ),
              ] else ...[
                const Text('Code de vérification',
                    style:
                        TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textInputAction: TextInputAction.done,
                  decoration: const InputDecoration(
                    hintText: '123456',
                    prefixIcon: Icon(Icons.verified_user_outlined, size: 20),
                    counterText: '',
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: auth.isLoading
                        ? null
                        : () async {
                            final messenger = ScaffoldMessenger.maybeOf(context);
                            final success = await auth.resendLoginOtp();
                            if (!mounted) return;
                            if (messenger == null) return;
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(success
                                    ? 'Un nouveau code a été envoyé.'
                                    : auth.errorMessage ??
                                        'Impossible de renvoyer le code.'),
                              ),
                            );
                          },
                    child: const Text('Renvoyer le code'),
                  ),
                ),
              ],
              const SizedBox(height: 28),

              // Submit Button
              ElevatedButton(
                onPressed: auth.isLoading
                    ? null
                    : () async {
                        final navigator = Navigator.of(context);
                        final success = _awaitingOtp
                            ? await auth.verifyLoginOtp(_otpController.text)
                            : await auth.login(
                                _emailController.text,
                                _passwordController.text,
                              );
                        if (success && mounted) {
                          if (_awaitingOtp) {
                            navigator.pushAndRemoveUntil(
                              MaterialPageRoute(
                                  builder: (_) => const MainNavigationScreen()),
                              (route) => false,
                            );
                          } else {
                            setState(() => _awaitingOtp = true);
                          }
                        }
                      },
                child: auth.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : Text(_awaitingOtp
                        ? 'Vérifier et se connecter'
                        : 'Continuer'),
              ),
              const SizedBox(height: 20),

              if (!_awaitingOtp)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Pas encore de compte ? ',
                        style: TextStyle(
                            fontSize: 13, color: AppColors.textSecondary)),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => const RegisterScreen()),
                        );
                      },
                      child: const Text(
                        'Créer un compte',
                        style: TextStyle(
                            fontSize: 13,
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
