import 'package:flutter/material.dart';
import 'theme.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().fetchProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    final fullName = authProvider.fullName;
    final email = authProvider.email;
    final phone = authProvider.phone;
    final address = authProvider.address;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text("Profile"),
        backgroundColor: AppColors.mossGreen,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 24),

            // Avatar with initials
            Center(
              child: CircleAvatar(
                radius: 55,
                backgroundColor: AppColors.mossGreen.withAlpha(40),
                child: Text(
                  _getInitials(fullName, email),
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: AppColors.mossGreen,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Full Name
            Text(
              fullName ?? "Guest User",
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 4),

            // Email
            if (email != null)
              Text(
                email,
                style: const TextStyle(fontSize: 15, color: Colors.grey),
              ),

            const SizedBox(height: 16),

            // Phone info
            if (phone != null && phone.isNotEmpty)
              _buildInfoTile(Icons.phone, "Phone", phone),

            // Address info
            if (address != null && address.isNotEmpty)
              _buildInfoTile(Icons.location_on, "Address", address),

            const SizedBox(height: 15),

            // Edit Profile
            if (authProvider.isAuthenticated)
              _buildCard(
                context: context,
                icon: Icons.edit,
                title: "Edit Profile",
                onTap: () => _showEditProfileDialog(context, authProvider),
              ),

            // Previous Orders
            _buildCard(
              context: context,
              icon: Icons.history,
              title: "Previous Orders",
              onTap: () => Navigator.pushNamed(context, '/orders'),
            ),

            // Saved Addresses
            _buildCard(
              context: context,
              icon: Icons.location_on,
              title: "Saved Addresses",
              onTap: () => Navigator.pushNamed(context, '/addresses'),
            ),

            // Theme Toggle
            _buildThemeToggle(context),

            const SizedBox(height: 20),

            // Logout
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.mossGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: () async {
                    await authProvider.logout();
                    if (context.mounted) {
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        '/login',
                        (route) => false,
                      );
                    }
                  },
                  child: const Text(
                    "Logout",
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  String _getInitials(String? fullName, String? email) {
    if (fullName != null && fullName.isNotEmpty) {
      final parts = fullName.trim().split(' ');
      if (parts.length >= 2) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    if (email != null && email.isNotEmpty) {
      return email[0].toUpperCase();
    }
    return '?';
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 3),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: ListTile(
          leading: Icon(icon, color: AppColors.mossGreen, size: 22),
          title: Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          subtitle: Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
          dense: true,
        ),
      ),
    );
  }

  Widget _buildCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
        child: ListTile(
          leading: Icon(icon, color: AppColors.mossGreen),
          title: Text(title),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: onTap,
        ),
      ),
    );
  }

  Widget _buildThemeToggle(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
        child: SwitchListTile(
          secondary: Icon(
            themeProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode,
            color: AppColors.mossGreen,
          ),
          title: const Text("Dark mode"),
          value: themeProvider.isDarkMode,
          onChanged: (val) {
            themeProvider.toggleTheme(val);
          },
        ),
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context, AuthProvider authProvider) {
    final fullNameController = TextEditingController(text: authProvider.fullName ?? "");
    final phoneController = TextEditingController(text: authProvider.phone ?? "");
    final addressController = TextEditingController(text: authProvider.address ?? "");

    showDialog(
      context: context,
      builder: (dialogContext) {
        bool isSaving = false;

        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            return AlertDialog(
              title: const Text("Edit Profile"),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: fullNameController,
                      decoration: const InputDecoration(
                        labelText: "Full Name",
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        labelText: "Phone (10 digits)",
                        prefixIcon: Icon(Icons.phone),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: addressController,
                      decoration: const InputDecoration(
                        labelText: "Address",
                        prefixIcon: Icon(Icons.location_on),
                      ),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.mossGreen,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final payload = <String, dynamic>{};

                          final name = fullNameController.text.trim();
                          if (name.isNotEmpty) payload["fullName"] = name;

                          final ph = phoneController.text.trim();
                          if (ph.isNotEmpty) payload["phone"] = ph;

                          final addr = addressController.text.trim();
                          if (addr.isNotEmpty) payload["address"] = addr;

                          if (payload.isEmpty) {
                            Navigator.pop(dialogContext);
                            return;
                          }

                          setDialogState(() => isSaving = true);

                          final success = await authProvider.updateProfile(payload);

                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                          }
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(success
                                    ? "Profile updated!"
                                    : "Failed: ${authProvider.error ?? 'Unknown error'}"),
                                backgroundColor: success ? Colors.green : Colors.red,
                              ),
                            );
                          }
                        },
                  child: isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text("Save"),
                ),
              ],
            );
          },
        );
      },
    );
  }
}