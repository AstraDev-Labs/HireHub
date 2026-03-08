import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & FAQ",
  description: "Get help with HireHub. Frequently asked questions and direct support contact for students and companies.",
};

import SupportPageClient from "./SupportPageClient";

export default function SupportPage() {
  return <SupportPageClient />;
}
