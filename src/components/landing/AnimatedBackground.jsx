import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react'; // Import useState and useEffect

// Custom hook for media queries
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

const transitionConfig = { duration: 1.2, ease: [0.45, 0, 0.55, 1] };

// Define base variants for desktop
const desktopEllipse1Variants = {
  hero: {
    top: '259.44px',
    right: '-250px',
    width: '801.03px',
    height: '801.03px',
    borderRadius: '50%',
    backgroundColor: '#009368',
    transition: transitionConfig
  },
  about: {
    top: '-180px',
    left: '50%',
    width: '5100px',
    height: '5100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    transition: { duration: 1.2, ease: [0.45, 0, 0.55, 1] }
  },
  features: {
    top: '-180px',
    left: '50%',
    width: '5100px',
    height: '5100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  },
  dimensions: {
    top: '-180px',
    left: '50%',
    width: '5100px',
    height: '5100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  },
  blog: {
    top: '-180px',
    left: '50%',
    width: '5100px',
    height: '5100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  }
};

const desktopEllipse2Variants = {
  hero: {
    top: '375.6px',
    right: '0px',
    width: '568.72px',
    height: '568.72px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  about: {
    top: '-197.84px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  features: {
    top: '456px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  dimensions: {
    top: '1456px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  blog: {
    top: '924px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  }
};

// Define mobile variants (example - need to refine based on desired mobile look)
const mobileEllipse1Variants = {
  hero: {
    top: '259.44px',
    right: '-350px',
    width: '801.03px',
    height: '801.03px',
    borderRadius: '50%',
    backgroundColor: '#009368',
    transition: transitionConfig
  },
  about: {
    top: 'calc(90vh - 470px)',
    left: '50%',
    width: '3100px',
    height: '3100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    transition: { duration: 1.2, ease: [0.45, 0, 0.55, 1] }
  },
  features: {
    top: 'calc(90vh - 470px)',
    left: '50%',
    width: '3100px',
    height: '3100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  },
  dimensions: {
    top: 'calc(90vh - 470px)',
    left: '50%',
    width: '3100px',
    height: '3100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  },
  blog: {
    top: 'calc(90vh - 470px)',
    left: '50%',
    width: '3100px',
    height: '3100px',
    x: '-50%',
    y: '-50%',
    borderRadius: '50%',
    backgroundColor: '#009368',
    opacity: 1,
    transition: transitionConfig
  }
};

const mobileEllipse2Variants = {
  hero: {
    top: '375.6px',
    right: '0px',
    width: '568.72px',
    height: '568.72px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  about: {
    top: '-197.84px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  features: {
    top: '456px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  dimensions: {
    top: '1456px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  },
  blog: {
    top: '924px',
    left: '93.45px',
    width: '1325.1px',
    height: '1325.1px',
    borderRadius: '50%',
    backgroundColor: '#12BD8A',
    opacity: 0.34,
    filter: 'blur(84.85px)',
    transition: transitionConfig
  }
};

export default function AnimatedBackground({ section }) {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const ellipse1Variants = isMobile ? mobileEllipse1Variants : desktopEllipse1Variants;
  const ellipse2Variants = isMobile ? mobileEllipse2Variants : desktopEllipse2Variants;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-base-100">
      {/* Ellipse 1 (Primary) */}
      <motion.div
        className="absolute"
        style={{
            // Radial gradient overlay to create the white highlight effect on top of the solid green
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%)'
        }}
        initial="hero"
        animate={section}
        variants={ellipse1Variants}
      />

      {/* Ellipse 2 (Secondary - Blurred) */}
      <motion.div
        className="absolute"
        initial="hero"
        animate={section}
        variants={ellipse2Variants}
      />
    </div>
  );
}

AnimatedBackground.propTypes = {
  section: PropTypes.string.isRequired,
};
