import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";
import { Manrope, Space_Grotesk } from "next/font/google";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Camera,
  Cloud,
  Database,
  Globe2,
  Heart,
  Layers,
  Lock,
  MessageCircle,
  Palette,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Github,
  ChevronDown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronUp,
  ChevronRight,
  Zap,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* dynamic import for client-only count-up */
const CountUp = dynamic(() => import("react-countup"), { ssr: false });

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});
const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

/* -------------------------------------------------------------------------- */
/*                                 Typewriter                                 */
/* -------------------------------------------------------------------------- */

function useTypewriter(lines: string[], speed = 85) {
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState("");

  useEffect(() => {
    const full = lines[idx];
    if (sub.length < full.length) {
      const t = setTimeout(() => setSub(full.slice(0, sub.length + 1)), speed);
      return () => clearTimeout(t);
    }
    const pause = setTimeout(() => {
      setSub("");
      setIdx((n) => (n + 1) % lines.length);
    }, 1600);
    return () => clearTimeout(pause);
  }, [sub, idx, lines, speed]);

  return sub;
}

/* -------------------------------------------------------------------------- */
/*                          Small Reusable Components                         */
/* -------------------------------------------------------------------------- */

const Btn = ({
  children,
  href,
  outline = false,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  outline?: boolean;
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none";
  const filled =
    "bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50";
  const hollow =
    "border border-white/40 text-white hover:bg-white/10 backdrop-blur";
  const cn = `${base} ${outline ? hollow : filled} ${className}`;

  if (!href) return <button className={cn}>{children}</button>;

  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn}
    >
      {children}
    </Link>
  );
};

const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const revealTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

const staggerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const Reveal = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    variants={revealVariants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transition={{ ...revealTransition, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Stagger = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={staggerVariants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

const RevealItem = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={revealVariants}
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transition={revealTransition}
    className={className}
  >
    {children}
  </motion.div>
);

const Section = ({
  id,
  title,
  sub,
  children,
  bg = "bg-neutral-900",
  titleClassName = "",
  subClassName = "",
}: {
  id?: string;
  title: string;
  sub: string;
  children: React.ReactNode;
  bg?: string;
  titleClassName?: string;
  subClassName?: string;
}) => (
  <section id={id} className={`${bg} py-20 md:py-24 px-4`}>
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transition={revealTransition}
      className="max-w-3xl mx-auto text-center mb-12 md:mb-16"
    >
      <h2
        className={`font-display text-3xl md:text-4xl font-extrabold text-white ${titleClassName}`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 text-base md:text-lg text-neutral-400 ${subClassName}`}
      >
        {sub}
      </p>
    </motion.div>
    {children}
  </section>
);

const StatCard = ({
  value,
  suffix = "",
  prefix = "",
  label,
  note,
  decimals = 0,
  duration = 2.2,
  size = "md",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  note?: string;
  decimals?: number;
  duration?: number;
  size?: "md" | "lg";
}) => (
  <Card
    className={`bg-neutral-800/60 backdrop-blur rounded-3xl text-center ${
      size === "lg" ? "py-8 sm:py-10" : "py-6 sm:py-8"
    } hover:shadow-emerald-600/30 hover:shadow-lg transition`}
  >
    <CardContent className="space-y-2">
      <div
        className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-300 ${
          size === "lg" ? "md:text-6xl" : ""
        }`}
      >
        <CountUp
          start={0}
          end={value}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          separator=","
          enableScrollSpy
          scrollSpyOnce
        />
      </div>
      <p className="text-xs md:text-sm uppercase text-neutral-300 tracking-[0.2em]">
        {label}
      </p>
      {note && <p className="text-xs text-neutral-500">{note}</p>}
    </CardContent>
  </Card>
);

/* -------------------------------------------------------------------------- */
/*                             Content Definition                             */
/* -------------------------------------------------------------------------- */

const heroLines = [
  "Built for Gen-Z creators.",
  "Your vibe. Your feed.",
  "Privacy-first, not algorithm-first.",
  "Create. Post. Connect. Repeat.",
  "Community-first social, by design.",
];

const heroStats = [
  {
    value: 2.8,
    suffix: "M",
    label: "Monthly scrolls",
    note: "Across Gen-Z communities",
    decimals: 1,
  },
  {
    value: 410,
    suffix: "K",
    label: "Weekly active creators",
    note: "Rolling 30-day average",
  },
  {
    value: 1.9,
    suffix: "B",
    label: "Reactions delivered",
    note: "Monthly at the edge",
    decimals: 1,
  },
  {
    value: 99.98,
    suffix: "%",
    label: "Delivery success",
    note: "Fast + resilient delivery",
    decimals: 2,
  },
];

const metrics = [
  {
    value: 152000,
    suffix: "+",
    label: "Communities hosted",
    note: "Public + private spaces",
  },
  {
    value: 48,
    suffix: "M",
    label: "Posts indexed",
    note: "Search-ready content",
  },
  {
    value: 6.4,
    suffix: "M",
    label: "Profiles created",
    note: "Gen-Z signups",
    decimals: 1,
  },
  {
    value: 320,
    suffix: "TB",
    label: "Media delivered daily",
    note: "Global CDN",
  },
  {
    value: 240,
    suffix: "ms",
    label: "Median feed load",
    note: "p50 on 4G",
  },
  {
    value: 4.9,
    suffix: " / 5",
    label: "Creator satisfaction",
    note: "Opt-in surveys",
    decimals: 1,
  },
];

const pillars = [
  {
    icon: Sparkles,
    title: "Creator-first publishing",
    desc: "Drafts, scheduling, and rich embeds made for Gen-Z storytelling.",
  },
  {
    icon: Zap,
    title: "Real-time interactions",
    desc: "Instant comments, follows, and reactions without lag.",
  },
  {
    icon: BarChart3,
    title: "Creator analytics",
    desc: "Track growth and engagement without invasive tracking.",
  },
  {
    icon: Lock,
    title: "Privacy-first defaults",
    desc: "Clear audience controls and safe visibility settings.",
  },
  {
    icon: Globe2,
    title: "Global speed",
    desc: "Edge delivery keeps timelines fast everywhere.",
  },
  {
    icon: Layers,
    title: "Customizable stack",
    desc: "Swap auth, storage, or feed logic without rebuilding.",
  },
];

const reliabilityStats = [
  {
    value: 99.99,
    suffix: "%",
    label: "App availability",
    note: "Rolling 90-day uptime",
    decimals: 2,
  },
  {
    value: 12,
    suffix: "+",
    label: "Login options",
    note: "OAuth + magic links",
  },
  {
    value: 5.2,
    suffix: "x",
    label: "Faster uploads",
    note: "Adaptive compression",
    decimals: 1,
  },
  {
    value: 28,
    suffix: "%",
    label: "Lower infra cost",
    note: "Smart caching",
  },
];

const workflowSteps = [
  {
    title: "Start your space",
    desc: "Launch a branded community with custom invites and roles.",
  },
  {
    title: "Kick off the vibe",
    desc: "Drop highlights, creator spotlights, and launch moments.",
  },
  {
    title: "Grow with insight",
    desc: "Use engagement data to shape formats and discovery.",
  },
];

const governance = [
  {
    icon: ShieldCheck,
    title: "Community moderation",
    desc: "Configurable rules, escalation paths, and clear enforcement.",
  },
  {
    icon: BadgeCheck,
    title: "Verified creators",
    desc: "Proof-of-ownership badges and trust signals.",
  },
  {
    icon: Timer,
    title: "Fast report response",
    desc: "Priority queues for high-impact reports.",
  },
  {
    icon: Lock,
    title: "Secure by default",
    desc: "Row-level security, scoped tokens, and encrypted transport.",
  },
];

const architecture = [
  {
    icon: Server,
    title: "Mobile-ready API",
    desc: "Fast endpoints tuned for low-latency feeds.",
  },
  {
    icon: Database,
    title: "Postgres core",
    desc: "Structured data with scalable indexing.",
  },
  {
    icon: Cloud,
    title: "Media pipeline",
    desc: "Responsive images, CDN delivery, and safe storage.",
  },
  {
    icon: Layers,
    title: "Composable UI",
    desc: "Design tokens and components that scale fast.",
  },
];

const features = [
  {
    icon: Palette,
    title: "Light & Dark",
    desc: "Auto theme that matches your vibe.",
  },
  {
    icon: Camera,
    title: "Image Uploads",
    desc: "Post photos in crisp, full resolution.",
  },
  {
    icon: Heart,
    title: "Likes & Follows",
    desc: "Show love, build your circle.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Comments",
    desc: "Talk it out instantly.",
  },
  {
    icon: Activity,
    title: "Infinite Scroll",
    desc: "Stay in the flow, no hard stops.",
  },
  {
    icon: Send,
    title: "Share Anywhere",
    desc: "Easy sharing with rich embeds.",
  },
  {
    icon: BarChart3,
    title: "Creator Analytics",
    desc: "Track growth, reach, and engagement.",
  },
  {
    icon: ShieldCheck,
    title: "Moderation Console",
    desc: "Triage reports and keep spaces safe.",
  },
  {
    icon: Globe2,
    title: "Global CDN",
    desc: "Fast access, no matter where you are.",
  },
];

const testimonials = [
  [
    "It feels like the social app my friends actually want to use.",
    "Ava • Content Creator",
  ],
  [
    "We launched our campus community in days and it just worked.",
    "Kai • Student Organizer",
  ],
  ["Fast, clean, and not creepy. The vibe is right.", "Zoe • Gen-Z Builder"],
];

const faq: [string, string][] = [
  ["Is Meadows free?", "Yes - it’s open-source and self-host-friendly."],
  [
    "What tech does it run on?",
    "Next.js, Supabase, React Query & Tailwind CSS.",
  ],
  [
    "Can I bring my own auth?",
    "Yes - plug in any Supabase Auth provider (OAuth, magic links, etc.).",
  ],
  [
    "Does it work on mobile?",
    "Yes. It’s mobile-first and built for Gen-Z thumb scrolling.",
  ],
  [
    "Can I deploy it myself?",
    "Yes. Clone the repo, set up Supabase, and deploy anywhere.",
  ],
  [
    "Is there a dark mode?",
    "Of course. Meadows adapts to your system theme or lets you toggle manually.",
  ],
  [
    "How are images handled?",
    "Images are uploaded to Supabase Storage and served via CDN.",
  ],
  [
    "Does it support infinite scroll?",
    "Yes - feeds and profiles use smooth, paginated infinite loading.",
  ],
  [
    "Can I customize the styles?",
    "Absolutely. It uses Tailwind CSS, so customizing the design is easy.",
  ],
  [
    "Is it production-ready?",
    "Yes - with SSR, auth, secure uploads, and performance optimizations.",
  ],
  [
    "Does it have real-time features?",
    "Yes - real-time updates are powered by Supabase subscriptions and React Query.",
  ],
  [
    "How do likes and follows work?",
    "They’re managed with relational tables in Supabase. You can extend them too.",
  ],
  [
    "How do moderation workflows work?",
    "Meadows supports policy-based queues, escalation paths, and community-owned rulesets.",
  ],
  [
    "Can I customize roles and permissions?",
    "Yes - you can create custom roles with scoped permissions for teams or communities.",
  ],
];

const devices = [
  { icon: Monitor, title: "Desktop-Perfect" },
  { icon: Tablet, title: "Tablet-Tuned" },
  { icon: Smartphone, title: "Mobile-First" },
];

/* -------------------------------------------------------------------------- */
/*               Tiny, Dependency-Free Accordion for the FAQ                 */
/* -------------------------------------------------------------------------- */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-neutral-800/60 backdrop-blur rounded-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left text-white flex justify-between items-center font-display"
      >
        {q}
        <ChevronRight
          className={`size-4 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-neutral-400">{a}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Main Page                                   */
/* -------------------------------------------------------------------------- */

export default function Landing() {
  const typedLine = useTypewriter(heroLines);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>Meadows - Social Media for Gen-Z</title>
        <meta
          name="description"
          content="Meadows is the Gen-Z social platform: fast, expressive, and privacy-first."
        />
      </Head>

      {/* --------------------------- Global Styles -------------------------- */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .landing-root {
          font-family: var(--font-body);
        }
        .landing-root .font-display {
          font-family: var(--font-display);
          letter-spacing: -0.02em;
        }
        @keyframes blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        .cursor {
          display: inline-block;
          width: 1px;
          height: 1em;
          background: currentColor;
          margin-left: 1px;
          animation: blink 1s step-end infinite;
        }
      `}</style>

      <div
        className={`${displayFont.variable} ${bodyFont.variable} landing-root`}
      >
        {/* ------------------------------ Hero ------------------------------- */}
        <header className="relative flex flex-col items-center justify-center min-h-[90svh] md:min-h-dvh bg-neutral-950 text-white overflow-hidden px-4 pt-20 pb-16 text-center">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-emerald-600/40 to-purple-700/40 blur-3xl opacity-30" />
          <div className="absolute -z-10 -top-16 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
          <motion.h1
            variants={revealVariants}
            initial="hidden"
            animate="show"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transition={{ ...revealTransition, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold"
          >
            Meadows
          </motion.h1>
          <motion.p
            variants={revealVariants}
            initial="hidden"
            animate="show"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transition={{ ...revealTransition, delay: 0.25 }}
            className="mt-5 max-w-2xl text-base sm:text-lg text-neutral-300"
          >
            The social platform for Gen-Z - fast, expressive, and built for
            creators and communities that move at your speed.
          </motion.p>
          <motion.p
            variants={revealVariants}
            initial="hidden"
            animate="show"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transition={{ ...revealTransition, delay: 0.4 }}
            className="mt-6 text-lg sm:text-2xl text-emerald-400 font-mono text-center mx-auto max-w-[30ch] leading-snug"
          >
            {typedLine}
            <span className="cursor" />
          </motion.p>
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate="show"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transition={{ ...revealTransition, delay: 0.55 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Btn href="/signup">
              <Users className="size-5" />
              Join Meadows
            </Btn>
            <Btn href="/login" outline>
              <Send className="size-5" />
              Log In
            </Btn>
          </motion.div>
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate="show"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transition={{ ...revealTransition, delay: 0.75 }}
            className="absolute bottom-8 hidden sm:flex"
          >
            <Btn
              href="#highlights"
              outline
              className="animate-bounce px-4 py-2"
            >
              <ChevronDown className="size-6" /> Learn More
            </Btn>
          </motion.div>
        </header>

        {/* ------------------------- Hero Metrics -------------------------- */}
        <Section
          id="highlights"
          title="Gen-Z Momentum"
          sub="Big-picture scale indicators across the Meadows community."
          bg="bg-neutral-900"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {heroStats.map((stat) => (
              <RevealItem key={stat.label}>
                <StatCard {...stat} size="lg" />
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* --------------------------- Metrics ------------------------------ */}
        <Section
          id="metrics"
          title="Community Snapshot"
          sub="Signals from Gen-Z communities, updated weekly."
          bg="bg-neutral-900"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((stat) => (
              <RevealItem key={stat.label}>
                <StatCard {...stat} />
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ------------------------ Platform Pillars ------------------------ */}
        <Section
          id="pillars"
          title="Gen-Z Pillars"
          sub="Everything you need to create, connect, and grow your circle."
          bg="bg-neutral-950"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <RevealItem key={pillar.title}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl hover:shadow-lg hover:shadow-emerald-600/30 transition">
                  <CardHeader className="flex items-center gap-3 pb-2">
                    <pillar.icon className="size-8 text-emerald-400" />
                    <CardTitle className="font-display text-lg text-white">
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-neutral-400">
                    {pillar.desc}
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ----------------------- Scale & Reliability ---------------------- */}
        <Section
          id="reliability"
          title="Speed & Reliability"
          sub="Built to stay fast and stable on mobile networks."
          bg="bg-neutral-900"
        >
          <div className="grid max-w-6xl mx-auto gap-10 lg:grid-cols-[1.1fr,1fr] items-start">
            <Reveal className="space-y-4">
              <h3 className="font-display text-2xl text-white">
                Fast feeds for fast-moving communities
              </h3>
              <p className="text-neutral-400 text-sm md:text-base">
                Meadows pairs edge delivery with resilient APIs so Gen-Z
                communities stay smooth, even on 4G. Consistent performance,
                predictable experience.
              </p>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
                <span className="px-3 py-1 rounded-full bg-neutral-800/70">
                  Edge caching
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-800/70">
                  Adaptive media
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-800/70">
                  Observability-ready
                </span>
              </div>
            </Reveal>
            <Stagger className="grid gap-4 sm:grid-cols-2">
              {reliabilityStats.map((stat) => (
                <RevealItem key={stat.label}>
                  <StatCard {...stat} />
                </RevealItem>
              ))}
            </Stagger>
          </div>
        </Section>

        {/* ------------------------ Workflow Section ------------------------ */}
        <Section
          id="workflow"
          title="From First Post to Momentum"
          sub="A simple workflow to launch, grow, and keep the vibe."
          bg="bg-neutral-950"
        >
          <Stagger className="grid max-w-5xl mx-auto gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <RevealItem key={step.title}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl p-6 hover:shadow-lg hover:shadow-emerald-600/30 transition">
                  <div className="font-display text-4xl text-emerald-400">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h4 className="mt-4 text-lg text-white font-semibold font-display">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm text-neutral-400">{step.desc}</p>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* --------------------------- Architecture ------------------------- */}
        <Section
          id="architecture"
          title="Built for Mobile"
          sub="Modern infrastructure tuned for Gen-Z speed."
          bg="bg-neutral-900"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {architecture.map((item) => (
              <RevealItem key={item.title}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl p-6 hover:shadow-lg hover:shadow-emerald-600/30 transition">
                  <item.icon className="size-8 text-emerald-400" />
                  <h4 className="mt-4 text-lg text-white font-semibold font-display">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm text-neutral-400">{item.desc}</p>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* --------------------------- Features ----------------------------- */}
        <Section
          id="features"
          title="Core Features"
          sub="Everything Gen-Z creators need to ship a high-quality social space."
          bg="bg-neutral-950"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <RevealItem key={f.title}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl hover:shadow-lg hover:shadow-emerald-600/30 transition">
                  <CardHeader className="flex items-center gap-3 pb-2">
                    <f.icon className="size-8 text-emerald-400" />
                    <CardTitle className="font-display text-lg text-white">
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-neutral-400">
                    {f.desc}
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* --------------------- Device-Ready Showcase ---------------------- */}
        <Section
          id="devices"
          title="Beautiful Everywhere"
          sub="Optimized layouts from widescreen to pocket-size."
          bg="bg-neutral-900"
        >
          <Stagger className="grid max-w-4xl mx-auto gap-6 sm:grid-cols-3">
            {devices.map((d) => (
              <RevealItem key={d.title}>
                <Card className="bg-neutral-800/60 backdrop-blur rounded-3xl text-center py-10 hover:shadow-emerald-600/30 hover:shadow-lg transition">
                  <CardContent className="flex flex-col items-center gap-4">
                    <d.icon className="size-10 text-emerald-400" />
                    <p className="font-medium text-white">{d.title}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Responsive by design
                    </span>
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ------------------------- Testimonials --------------------------- */}
        <Section
          id="testimonials"
          title="Loved by Gen-Z Creators"
          sub="Real feedback from the people building on Meadows."
          bg="bg-neutral-950"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map(([text, name]) => (
              <RevealItem key={name}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl p-6 hover:shadow-emerald-600/30 hover:shadow-lg transition">
                  <p className="text-sm text-neutral-300">“{text}”</p>
                  <footer className="mt-3 text-sm text-emerald-400">
                    {name}
                  </footer>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ---------------------- Trust & Governance ----------------------- */}
        <Section
          id="governance"
          title="Safety & Trust"
          sub="Clear controls, accountable moderation, and transparent policies."
          bg="bg-neutral-900"
        >
          <Stagger className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {governance.map((item) => (
              <RevealItem key={item.title}>
                <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl p-6 hover:shadow-lg hover:shadow-emerald-600/30 transition">
                  <item.icon className="size-8 text-emerald-400" />
                  <h4 className="mt-4 text-lg text-white font-semibold font-display">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm text-neutral-400">{item.desc}</p>
                </Card>
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ----------------------------- FAQ ------------------------------ */}
        <Section
          id="faq"
          title="Frequently Asked Questions"
          sub="Quick answers for Gen-Z creators and communities."
          bg="bg-neutral-900"
        >
          <Stagger className="max-w-4xl mx-auto space-y-4">
            {faq.map(([q, a]) => (
              <RevealItem key={q}>
                <FaqItem q={q} a={a} />
              </RevealItem>
            ))}
          </Stagger>
        </Section>

        {/* ------------------------- Call to Action -------------------------- */}
        <Section
          id="signup"
          title="Ready to Join Gen-Z Social?"
          sub="Start posting in seconds. No friction, just community."
          bg="bg-emerald-600"
          titleClassName="text-white"
          subClassName="text-white"
        >
          <Reveal className="flex flex-wrap justify-center gap-4">
            <Btn href="/signup" className="bg-white text-emerald-700">
              Get Started
            </Btn>
            <Btn
              href="https://github.com/hoangsonww/Meadows-Social-Media"
              outline
              className="border-white/60 text-white"
            >
              <Github className="size-5" /> Star on GitHub
            </Btn>
          </Reveal>
        </Section>

        {/* --------------------------- Footer ------------------------------ */}
        <footer className="bg-neutral-950 text-neutral-400 py-10 text-sm">
          <Reveal className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <span>© {new Date().getFullYear()} Meadows</span>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="#" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition">
                License
              </Link>
              <Link
                href="https://github.com/hoangsonww/Meadows-Social-Media"
                className="flex items-center gap-1 hover:text-white transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                GitHub
              </Link>
            </nav>
          </Reveal>
        </footer>
      </div>
    </>
  );
}
