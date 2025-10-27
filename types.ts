export interface ColorInfo {
  number: string;
  picturePart: string;
  hex: string;
  fbPencilColor: string;
  fbNumber: string;
}

export interface UploadedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
  name: string;
  width: number;
  height: number;
}

export interface ColoringPageResult {
  imageUrl: string;
  instructions: string;
}