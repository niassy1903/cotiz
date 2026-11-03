import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/cotiz_provider.dart';
import '../payments/make_payment_screen.dart';
import '../contributions/contributions_screen.dart';
import '../notifications/notifications_screen.dart';

class MemberDashboardScreen extends StatelessWidget {
  const MemberDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cotiz = context.watch<CotizProvider>();
    final user = auth.currentUser;

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
                  color: AppColors.textPrimary),
            ),
            Text(
              '${cotiz.currentOrg?.type.toUpperCase() ?? 'COTIZ'} · Espace Membre',
              style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                tooltip: 'Notifications',
                icon: const Icon(Icons.notifications_none_rounded),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const NotificationsScreen()),
                ),
              ),
              if (cotiz.unreadNotifications > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: CircleAvatar(
                    radius: 8,
                    backgroundColor: AppColors.error,
                    child: Text(
                      '${cotiz.unreadNotifications}',
                      style:
                          const TextStyle(color: Colors.white, fontSize: 9),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _DashboardBody(
        firstName: user?.firstName ?? 'Membre',
        cotiz: cotiz,
        userId: user?.id,
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({
    required this.firstName,
    required this.cotiz,
    required this.userId,
  });

  final String firstName;
  final CotizProvider cotiz;
  final String? userId;

  @override
  Widget build(BuildContext context) {
    if (cotiz.isLoading && cotiz.currentOrg == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (cotiz.errorMessage != null && cotiz.currentOrg == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(cotiz.errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: cotiz.refresh,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    final ownMemberId = cotiz.members
        .where((member) => member.userId == userId)
        .firstOrNull
        ?.id;
    final ownPayments = cotiz.payments
        .where((payment) => payment.memberId == ownMemberId)
        .toList();
    final totalPaid = ownPayments
        .where((payment) => payment.status == 'validated')
        .fold(0.0, (total, payment) => total + payment.amount);
    final activeContribution = cotiz.contributions
        .where((contribution) => contribution.status == 'active')
        .firstOrNull;

    return RefreshIndicator(
      onRefresh: cotiz.refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primarySoft,
                  child: Text(
                    firstName.isEmpty ? 'M' : firstName[0].toUpperCase(),
                    style: const TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bonjour, $firstName',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Retrouvez ici vos cotisations et paiements.',
                        style: TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (activeContribution != null)
            _NextPaymentCard(
              contribution: activeContribution,
              cycle: cotiz.cycles
                  .where((cycle) =>
                      cycle['contribution_id']?.toString() ==
                          activeContribution.id &&
                      cycle['status'] == 'open')
                  .firstOrNull,
            )
          else
            const _EmptyContributionCard(),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _SummaryCard(
                  label: 'Total versé',
                  amount: totalPaid,
                  icon: Icons.check_circle_outline,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryCard(
                  label: 'En attente',
                  amount: ownPayments
                      .where((payment) => payment.status == 'pending')
                      .fold(0, (total, payment) => total + payment.amount),
                  icon: Icons.schedule_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Cotisations actives',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const ContributionsScreen()),
                ),
                child: const Text('Tout voir'),
              ),
            ],
          ),
          if (cotiz.contributions.isEmpty)
            const Text('Aucune cotisation active.')
          else
            ...cotiz.contributions
                .where((item) => item.status == 'active')
                .map(
                  (contribution) => Card(
                    child: ListTile(
                      leading: const CircleAvatar(
                        backgroundColor: AppColors.primarySoft,
                        child: Icon(Icons.wallet_outlined,
                            color: AppColors.primary),
                      ),
                      title: Text(contribution.title),
                      subtitle: Text(contribution.frequency),
                      trailing: Text(
                        CurrencyFormatter.formatFCFA(contribution.amount),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class _NextPaymentCard extends StatelessWidget {
  const _NextPaymentCard({required this.contribution, this.cycle});

  final dynamic contribution;
  final Map<String, dynamic>? cycle;

  @override
  Widget build(BuildContext context) {
    final dueDate = DateTime.tryParse(cycle?['due_date']?.toString() ?? '');
    final dateLabel = dueDate == null
        ? 'Échéance à venir'
        : DateFormat('dd MMMM yyyy', 'fr_FR').format(dueDate);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(dateLabel,
              style: const TextStyle(
                  color: Colors.white70, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Text(contribution.title,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            CurrencyFormatter.formatFCFA(contribution.amount),
            style: const TextStyle(
                color: Colors.white,
                fontSize: 25,
                fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      MakePaymentScreen(preselectedId: contribution.id),
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.secondary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Déclarer un paiement'),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyContributionCard extends StatelessWidget {
  const _EmptyContributionCard();

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Text('Aucune cotisation à régler pour le moment.'),
      );
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.amount,
    required this.icon,
  });

  final String label;
  final double amount;
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
            Icon(icon, color: AppColors.primary),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 11)),
            const SizedBox(height: 4),
            Text(
              CurrencyFormatter.formatFCFA(amount),
              style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
}
