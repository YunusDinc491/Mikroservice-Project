interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 256 256"
      fill="none"
      className={`sm:w-[32px] sm:h-[32px] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 40 216 L 40 140 L 88 140 L 88 216 Z"
        fill="white"
        fillOpacity="0.35"
      />
      <path
        d="M 104 216 L 104 96 L 152 96 L 152 216 Z"
        fill="white"
        fillOpacity="0.65"
      />
      <path d="M 168 216 L 168 40 L 216 40 L 216 216 Z" fill="white" />
    </svg>
  );
}
