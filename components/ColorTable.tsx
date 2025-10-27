import React from 'react';
import { ColorInfo } from '../types';

interface ColorTableProps {
  colors: ColorInfo[];
}

const ColorTable: React.FC<ColorTableProps> = ({ colors }) => {
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: show a toast notification
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };
  
  return (
    <div className="w-full mt-8 overflow-hidden rounded-lg shadow-lg bg-slate-800 border border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
            <tr>
              <th scope="col" className="px-4 py-3">
                Swatch
              </th>
              <th scope="col" className="px-4 py-3">
                Hex
              </th>
              <th scope="col" className="px-4 py-3">
                Picture Part
              </th>
              <th scope="col" className="px-4 py-3">
                FB Pencil Color
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                FB #
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color, index) => (
              <tr key={`${color.number}-${index}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-200">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-md border border-slate-600" style={{ backgroundColor: color.hex }}></div>
                </td>
                <td className="px-4 py-3 font-mono">
                   <button 
                     onClick={() => copyToClipboard(color.hex)} 
                     className="hover:text-cyan-400 transition-colors"
                     title={`Copy ${color.hex}`}
                   >
                     {color.hex}
                   </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{color.picturePart}</td>
                <td className="px-4 py-3 whitespace-nowrap">{color.fbPencilColor}</td>
                <td className="px-4 py-3 text-center font-semibold">{color.fbNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColorTable;
