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
  String? selectedEventType;
  final TextEditingController _guestCountController = TextEditingController(text: '100');
  final TextEditingController _venueController = TextEditingController();

  final List<String> eventTypes = [
    'Wedding',
    'Conference',
    'Birthday',
    'Corporate',
    'Family Gathering',
    'Other',
  ];

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

    if (selectedEventType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select an event type"),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final guestCount = int.tryParse(_guestCountController.text) ?? 0;
    if (guestCount < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Guest count must be at least 10"),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_venueController.text.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter a venue address (at least 10 characters)"),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Format date and time for the backend
    final eventDate = "${selectedDate!.year}-${selectedDate!.month.toString().padLeft(2, '0')}-${selectedDate!.day.toString().padLeft(2, '0')}";
    final eventTime = "${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}";

    Navigator.pushNamed(context, '/billingOrder', arguments: {
      'event_date': eventDate,
      'event_time': eventTime,
      'event_type': selectedEventType,
      'guest_count': guestCount,
      'venue_address': _venueController.text.trim(),
    });
  }

  @override
  void dispose() {
    _guestCountController.dispose();
    _venueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Event Details"),
        backgroundColor: AppColors.mossGreen,
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Center(
                child: Image.asset(
                  'assets/logo.png',
                  height: 70,
                ),
              ),

              const SizedBox(height: 20),

              // Date
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
                      initialDate: DateTime.now().add(const Duration(days: 7)),
                    );
                    setState(() {});
                  },
                ),
              ),

              const SizedBox(height: 15),

              // Time
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
                      initialTime: const TimeOfDay(hour: 18, minute: 0),
                    );
                    setState(() {});
                  },
                ),
              ),

              const SizedBox(height: 15),

              // Event Type Dropdown
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                      labelText: "Event Type",
                      border: InputBorder.none,
                      icon: Icon(Icons.event),
                    ),
                    value: selectedEventType,
                    items: eventTypes.map((type) {
                      return DropdownMenuItem(value: type, child: Text(type));
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedEventType = value;
                      });
                    },
                  ),
                ),
              ),

              const SizedBox(height: 15),

              // Guest Count
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: TextField(
                    controller: _guestCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Number of Guests (min 10)",
                      border: InputBorder.none,
                      icon: Icon(Icons.people),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 15),

              // Venue Address
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: TextField(
                    controller: _venueController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: "Venue Address",
                      hintText: "Enter full venue address",
                      border: InputBorder.none,
                      icon: Icon(Icons.location_on),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 25),

              // Continue Button
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
      ),
    );
  }
}