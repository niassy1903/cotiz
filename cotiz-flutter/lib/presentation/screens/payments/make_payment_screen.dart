import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';

class MakePaymentScreen extends StatefulWidget {
  final String? preselectedId;
  const MakePaymentScreen({super.key, this.preselectedId});

  @override
  State<MakePaymentScreen> createState() => _MakePaymentScreenState();
}

class _MakePaymentScreenState extends State<MakePaymentScreen> {
  String? _selectedContributionId;
  String? _selectedMemberId;
  final _amountController = TextEditingController(text: '5000');
  final _transactionController = TextEditingController();
  String _method = 'wave';
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    final cotiz = Provider.of<CotizProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _selectedContributionId = widget.preselectedId ??
        cotiz.contributions
            .where((contribution) => contribution.status == 'active')
            .firstOrNull
            ?.id;
    _selectedMemberId = cotiz.memberIdForUser(auth.currentUser) ??
        cotiz.members
            .where((member) => member.status == 'active')
            .firstOrNull
            ?.id;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _transactionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cotiz = Provider.of<CotizProvider>(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final organization = cotiz.currentOrg;
    final activeContributions = cotiz.contributions
        .where((contribution) => contribution.status == 'active')
        .toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Déclarer un paiement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: organization == null
          ? const Center(child: Text('Aucune organisation active.'))
          : activeContributions.isEmpty
              ? const Center(child: Text('Aucune cotisation active à régler.'))
              : _isProcessing
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: AppColors.primary),
                  const SizedBox(height: 20),
                  Text(
                    'Enregistrement de votre déclaration...',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  const Text('Le paiement sera soumis à validation par un administrateur.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Select contribution
                  const Text('Cotisation concernée', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: activeContributions.any((item) => item.id == _selectedContributionId)
                            ? _selectedContributionId
                            : null,
                        isExpanded: true,
                        items: activeContributions.map((c) {
                          return DropdownMenuItem(
                            value: c.id,
                            child: Text(c.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedContributionId = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  if (auth.currentUser?.isAdmin == true) ...[
                    const Text('Membre concerné', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: cotiz.members.any((member) => member.id == _selectedMemberId)
                          ? _selectedMemberId
                          : null,
                      items: cotiz.members
                          .where((member) => member.status == 'active')
                          .map((member) => DropdownMenuItem(
                                value: member.id,
                                child: Text(member.fullName),
                              ))
                          .toList(),
                      onChanged: (id) => setState(() => _selectedMemberId = id),
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],

                  // Amount
                  const Text('Montant à verser (FCFA)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.payments_outlined, color: AppColors.primary),
                      suffixText: 'FCFA',
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Référence de transaction (facultatif)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _transactionController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      hintText: 'Référence Wave / Orange Money',
                      prefixIcon: Icon(Icons.tag_rounded),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Method Selection
                  const Text('Mode de règlement', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Wave
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _method = 'wave'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: _method == 'wave' ? AppColors.waveBlue.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: _method == 'wave' ? AppColors.waveBlue : AppColors.border,
                                width: _method == 'wave' ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.waveBlue,
                                  child: const Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(height: 8),
                                const Text('Wave', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                const Text('Direct', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Orange Money
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _method = 'orange_money'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: _method == 'orange_money' ? AppColors.orangeMoney.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: _method == 'orange_money' ? AppColors.orangeMoney : AppColors.border,
                                width: _method == 'orange_money' ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.orangeMoney,
                                  child: const Text('OM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                                ),
                                const SizedBox(height: 8),
                                const Text('Orange Money', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                const Text('Code USSD / App', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Cash
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _method = 'cash'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: _method == 'cash' ? AppColors.cashGreen.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: _method == 'cash' ? AppColors.cashGreen : AppColors.border,
                                width: _method == 'cash' ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: const [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.cashGreen,
                                  child: Icon(Icons.money_rounded, color: Colors.white, size: 20),
                                ),
                                SizedBox(height: 8),
                                Text('Espèces', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                SizedBox(height: 2),
                                Text('Trésorier', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Destination official phone
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Numéro de collecte officiel :', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        Text(
                          _method == 'orange_money' ? organization.orangeMoneyNumber : organization.waveNumber,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Cotiz enregistre la déclaration et la transmet pour validation. Le paiement mobile money doit être effectué dans l’application du fournisseur.',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 32),

                  // Button
                  ElevatedButton(
                    onPressed: () async {
                      final amount = double.tryParse(_amountController.text);
                      final memberId = _selectedMemberId;
                      final contributionId = _selectedContributionId;
                      final messenger = ScaffoldMessenger.maybeOf(context);
                      final navigator = Navigator.of(context);
                      if (amount == null || amount <= 0) {
                        if (messenger == null) return;
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Saisissez un montant valide.')),
                        );
                        return;
                      }
                      if (memberId == null || contributionId == null) {
                        if (messenger == null) return;
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Sélectionnez un membre et une cotisation.')),
                        );
                        return;
                      }
                      setState(() => _isProcessing = true);
                      try {
                        final cycle = cotiz.cycles
                            .where((item) =>
                                item['contribution_id']?.toString() ==
                                    contributionId &&
                                item['status'] == 'open')
                            .firstOrNull;
                        await cotiz.recordPayment(
                          contributionId: contributionId,
                          cycleId: cycle?['id']?.toString(),
                          memberId: memberId,
                          amount: amount,
                          method: _method,
                          transactionId: _transactionController.text.trim(),
                        );
                        if (!mounted) return;
                        setState(() => _isProcessing = false);
                        _showSuccessReceipt(navigator.context, amount);
                      } on ApiException catch (error) {
                        if (!mounted) return;
                        setState(() => _isProcessing = false);
                        if (messenger == null) return;
                        messenger.showSnackBar(
                          SnackBar(content: Text(error.message)),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _method == 'orange_money' ? AppColors.orangeMoney : AppColors.primary,
                    ),
                    child: Text('Effectuer le versement (${_method.toUpperCase()})'),
                  ),
                ],
              ),
            ),
    );
  }

  void _showSuccessReceipt(BuildContext context, double amount) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 30,
              backgroundColor: AppColors.primarySoft,
              child: Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 16),
            const Text('Déclaration envoyée', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 6),
            Text(
              'Votre déclaration de ${CurrencyFormatter.formatFCFA(amount)} est en attente de validation par un administrateur.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('Fermer le reçu'),
            ),
          ],
        ),
      ),
    );
  }
}
