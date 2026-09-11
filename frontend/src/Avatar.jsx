export default function Avatar({ seed, size = 28 }) {
  const value = encodeURIComponent(seed || "guest");
  return (
    <img
      className="user-avatar"
      src={`https://api.dicebear.com/9.x/bottts/svg?seed=${value}&backgroundType=gradientLinear`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
