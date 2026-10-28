import React from 'react';
import { useAccessibility } from '../../lib/accessibilityContext';
import { Eye, Type, Globe, Volume2 } from 'lucide-react';

export const GIGWHeader: React.FC = () => {
  const {
    fontSize,
    decreaseFontSize,
    resetFontSize,
    increaseFontSize,
    highContrast,
    toggleHighContrast,
    language,
    setLanguage,
  } = useAccessibility();

  return (
    <div className="bg-[#14243A] text-slate-200 border-b border-navy-800 text-[11px] selection:bg-teal-primary selection:text-white">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility (GIGW 3.0 Mandatory) */}
      <a
        href="#main-content"
        className="sr-only sr-only-focusable bg-teal-primary text-white font-bold px-4 py-2 absolute top-2 left-2 z-50 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content / मुख्य सामग्री पर जाएं
      </a>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Government of India / AICTE Institutional Identification */}
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-semibold text-white tracking-wide">
            {language === 'HI' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 hidden sm:inline">
            {language === 'HI'
              ? 'अखिल भारतीय तकनीकी शिक्षा परिषद'
              : 'All India Council for Technical Education (AICTE)'}
          </span>
          <span className="text-slate-300 sm:hidden">AICTE</span>
        </div>

        {/* Accessibility & Language Toolbar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Screen Reader Access Notice */}
          <button
            type="button"
            onClick={() => alert('Screen Reader Access: This portal is optimized for NVDA, JAWS, and VoiceOver conforming to GIGW 3.0 & WCAG 2.1 AA.')}
            className="hidden md:flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            title="Screen Reader Access Information"
            aria-label="Screen Reader Access"
          >
            <Volume2 className="w-3 h-3 text-teal-300" />
            <span>Screen Reader</span>
          </button>

          {/* Font Resizing Controls (GIGW 3.0 Standard) */}
          <div className="flex items-center border border-slate-700 rounded bg-navy-800/80 px-1 py-0.5" role="group" aria-label="Text Size Controls">
            <button
              onClick={decreaseFontSize}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'sm' ? 'bg-teal-primary text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Decrease Font Size (A-)"
              aria-label="Decrease text size"
            >
              A-
            </button>
            <button
              onClick={resetFontSize}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'base' ? 'bg-teal-primary text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Standard Font Size (A)"
              aria-label="Normal text size"
            >
              A
            </button>
            <button
              onClick={increaseFontSize}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'lg' ? 'bg-teal-primary text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Increase Font Size (A+)"
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle (GIGW 3.0 Mandatory) */}
          <button
            onClick={toggleHighContrast}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-300 font-bold'
                : 'border-slate-700 bg-navy-800/80 text-slate-300 hover:text-white'
            }`}
            title="Toggle High Contrast Mode"
            aria-pressed={highContrast}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">
              {highContrast ? 'Standard View' : 'High Contrast'}
            </span>
          </button>

          {/* Language Toggle (EN / HI) */}
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            <Globe className="w-3 h-3 text-slate-400" />
            <button
              onClick={() => setLanguage('EN')}
              className={`transition-colors ${language === 'EN' ? 'text-teal-300 font-bold underline' : 'text-slate-400 hover:text-slate-200'}`}
              aria-label="Select English Language"
            >
              English
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => setLanguage('HI')}
              className={`transition-colors ${language === 'HI' ? 'text-teal-300 font-bold underline' : 'text-slate-400 hover:text-slate-200'}`}
              aria-label="Select Hindi Language"
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
