import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ slides, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!slides || slides.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const setSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full select-none">
      {/* Carousel Header */}
      <div className="flex justify-between items-center mb-6">
        {title && <h3 className="font-bold text-slate-800 text-lg">{title}</h3>}
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className="text-xs font-semibold text-slate-500 min-w-[40px] text-center">
            {currentIndex + 1} / {slides.length}
          </span>
          
          <button
            onClick={nextSlide}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slide Content Area */}
      <div className="relative flex-1 overflow-hidden min-h-[220px]">
        <div 
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="w-full flex-shrink-0 h-full flex flex-col justify-between">
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSlide(idx)}
            className={`h-2 rounded-full transition-all duration-150 ${
              idx === currentIndex ? 'w-6 bg-brand-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
