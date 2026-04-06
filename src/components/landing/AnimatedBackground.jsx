import { motion, useScroll, useTransform } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);
  return matches;
};

export default function AnimatedBackground() {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { scrollY } = useScroll();

  // Measure the features section top to know where the circle bottom edge should land
  const [featuresTop, setFeaturesTop] = useState(99999);
  useEffect(() => {
    const update = () => {
      const el = document.getElementById('features');
      if (el) setFeaturesTop(el.offsetTop);
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
  const heroEnd = isMobile ? 600 : 400;
  // +150 so curved title (at top of features section) stays inside the circle
  const circleRestY = featuresTop - expandedSize + 200;

  const circleY = useTransform(scrollY, [0, heroEnd], [heroStartY, circleRestY]);
  const circleSize = useTransform(scrollY, [0, heroEnd], [heroStartSize, expandedSize]);
  const circleX = useTransform(scrollY, [0, heroEnd], [heroStartX, '50%']);
  const circleTranslateX = '-50%';

  // Secondary ellipse (green glow) — desktop only
  const ellipse2Opacity = useTransform(scrollY, [0, heroEnd, heroEnd + 400], [0.34, 0.34, 0]);
  const ellipse2Y = useTransform(scrollY, [0, heroEnd], [375, -198]);
  const ellipse2Size = useTransform(scrollY, [0, heroEnd], [569, 1325]);

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

      {/* Secondary ellipse (green glow) — desktop only */}
      {!isMobile && (
        <motion.div
          className="absolute rounded-full"
          style={{
            top: ellipse2Y,
            left: '93px',
            width: ellipse2Size,
            height: ellipse2Size,
            backgroundColor: '#12BD8A',
            opacity: ellipse2Opacity,
            filter: 'blur(84.85px)',
          }}
        />
      )}
    </div>
  );
}

AnimatedBackground.propTypes = {
  section: PropTypes.string,
};
