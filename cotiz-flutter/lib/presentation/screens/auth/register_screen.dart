import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../home/main_navigation_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _orgNameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _invitationController = TextEditingController();
  final _referralController = TextEditingController();
  String _gender = 'M';
  bool _obscure = true;

  String _normalizePhone(String value) {
    final trimmed = value.trim();
    var digits = trimmed.replaceAll(RegExp(r'\D'), '');
    if (trimmed.startsWith('00') && digits.startsWith('00')) {
      digits = digits.substring(2);
    }
    return '${trimmed.startsWith('+') || trimmed.startsWith('00') ? '+' : ''}$digits';
  }

  bool get _hasStrongPassword {
    final password = _passwordController.text;
    return password.length >= 12 &&
        password.length <= 72 &&
        RegExp(r'[a-z]').hasMatch(password) &&
        RegExp(r'[A-Z]').hasMatch(password) &&
        RegExp(r'\d').hasMatch(password) &&
        RegExp(r'[^A-Za-z\d]').hasMatch(password);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _orgNameController.dispose();
    _passwordController.dispose();
    _invitationController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Créer un compte',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Rejoignez la communauté',
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'Créez votre profil pour participer aux cotisations en toute sécurité.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Name inputs
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Prénom',
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _firstNameController,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(hintText: 'Moussa'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Nom',
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _lastNameController,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(hintText: 'Sow'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Email
              const Text('Adresse Email',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textCapitalization: TextCapitalization.none,
                textInputAction: TextInputAction.next,
                autocorrect: false,
                decoration: const InputDecoration(
                  hintText: 'moussa.sow@cotiz.sn',
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                ),
              ),
              const SizedBox(height: 14),

              // Phone
              const Text('Numéro de téléphone (Wave / OM)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: '+221 77 000 00 00',
                  prefixIcon: Icon(Icons.phone_outlined, size: 20),
                ),
              ),
              const SizedBox(height: 14),

              const Text('Code d’invitation (facultatif)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _invitationController,
                textCapitalization: TextCapitalization.none,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'Lien ou code d’invitation',
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                ),
              ),
              const SizedBox(height: 14),

              const Text('Nom de votre organisation',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _orgNameController,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'Ex: Dahira Touba Mermoz',
                  prefixIcon: Icon(Icons.groups_outlined, size: 20),
                ),
              ),
              const SizedBox(height: 14),
              const Text('Code de parrainage (facultatif)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _referralController,
                textCapitalization: TextCapitalization.characters,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'COTIZ-…',
                  prefixIcon: Icon(Icons.card_giftcard_outlined, size: 20),
                ),
              ),
              const SizedBox(height: 14),

              // Gender Selector
              const Text('Sexe',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Homme')),
                      selected: _gender == 'M',
                      selectedColor: AppColors.primarySoft,
                      onSelected: (val) => setState(() => _gender = 'M'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Femme')),
                      selected: _gender == 'F',
                      selectedColor: AppColors.primarySoft,
                      onSelected: (val) => setState(() => _gender = 'F'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Password
              const Text('Mot de passe',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  hintText: '12 caractères, majuscule, chiffre, symbole',
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obscure
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: auth.isLoading
                    ? null
                    : () async {
                        final hasInvitation =
                            _invitationController.text.trim().isNotEmpty;
                        final normalizedPhone =
                            _normalizePhone(_phoneController.text);
                        final hasRequiredFields =
                            _firstNameController.text.trim().isNotEmpty &&
                                _lastNameController.text.trim().isNotEmpty &&
                                _emailController.text.trim().contains('@') &&
                                RegExp(r'^\+?[1-9]\d{7,15}$')
                                    .hasMatch(normalizedPhone) &&
                                _hasStrongPassword &&
                                (hasInvitation ||
                                    _orgNameController.text.trim().length >= 2);
                        if (!hasRequiredFields) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Vérifiez les champs requis. Le mot de passe doit contenir 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.'),
                            ),
                          );
                          return;
                        }
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.maybeOf(context);
                        final success = await auth.register(
                          firstName: _firstNameController.text.trim(),
                          lastName: _lastNameController.text.trim(),
                          email: _emailController.text.trim(),
                          phone: normalizedPhone,
                          gender: _gender,
                          password: _passwordController.text,
                          organizationName: hasInvitation
                              ? null
                              : _orgNameController.text.trim(),
                          invitationToken: hasInvitation
                              ? _invitationController.text.trim()
                              : null,
                          referralCode: _referralController.text.trim().isEmpty
                              ? null
                              : _referralController.text.trim(),
                        );
                        if (success && mounted) {
                          navigator.pushAndRemoveUntil(
                            MaterialPageRoute(
                                builder: (_) => const MainNavigationScreen()),
                            (route) => false,
                          );
                        } else if (mounted && auth.errorMessage != null) {
                          if (messenger != null) {
                            messenger.showSnackBar(
                              SnackBar(content: Text(auth.errorMessage!)),
                            );
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
                    : const Text('Créer mon compte'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
