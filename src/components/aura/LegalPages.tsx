"use client";

import { useState } from "react";
import { ArrowLeft, FileText, Shield, Cookie, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

type LegalPage = "terms" | "privacy" | "cookies" | "guidelines";

export function LegalPage({ page, onBack }: { page: LegalPage; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      {page === "terms" && <TermsOfService />}
      {page === "privacy" && <PrivacyPolicy />}
      {page === "cookies" && <CookiePolicy />}
      {page === "guidelines" && <CommunityGuidelines />}
    </div>
  );
}

export function LegalLinks({ onSelect }: { onSelect: (page: LegalPage) => void }) {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => onSelect("terms")} className="hover:text-foreground transition">Terms of Service</button>
          <span>·</span>
          <button onClick={() => onSelect("privacy")} className="hover:text-foreground transition">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => onSelect("cookies")} className="hover:text-foreground transition">Cookie Policy</button>
          <span>·</span>
          <button onClick={() => onSelect("guidelines")} className="hover:text-foreground transition">Community Guidelines</button>
          <span>·</span>
          <span>© 2025 AuraMedia. All rights reserved.</span>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
          AuraMedia operates in compliance with EU GDPR (Reg. 2016/679), Italian Legislative Decree 196/2003,
          and the EU Digital Services Act (DSA - Reg. 2022/2065).
        </p>
      </div>
    </footer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="h-6 w-6" /> Terms of Service</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated: January 2025</p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using AuraMedia ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        <p>AuraMedia is operated by the platform owner. The Service is a social media platform where users share goals, achievements, and lifestyle content.</p>
      </Section>

      <Section title="2. Eligibility & Age Requirement">
        <p>You must be at least <b>13 years old</b> to use this Service. Users in the European Union must be at least 16 years old, or have parental consent if between 13 and 16, in accordance with GDPR Article 8.</p>
        <p>By registering, you confirm that you meet the age requirement and have the legal capacity to enter into these terms.</p>
        <p>In Italy, users under 18 must obtain parental consent as required by Italian Legislative Decree 196/2003 (Privacy Code) and GDPR.</p>
      </Section>

      <Section title="3. User Accounts">
        <p>You are responsible for maintaining the confidentiality of your password and for all activities under your account.</p>
        <p>Usernames must be unique, between 3 and 35 characters, and may only contain lowercase letters, numbers, periods, and underscores.</p>
        <p>You may not impersonate another person or entity. The platform reserves the right to verify accounts and remove impersonators.</p>
      </Section>

      <Section title="4. User Content">
        <p>You retain ownership of content you post. By posting, you grant AuraMedia a non-exclusive, royalty-free license to display, reproduce, and distribute your content within the Service.</p>
        <p>You are solely responsible for your content. You represent that you have all necessary rights to post it.</p>
        <p>The following content is strictly prohibited:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>NSFW, pornographic, or sexually explicit material</li>
          <li>Scams, fraud, or "get rich quick" schemes</li>
          <li>Illegal goods or services (drugs, weapons, stolen accounts)</li>
          <li>Hate speech, harassment, or threats</li>
          <li>Spam or unsolicited promotions</li>
          <li>Content that violates intellectual property rights</li>
          <li>Content that violates applicable laws in Italy, the EU, or your jurisdiction</li>
        </ul>
        <p>AuraMedia uses automated AI moderation ("AuraGuard") to detect and block prohibited content. Content may be removed without notice.</p>
      </Section>

      <Section title="5. Content Moderation">
        <p>AuraMedia employs AI-powered content moderation to detect scams, NSFW content, hate speech, and illegal material. The system analyzes both text and images.</p>
        <p>Users can report content that violates these terms. Reports are reviewed by the platform administrator.</p>
        <p>In accordance with the EU Digital Services Act (DSA), users can appeal content moderation decisions by contacting the administrator.</p>
      </Section>

      <Section title="6. Privacy & Data Protection (GDPR)">
        <p>Your use of the Service is also governed by our Privacy Policy, which complies with the EU General Data Protection Regulation (GDPR - Reg. 2016/679) and Italian Legislative Decree 196/2003.</p>
        <p>You have the right to access, rectify, erase, and port your personal data. You can request data deletion at any time.</p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>AuraMedia and its original content, features, and functionality are owned by the platform operator and are protected by international copyright, trademark, and other intellectual property laws.</p>
      </Section>

      <Section title="8. Termination">
        <p>We may terminate or suspend your account at any time, without prior notice, for violations of these Terms.</p>
        <p>You may delete your account at any time by contacting the administrator.</p>
        <p>Upon termination, your content will be permanently deleted.</p>
      </Section>

      <Section title="9. Disclaimers">
        <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>To the maximum extent permitted by law, AuraMedia shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
      </Section>

      <Section title="11. Governing Law">
        <p>These Terms are governed by the laws of Italy and the European Union. Any disputes shall be resolved in the courts of Italy.</p>
        <p>EU consumers have the right to use the European Online Dispute Resolution platform (ODR) at <a href="https://ec.europa.eu/consumers/odr" className="text-primary underline" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>.</p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>For questions about these Terms, contact: admin@auramedia.app</p>
      </Section>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Shield className="h-6 w-6" /> Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated: January 2025</p>

      <Section title="1. Data Controller">
        <p>The data controller for your personal data is the AuraMedia platform operator.</p>
        <p>In compliance with GDPR Article 13, we inform you that your data is processed lawfully, fairly, and transparently.</p>
      </Section>

      <Section title="2. Data We Collect">
        <p><b>Account data:</b> Username, email address, encrypted password.</p>
        <p><b>Content data:</b> Posts, comments, likes, images you upload.</p>
        <p><b>Usage data:</b> IP address, browser type, interaction data (likes, comments, follows).</p>
        <p><b>Profile views:</b> We track who views your profile (visible only to you).</p>
        <p><b>Moderation data:</b> AI analysis results of your posts (risk scores, moderation notes).</p>
      </Section>

      <Section title="3. Legal Basis (GDPR Article 6)">
        <p>We process your data based on:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><b>Consent</b> — when you register and agree to these terms</li>
          <li><b>Contract performance</b> — to provide the Service you requested</li>
          <li><b>Legitimate interest</b> — for security, fraud prevention, and content moderation</li>
          <li><b>Legal obligation</b> — to comply with EU/Italian law enforcement requests</li>
        </ul>
      </Section>

      <Section title="4. How We Use Your Data">
        <p>To create and manage your account, display your content, enable social interactions, moderate content, and ensure platform security.</p>
        <p>We do <b>not</b> sell your personal data to third parties.</p>
        <p>We do <b>not</b> use your data for profiling or automated decision-making (except for content moderation, which is necessary for platform safety).</p>
      </Section>

      <Section title="5. Data Storage">
        <p>Your data is stored in a cloud database (Turso/libSQL) hosted on AWS (US-East). Data transfers outside the EU are protected by Standard Contractual Clauses (SCCs) in accordance with GDPR Chapter V.</p>
        <p>Images are stored as base64 data within the database, not on external servers.</p>
      </Section>

      <Section title="6. Your Rights (GDPR Articles 15-22)">
        <p>Under GDPR, you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><b>Access</b> — request a copy of your personal data</li>
          <li><b>Rectification</b> — correct inaccurate or incomplete data</li>
          <li><b>Erasure</b> — request deletion of your account and all data ("right to be forgotten")</li>
          <li><b>Restriction</b> — limit how we process your data</li>
          <li><b>Data portability</b> — receive your data in a machine-readable format</li>
          <li><b>Object</b> — object to processing based on legitimate interests</li>
          <li><b>Withdraw consent</b> — at any time, without affecting prior processing</li>
        </ul>
        <p>To exercise these rights, contact: admin@auramedia.app</p>
      </Section>

      <Section title="7. Data Retention">
        <p>Your data is retained for as long as your account is active. When you delete your account, all your data (posts, comments, likes, images) is permanently deleted within 30 days.</p>
        <p>Moderation logs may be retained for 6 months after deletion for security purposes.</p>
      </Section>

      <Section title="8. Data Security">
        <p>Passwords are hashed using bcrypt. Session tokens are signed with HMAC-SHA256. The database is accessed via encrypted connections.</p>
        <p>Despite these measures, no method of transmission over the internet is 100% secure.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>The Service is not directed to children under 13 (or 16 in the EU). We do not knowingly collect data from children. If you believe a child has registered, contact us for immediate deletion.</p>
      </Section>

      <Section title="10. Italian Privacy Code (D.Lgs. 196/2003)">
        <p>This Privacy Policy also complies with the Italian Privacy Code (Codice in materia di protezione dei dati personali), as amended by D.Lgs. 101/2018 to align with GDPR.</p>
        <p>Italian users may file a complaint with the Garante per la Protezione dei Dati Personali (Italian Data Protection Authority) at <a href="https://www.garanteprivacy.it" className="text-primary underline" target="_blank" rel="noreferrer">garanteprivacy.it</a>.</p>
      </Section>

      <Section title="11. Supervisory Authority">
        <p>EU users have the right to lodge a complaint with their local Data Protection Authority, or with the Italian Data Protection Authority:</p>
        <p>Garante per la protezione dei dati personali<br />Piazza di Monte Citorio n. 121<br />00186 ROMA<br />Email: protocollo@pec.gpdp.it</p>
      </Section>
    </div>
  );
}

