import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../providers/cotiz_provider.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cotiz = context.watch<CotizProvider>();
    final notifications = cotiz.notifications;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifications.isNotEmpty)
            TextButton(
              onPressed: () async {
                try {
                  await cotiz.markAllNotificationsRead();
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Impossible de mettre à jour les notifications.'),
                      ),
                    );
                  }
                }
              },
              child: const Text('Tout lire'),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Aucune notification pour le moment.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: cotiz.refresh,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = notifications[index];
                  final title = item['title']?.toString() ?? 'Notification';
                  final body = item['message']?.toString() ??
                      item['body']?.toString() ??
                      'Aucune description.';
                  final isRead = item['read'] == true;
                  final id = item['id']?.toString();

                  return ListTile(
                    tileColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isRead ? AppColors.border : AppColors.primarySoft,
                      ),
                    ),
                    leading: Icon(
                      isRead
                          ? Icons.mark_email_read_outlined
                          : Icons.notifications_active_outlined,
                      color: isRead ? AppColors.textSecondary : AppColors.primary,
                    ),
                    title: Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(body),
                    ),
                    trailing: isRead
                        ? const SizedBox.shrink()
                        : const Icon(Icons.fiber_new_rounded,
                            color: AppColors.primary),
                    onTap: id == null
                        ? null
                        : () async {
                            try {
                              await cotiz.markNotificationRead(id);
                            } catch (_) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('La notification n’a pas pu être mise à jour.'),
                                  ),
                                );
                              }
                            }
                          },
                  );
                },
              ),
            ),
    );
  }
}
