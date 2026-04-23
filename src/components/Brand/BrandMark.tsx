export default function BrandMark({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const textSize = size === 'large' ? 'text-[1.9rem]' : 'text-[1.45rem]';
  const iconSize = size === 'large' ? 30 : 26;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/16 via-sky-400/8 to-transparent ring-1 ring-sky-300/10"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg width={iconSize - 6} height={iconSize - 6} viewBox="0 0 24 24" fill="none" className="text-sky-400">
          <path d="M12 3.5a2.8 2.8 0 1 1 0 5.6a2.8 2.8 0 0 1 0-5.6Z" fill="currentColor" />
          <path d="M10.4 9.3L8.5 15h7L13.6 9.3Z" fill="currentColor" opacity=".92" />
          <path d="M7.4 16.2L6.6 19h10.8l-.8-2.8Z" fill="currentColor" opacity=".82" />
        </svg>
      </div>
      <div className="leading-none">
        <div className={`${textSize} font-black tracking-[-0.04em] text-white`}>
          Openings<span className="text-sky-300">Lab</span>
        </div>
      </div>
    </div>
  );
}