function CookiePolicy() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Cookie className="h-6 w-6" /> Cookie Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated: January 2025</p>

      <Section title="1. What Are Cookies?">
        <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work efficiently.</p>
      </Section>

      <Section title="2. Cookies We Use">
        <p>AuraMedia uses the following cookies:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><b>Session cookie (aura_session):</b> Essential — keeps you logged in. Deleted when you close your browser (or after 30 days if you stay logged in).</li>
          <li><b>Theme cookie (next-themes):</b> Essential — remembers your dark/light theme preference.</li>
          <li><b>reCAPTCHA cookie: </b> Essential — Google reCAPTCHA uses cookies to distinguish humans from bots.</li>
        </ul>
        <p>We do <b>not</b> use analytics, advertising, or tracking cookies.</p>
      </Section>

      <Section title="3. Managing Cookies">
        <p>Essential cookies cannot be disabled — they are required for the Service to function.</p>
        <p>You can manage all cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in.</p>
      </Section>

      <Section title="4. Third-Party Cookies">
        <p>Google reCAPTCHA sets cookies on your device. See <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noreferrer">Google's Privacy Policy</a> for details.</p>
      </Section>

      <Section title="5. EU ePrivacy Directive">
        <p>In compliance with the EU ePrivacy Directive (Directive 2002/58/EC) and Italian D.Lgs. 196/2003, we only use essential cookies that do not require prior consent. Non-essential cookies would require your explicit consent, which we do not use.</p>
      </Section>
    </div>
  );
}

