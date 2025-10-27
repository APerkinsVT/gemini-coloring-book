
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">
        Gemini Color by Number Generator
      </h1>
      <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
        Turn any photo into a relaxing color-by-number activity. Upload an image and let Gemini create a numbered line drawing and a matching color palette.
      </p>
    </header>
  );
};

export default Header;