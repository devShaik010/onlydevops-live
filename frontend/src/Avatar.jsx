export default function Avatar({ seed, size = 42 }) {
  const value = encodeURIComponent(seed || "guest");
  return (
    <img
      className="user-avatar"
      src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${value}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
      alt=""
      width={size}
      height={size}
      style={{ "--avatar-size": `${size}px` }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
