import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
  uploadedImage: UploadedImage | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64String = dataUrl.split(',')[1];
      
      const img = new Image();
      img.onload = () => {
        onImageUpload({
          base64: base64String,
          mimeType: file.type,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          width: img.width,
          height: img.height,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };


  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="relative border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400 transition-colors duration-300 bg-slate-800/50"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {uploadedImage ? (
          <div className="relative group">
             <img
              src={uploadedImage.previewUrl}
              alt="Uploaded Preview"
              className="max-h-64 w-auto mx-auto rounded-lg object-contain"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <span className="text-white font-semibold">Click to change image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-700 rounded-full">
                <UploadIcon className="w-6 h-6 text-slate-300"/>
            </div>
            <p className="font-semibold text-slate-300">
              <span className="text-cyan-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">PNG, JPG or WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;