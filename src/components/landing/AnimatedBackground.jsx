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

const transitionConfig = { duration: 1.2, ease: [0.45, 0, 0.55, 1] };

const desktopEllipse1Variants = {
  hero: {
    top: '259.44px', right: '-250px', width: '801.03px', height: '801.03px',
    borderRadius: '50%', backgroundColor: 'var(--color-primary)', transition: transitionConfig
  },
  about: {
    top: '-180px', left: '50%', width: '5100px', height: '5100px',
    x: '-50%', y: '-50%', borderRadius: '50%', backgroundColor: 'var(--color-primary)',
    transition: { duration: 1.2, ease: [0.45, 0, 0.55, 1] }
  },
  features: {
    top: '-180px', left: '50%', width: '5100px', height: '5100px',
    x: '-50%', y: '-50%', borderRadius: '50%', backgroundColor: 'var(--color-primary)',
    opacity: 1, transition: transitionConfig
  },
  dimensions: {
    top: '-180px', left: '50%', width: '5100px', height: '5100px',
    x: '-50%', y: '-50%', borderRadius: '50%', backgroundColor: 'var(--color-primary)',
    opacity: 1, transition: transitionConfig
  },
  blog: {
    top: '-180px', left: '50%', width: '5100px', height: '5100px',
    x: '-50%', y: '-50%', borderRadius: '50%', backgroundColor: 'var(--color-primary)',
    opacity: 1, transition: transitionConfig
  }
};

const desktopEllipse2Variants = {
  hero: {
    top: '375.6px', right: '0px', width: '568.72px', height: '568.72px',
    borderRadius: '50%', backgroundColor: '#12BD8A', opacity: 0.34,
    filter: 'blur(84.85px)', transition: transitionConfig
  },
  about: {
    top: '-197.84px', left: '93.45px', width: '1325.1px', height: '1325.1px',
    borderRadius: '50%', backgroundColor: '#12BD8A', opacity: 0.34,
    filter: 'blur(84.85px)', transition: transitionConfig
  },
  features: {
    top: '456px', left: '93.45px', width: '1325.1px', height: '1325.1px',
    borderRadius: '50%', backgroundColor: '#12BD8A', opacity: 0,
    filter: 'blur(84.85px)', transition: transitionConfig
  },
  dimensions: {
    top: '1456px', left: '93.45px', width: '1325.1px', height: '1325.1px',
    borderRadius: '50%', backgroundColor: '#12BD8A', opacity: 0,
    filter: 'blur(84.85px)', transition: transitionConfig
  },
  blog: {
    top: '924px', left: '93.45px', width: '1325.1px', height: '1325.1px',
    borderRadius: '50%', backgroundColor: '#12BD8A', opacity: 0.34,
    filter: 'blur(84.85px)', transition: transitionConfig
  }
};

function MobileBackground() {
  const containerRef = useRef(null);

  // Track the features section scroll progress relative to viewport
  const featuresRef = useRef(null);
  useEffect(() => {
    featuresRef.current = document.getElementById('features');
  }, []);

  const { scrollY } = useScroll();

  // Dynamically compute circle position based on the features section position
  const [featuresTop, setFeaturesTop] = useState(99999);
  useEffect(() => {
    const update = () => {
      const el = document.getElementById('features');
      if (el) {
        // Get the absolute top of the features section from the page top
        setFeaturesTop(el.offsetTop);
      }
    };
    update();
    window.addEventListener('resize', update);
    // Re-measure after fonts/images load
    const timeout = setTimeout(update, 1000);
    return () => {
      window.removeEventListener('resize', update);
      clearTimeout(timeout);
    };
  }, []);

  // The circle bottom edge should align with the features section top
  // circleBottom = circleY + circleSize = featuresTop (relative to page)
  // But circleY is relative to the container (which is the page), and we want
  // the circle to scroll with the page. So we position it so that when the user
  // scrolls to the features section, the circle's bottom edge is at the features top.
  //
  // At the hero (scroll=0): small circle on the right
  // At about (scroll=heroHeight~800): big circle covering about
  // At features (scroll=featuresTop): circle bottom edge = featuresTop in page coords
  //
  // For the expanded circle: circleY = featuresTop - circleSize
  // With circleSize=3000: circleY = featuresTop - 3000

  const heroEnd = 600; // approximate hero scroll distance
  const circleFullSize = 3000;
  const circleRestY = featuresTop - circleFullSize + 150; // +150 to include the curved title inside the circle

  // Hero: circle at bottom-right, mostly off-screen (only left arc visible)
  // About: expands and centers
  const circleY = useTransform(scrollY, [0, heroEnd], [442, circleRestY]);
  const circleSize = useTransform(scrollY, [0, heroEnd], [780, circleFullSize]);
  const circleX = useTransform(scrollY, [0, heroEnd], ['82%', '50%']);
  const circleTranslateX = useTransform(scrollY, [0, heroEnd], ['-50%', '-50%']);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-base-100">
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

function DesktopBackground({ section }) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-base-100">
      <motion.div
        className="absolute"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%)'
        }}
        initial="hero"
        animate={section}
        variants={desktopEllipse1Variants}
      />
      <motion.div
        className="absolute"
        initial="hero"
        animate={section}
        variants={desktopEllipse2Variants}
      />
    </div>
  );
}

DesktopBackground.propTypes = {
  section: PropTypes.string.isRequired,
};

export default function AnimatedBackground({ section }) {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  if (isMobile) {
    return <MobileBackground />;
  }

  return <DesktopBackground section={section} />;
}

AnimatedBackground.propTypes = {
  section: PropTypes.string.isRequired,
};
