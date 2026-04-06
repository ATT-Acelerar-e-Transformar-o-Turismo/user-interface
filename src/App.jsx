import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './App.css'
import PageTemplate from './pages/PageTemplate'
import HeroSection from './components/landing/HeroSection'
import AboutSection from './components/landing/AboutSection'
import FeaturesSection from './components/landing/FeaturesSection'
import DimensionsSection from './components/landing/DimensionsSection'
import BlogSection from './components/landing/BlogSection'
import AnimatedBackground from './components/landing/AnimatedBackground'
import { useInView } from 'react-intersection-observer';

function SectionWrapper({ children, onInView, id }) {
  const { ref,inView } = useInView({
    threshold: 0.3, // Trigger when 30% of the section is visible
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView) {
      onInView(id);
    }
  }, [inView, onInView, id]);

  return <div id={id} ref={ref} className="relative z-10">{children}</div>;
}

SectionWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  onInView: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

function App() {
  const [currentSection, setCurrentSection] = useState('hero');

  return (
    <>
      <PageTemplate showSearchBox={false} fullBleed landingFooter>
        <div className="relative flex flex-col w-full">
          <AnimatedBackground section={currentSection} />
          <SectionWrapper id="hero" onInView={setCurrentSection}>
            <HeroSection />
          </SectionWrapper>
          <SectionWrapper id="about" onInView={setCurrentSection}>
            <AboutSection />
          </SectionWrapper>
          <SectionWrapper id="features" onInView={setCurrentSection}>
            <FeaturesSection />
          </SectionWrapper>
          <SectionWrapper id="dimensions" onInView={setCurrentSection}>
            <DimensionsSection />
          </SectionWrapper>
          <SectionWrapper id="blog" onInView={setCurrentSection}>
            <BlogSection />
          </SectionWrapper>
        </div>
      </PageTemplate>
    </>
  )
}

export default App
