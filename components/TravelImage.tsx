import type { ImgHTMLAttributes } from 'react';
import { STATES } from '../data/travel';
const widths = new Map(STATES.flatMap((s) => s.photos.map((p) => [p.src, p.width] as const)));
export function imageSources(src: string) {
  if (!/^\/images\/(?!responsive\/).+\.(jpg|jpeg|png)$/.test(src)) return undefined;
  const base = src.replace('/images/', '/images/responsive/').replace(/\.(jpg|jpeg|png)$/, '');
  const width = widths.get(src) ?? 960;
  if (src === '/images/hero.jpg')
    return `${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`;
  return [480, 640, 960]
    .filter((_, i, sizes) => i === 0 || width > sizes[i - 1])
    .map((size) => `${base}-${size}.webp ${Math.min(size, width)}w`)
    .join(', ');
}
export default function TravelImage({
  src = '',
  sizes = '(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw',
  width = 960,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src={src}
      width={width}
      sizes={sizes}
      srcSet={imageSources(src)}
      decoding={props.fetchPriority === 'high' ? 'sync' : 'async'}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.srcset) {
          img.removeAttribute('srcset');
          img.src = src;
        } else props.onError?.(event);
      }}
    />
  );
}
