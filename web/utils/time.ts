function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}

export function formatFeedPostDateLabel(
  postedAtValue: Date | string,
  nowValue: Date = new Date(),
): string {
  const postedAt = toDate(postedAtValue);
  const nowYear = nowValue.getFullYear();
  const postYear = postedAt.getFullYear();

  if (postYear !== nowYear) {
    return postedAt.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return postedAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTimeAgo(
  postedAtValue: Date | string,
  nowValue: Date = new Date(),
): string {
  const postedAt = toDate(postedAtValue);
  const diffMs = Math.max(nowValue.getTime() - postedAt.getTime(), 0);

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${Math.max(seconds, 1)}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
