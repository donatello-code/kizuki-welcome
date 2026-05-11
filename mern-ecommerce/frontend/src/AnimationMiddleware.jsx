import React, { useEffect, useRef, useState } from 'react';

const AnimationMiddleware = ({ 
  children, 
  animation = 'anim-fade-in-up', 
  delay = '', 
  threshold = 0.1, 
  className = '' 
}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px',
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    const currentRef = ref.current;
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? `${animation} ${delay}` : 'anim-hidden'}`}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
};

export default AnimationMiddleware;
