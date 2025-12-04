// components/ScrollProgress.tsx
'use client';

import { useEffect } from 'react';

export default function ScrollProgress() {
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const progressBar = document.getElementById('scroll-progress');
      if (progressBar) {
        progressBar.style.width = scrolled + '%';
      }

      // Back to top button visibility
      const backToTop = document.getElementById('back-to-top');
      if (backToTop) {
        if (window.scrollY > 500) {
          backToTop.style.opacity = '1';
          backToTop.style.pointerEvents = 'auto';
        } else {
          backToTop.style.opacity = '0';
          backToTop.style.pointerEvents = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}