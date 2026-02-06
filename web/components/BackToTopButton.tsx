import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.pageYOffset > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="
        fixed bottom-5 right-5 z-50
        flex h-11 w-11 items-center justify-center
        rounded-full border border-border/70 bg-card/85 text-foreground shadow-soft-xl backdrop-blur
        transition-transform duration-200 hover:-translate-y-1
      "
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
