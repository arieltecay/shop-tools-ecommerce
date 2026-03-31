import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSlide } from '../types';
import { getOptimizedUrl } from '../../../utils/image-utils';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const HeroCarousel = ({ slides }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for right, -1 for left
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slides.length]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const product = currentSlide.product;
  const productImage = currentSlide.imageUrl || 
    (product?.images.find(img => img.isPrimary)?.url || product?.images[0]?.url);

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for "revolutionary" feel
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 + custom * 0.1, duration: 0.6 }
    })
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: { 
        delay: 0.4, 
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }
    },
    floating: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section 
      className="relative h-[650px] w-full overflow-hidden"
      style={{ backgroundColor: currentSlide.backgroundColor }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 flex items-center"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 mt-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 mb-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16">
              
              {/* Text Content */}
              <div className="order-2 md:order-1 space-y-6 md:space-y-8 text-center md:text-left z-10">
                <div className="space-y-4">
                  <motion.span 
                    variants={textVariants} initial="hidden" animate="visible" custom={0}
                    className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest"
                    style={{ color: currentSlide.textColor }}
                  >
                    {product?.category?.name || 'Destacado'}
                  </motion.span>
                  
                  <motion.h2 
                    variants={textVariants} initial="hidden" animate="visible" custom={1}
                    className="text-4xl md:text-7xl font-black tracking-tight leading-none"
                    style={{ color: currentSlide.textColor }}
                  >
                    {currentSlide.title}
                  </motion.h2>
                  
                  <motion.p 
                    variants={textVariants} initial="hidden" animate="visible" custom={2}
                    className="text-lg md:text-xl font-medium opacity-80 max-w-lg mx-auto md:mx-0"
                    style={{ color: currentSlide.textColor }}
                  >
                    {currentSlide.subtitle}
                  </motion.p>
                </div>

                <motion.div 
                  variants={textVariants} initial="hidden" animate="visible" custom={3}
                  className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
                >
                  <Link 
                    to={`/products/${product?.category?.slug}/${product?.slug}`}
                    className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-tight hover:scale-105 transition-transform flex items-center gap-2 shadow-2xl"
                    style={{ color: currentSlide.backgroundColor, backgroundColor: currentSlide.textColor }}
                  >
                    {currentSlide.buttonText} <ArrowRight size={18} />
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black opacity-60" style={{ color: currentSlide.textColor }}>Precio especial</span>
                    <span className="text-3xl font-black" style={{ color: currentSlide.textColor }}>
                      ${product?.price.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Image Content */}
              <div className="order-1 md:order-2 flex justify-center items-center z-10">
                <div className="relative group">
                  {/* Glowing background for image */}
                  <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
                  
                  <motion.div
                    variants={imageVariants}
                    initial="hidden"
                    animate={["visible", "floating"]}
                    className="relative w-72 h-72 md:w-[450px] md:h-[450px]"
                  >
                    <img 
                      src={getOptimizedUrl(productImage, 800, 800)} 
                      alt={currentSlide.title}
                      className="w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                    />
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8 z-20">
        <button 
          onClick={prevSlide}
          className="p-3 rounded-full border-2 transition-all hover:bg-white/10"
          style={{ borderColor: `${currentSlide.textColor}33`, color: currentSlide.textColor }}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Indicators with Progress Bar */}
        <div className="flex gap-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
              className="relative h-1.5 overflow-hidden rounded-full transition-all"
              style={{ 
                width: currentIndex === idx ? '60px' : '12px',
                backgroundColor: `${currentSlide.textColor}33`
              }}
            >
              {currentIndex === idx && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="absolute inset-0 h-full"
                  style={{ backgroundColor: currentSlide.textColor }}
                />
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={nextSlide}
          className="p-3 rounded-full border-2 transition-all hover:bg-white/10"
          style={{ borderColor: `${currentSlide.textColor}33`, color: currentSlide.textColor }}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Scroll indicator for mobile */}
      <div className="md:hidden absolute bottom-4 left-0 w-full flex justify-center opacity-30">
        <div className="w-1 h-8 rounded-full bg-white animate-pulse" />
      </div>
    </section>
  );
};

export default HeroCarousel;
