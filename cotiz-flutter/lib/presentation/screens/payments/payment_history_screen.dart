import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../providers/cotiz_provider.dart';

class PaymentHistoryScreen extends StatelessWidget {
  const PaymentHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cotiz = Provider.of<CotizProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Journal des Paiements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: cotiz.payments.length,
        itemBuilder: (context, index) {
          final p = cotiz.payments[index];
          final isValidated = p.status == 'validated';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: p.method == 'wave'
                      ? AppColors.waveBlue.withOpacity(0.1)
                      : p.method == 'orange_money'
                          ? AppColors.orangeMoney.withOpacity(0.1)
                          : AppColors.cashGreen.withOpacity(0.1),
                  child: Text(
                    p.method == 'wave' ? 'W' : p.method == 'orange_money' ? 'OM' : 'C',
                    style: TextStyle(
                      color: p.method == 'wave'
                          ? AppColors.waveBlue
                          : p.method == 'orange_money'
                              ? AppColors.orangeMoney
                              : AppColors.cashGreen,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.memberName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${p.contributionTitle} · ${p.method.toUpperCase()}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                      Text(
                        p.transactionId,
                        style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      CurrencyFormatter.formatFCFA(p.amount),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isValidated ? AppColors.primarySoft : AppColors.secondarySoft,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isValidated ? 'Validé' : 'En attente',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isValidated ? AppColors.primaryDark : AppColors.secondaryDark,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
