export default function BrandMark({ size = 32, label = "" }) {
  return (
    <img
      className="brand-logo"
      src="/onlydevops-logo.png"
      alt={label}
      width={size}
      height={size}
      loading="eager"
    />
  );
}
