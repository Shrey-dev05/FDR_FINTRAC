import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'sm' | 'base' | 'lg';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  increaseFontSize: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  language: 'EN' | 'HI';
  setLanguage: (lang: 'EN' | 'HI') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('fintrac_font_size') as FontSize) || 'base';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('fintrac_high_contrast') === 'true';
  });

  const [language, setLanguageState] = useState<'EN' | 'HI'>(() => {
    return (localStorage.getItem('fintrac_lang') as 'EN' | 'HI') || 'EN';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    if (fontSize === 'sm') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'lg') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
    localStorage.setItem('fintrac_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('fintrac_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('fintrac_lang', language);
  }, [language]);

  const decreaseFontSize = () => {
    if (fontSize === 'lg') setFontSizeState('base');
    else if (fontSize === 'base') setFontSizeState('sm');
  };

  const resetFontSize = () => setFontSizeState('base');

  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSizeState('base');
    else if (fontSize === 'base') setFontSizeState('lg');
  };

  const toggleHighContrast = () => setHighContrastState((prev) => !prev);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setLanguage = (lang: 'EN' | 'HI') => setLanguageState(lang);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        decreaseFontSize,
        resetFontSize,
        increaseFontSize,
        highContrast,
        toggleHighContrast,
        language,
        setLanguage,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
