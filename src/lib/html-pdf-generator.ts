import * as puppeteer from 'puppeteer';
import { app } from 'electron';
import path from 'path';

export class HtmlPdfGenerator {    private static readonly PDF_OPTIONS: puppeteer.PDFOptions = {
        format: 'a4' as puppeteer.PaperFormat,
        landscape: true,
        printBackground: true,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    };

    /**
     * Generiert ein PDF aus der aktuellen Garten-Ansicht
     * @param htmlContent Der HTML-Content der gerendert werden soll
     * @param outputPath Der Pfad wo das PDF gespeichert werden soll
     */
    public static async generatePdf(htmlContent: string, outputPath: string): Promise<void> {
        try {
            // Erstelle einen neuen Browser-Context
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox']
            });

            const page = await browser.newPage();
            
            // Setze die Viewport-Größe auf A4 Querformat (297mm x 210mm)
            await page.setViewport({
                width: 1684,  // ~297mm bei 144dpi
                height: 1190  // ~210mm bei 144dpi
            });

            // Injiziere die Tailwind Styles
            const tailwindPath = path.join(app.getAppPath(), 'src', 'app', 'globals.css');
            await page.addStyleTag({ path: tailwindPath });

            // Setze den HTML-Content
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0'
            });

            // Generiere das PDF
            await page.pdf({
                ...HtmlPdfGenerator.PDF_OPTIONS,
                path: outputPath
            });

            await browser.close();
        } catch (error) {
            console.error('Fehler beim PDF Export:', error);
            throw error;
        }
    }
}
