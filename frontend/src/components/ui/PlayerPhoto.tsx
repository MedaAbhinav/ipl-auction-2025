import React, { useState } from 'react';

interface Props {
  src?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

const sizes = {
  sm:  'w-10 h-10 text-sm',
  md:  'w-16 h-16 text-lg',
  lg:  'w-24 h-24 text-2xl',
  xl:  'w-36 h-36 text-4xl'
};

export default function PlayerPhoto({ src, name, className = '', size = 'md', style }: Props) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (!src || err) {
    return (
      <div
        style={style}
        className={`${sizes[size]} ${className} rounded-full flex items-center justify-center font-bold
                       bg-gradient-to-br from-stadium-gold/30 to-stadium-accent/30 border-2 border-stadium-gold/40
                       text-stadium-gold select-none`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={style}
      className={`${sizes[size]} ${className} rounded-full object-cover object-top
                  border-2 border-stadium-gold/40`}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}