function CommunityGuidelines() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Scale className="h-6 w-6" /> Community Guidelines</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated: January 2025</p>

      <Section title="What AuraMedia Is About">
        <p>AuraMedia is a social network for sharing goals, achievements, and lifestyle content. We celebrate hard work, dedication, and legitimate success.</p>
        <p>Posts should be about: cars, watches, earnings, fitness goals, business milestones, travel, education, and personal achievements.</p>
      </Section>

      <Section title="What's Allowed">
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Sharing genuine achievements and milestones</li>
          <li>Posting about cars, watches, earnings, fitness PRs</li>
          <li>Setting and sharing goals</li>
          <li>Supporting and motivating other users</li>
          <li>Constructive discussions</li>
        </ul>
      </Section>

      <Section title="What's Prohibited">
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><b>NSFW content:</b> Nudity, sexual content, pornography (including in images)</li>
          <li><b>Scams:</b> "Get rich quick", crypto signals, investment offers, "DM me to make money"</li>
          <li><b>Illegal goods:</b> Drugs, weapons, stolen accounts, counterfeit items</li>
          <li><b>Hate speech:</b> Racism, threats, harassment, doxxing</li>
          <li><b>Spam:</b> Repetitive promotions, follow-for-follow, link farming</li>
          <li><b>Impersonation:</b> Pretending to be someone else</li>
          <li><b>Fancy fonts:</b> Unicode font tricks that bypass moderation</li>
          <li><b>Off-topic content:</b> Posts that aren't about goals or flexes</li>
        </ul>
      </Section>

      <Section title="AI Moderation">
        <p>AuraMedia uses "AuraGuard", an automated moderation system that analyzes:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><b>Text:</b> Scam patterns, NSFW keywords (multi-language: EN, IT, ES, FR, DE, PT), hate speech, drug references, leetspeak obfuscation</li>
          <li><b>Images:</b> Skin tone analysis, NSFW detection, file type validation</li>
          <li><b>Flex detection:</b> Whether the post is actually a flex/goal (off-topic posts are flagged)</li>
        </ul>
        <p>Content that violates these guidelines is automatically blocked or held for admin review.</p>
      </Section>

      <Section title="Reporting Content">
        <p>If you see content that violates these guidelines, use the "Report post" button (⋯ menu → Report post). Select the reason and submit.</p>
        <p>Posts with 3+ community reports are automatically hidden pending admin review.</p>
      </Section>

      <Section title="Consequences">
        <p>Violations may result in:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Content removal</li>
          <li>Account suspension</li>
          <li>Permanent account deletion</li>
          <li>Reporting to authorities (for illegal content)</li>
        </ul>
      </Section>

      <Section title="Appeals">
        <p>If your content was removed and you believe it was a mistake, you can appeal by contacting: admin@auramedia.app</p>
        <p>In accordance with the EU Digital Services Act (DSA), you have the right to appeal content moderation decisions.</p>
      </Section>
    </div>
  );
}
