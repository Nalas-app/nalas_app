import 'package:flutter/material.dart';
import '../theme.dart';

class DateTimeScreen extends StatefulWidget {
  const DateTimeScreen({super.key});

  @override
  State<DateTimeScreen> createState() => _DateTimeScreenState();
}

class _DateTimeScreenState extends State<DateTimeScreen> {

  DateTime? selectedDate;
  TimeOfDay? selectedTime;

  void _continue() {
    if (selectedDate == null || selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select both date and time"),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    Navigator.pushNamed(context, '/billingOrder');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Select Date & Time"),
        backgroundColor: AppColors.mossGreen,
      ),

      body: Padding(
  padding: const EdgeInsets.all(20),
  child: Column(
    children: [

      // 🔥 LOGO (ADDED)
      Center(
        child: Image.asset(
          'assets/logo.png',
          height: 70,
        ),
      ),

      const SizedBox(height: 20),

      // 👉 KEEP EVERYTHING BELOW SAME

            const SizedBox(height: 30),

            // DATE
            Card(
              child: ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text("Select Date"),
                subtitle: Text(
                  selectedDate == null
                      ? "No date selected"
                      : "${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year}",
                ),
                onTap: () async {
                  selectedDate = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now(),
                    lastDate: DateTime(2100),
                    initialDate: DateTime.now(),
                  );
                  setState(() {});
                },
              ),
            ),

            const SizedBox(height: 20),

            // TIME
            Card(
              child: ListTile(
                leading: const Icon(Icons.access_time),
                title: const Text("Select Time"),
                subtitle: Text(
                  selectedTime == null
                      ? "No time selected"
                      : selectedTime!.format(context),
                ),
                onTap: () async {
                  selectedTime = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.now(),
                  );
                  setState(() {});
                },
              ),
            ),

            const Spacer(),

            // CONTINUE BUTTON
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.mossGreen,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: _continue,
                child: const Text("Continue"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}