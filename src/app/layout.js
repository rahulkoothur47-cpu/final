import "./globals.css";

export const metadata = {
  title: "BusTracker - Real-time Bus Tracking",
  description: "Track your college and KSRTC buses in real-time. Never miss your bus again!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
