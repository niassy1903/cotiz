import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../data/models/member_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';

class MembersListScreen extends StatefulWidget {
  const MembersListScreen({super.key});

  @override
  State<MembersListScreen> createState() => _MembersListScreenState();
}

class _MembersListScreenState extends State<MembersListScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cotiz = context.watch<CotizProvider>();
    final isAdmin =
        context.watch<AuthProvider>().currentUser?.isAdmin ?? false;
    final members = cotiz.members.where((member) {
      final query = _query.toLowerCase();
      return member.fullName.toLowerCase().contains(query) ||
          member.phone.toLowerCase().contains(query) ||
          member.email.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Membres',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          if (isAdmin)
            IconButton(
              tooltip: 'Inviter des membres',
              icon: const Icon(Icons.person_add_alt_1_rounded),
              onPressed: () => _createInvitation(context, cotiz),
            ),
          if (isAdmin)
            IconButton(
              tooltip: 'Ajouter un membre',
              icon: const Icon(Icons.add_circle_outline_rounded),
              onPressed: () => _addMember(context, cotiz),
            ),
        ],
      ),
      body: cotiz.isLoading && cotiz.members.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : cotiz.errorMessage != null && cotiz.members.isEmpty
              ? _LoadError(message: cotiz.errorMessage!, onRetry: cotiz.refresh)
              : RefreshIndicator(
                  onRefresh: cotiz.refresh,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      TextField(
                        controller: _searchController,
                        onChanged: (value) => setState(() => _query = value),
                        decoration: const InputDecoration(
                          hintText: 'Rechercher un membre',
                          prefixIcon: Icon(Icons.search_rounded),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        '${members.length} membre(s)',
                        style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      if (members.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 30),
                          child: Center(
                              child: Text('Aucun membre ne correspond.')),
                        ),
                      ...members.map(
                        (member) => _MemberCard(
                          member: member,
                          canManage: isAdmin,
                          cotiz: cotiz,
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Future<void> _createInvitation(
      BuildContext context, CotizProvider cotiz) async {
    try {
      final url = await cotiz.createInvitation();
      if (!context.mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Lien d’adhésion',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  'Valable 72 heures pour ${cotiz.currentOrg?.name ?? 'votre organisation'}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 18),
                QrImageView(data: url, size: 190),
                SelectableText(url,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 11)),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => Share.share(
                    'Rejoins ${cotiz.currentOrg?.name ?? 'notre organisation'} sur Cotiz : $url',
                  ),
                  icon: const Icon(Icons.share_rounded),
                  label: const Text('Partager le lien'),
                ),
              ],
            ),
          ),
        ),
      );
    } on ApiException catch (error) {
      if (context.mounted) _showError(context, error.message);
    }
  }

  Future<void> _addMember(BuildContext context, CotizProvider cotiz) async {
    final firstName = TextEditingController();
    final lastName = TextEditingController();
    final phone = TextEditingController();
    final email = TextEditingController();
    var gender = 'M';
    var isGhost = false;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              20,
              20,
              MediaQuery.of(context).viewInsets.bottom + 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Ajouter un membre',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  TextField(
                      controller: firstName,
                      decoration: const InputDecoration(labelText: 'Prénom')),
                  TextField(
                      controller: lastName,
                      decoration: const InputDecoration(labelText: 'Nom')),
                  TextField(
                      controller: phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Téléphone')),
                  TextField(
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                          labelText: 'E-mail (facultatif)')),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: gender,
                          decoration:
                              const InputDecoration(labelText: 'Genre'),
                          items: const [
                            DropdownMenuItem(value: 'M', child: Text('Homme')),
                            DropdownMenuItem(value: 'F', child: Text('Femme')),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              setSheetState(() => gender = value);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Membre invité'),
                          value: isGhost,
                          onChanged: (value) =>
                              setSheetState(() => isGhost = value),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      if (firstName.text.trim().isEmpty ||
                          lastName.text.trim().isEmpty ||
                          phone.text.trim().isEmpty) {
                        _showError(context, 'Prénom, nom et téléphone requis.');
                        return;
                      }
                      try {
                        await cotiz.addMember(
                          firstName: firstName.text.trim(),
                          lastName: lastName.text.trim(),
                          phone: phone.text.trim(),
                          email: email.text.trim(),
                          gender: gender,
                          role: 'member',
                          isGhost: isGhost,
                        );
                        if (sheetContext.mounted) {
                          Navigator.pop(sheetContext, true);
                        }
                      } on ApiException catch (error) {
                        if (context.mounted) _showError(context, error.message);
                      }
                    },
                    child: const Text('Ajouter le membre'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    firstName.dispose();
    lastName.dispose();
    phone.dispose();
    email.dispose();
    if (created == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Membre ajouté.')),
      );
    }
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _MemberCard extends StatelessWidget {
  const _MemberCard({
    required this.member,
    required this.canManage,
    required this.cotiz,
  });

  final MemberModel member;
  final bool canManage;
  final CotizProvider cotiz;

  @override
  Widget build(BuildContext context) {
    final pending = member.status == 'pending';
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor:
                member.isGhost ? AppColors.secondarySoft : AppColors.primarySoft,
            child: Text(
              member.firstName.isEmpty ? '?' : member.firstName[0].toUpperCase(),
              style: const TextStyle(
                  color: AppColors.primaryDark, fontWeight: FontWeight.bold),
            ),
          ),
          title: Text(member.fullName,
              style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text(
            [
              member.phone,
              if (member.email.isNotEmpty) member.email,
              if (member.isGhost) 'Membre invité',
              if (pending) 'Demande en attente',
            ].join(' · '),
          ),
          trailing: canManage
              ? PopupMenuButton<String>(
                  onSelected: (action) => _performAction(context, action),
                  itemBuilder: (context) => [
                    if (pending) ...[
                      const PopupMenuItem(
                          value: 'accept', child: Text('Accepter')),
                      const PopupMenuItem(
                          value: 'reject', child: Text('Refuser')),
                    ],
                    if (!pending) ...[
                      PopupMenuItem(
                        value: 'access',
                        child: Text(member.hasTransactionAccess
                            ? 'Retirer accès financier'
                            : 'Autoriser accès financier'),
                      ),
                      if (member.role != 'admin')
                        const PopupMenuItem(
                            value: 'admin',
                            child: Text('Transférer administrateur')),
                      const PopupMenuItem(
                          value: 'archive', child: Text('Archiver')),
                    ],
                  ],
                )
              : Text(
                  member.role == 'admin' ? 'Admin' : 'Membre',
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 12),
                ),
        ),
      ),
    );
  }

  Future<void> _performAction(BuildContext context, String action) async {
    try {
      switch (action) {
        case 'accept':
          await cotiz.acceptMember(member.id);
          break;
        case 'reject':
          await cotiz.rejectMember(member.id);
          break;
        case 'access':
          await cotiz.toggleMemberTransactionAccess(member.id);
          break;
        case 'admin':
          await cotiz.transferAdmin(member.id);
          break;
        case 'archive':
          await cotiz.archiveMember(member.id);
          break;
      }
    } on ApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function({String? organizationId}) onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: const Text('Réessayer')),
            ],
          ),
        ),
      );
}
