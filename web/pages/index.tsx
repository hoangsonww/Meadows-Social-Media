import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  Activity,
  Camera,
  Heart,
  MessageCircle,
  Palette,
  Send,
  Users,
  Github,
  ChevronDown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronUp,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* dynamic import for client-only count-up */
const CountUp = dynamic(() => import("react-countup"), { ssr: false });

/* -------------------------------------------------------------------------- */
/*                                 Typewriter                                 */
/* -------------------------------------------------------------------------- */

function useTypewriter(lines: string[], speed = 85) {
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState("");

  useEffect(() => {
    const full = lines[idx];
    /* keep typing current line */
    if (sub.length < full.length) {
      const t = setTimeout(() => setSub(full.slice(0, sub.length + 1)), speed);
      return () => clearTimeout(t);
    }
    /* pause, then reset & move to next line */
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

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

const Section = ({
  id,
  title,
  sub,
  children,
  bg = "bg-neutral-900",
}: {
  id?: string;
  title: string;
  sub: string;
  children: React.ReactNode;
  bg?: string;
}) => (
  <section id={id} className={`${bg} py-24 px-4`}>
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="max-w-3xl mx-auto text-center mb-16"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold text-white">
        {title}
      </h2>
      <p className="mt-3 text-lg text-neutral-400">{sub}</p>
    </motion.div>
    {children}
  </section>
);

/* -------------------------------------------------------------------------- */
/*                             Content Definition                             */
/* -------------------------------------------------------------------------- */

const heroLines = [
  "Scroll. Share. Smile.",
  "Social Media, Re-imagined.",
  "Built for Gen-Z Creators.",
  "Open Source • Supabase-Powered.",
  "Your Privacy-First, Your Security-First.",
  "Join the Meadows Movement!",
  "Your Feed, Your Rules.",
  "Where Every Post Matters.",
  "Connect, Create, Conquer.",
  "A Fresh Take on Social Media.",
  "Share Your World, Your Way.",
  "Discover, Engage, Inspire.",
  "The Social Network You Deserve.",
  "Empowering Creators Everywhere.",
  "Your Voice, Amplified.",
  "Join the Next-Gen Social Revolution.",
  "Meadows: Where Community Thrives.",
  "Craft Your Digital Garden.",
  "Social Media, Evolved.",
  "Your Story, Your Platform.",
  "Connect with Kindred Spirits.",
  "Grow With Every Scroll.",
  "Built for Expression, Not Algorithms.",
  "Be Seen. Be Heard. Be You.",
  "Unfiltered. Uncensored. Unstoppable.",
  "Social That Cares.",
  "Create Without Constraints.",
  "Posts That Breathe With You.",
  "A Platform With Purpose.",
  "Vibe With Your Tribe.",
  "Where Creators Bloom.",
  "Reclaim Your Digital Space.",
  "Rooted in Openness, Grown by You.",
  "Freedom to Post, Power to Connect.",
  "Not Just Another Feed - A Movement.",
  "Human-Centered Social Media.",
  "Open Feeds. Open Minds.",
  "A Breath of Fresh Air in Social.",
  "Meadows Grows With You.",
  "Beyond the Algorithm.",
];

const metrics = [
  { value: 15000, suffix: "+", label: "Monthly active users" },
  { value: 2000000, suffix: "+", label: "Posts served" },
  { value: 4.9, suffix: " ★", label: "User rating" },
];

const features = [
  {
    icon: Palette,
    title: "Light & Dark",
    desc: "Automatic theme that matches your vibe.",
  },
  {
    icon: Camera,
    title: "Image Uploads",
    desc: "Share memories in full resolution.",
  },
  {
    icon: Heart,
    title: "Likes & Follows",
    desc: "Show love and build your tribe.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Comments",
    desc: "Talk it out - instantly.",
  },
  {
    icon: Activity,
    title: "Infinite Scroll",
    desc: "Never hit the bottom of your feed.",
  },
  {
    icon: Send,
    title: "Share Anywhere",
    desc: "Web Share API & rich embeds.",
  },
];

const testimonials = [
  [
    "Meadows feels like Twitter circa 2012 but modern. Love the vibe!",
    "Ava • Product Designer",
  ],
  [
    "Built an entire community for my indie game on Meadows in a week.",
    "Kai • Game Dev",
  ],
  [
    "Open-source, local first, privacy-respecting - instant 5 stars.",
    "Zoe • Engineer",
  ],
];

const faq: [string, string][] = [
  ["Is Meadows free?", "Absolutely - MIT-licensed and self-host-friendly."],
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
    "Yep! Meadows is fully responsive and feels great on any device.",
  ],
  [
    "Can I deploy it myself?",
    "Totally. Just clone the repo, set up Supabase, and deploy to Vercel or any platform.",
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
        className="w-full px-4 py-3 text-left text-white flex justify-between items-center"
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
          content="Meadows is an open-source, privacy-first social platform powered by Next.js and Supabase."
        />
      </Head>

      {/* --------------------------- Global Styles -------------------------- */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
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

      {/* ------------------------------ Hero ------------------------------- */}
      <header className="relative flex flex-col items-center justify-center min-h-dvh bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -z-10 inset-0 bg-gradient-to-br from-emerald-600/40 to-purple-700/40 blur-3xl opacity-30" />
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-extrabold text-center"
        >
          Meadows
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="mt-6 max-w-2xl text-lg text-center text-neutral-300"
        >
          A fresh, open social network - built by devs, shaped by creators.
        </motion.p>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.45 }}
          className="mt-8 text-2xl text-emerald-400 font-mono h-8"
        >
          {typedLine}
          <span className="cursor" />
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.6 }}
          className="mt-12 flex gap-4"
        >
          <Btn href="/signup">
            <Users className="size-5" />
            Join Meadows
          </Btn>
          <Btn href="/login" outline>
            <Send className="size-5" />
            Log In
          </Btn>
          <Btn
            href="https://github.com/hoangsonww/Meadows-Social-Media"
            outline
          >
            <Github className="size-5" />
            GitHub
          </Btn>
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.8 }}
          className="absolute bottom-10"
        >
          <Btn href="#metrics" outline className="animate-bounce px-4 py-2">
            <ChevronDown className="size-6" /> Explore
          </Btn>
        </motion.div>
      </header>

      {/* --------------------------- Metrics ------------------------------ */}
      <Section
        id="metrics"
        title="Community at a Glance"
        sub="Live stats updated weekly"
        bg="bg-neutral-900"
      >
        <div className="grid max-w-6xl mx-auto gap-6 sm:grid-cols-3">
          {metrics.map(({ value, suffix, label }) => (
            <Card
              key={label}
              className="bg-neutral-800/60 backdrop-blur rounded-3xl text-center py-8 hover:shadow-emerald-600/30 hover:shadow-lg transition"
            >
              <CardContent>
                <h3 className="text-3xl font-bold text-emerald-400">
                  <CountUp
                    start={0}
                    end={value}
                    duration={2}
                    suffix={suffix}
                    separator=","
                    enableScrollSpy
                    scrollSpyOnce
                  />
                </h3>
                <p className="mt-2 text-sm uppercase text-neutral-400 tracking-wide">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* --------------------------- Features ----------------------------- */}
      <Section
        id="features"
        title="Why You'll Love Meadows"
        sub="The tools you need to create, connect, and grow"
        bg="bg-neutral-950"
      >
        <div className="relative max-w-6xl mx-auto">
          <Carousel opts={{ loop: true }}>
            <CarouselContent className="-ml-6">
              {features.map((f) => (
                <CarouselItem
                  key={f.title}
                  className="basis-10/12 md:basis-1/3 pl-6"
                >
                  <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl hover:shadow-lg hover:shadow-emerald-600/30 transition">
                    <CardHeader className="flex items-center gap-3 pb-2">
                      <f.icon className="size-8 text-emerald-400" />
                      <CardTitle className="text-lg text-white">
                        {f.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-neutral-400">
                      {f.desc}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hover:scale-110 transition" />
            <CarouselNext className="hover:scale-110 transition" />
          </Carousel>
        </div>
      </Section>

      {/* --------------------- Device-Ready Showcase ---------------------- */}
      <Section
        id="devices"
        title="Beautiful Everywhere"
        sub="Optimized layouts from widescreen to pocket-size"
        bg="bg-neutral-900"
      >
        <div className="grid max-w-4xl mx-auto gap-6 sm:grid-cols-3">
          {devices.map((d) => (
            <Card
              key={d.title}
              className="bg-neutral-800/60 backdrop-blur rounded-3xl text-center py-10 hover:shadow-emerald-600/30 hover:shadow-lg transition"
            >
              <CardContent className="flex flex-col items-center gap-4">
                <d.icon className="size-10 text-emerald-400" />
                <p className="font-medium text-white">{d.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ------------------------- Testimonials --------------------------- */}
      <Section
        id="testimonials"
        title="Loved by Creators"
        sub="Real feedback from early adopters"
        bg="bg-neutral-950"
      >
        <div className="relative max-w-6xl mx-auto">
          <Carousel opts={{ loop: true }}>
            <CarouselContent className="-ml-6">
              {testimonials.map(([text, name]) => (
                <CarouselItem
                  key={name}
                  className="basis-10/12 md:basis-1/2 pl-6"
                >
                  <Card className="h-full bg-neutral-800/60 backdrop-blur rounded-3xl p-6 hover:shadow-emerald-600/30 hover:shadow-lg transition">
                    <p className="text-sm text-neutral-300">“{text}”</p>
                    <footer className="mt-3 text-sm text-emerald-400">
                      {name}
                    </footer>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hover:scale-110 transition" />
            <CarouselNext className="hover:scale-110 transition" />
          </Carousel>
        </div>
      </Section>

      {/* ----------------------------- FAQ ------------------------------ */}
      <Section
        id="faq"
        title="Frequently Asked Questions"
        sub="Everything else you might want to know"
        bg="bg-neutral-900"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {faq.map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </Section>

      {/* ------------------------- Call to Action -------------------------- */}
      <Section
        id="signup"
        title="Ready to Start Posting?"
        sub="Sign up in seconds - no credit card required"
        bg="bg-emerald-600"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
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
        </motion.div>
      </Section>

      {/* --------------------------- Footer ------------------------------ */}
      <footer className="bg-neutral-950 text-neutral-400 py-10 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <span>© {new Date().getFullYear()} Meadows</span>
          <nav className="flex gap-6">
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
        </div>
      </footer>
    </>
  );
}
