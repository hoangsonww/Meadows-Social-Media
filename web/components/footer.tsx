import { Github, Globe, Linkedin, Sparkles } from "lucide-react";

const links = [
  {
    href: "https://sonnguyenhoang.com",
    label: "Portfolio",
    icon: Globe,
  },
  {
    href: "https://github.com/hoangsonww",
    label: "GitHub",
    icon: Github,
  },
  {
    href: "https://www.linkedin.com/in/hoangsonw/",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "https://github.com/hoangsonww/Meadows-Social-Media/",
    label: "Repo",
    icon: Sparkles,
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-left">
          <p className="text-sm font-medium text-muted-foreground">
            Meadows Social • Built with ❤️ by Son Nguyen
          </p>
          <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block sm:text-right">
            {year}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 sm:w-auto sm:justify-start sm:py-1.5"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
