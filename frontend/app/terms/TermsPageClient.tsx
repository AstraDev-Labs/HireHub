"use client";

/* UX: label placeholder aria-label */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function TermsPageClient() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <GraduationCap className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
          Terms of Service
        </h1>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Effective Date: March 8, 2026
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please read these terms carefully before using the HireHub platform.
          </p>
        </CardHeader>
        <CardContent className="pt-8">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using HireHub ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including students, recruiters, staff members, and administrators.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  2. User Eligibility and Registration
                </h2>
                <p>
                  Users must provide accurate, complete, and current information during the registration process. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Registration is subject to approval by HireHub administrators.</li>
                  <li>One account per individual user is permitted.</li>
                  <li>Unauthorized use of another user's account is strictly prohibited.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  3. Use of the Platform
                </h2>
                <p>
                  HireHub is designed to facilitate campus placements. Users agree to use the platform only for its intended purpose and in compliance with all applicable laws and regulations.
                </p>
                <p className="mt-4 font-bold text-foreground">Prohibited Activities:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Posting false or misleading information in resumes or job descriptions.</li>
                  <li>Attempting to interfere with the security or integrity of the platform.</li>
                  <li>Automated scraping of data without explicit permission.</li>
                  <li>Harassment or unprofessional conduct toward other users.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  4. Placement Process and Applications
                </h2>
                <p>
                  HireHub facilitates the application process but does not guarantee employment. Placement outcomes are determined by the respective companies and university placement policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  5. Privacy and Data Usage
                </h2>
                <p>
                  Your use of the Platform is also governed by our <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>. By using HireHub, you consent to the collection and use of your data as outlined in the policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  6. Intellectual Property
                </h2>
                <p>
                  All content, trademarks, logos, and software used on HireHub are the property of the Platform or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  7. Limitation of Liability
                </h2>
                <p>
                  HireHub is provided "as is" without any warranties. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  8. Termination
                </h2>
                <p>
                  We reserve the right to suspend or terminate your access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  9. Changes to Terms
                </h2>
                <p>
                  HireHub reserves the right to modify these terms at any time. We will notify users of significant changes, but it is your responsibility to review these terms periodically.
                </p>
              </section>

              <section className="pb-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  10. Contact Information
                </h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at <span className="text-primary font-bold">hirehubedu@gmail.com</span>.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="mt-12 text-center text-sm text-muted-foreground uppercase tracking-widest font-bold">
        Secure • Transparent • Professional
      </div>
    </div>
  );
}
