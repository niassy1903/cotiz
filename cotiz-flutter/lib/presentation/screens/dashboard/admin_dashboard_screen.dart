import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/payment_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';
import '../payments/make_payment_screen.dart';
import '../payments/payment_history_screen.dart';
import '../contributions/contributions_screen.dart';
import '../members/members_list_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cotiz = context.watch<CotizProvider>();
    final user = context.watch<AuthProvider>().currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              cotiz.currentOrg?.name ?? 'Cotiz',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const Text(
              'TABLEAU DE BORD ADMINISTRATEUR',
              style: TextStyle(
                fontSize: 10,
                color: AppColors.primaryDark,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Actualiser',
            onPressed: cotiz.isLoading ? null : () => cotiz.refresh(),
            icon: const Icon(Icons.refresh_rounded),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CircleAvatar(
              backgroundColor: AppColors.primarySoft,
              child: Text(
                user?.firstName.isNotEmpty == true
                    ? user!.firstName[0].toUpperCase()
                    : 'C',
                style: const TextStyle(
                  color: AppColors.primaryDark,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _DashboardBody(cotiz: cotiz),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({required this.cotiz});

  final CotizProvider cotiz;

  @override
  Widget build(BuildContext context) {
    if (cotiz.isLoading && cotiz.currentOrg == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (cotiz.errorMessage != null && cotiz.currentOrg == null) {
      return _LoadError(message: cotiz.errorMessage!, onRetry: cotiz.refresh);
    }
    if (cotiz.currentOrg == null) {
      return const _EmptyOrganization();
    }

    final pending =
        cotiz.payments.where((payment) => payment.status == 'pending').toList();
    final netBalance = cotiz.totalCollected - cotiz.totalExpenses;

    return RefreshIndicator(
      onRefresh: cotiz.refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  label: 'Total collecté',
                  amount: cotiz.totalCollected,
                  color: AppColors.primary,
                  icon: Icons.savings_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  label: 'Dépenses actives',
                  amount: cotiz.totalExpenses,
                  color: AppColors.error,
                  icon: Icons.receipt_long_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.textPrimary,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Solde net',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      CurrencyFormatter.formatFCFA(netBalance),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Icon(Icons.account_balance_wallet_outlined,
                    color: Colors.white70, size: 30),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (cotiz.errorMessage != null) ...[
            _InlineError(message: cotiz.errorMessage!),
            const SizedBox(height: 16),
          ],
          if (pending.isNotEmpty) ...[
            _PendingPayments(payments: pending, cotiz: cotiz),
            const SizedBox(height: 20),
          ],
          const Text(
            'Actions rapides',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _QuickAction(
                label: 'Encaisser',
                icon: Icons.add_card_rounded,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const MakePaymentScreen()),
                ),
              ),
              const SizedBox(width: 10),
              _QuickAction(
                label: 'Cotisations',
                icon: Icons.account_balance_wallet_outlined,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const ContributionsScreen()),
                ),
              ),
              const SizedBox(width: 10),
              _QuickAction(
                label: 'Membres',
                icon: Icons.people_outline_rounded,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const MembersListScreen()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Activité récente',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PaymentHistoryScreen()),
                ),
                child: const Text('Tout voir'),
              ),
            ],
          ),
          if (cotiz.payments.isEmpty)
            const _EmptyMessage(message: 'Aucun paiement pour le moment.')
          else
            ...cotiz.payments.take(5).map((payment) => _PaymentRow(payment)),
        ],
      ),
    );
  }
}

class _PendingPayments extends StatelessWidget {
  const _PendingPayments({required this.payments, required this.cotiz});

  final List<PaymentModel> payments;
  final CotizProvider cotiz;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.secondarySoft,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.secondary.withValues(alpha: .3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${payments.length} paiement(s) à vérifier',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.secondaryDark,
              ),
            ),
            const SizedBox(height: 8),
            ...payments.take(5).map(
                  (payment) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(payment.memberName),
                    subtitle: Text(CurrencyFormatter.formatFCFA(payment.amount)),
                    trailing: IconButton(
                      tooltip: 'Valider le paiement',
                      icon: const Icon(Icons.check_circle_outline,
                          color: AppColors.primary),
                      onPressed: () async {
                        try {
                          await cotiz.validatePayment(payment.id);
                        } on ApiException catch (error) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(error.message)),
                            );
                          }
                        }
                      },
                    ),
                  ),
                ),
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => const PaymentHistoryScreen()),
              ),
              child: const Text('Gérer les paiements'),
            ),
          ],
        ),
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.amount,
    required this.color,
    required this.icon,
  });

  final String label;
  final double amount;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 11)),
            const SizedBox(height: 5),
            Text(
              CurrencyFormatter.formatFCFA(amount),
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
        child: OutlinedButton(
          onPressed: onTap,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
            side: const BorderSide(color: AppColors.border),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
      );
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow(this.payment);

  final PaymentModel payment;

  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          leading: const CircleAvatar(
            backgroundColor: AppColors.primarySoft,
            child: Icon(Icons.payments_outlined, color: AppColors.primary),
          ),
          title: Text(payment.memberName),
          subtitle: Text(payment.contributionTitle),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(CurrencyFormatter.formatFCFA(payment.amount)),
              Text(payment.status == 'validated' ? 'Validé' : 'En attente',
                  style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
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

class _EmptyOrganization extends StatelessWidget {
  const _EmptyOrganization();

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Aucune organisation associée à ce compte.'),
        ),
      );
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Text(
        message,
        style: const TextStyle(color: AppColors.error, fontSize: 12),
      );
}

class _EmptyMessage extends StatelessWidget {
  const _EmptyMessage({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(message, style: const TextStyle(color: AppColors.textMuted)),
      );
}
