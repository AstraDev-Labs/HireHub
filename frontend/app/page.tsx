import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Home | HireHub - Campus Placement Management System",
  description: "Join 10,000+ students and top companies on HireHub, the most advanced campus placement management platform. Streamline your career journey today.",
  openGraph: {
    title: "HireHub - Empowering Campus Placements",
    description: "The next-generation platform connecting talent with opportunity.",
    images: ["/og-image.jpg"],
  },
};

export default function Home() {
  return <HomeClient />;
}
