"use client";

import { useState } from "react";
import TemplateCard from "./TemplateCard";
import { Search } from "lucide-react";

const CATEGORIES = ["All", "Style", "Landing Page", "Dashboard", "Full-Stack", "Agency"];

const TEMPLATES = [
  {
    title: "SaaS Landing Page",
    description: "Full-stack SaaS with auth, pricing table, and user dashboard",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    pattern: "default" as const,
    category: "Landing Page",
    features: ["Next.js", "Auth", "Stripe", "Dashboard"],
    prompt: "Build a modern SaaS landing page with a pricing table with 3 tiers, hero section with gradient background, features grid, testimonials, and CTA sections. Use a dark futuristic theme with purple/blue accents.",
  },
  {
    title: "Developer Portfolio",
    description: "Dark theme portfolio with project showcase and contact form",
    gradient: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
    pattern: "cards" as const,
    category: "Style",
    features: ["Dark theme", "Projects", "Contact", "Resume"],
    prompt: "Build a modern developer portfolio website with a dark theme, sections for hero with animated text, about me, projects showcase with filterable cards, skills/tech stack visualization, and a contact form. Include smooth scroll animations.",
  },
  {
    title: "E-commerce Store",
    description: "Online store with product catalog and beautiful product cards",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    pattern: "grid" as const,
    category: "Full-Stack",
    features: ["Products", "Cart", "Catalog", "Filters"],
    prompt: "Build a modern e-commerce product showcase page with a hero banner, featured products grid with hover effects, product categories, a promotional section, customer reviews, and footer. Clean minimal design with good product photography layout.",
  },
  {
    title: "Blog Platform",
    description: "Content platform with clean reading experience",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    category: "Style",
    features: ["MDX", "Clean", "SEO", "Typography"],
    prompt: "Build a blog landing page with a clean editorial design, featured article hero, article grid with category tags, newsletter signup, and minimal footer. Light theme with excellent typography using serif fonts.",
  },
  {
    title: "Admin Dashboard",
    description: "Data-rich dashboard with charts, tables, and KPI cards",
    gradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    pattern: "dashboard" as const,
    category: "Dashboard",
    features: ["Charts", "Tables", "KPIs", "Filters"],
    prompt: "Build an admin dashboard landing page showing KPI cards with statistics, chart placeholders, a data summary table, sidebar navigation, and status indicators. Dark tech dashboard theme with green/blue data accents.",
  },
  {
    title: "Restaurant",
    description: "Elegant restaurant website with menu and reservations",
    gradient: "linear-gradient(135deg, #8B6F47 0%, #C17F5A 100%)",
    category: "Landing Page",
    features: ["Menu", "Booking", "Gallery", "Hours"],
    prompt: "Build a beautiful restaurant website for an upscale Italian restaurant called Trattoria Luna with a hero image, menu sections (appetizers, mains, desserts, wine), reservation form, photo gallery, hours/location, and testimonials. Warm organic design with serif fonts.",
  },
  {
    title: "Fitness App",
    description: "Bold fitness app landing with CTA and feature showcase",
    gradient: "linear-gradient(135deg, #FF6B35 0%, #FF3366 100%)",
    category: "Landing Page",
    features: ["Hero", "Features", "Pricing", "CTA"],
    prompt: "Build a landing page for FitPulse, a fitness tracking app. Bold creative design with large headlines, feature showcase with icons, app screenshots, pricing tiers, user testimonials, and strong call-to-action. Dark background with vibrant orange/pink accents.",
  },
  {
    title: "AI Chatbot Interface",
    description: "Chat UI with streaming responses and conversation history",
    gradient: "linear-gradient(135deg, #4a00e0 0%, #8e2de2 100%)",
    pattern: "chat" as const,
    category: "Full-Stack",
    features: ["Streaming", "History", "Claude/GPT", "UI"],
    prompt: "Build a landing page for an AI assistant product called MindFlow. Features a chat interface mockup, feature cards showing streaming responses and conversation memory, pricing, and testimonials. Dark futuristic theme with purple gradient accents.",
  },
  {
    title: "Startup Launch",
    description: "High-converting launch page with waitlist and social proof",
    gradient: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)",
    category: "Landing Page",
    features: ["Hero", "Waitlist", "CTA", "Social Proof"],
    prompt: "Build a high-converting startup launch page for CloudSync, a cloud collaboration tool. Animated hero section, email waitlist capture, social proof (logos, stats), feature highlights with icons, FAQ accordion, and a bold CTA. Clean minimal design.",
  },
  {
    title: "Creative Agency",
    description: "Bold agency site with case studies and team showcase",
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "Agency",
    features: ["Portfolio", "Team", "Services", "Contact"],
    prompt: "Build a creative agency website for Pixel & Co, a digital design studio. Bold editorial design with massive typography, case study showcase with image overlays, team section with headshots, services grid, client logos, and a contact form. Dark monochromatic with one vibrant accent color.",
  },
  {
    title: "Real Estate",
    description: "Property listings with search filters and virtual tours",
    gradient: "linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)",
    category: "Landing Page",
    features: ["Listings", "Search", "Maps", "Gallery"],
    prompt: "Build a luxury real estate landing page for Skyline Properties. Hero with a stunning property image, featured listings grid with price and location, neighborhood spotlight, agent profiles, testimonial slider, and contact form. Premium clean design with forest green and gold accents.",
  },
  {
    title: "Music Streaming",
    description: "Vibrant music app landing with player UI mockup",
    gradient: "linear-gradient(135deg, #1DB954 0%, #191414 100%)",
    category: "Landing Page",
    features: ["Player", "Playlists", "Artists", "Premium"],
    prompt: "Build a music streaming app landing page for WaveForm. Dark theme with neon green accents, hero with a 3D player mockup, featured playlists section, artist spotlight cards, premium vs free comparison, user stats showcase, and download CTA. Sleek modern design with glassmorphism.",
  },
  {
    title: "Online Course",
    description: "Learning platform with course cards and progress tracking",
    gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)",
    category: "Full-Stack",
    features: ["Courses", "Progress", "Reviews", "Pricing"],
    prompt: "Build a landing page for LearnHub, an online education platform. Warm friendly design, hero with student illustration, popular courses grid with ratings and progress bars, instructor profiles, student testimonials, pricing plans, and newsletter signup. Light background with coral and yellow accents.",
  },
  {
    title: "Crypto Dashboard",
    description: "Dark fintech dashboard with charts and portfolio tracker",
    gradient: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2333 100%)",
    pattern: "dashboard" as const,
    category: "Dashboard",
    features: ["Charts", "Portfolio", "Trading", "Alerts"],
    prompt: "Build a cryptocurrency dashboard landing page for CryptoVault. Ultra-dark theme, hero with animated chart mockup, portfolio tracker cards, market overview table, feature highlights (real-time alerts, multi-chain support), security badges, and pricing. Neon cyan and green accents on pure black.",
  },
  {
    title: "Travel & Booking",
    description: "Wanderlust-inspired travel site with destination cards",
    gradient: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)",
    category: "Landing Page",
    features: ["Destinations", "Booking", "Reviews", "Gallery"],
    prompt: "Build a travel booking landing page for Wanderly. Full-width hero with a breathtaking landscape photo, popular destinations grid with hover zoom effects, trip planning features, traveler testimonials with photos, a deals/offers section, and newsletter signup. Bright clean design with ocean blue accents.",
  },
  {
    title: "Medical Clinic",
    description: "Healthcare site with doctor profiles and appointment booking",
    gradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
    category: "Landing Page",
    features: ["Doctors", "Booking", "Services", "Insurance"],
    prompt: "Build a healthcare clinic landing page for Vitality Medical Center. Clean professional design, hero with smiling doctor photo, services grid (cardiology, dermatology, pediatrics, etc.), doctor profiles with specialties, patient testimonials, insurance accepted logos, and appointment booking CTA. Light theme with calming green/teal accents.",
  },
  {
    title: "Event Conference",
    description: "Tech conference site with speakers and schedule",
    gradient: "linear-gradient(135deg, #FF512F 0%, #F09819 100%)",
    category: "Landing Page",
    features: ["Speakers", "Schedule", "Tickets", "Venue"],
    prompt: "Build a tech conference landing page for DevSummit 2026. Bold design with countdown timer hero, speaker lineup grid with photos and bios, multi-track schedule table, ticket tiers with early bird pricing, venue map section, sponsor logos, and FAQ. Dark background with fiery orange/red gradient accents.",
  },
  {
    title: "Podcast Studio",
    description: "Podcast landing with episode player and show notes",
    gradient: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
    category: "Style",
    features: ["Episodes", "Player", "Guests", "Subscribe"],
    prompt: "Build a podcast landing page for The Deep Dive, a tech interview show. Dark atmospheric design, hero with audio waveform visualization, latest episodes list with play buttons and duration, featured guest cards, platform subscribe buttons (Apple, Spotify, YouTube), and newsletter signup. Deep purple/violet gradient theme.",
  },
];

interface TemplateGridProps {
  onSelectTemplate: (prompt: string) => void;
  compact?: boolean;
}

export default function TemplateGrid({ onSelectTemplate, compact = false }: TemplateGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = TEMPLATES.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const displayTemplates = compact ? filtered.slice(0, 3) : filtered;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
          {compact ? "Quick Start" : "Discover templates"}
        </h2>
        {!compact && (
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        )}
      </div>

      {/* Category pills */}
      {!compact && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: category === cat ? "var(--text)" : "var(--bg-secondary)",
                color: category === cat ? "var(--bg)" : "var(--text-muted)",
                border: category === cat ? "none" : "1px solid var(--border)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className={`grid gap-4 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {displayTemplates.map((template) => (
          <TemplateCard
            key={template.title}
            title={template.title}
            description={template.description}
            gradient={template.gradient}
            features={template.features}
            pattern={(template as any).pattern}
            onClick={() => onSelectTemplate(template.prompt)}
          />
        ))}
      </div>
    </div>
  );
}

export { TEMPLATES };
