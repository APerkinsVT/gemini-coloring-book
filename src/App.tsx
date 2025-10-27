import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { ColorInfo, UploadedImage, ColoringPageResult } from './types';
import { extractPalette, generateLineDrawing, generateColoringInstructions } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import ColorTable from './components/ColorTable';
import ColoringInstructions from './components/ColoringInstructions';
import DownloadIcon from './components/icons/DownloadIcon';


const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [colorData, setColorData] = useState<ColorInfo[]>([]);
  const [coloringPageResult, setColoringPageResult] = useState<ColoringPageResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');


  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
    setOrientation(image.width > image.height ? 'landscape' : 'portrait');
    setColorData([]);
    setError(null);
    setColoringPageResult(null);
  };

  const handleGenerateClick = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setColorData([]);
    setColoringPageResult(null);

    try {
      // Step 1: Start palette extraction and line drawing generation in parallel.
      // These two tasks are independent and can run at the same time.
      const palettePromise = extractPalette(uploadedImage.base64, uploadedImage.mimeType);
      const lineDrawingPromise = generateLineDrawing(uploadedImage.base64, uploadedImage.mimeType);

      // Await the palette results first. We need them to generate instructions,
      // and this allows us to show the color table to the user while other parts are still loading.
      const paletteResults = await palettePromise;
      
      if (!paletteResults || paletteResults.length === 0) {
        throw new Error("Could not extract a color palette. Please try a different image.");
      }
      setColorData(paletteResults);

      // Step 2: Now that we have the palette, start generating the instructions.
      // This can run concurrently with the line drawing generation if it's still running.
      const instructionsPromise = generateColoringInstructions(uploadedImage.base64, uploadedImage.mimeType, paletteResults);

      // Step 3: Wait for the remaining two promises (line drawing and instructions) to complete.
      const [imageUrl, instructions] = await Promise.all([
        lineDrawingPromise,
        instructionsPromise,
      ]);
      
      if (!imageUrl || !instructions) {
        throw new Error("Failed to generate either the image or the instructions.");
      }
      
      setColoringPageResult({ imageUrl, instructions });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toTitleCase = (str: string): string => {
    if (!str) return '';
    const baseName = str.split('.').slice(0, -1).join('.') || str;
    return baseName
      .replace(/[-_]/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pictureTitle = uploadedImage ? toTitleCase(uploadedImage.name) : 'Your Coloring Page';
  
  const handleDownloadPdf = async () => {
    if (!coloringPageResult || !uploadedImage) {
        setError("Cannot download PDF: Missing content.");
        return;
    }

    setIsDownloading(true);
    setError(null);
    try {
        const isLandscape = orientation === 'landscape';

        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'in',
            format: 'letter'
        });

        const pageW = isLandscape ? 11 : 8.5;
        const pageH = isLandscape ? 8.5 : 11;
        const margin = 0.5;
        const contentW = pageW - margin * 2;
        
        // --- PAGE 1: DRAWING + TITLE ---
        const coloringImg = new Image();
        coloringImg.crossOrigin = "anonymous";
        coloringImg.src = coloringPageResult.imageUrl;
        await new Promise((resolve, reject) => {
            coloringImg.onload = resolve;
            coloringImg.onerror = reject;
        });

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text(pictureTitle, pageW / 2, margin + 0.3, { align: 'center' });

        const imageStartY = margin + 0.6;
        const imageContentH = pageH - imageStartY - margin;

        const imgAspectRatio = coloringImg.width / coloringImg.height;
        let finalW, finalH;

        if (imgAspectRatio > (contentW / imageContentH)) {
            finalW = contentW;
            finalH = finalW / imgAspectRatio;
        } else {
            finalH = imageContentH;
            finalW = finalH * imgAspectRatio;
        }

        const x = margin + (contentW - finalW) / 2;
        const y = imageStartY + (imageContentH - finalH) / 2;
        pdf.addImage(coloringImg, 'PNG', x, y, finalW, finalH);


        // --- PAGE 2: ORIGINAL IMAGE + GUIDE ---
        pdf.addPage();
        let currentY = margin;

        // Add Original Image
        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = uploadedImage.previewUrl;
        await new Promise((resolve, reject) => {
            originalImg.onload = resolve;
            originalImg.onerror = reject;
        });

        const maxDim = 3; // 3 inches for the longer side
        const origAspectRatio = originalImg.width / originalImg.height;
        let finalOrigW, finalOrigH;
        if (origAspectRatio >= 1) { // Landscape or square
            finalOrigW = maxDim;
            finalOrigH = finalOrigW / origAspectRatio;
        } else { // Portrait
            finalOrigH = maxDim;
            finalOrigW = finalOrigH * origAspectRatio;
        }
        const xOrig = margin + (contentW - finalOrigW) / 2;
        pdf.addImage(originalImg, 'PNG', xOrig, currentY, finalOrigW, finalOrigH);
        currentY += finalOrigH + 0.3;

        // Add Coloring Guide Text
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text("Coloring Guide", pageW / 2, currentY, { align: 'center' });
        currentY += 0.5;

        pdf.setFontSize(11);
        
        const lines = coloringPageResult.instructions.split('\n').filter(line => line.trim() !== '');
        const lineHeight = 0.25;
        const bulletIndent = 0.2;

        lines.forEach(line => {
          if (currentY > pageH - margin) {
            pdf.addPage();
            currentY = margin;
          }

          const isListItem = /^\s*[-*]/.test(line);
          const cleanLine = line.replace(/^\s*[-*]\s*/, '');
          
          let currentX = margin;
          
          if (isListItem) {
            pdf.setFont(undefined, 'bold');
            pdf.text('•', currentX, currentY);
            currentX += bulletIndent;
          }

          const parts = cleanLine.split(/(\*\*.*?\*\*)/g).filter(p => p);
          
          parts.forEach(part => {
            const isBold = part.startsWith('**') && part.endsWith('**');
            const text = isBold ? part.slice(2, -2) : part;
            
            pdf.setFont(undefined, isBold ? 'bold' : 'normal');
            
            const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
            if (currentX + textWidth > pageW - margin) {
                currentY += lineHeight;
                currentX = margin + (isListItem ? bulletIndent : 0);
            }
            pdf.text(text, currentX, currentY);
            currentX += textWidth;
          });
          currentY += lineHeight;
        });


        // --- PAGE 3: KEY ---
        pdf.addPage();
        currentY = margin;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text("Color Key", pageW / 2, currentY, { align: 'center' });
        currentY += 0.5;

        const tableHeaders = ["Swatch", "Hex", "Picture Part", "Faber-Castell Color", "FB #"];
        const columnWidths = [0.7, 1.0, 1.8, isLandscape ? 5.8 : 3.3, 0.7];
        const rowHeight = 0.4;
        const headerHeight = 0.3;

        const drawTableHeaders = (yPos: number) => {
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            let xPos = margin;
            tableHeaders.forEach((header, i) => {
                pdf.text(header, xPos, yPos);
                xPos += columnWidths[i];
            });
        };

        const drawTableRow = (color: ColorInfo, yPos: number) => {
             pdf.setFontSize(9);
             pdf.setFont(undefined, 'normal');
             let xPos = margin;
             
             pdf.setFillColor(color.hex.replace('#', ''));
             pdf.rect(xPos + 0.05, yPos - 0.2, 0.25, 0.25, 'F');
             xPos += columnWidths[0];
             
             pdf.text(color.hex, xPos, yPos);
             xPos += columnWidths[1];
             pdf.text(color.picturePart, xPos, yPos);
             xPos += columnWidths[2];
             pdf.text(color.fbPencilColor, xPos, yPos);
             xPos += columnWidths[3];
             pdf.text(color.fbNumber, xPos + 0.5, yPos, {align: 'center'});
        };

        drawTableHeaders(currentY);
        currentY += headerHeight;

        for (const color of colorData) {
            if (currentY + rowHeight > pageH - margin) {
                pdf.addPage();
                currentY = margin;
                drawTableHeaders(currentY);
                currentY += headerHeight;
            }
            drawTableRow(color, currentY);
            currentY += rowHeight;
        }

        pdf.save(`${pictureTitle.replace(/\s/g, '_')}_Coloring_Page.pdf`);

    } catch (e) {
        console.error("Failed to generate PDF", e);
        setError("Could not generate the PDF. The image might be protected by CORS policy. Please try a different image.");
    } finally {
        setIsDownloading(false);
    }
};

  const ResultsDisplay = () => (
     <>
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-200">{pictureTitle}</h2>
      </div>
      
      <div className={`mt-6 ${orientation === 'portrait' ? 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start' : 'flex flex-col items-center gap-8'}`}>
          <div className="w-full">
              <img src={coloringPageResult!.imageUrl} alt="Generated coloring page drawing" className="rounded-lg shadow-lg border border-slate-700 w-full" />
          </div>
          <div className={`w-full ${orientation === 'landscape' ? 'max-w-4xl' : ''}`}>
              <div className="bg-slate-900 p-1 mb-8">
                <h2 className="text-2xl font-bold text-slate-300 mb-4 text-center">Original Photo</h2>
                <img src={uploadedImage!.previewUrl} alt="Original uploaded photo" className="rounded-lg shadow-lg border border-slate-700 w-full max-w-sm mx-auto" />
              </div>
              <div className="bg-slate-900 p-1">
                <h2 className="text-2xl font-bold text-slate-300 mb-4 text-center">Coloring Guide</h2>
                <ColoringInstructions instructions={coloringPageResult!.instructions} />
              </div>
              <div className="bg-slate-900 p-1">
                <ColorTable colors={colorData} />
              </div>
          </div>
      </div>

      <div className="text-center mt-8">
          <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <DownloadIcon className="w-5 h-5"/>
              {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        
        <main className="mt-8 flex flex-col items-center space-y-6">
          <ImageUploader onImageUpload={handleImageUpload} uploadedImage={uploadedImage} />

          <button
            onClick={handleGenerateClick}
            disabled={!uploadedImage || isLoading}
            className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg shadow-lg hover:from-cyan-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
          >
            {isLoading ? 'Generating...' : 'Create Coloring Page'}
          </button>

          <div className="w-full mt-8">
            {isLoading && <Loader />}
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {coloringPageResult && colorData.length > 0 && <ResultsDisplay />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;