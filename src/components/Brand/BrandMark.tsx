export type LogoVariant = 'side-by-side' | 'light-dark' | 'diagonal-2' | 'boxed-pair' | 'wordmark' | 'minimal';

export default function BrandMark({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const textSize = size === 'large' ? 'text-[1.9rem]' : 'text-[1.45rem]';
  const iconSize = size === 'large' ? 34 : 28;

  return (
    <div className="flex items-center gap-3">
      <TwoPawnsLogo variant="boxed-pair" size={iconSize} />
      <div className="leading-none">
        <div className={`${textSize} font-brand-serif font-black text-white`}>
          2<span className="text-sky-300">pawns</span>
        </div>
      </div>
    </div>
  );
}

export function TwoPawnsLogo({
  variant,
  size = 42,
}: {
  variant: LogoVariant;
  size?: number;
}) {
  const boxed = variant === 'boxed-pair' || variant === 'diagonal-2';
  const compact = variant === 'minimal';
  const lightDark = variant === 'light-dark' || variant === 'wordmark';

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${
        boxed ? 'rounded-xl border border-sky-300/20 bg-sky-400/12' : ''
      }`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {variant === 'wordmark' && (
        <span className="absolute -left-0.5 top-1 text-[10px] font-black text-white">2</span>
      )}
      <PawnShape
        className={lightDark ? 'text-white' : 'text-sky-200'}
        size={compact ? size * 0.52 : size * 0.58}
        style={{
          transform: variant === 'diagonal-2' ? 'translate(-18%, 8%) scale(0.92)' : 'translate(-22%, 0)',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
        }}
      />
      <PawnShape
        className={lightDark ? 'text-slate-950' : 'text-sky-400'}
        size={compact ? size * 0.52 : size * 0.58}
        style={{
          transform: variant === 'diagonal-2' ? 'translate(20%, -13%) scale(0.92)' : 'translate(20%, 0)',
          filter: lightDark
            ? 'drop-shadow(0 0 1px rgba(255,255,255,0.7))'
            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
        }}
      />
    </div>
  );
}

function PawnShape({
  size,
  className,
  style,
}: {
  size: number;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`absolute ${className}`}
      style={style}
    >
      <circle cx="12" cy="5.8" r="3.3" />
      <path d="M9.3 9.3h5.4l1.25 5.2h-7.9z" />
      <path d="M6.9 15.8h10.2l1.25 3.1H5.65z" />
      <path d="M4.8 20h14.4v1.6H4.8z" />
    </svg>
  );
}
import type { CSSProperties } from 'react';
