import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
};

export default function AnimatedBackground() {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { scrollY } = useScroll();

  // Measure the features section top to know where the circle bottom edge should land
  const [featuresTop, setFeaturesTop] = useState(99999);
  // Measure when the subtitle bottom scrolls out of view
  const [subtitleEnd, setSubtitleEnd] = useState(null);
  useEffect(() => {
    const update = () => {
      const el = document.getElementById('features');
      if (el) setFeaturesTop(el.offsetTop);
      const cta = document.getElementById('hero-cta');
      if (cta) {
        // scrollY at which the CTA button's bottom edge leaves the top of the viewport
        // This means the user has scrolled past ALL hero text + button
        setSubtitleEnd(cta.offsetTop + cta.offsetHeight);
      }
    };
    update();
    window.addEventListener('resize', update);
    const timeout = setTimeout(update, 1000);
    return () => {
      window.removeEventListener('resize', update);
      clearTimeout(timeout);
    };
  }, []);

  // --- Responsive config ---
  const heroStartX = isMobile ? '82%' : '85%';
  const heroStartY = isMobile ? 442 : 259;
  const heroStartSize = isMobile ? 780 : 801;
  const expandedSize = isMobile ? 3000 : 5100;
  // The scroll position where the CTA button leaves the viewport
  const heroStart = subtitleEnd || (isMobile ? 300 : 200);
  // How much additional scroll after that to fully expand
  const expandDuration = isMobile ? 800 : 1200;
  const heroEnd = heroStart + expandDuration;
  // Position so the circle's bottom edge sits at featuresTop
  const circleRestY = featuresTop - expandedSize + (isMobile ? 80 : 200);

  // Circle stays at initial state until heroStart, then expands to heroEnd
  const circleY = useTransform(scrollY, [0, heroStart, heroEnd], [heroStartY, heroStartY, circleRestY]);
  const circleSize = useTransform(scrollY, [0, heroStart, heroEnd], [heroStartSize, heroStartSize, expandedSize]);
  const circleX = useTransform(scrollY, [0, heroStart, heroEnd], [heroStartX, heroStartX, '50%']);
  const circleTranslateX = '-50%';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-base-100">
      {/* Primary circle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: circleY,
          left: circleX,
          x: circleTranslateX,
          width: circleSize,
          height: circleSize,
          backgroundColor: 'var(--color-primary)',
        }}
      />
    </div>
  );
}

