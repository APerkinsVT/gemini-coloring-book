import React from 'react';

interface ColoringInstructionsProps {
  instructions: string;
}

const ColoringInstructions: React.FC<ColoringInstructionsProps> = ({ instructions }) => {
  // Split instructions and filter out empty lines
  const lines = instructions.split('\n').filter(line => line.trim() !== '');

  // Assume the first line is an intro if it doesn't start with a list marker
  const intro = lines.length > 0 && !/^\s*[-*]/.test(lines[0]) ? lines.shift() : null;

  return (
    <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 shadow-inner">
      <div className="text-slate-300">
        {intro && <p className="leading-relaxed mb-4">{intro}</p>}
        <ul className="space-y-3 list-disc list-inside">
          {lines.map((line, index) => {
            // Remove leading list markers for clean rendering within the <li>
            const cleanLine = line.replace(/^\s*[-*]\s*/, '');
            // Simple bolding for text between asterisks, e.g., *Orchid Petals:*
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            return (
              <li key={index} className="leading-relaxed">
                {parts.map((part, i) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                  ) : (
                    part
                  )
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ColoringInstructions;