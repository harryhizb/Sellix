"use client";

import Link from "next/link";
import { ArrowRight, Twitter, Linkedin, Github, MessageSquare, Zap } from "lucide-react";
import Image from "next/image";


export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Security", href: "#" },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Brand", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Docs", href: "#" },
        { label: "API", href: "#" },
        { label: "Community", href: "#" },
        { label: "Support", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Cookies", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ];

  return (
    <footer style={{ background: "#080C10" }} className="border-t border-white/5">
      {/* CTA Section */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-16"
            style={{
              background: "linear-gradient(145deg, #0D1219, #080C10)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                width: "400px",
                height: "400px",
                background:
                  "radial-gradient(ellipse at center, rgba(37,211,102,0.1) 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                width: "300px",
                height: "300px",
                background:
                  "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)",
                transform: "translate(-30%, 30%)",
                pointerEvents: "none",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 mb-6">
                  <Zap className="w-4 h-4 text-[#25D366]" />
                  <span className="text-sm font-medium text-[#25D366]">
                    Start selling in 5 minutes
                  </span>
                </div>
                <h2
                  style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
                  className="text-3xl sm:text-4xl text-white mb-4"
                >
                  Ready to automate your sales?
                </h2>
                <p className="text-white/40 text-lg">
                  Join thousands of businesses selling on WhatsApp. No credit card required.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 btn-primary text-white rounded-full flex items-center justify-center gap-2 font-medium"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/5 text-white rounded-full hover:bg-white/10 transition-colors flex items-center justify-center font-medium border border-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-6">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">

                <Link href="/" className="flex items-center gap-2.5 group">
                  <Image
                    src="/logo.png"
                    alt="Sellix Logo"
                    width={36}
                    height={36}
                    className="rounded-lg"
                  />

                  <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.2rem" }}>
                    Sellix
                  </span>
                </Link>


              </div>
              <p className="text-sm text-white/40 mb-8 leading-relaxed max-w-xs">
                Turn WhatsApp into your 24/7 sales channel. AI handles orders, answers questions,
                and sells while you sleep.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { Icon: Twitter, href: "#", label: "Twitter" },
                  { Icon: Linkedin, href: "#", label: "LinkedIn" },
                  { Icon: Github, href: "#", label: "GitHub" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-[#25D366] hover:text-white transition-all duration-300"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Grid */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-white mb-5">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                      >
                        {link.label}
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm text-white/40">
            <p>
              &copy; {currentYear}{" "}
              <span className="text-white font-medium">Sellix</span>. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}