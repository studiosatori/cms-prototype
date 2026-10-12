function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({ user, size = 24 }) {
  if (!user) return null;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white font-medium text-gray-800 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={user.name}
    >
      {initials(user.name)}
    </span>
  );
}
