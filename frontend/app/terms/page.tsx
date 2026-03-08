import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using HireHub, the campus placement management system.",
};

import TermsPageClient from "./TermsPageClient";

export default function TermsOfService() {
  return <TermsPageClient />;
}
