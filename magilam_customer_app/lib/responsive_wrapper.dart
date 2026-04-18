import 'package:flutter/material.dart';

class ResponsiveWrapper extends StatelessWidget {
  final Widget child;

  const ResponsiveWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;

    double maxWidth = width * 0.9;

    if (width > 600) {
      maxWidth = 500; // tablet
    }

    if (width > 1000) {
      maxWidth = 700; // web
    }

    return Center(
      child: Container(
        width: maxWidth,
        child: child,
      ),
    );
  }
}