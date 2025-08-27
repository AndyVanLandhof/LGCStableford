import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Player, TeeBox } from '../types';

export const generatePDF = async (players: Player[], selectedTeeBox: TeeBox, gameDate?: string) => {
  try {
    console.log('Starting PDF generation...');
    
    // Find specific sections to render as separate PDF pages
    const page1El = document.querySelector('.pdf-page1') as HTMLElement;
    const frontEl = document.querySelector('.pdf-front9') as HTMLElement;
    const backEl = document.querySelector('.pdf-back9') as HTMLElement;
    if (!page1El) {
      console.error('PDF page 1 element (.pdf-page1) not found');
      alert('Could not find PDF sections. Please open the Full Scorecard page.');
      return;
    }

    // Store original styles
    const originalStyle = page1El.style.cssText;
    const originalBodyOverflow = document.body.style.overflow;
    
    // Prepare element for capture
    page1El.style.position = 'relative';
    page1El.style.zIndex = '9999';
    page1El.style.backgroundColor = '#ffffff';
    page1El.style.minWidth = '800px';
    document.body.style.overflow = 'visible';

    // Wait for any layout changes
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Capturing canvas...');

    // Create canvas with optimized settings
    const page1Canvas = await html2canvas(page1El, {
      scale: 2, // High DPI for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: page1El.scrollWidth || page1El.offsetWidth,
      height: page1El.scrollHeight || page1El.offsetHeight,
      logging: true, // Enable logging to debug
      foreignObjectRendering: true,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: (element) => {
        // Skip problematic elements
        return element.classList?.contains('no-print') || 
               element.tagName === 'SCRIPT' || 
               element.tagName === 'STYLE' ||
               element.classList?.contains('sticky') ||
               element.style?.position === 'fixed';
      }
    });

    // Restore original styles
    page1El.style.cssText = originalStyle;
    document.body.style.overflow = originalBodyOverflow;

    console.log('Page1 canvas created:', page1Canvas.width, 'x', page1Canvas.height);

    if (page1Canvas.width === 0 || page1Canvas.height === 0) {
      throw new Error('Canvas has no content - check if scorecard is visible');
    }

    // Create PDF in portrait format with 3 pages:
    // Page 1: Leaderboard + 18-hole summary + club info (from .pdf-page1)
    // Page 2: Front 9 table (from .pdf-front9)
    // Page 3: Back 9 table (from .pdf-back9)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
    // Add margins
    const margin = 15;
    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);
    
    // Helper to add a canvas as a PDF page (or the first page)
    const addCanvasAsPage = (canvas: HTMLCanvasElement, isFirstPage = false) => {
      const scaleX = availableWidth / (canvas.width / 2);
      const scaleY = availableHeight / (canvas.height / 2);
      const scale = Math.min(scaleX, scaleY);
      const imgWidth = (canvas.width / 2) * scale;
      const imgHeight = (canvas.height / 2) * scale;
      const xOffset = margin + (availableWidth - imgWidth) / 2;
      const yOffset = margin + (availableHeight - imgHeight) / 2;
      if (!isFirstPage) {
        pdf.addPage('a4', 'p');
      }
      pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'MEDIUM');
    };

    // Page 1: .pdf-page1 container
    addCanvasAsPage(page1Canvas, true);

    // Page 2: Front 9 section
    if (frontEl) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const frontCanvas = await html2canvas(frontEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      addCanvasAsPage(frontCanvas);
    }

    // Page 3: Back 9 section
    if (backEl) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const backCanvas = await html2canvas(backEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      addCanvasAsPage(backCanvas);
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const playerNames = players.map(p => p.name.replace(/\s+/g, '_')).join('-');
    const filename = `Liphook-Scorecard-${selectedTeeBox.name}-${date}-${playerNames}.pdf`;

    console.log('Saving PDF:', filename);

    // Save the PDF
    pdf.save(filename);
    
    console.log('PDF generation completed successfully');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};