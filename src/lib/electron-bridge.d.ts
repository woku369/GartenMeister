import { BaseBed, HerbVariety, KombinationsbeetSegment } from "./definitions";

export interface GardenExportData {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
}

export interface ExportPDFResult {
  success: boolean;
  message: string;
  filePath?: string;
}

export interface ElectronBridge {
  openExportFolder(): Promise<void>;
  getAppPath(): Promise<string>;
  getUserDataPath(): Promise<string>;
  exportPDF(data: GardenExportData): Promise<ExportPDFResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}
