'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-shit-darker/95 backdrop-blur-md shadow-lg' : 'bg-shit-darker'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">💩</span>
              <span className="text-xl font-bold text-glass group-hover:text-gold transition-colors">
                Shitscreener
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-cream hover:text-glass transition-colors">
                Tokens
              </Link>
              <a
                href="https://launch.shitter.io"
                className="text-cream hover:text-glass transition-colors"
              >
                Launch
              </a>
              <a
                href="https://social.shitter.io"
                className="text-cream hover:text-glass transition-colors"
              >
                Social
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-cream hover:text-glass transition-colors p-2"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-shit-darker border-t border-shit-brown/30">
            <div className="px-4 py-3 space-y-3">
              <Link
                href="/"
                className="block text-cream hover:text-glass transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tokens
              </Link>
              <a
                href="https://launch.shitter.io"
                className="block text-cream hover:text-glass transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Launch
              </a>
              <a
                href="https://social.shitter.io"
                className="block text-cream hover:text-glass transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Social
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-shit-darker/95 backdrop-blur-md border-t border-shit-brown/30">
        <div className="flex justify-around py-3">
          <Link
            href="/"
            className="flex flex-col items-center text-glass"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1">Tokens</span>
          </Link>
          <a
            href="https://launch.shitter.io"
            className="flex flex-col items-center text-shit-medium hover:text-glass transition-colors"
          >
            <span className="text-xl">🚀</span>
            <span className="text-xs mt-1">Launch</span>
          </a>
          <a
            href="https://social.shitter.io"
            className="flex flex-col items-center text-shit-medium hover:text-glass transition-colors"
          >
            <span className="text-xl">💬</span>
            <span className="text-xs mt-1">Social</span>
          </a>
        </div>
      </div>
    </>
  );
}
