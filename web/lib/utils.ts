/**
 * This is a helper function used by Shadcn to more easily
 * concatenate Tailwind CSS class names with other strings.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
