// Minimal type declaration for the BarcodeDetector Web API
// https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector

interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(image: ImageBitmapSource | HTMLVideoElement): Promise<DetectedBarcode[]>;
  static getSupportedFormats(): Promise<string[]>;
}
