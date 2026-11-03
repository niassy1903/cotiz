import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/contribution_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';
import '../payments/make_payment_screen.dart';

class ContributionsScreen extends StatelessWidget {
  const ContributionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cotiz = context.watch<CotizProvider>();
    final isAdmin =
        context.watch<AuthProvider>().currentUser?.isAdmin ?? false;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Cotisations',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          if (isAdmin)
            IconButton(
              tooltip: 'Créer une cotisation',
              icon: const Icon(Icons.add_circle_outline_rounded,
                  color: AppColors.primary),
              onPressed: () => _showCreateDialog(context, cotiz),
            ),
          IconButton(
            tooltip: 'Actualiser',
            onPressed: cotiz.isLoading ? null : () => cotiz.refresh(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: cotiz.isLoading && cotiz.contributions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : cotiz.errorMessage != null && cotiz.contributions.isEmpty
              ? _LoadError(message: cotiz.errorMessage!, onRetry: cotiz.refresh)
              : cotiz.contributions.isEmpty
                  ? const Center(child: Text('Aucune cotisation disponible.'))
                  : RefreshIndicator(
                      onRefresh: cotiz.refresh,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          if (cotiz.errorMessage != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(
                                cotiz.errorMessage!,
                                style: const TextStyle(color: AppColors.error),
                              ),
                            ),
                          ...cotiz.contributions.map(
                            (contribution) => _ContributionCard(
                              contribution: contribution,
                              cycles: cotiz.cycles
                                  .where((cycle) =>
                                      cycle['contribution_id']?.toString() ==
                                      contribution.id)
                                  .toList(),
                              canManage: isAdmin,
                              onCloseCycle: (cycleId) async {
                                try {
                                  await cotiz.closeCycle(cycleId);
                                } on ApiException catch (error) {
                                  if (context.mounted) {
                                    _showError(context, error.message);
                                  }
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Future<void> _showCreateDialog(
    BuildContext context,
    CotizProvider cotiz,
  ) async {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    var frequency = 'monthly';
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Nouvelle cotisation',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(
                  controller: titleController,
                  decoration:
                      const InputDecoration(labelText: 'Nom de la cotisation'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Montant en FCFA'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: frequency,
                  decoration: const InputDecoration(labelText: 'Fréquence'),
                  items: const [
                    DropdownMenuItem(value: 'weekly', child: Text('Hebdomadaire')),
                    DropdownMenuItem(value: 'biweekly', child: Text('Toutes les 2 semaines')),
                    DropdownMenuItem(value: 'monthly', child: Text('Mensuelle')),
                    DropdownMenuItem(value: 'quarterly', child: Text('Trimestrielle')),
                    DropdownMenuItem(value: 'annual', child: Text('Annuelle')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setSheetState(() => frequency = value);
                    }
                  },
                ),
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: () async {
                    final amount = double.tryParse(amountController.text);
                    if (titleController.text.trim().length < 2 ||
                        amount == null ||
                        amount <= 0) {
                      _showError(context, 'Saisissez un nom et un montant valides.');
                      return;
                    }
                    try {
                      await cotiz.createContribution(
                        title: titleController.text.trim(),
                        amount: amount,
                        frequency: frequency,
                        startDate:
                            DateTime.now().toIso8601String().substring(0, 10),
                      );
                      if (sheetContext.mounted) {
                        Navigator.pop(sheetContext, true);
                      }
                    } on ApiException catch (error) {
                      if (context.mounted) _showError(context, error.message);
                    }
                  },
                  child: const Text('Créer la cotisation'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    titleController.dispose();
    amountController.dispose();
    if (created == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cotisation créée.')),
      );
    }
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ContributionCard extends StatelessWidget {
  const _ContributionCard({
    required this.contribution,
    required this.cycles,
    required this.canManage,
    required this.onCloseCycle,
  });

  final ContributionModel contribution;
  final List<Map<String, dynamic>> cycles;
  final bool canManage;
  final Future<void> Function(String) onCloseCycle;

  @override
  Widget build(BuildContext context) {
    final openCycle =
        cycles.where((cycle) => cycle['status'] == 'open').firstOrNull;
    final expected =
        (openCycle?['expected_amount'] as num?)?.toDouble() ?? 0;
    final collected =
        (openCycle?['total_collected'] as num?)?.toDouble() ?? 0;
    final progress =
        expected <= 0 ? 0.0 : (collected / expected).clamp(0.0, 1.0);
    final dueDate = DateTime.tryParse(openCycle?['due_date']?.toString() ?? '');

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _Tag(label: contribution.frequency.toUpperCase()),
                Text(
                  dueDate == null
                      ? 'Aucune échéance ouverte'
                      : 'À régler avant le ${dueDate.day}/${dueDate.month}/${dueDate.year}',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(contribution.title,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 5),
            Text(
              CurrencyFormatter.formatFCFA(contribution.amount),
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primary),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  openCycle?['period_label']?.toString() ??
                      'Collecte du cycle',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
                Text('${(progress * 100).round()}%',
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark)),
              ],
            ),
            const SizedBox(height: 6),
            LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: AppColors.surfaceMuted,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.primary),
              borderRadius: BorderRadius.circular(4),
            ),
            if (openCycle != null && canManage)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () =>
                      onCloseCycle(openCycle['id']?.toString() ?? ''),
                  child: const Text('Clôturer le cycle'),
                ),
              ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: contribution.status == 'active'
                    ? () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => MakePaymentScreen(
                                preselectedId: contribution.id),
                          ),
                        )
                    : null,
                child: const Text('Déclarer un paiement'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label,
            style: const TextStyle(
                fontSize: 10, fontWeight: FontWeight.bold)),
      );
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
