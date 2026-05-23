import { avatarColor, initials } from "@/lib/format";

export function InitialAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className={`${avatarColor(name)} flex items-center justify-center rounded-full text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name || "?")}
    </div>
  );
}
