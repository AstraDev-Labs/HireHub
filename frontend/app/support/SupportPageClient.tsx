"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageSquare, Copy, Check, Search, HelpCircle, LifeBuoy } from "lucide-react";
import toast from "react-hot-toast";

const faqs = [
  {
    question: "How do I apply for a placement drive?",
    answer: "Navigate to the 'Drives' page from your dashboard. Find the drive you're interested in, click 'View Details', and if you meet the eligibility criteria, you'll see an 'Apply Now' button."
  },
  {
    question: "Can I update my profile after registration?",
    answer: "Yes, you can navigate to the 'Profile' page to update your personal details, academic information, and upload a new resume at any time."
  },
  {
    question: "How do I track my application status?",
    answer: "Your dashboard provides a summary of your recent applications. For detailed progress, visit the 'Applications' or 'Interviews' section in your portal."
  },
  {
    question: "What should I do if my resume isn't uploading?",
    answer: "Ensure your resume is in PDF format and the file size is under 5MB. If you still face issues, contact support at hirehubedu@gmail.com."
  },
  {
    question: "How are shortlisting criteria decided?",
    answer: "Shortlisting criteria are set by the hiring company. This usually includes minimum CGPA, specific departments, standing arrears, and skill set matching."
  },
  {
    question: "What happens after I apply for a drive?",
    answer: "Once you apply, your profile is sent to the company for review. If shortlisted, you will receive notifications for upcoming interview rounds via the portal and email."
  },
  {
    question: "Can I withdraw an application once submitted?",
    answer: "Withdrawal policies vary by drive. If enabled, you will see a 'Withdraw' button on the application details page. If not visible, please contact the placement coordinator."
  },
  {
    question: "How do I prepare for a technical interview on HireHub?",
    answer: "You can visit the 'Resources' section to find study materials or the 'Challenges' section to practice coding problems commonly asked by top companies."
  },
  {
    question: "Is there a limit to how many drives I can apply for?",
    answer: "Generally, there is no limit unless specified by your university's placement policy. However, once you are placed in a company, you may be restricted from applying to more drives based on 'one-student-one-job' rules."
  },
  {
    question: "What should I do if I miss an interview round?",
    answer: "Missing an interview without prior notice may lead to disqualification from the drive. Immediately inform your placement coordinator with a valid reason to see if a reschedule is possible."
  },
  {
    question: "How do I access interview feedback?",
    answer: "If a company provides feedback, it will be visible under the 'Interviews' tab next to the respective round result. Not all companies provide individual feedback."
  },
  {
    question: "What is the difference between an On-Campus and an Off-Campus drive on the portal?",
    answer: "On-Campus drives are exclusively for students of your university and conducted on your premises. Off-Campus drives are open to general candidates and may require travel to a central venue."
  }
];

export default function SupportPageClient() {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const copyEmail = () => {
    navigator.clipboard.writeText("hirehubedu@gmail.com");
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3">
          <LifeBuoy className="h-10 w-10 text-primary" />
          HireHub Support Center
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Need help? Search our FAQs or reach out to our dedicated support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Contact Info Card */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5 shadow-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Direct Support
            </CardTitle>
            <CardDescription>Get in touch with us via email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-background rounded-lg border border-border shadow-inner">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Official Email</p>
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <span className="font-mono text-sm truncate font-bold text-foreground">hirehubedu@gmail.com</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:bg-muted" onClick={copyEmail} aria-label="Copy support email">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-4">
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Response time: Within 24 hours
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Availability: Mon - Sat, 9AM - 6PM
              </p>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground">
                For administrative issues, please contact your respective department coordinator first.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support Form Card */}
        <Card className="lg:col-span-2 shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Submit a Request
            </CardTitle>
            <CardDescription>Send us a message and we'll get back to you shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Support request sent successfully!"); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="support-name" className="text-sm font-bold">Full Name</label>
                  <Input id="support-name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="support-email" className="text-sm font-bold">Email Address</label>
                  <Input id="support-email" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="support-subject" className="text-sm font-bold">Subject</label>
                <Input id="support-subject" placeholder="Registration Issue, Resume Upload, etc." required />
              </div>
              <div className="space-y-2">
                <label htmlFor="support-message" className="text-sm font-bold">Message</label>
                <Textarea id="support-message" placeholder="Describe your issue in detail..." className="min-h-[120px]" required />
              </div>
              <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20">
                Send Support Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search FAQs..." 
              className="pl-10 h-10 shadow-sm border-border/50" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQs"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-card/30 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
                <AccordionTrigger className="text-left font-semibold hover:no-underline text-foreground py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed font-medium">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
              <p>No FAQs matching your search found.</p>
              <Button variant="link" className="mt-2 text-primary" onClick={() => setSearchQuery("")}>Clear search</Button>
            </div>
          )}
        </Accordion>
      </div>

      <div className="mt-20 text-center text-sm text-muted-foreground">
        <p>© 2026 HireHub Support Team. All system notifications will originate from <span className="text-foreground font-bold">hirehubedu@gmail.com</span>.</p>
      </div>
    </div>
  );
}
