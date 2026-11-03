import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/payment_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';
import 'make_payment_screen.dart';

class PaymentHistoryScreen extends StatelessWidget {
  const PaymentHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cotiz = context.watch<CotizProvider>();
    final user = context.watch<AuthProvider>().currentUser;
    final isAdmin = user?.isAdmin ?? false;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Paiements',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            tooltip: 'Actualiser',
            onPressed: cotiz.isLoading ? null : () => cotiz.refresh(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: isAdmin
          ? null
          : FloatingActionButton.extended(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => const MakePaymentScreen()),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Déclarer un paiement'),
            ),
      body: cotiz.isLoading && cotiz.payments.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : cotiz.errorMessage != null && cotiz.payments.isEmpty
              ? _LoadError(message: cotiz.errorMessage!, onRetry: cotiz.refresh)
              : cotiz.payments.isEmpty
                  ? const Center(child: Text('Aucun paiement enregistré.'))
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
                                style:
                                    const TextStyle(color: AppColors.error),
                              ),
                            ),
                          ...cotiz.payments.map(
                            (payment) => _PaymentCard(
                              payment: payment,
                              canManage: isAdmin,
                              onValidate: () =>
                                  _validate(context, cotiz, payment),
                              onReject: () =>
                                  _reject(context, cotiz, payment),
                              onCancel: () =>
                                  _cancel(context, cotiz, payment),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Future<void> _validate(
    BuildContext context,
    CotizProvider cotiz,
    PaymentModel payment,
  ) async {
    try {
      await cotiz.validatePayment(payment.id);
    } on ApiException catch (error) {
      if (context.mounted) _showError(context, error.message);
    }
  }

  Future<void> _reject(
    BuildContext context,
    CotizProvider cotiz,
    PaymentModel payment,
  ) async {
    final reason = await _askForReason(context);
    if (reason == null || !context.mounted) return;
    try {
      await cotiz.rejectPayment(payment.id, reason);
    } on ApiException catch (error) {
      if (context.mounted) _showError(context, error.message);
    }
  }

  Future<void> _cancel(
    BuildContext context,
    CotizProvider cotiz,
    PaymentModel payment,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler ce paiement ?'),
        content: const Text('Cette action sera enregistrée dans le journal.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Retour'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Annuler le paiement'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await cotiz.cancelPayment(payment.id);
    } on ApiException catch (error) {
      if (context.mounted) _showError(context, error.message);
    }
  }

  Future<String?> _askForReason(BuildContext context) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Motif du rejet'),
        content: TextField(
          controller: controller,
          maxLength: 1000,
          decoration: const InputDecoration(hintText: 'Saisir le motif'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Retour'),
          ),
          FilledButton(
            onPressed: () {
              if (controller.text.trim().length < 2) return;
              Navigator.pop(context, controller.text.trim());
            },
            child: const Text('Rejeter'),
          ),
        ],
      ),
    );
    controller.dispose();
    return reason;
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({
    required this.payment,
    required this.canManage,
    required this.onValidate,
    required this.onReject,
    required this.onCancel,
  });

  final PaymentModel payment;
  final bool canManage;
  final VoidCallback onValidate;
  final VoidCallback onReject;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(payment.paymentDate);
    final statusColor = switch (payment.status) {
      'validated' => AppColors.primary,
      'rejected' || 'cancelled' => AppColors.error,
      _ => AppColors.secondaryDark,
    };
    final statusLabel = switch (payment.status) {
      'validated' => 'Validé',
      'rejected' => 'Rejeté',
      'cancelled' => 'Annulé',
      _ => 'En attente',
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primarySoft,
                  child: Text(
                    payment.method == 'wave'
                        ? 'W'
                        : payment.method == 'orange_money'
                            ? 'OM'
                            : 'C',
                    style: const TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(payment.memberName,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(payment.contributionTitle,
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary)),
                      Text(
                        '${payment.method.replaceAll('_', ' ').toUpperCase()} · ${date == null ? '' : DateFormat('dd/MM/yyyy HH:mm').format(date)}',
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      CurrencyFormatter.formatFCFA(payment.amount),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(statusLabel,
                        style: TextStyle(
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
            if (payment.transactionId.isNotEmpty ||
                payment.rejectReason != null) ...[
              const Divider(height: 20),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  payment.rejectReason ?? 'Référence : ${payment.transactionId}',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
              ),
            ],
            if (payment.status == 'pending' &&
                (canManage || payment.status == 'pending')) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (canManage) ...[
                    TextButton(
                      onPressed: onReject,
                      child: const Text('Rejeter'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: onValidate,
                      child: const Text('Valider'),
                    ),
                  ] else
                    TextButton(
                      onPressed: onCancel,
                      child: const Text('Annuler ma demande'),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
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
