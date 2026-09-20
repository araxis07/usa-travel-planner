import { lazy, Suspense, useEffect, useRef, useState, type ComponentProps } from 'react';
import { translate } from '../lib/i18n';
const Atlas = lazy(() => import('./Atlas'));

export default function DeferredAtlas(props: ComponentProps<typeof Atlas>) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(location.hash === '#map');
  useEffect(() => {
    if (ready || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReady(true);
      },
      { rootMargin: '400px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ready]);
  const placeholder = (
    <div className="atlas-loading" role="status">
      {translate('Loading map…', 'กำลังโหลดแผนที่…', props.lang)}
    </div>
  );
  return (
    <div ref={ref} id="map" className="section-anchor">
      {ready ? (
        <Suspense fallback={placeholder}>
          <Atlas {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
