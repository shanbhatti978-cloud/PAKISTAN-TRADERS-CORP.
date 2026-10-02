import React from 'react';

interface AmbientBackgroundProps {
  liteMode?: boolean;
  animatedBackground?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  liteMode = false,
  animatedBackground = true,
}) => {
  if (liteMode) {
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-bg transition-colors duration-300"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-colors duration-300"
      style={{
        background: 'var(--bg-gradient, linear-gradient(160deg, #ECE8FB 0%, #F7F4EF 50%, #FDF1EE 100%))',
      }}
      aria-hidden="true"
    >
      {/* Ambient Blob A - Top Start */}
      <div
        className={`ambient-blob ambient-blob-1 absolute -top-[15vw] -left-[10vw] w-[55vw] h-[55vw] rounded-full filter blur-[90px] sm:blur-[110px] opacity-45 dark:opacity-25 ${
          !animatedBackground ? 'pause-animation' : ''
        }`}
        style={{
          background: 'var(--blob-a, #BDB4F2)',
          willChange: 'transform',
        }}
      />

      {/* Ambient Blob B - Bottom End */}
      <div
        className={`ambient-blob ambient-blob-2 absolute -bottom-[15vw] -right-[10vw] w-[50vw] h-[50vw] rounded-full filter blur-[90px] sm:blur-[110px] opacity-45 dark:opacity-25 ${
          !animatedBackground ? 'pause-animation' : ''
        }`}
        style={{
          background: 'var(--blob-b, #F4A3A0)',
          willChange: 'transform',
        }}
      />

      {/* Ambient Blob C - Center */}
      <div
        className={`ambient-blob ambient-blob-3 absolute top-[35%] left-[25%] w-[45vw] h-[45vw] rounded-full filter blur-[80px] sm:blur-[100px] opacity-35 dark:opacity-20 ${
          !animatedBackground ? 'pause-animation' : ''
        }`}
        style={{
          background: 'var(--blob-c, #C9F0E4)',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
