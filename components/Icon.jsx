import { ICON_PATHS } from "@/lib/icons";

export default function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2 }) {
  const markup = ICON_PATHS[name] || "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "none", color }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
