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
        fixed bottom-4 right-4 z-50
        w-10 h-10
        flex items-center justify-center
        bg-black text-white
        dark:bg-white dark:text-black
        rounded-lg shadow-lg
        hover:scale-105 transition-transform
      "
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
