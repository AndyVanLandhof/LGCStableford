import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Player, TeeBox } from '../types';

export const generatePDF = async (players: Player[], selectedTeeBox: TeeBox, gameDate?: string) => {
  try {
    console.log('Starting PDF generation...');
    
    // Find the scorecard content area
    const element = document.querySelector('.pdf-content') as HTMLElement;
    if (!element) {
      console.error('PDF content area (.pdf-content) not found');
      alert('Could not find scorecard content. Please make sure you are on the Full Scorecard page.');
      return;
    }

    console.log('Found PDF content element:', element);

    // Store original styles
    const originalStyle = element.style.cssText;
    const originalBodyOverflow = document.body.style.overflow;
    
    // Prepare element for capture
    element.style.position = 'relative';
    element.style.zIndex = '9999';
    element.style.backgroundColor = '#ffffff';
    element.style.minWidth = '800px';
    document.body.style.overflow = 'visible';

    // Wait for any layout changes
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Capturing canvas...');

    // Create canvas with optimized settings
    const canvas = await html2canvas(element, {
      scale: 2, // High DPI for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth || element.offsetWidth,
      height: element.scrollHeight || element.offsetHeight,
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
    element.style.cssText = originalStyle;
    document.body.style.overflow = originalBodyOverflow;

    console.log('Canvas created:', canvas.width, 'x', canvas.height);

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has no content - check if scorecard is visible');
    }

    // Create PDF in landscape format
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
    // Add margins
    const margin = 15;
    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);
    
    // Calculate scaling to fit within available space
    const scaleX = availableWidth / (canvas.width / 2); // Divide by 2 because of scale: 2
    const scaleY = availableHeight / (canvas.height / 2);
    const scale = Math.min(scaleX, scaleY);
    
    const imgWidth = (canvas.width / 2) * scale;
    const imgHeight = (canvas.height / 2) * scale;
    
    // Center the image
    const xOffset = margin + (availableWidth - imgWidth) / 2;
    const yOffset = margin + (availableHeight - imgHeight) / 2;

    console.log('Adding image to PDF...', { imgWidth, imgHeight, xOffset, yOffset });

    // Add page 1: Split content into two halves if very tall, else fit once
    pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'MEDIUM');

    // Add page 2 for rules/legend by re-capturing only the legend/summary section if present,
    // otherwise just duplicate a lighter footer section.
    const legendSection = document.querySelector('.pdf-page2') as HTMLElement;
    if (legendSection) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const legendCanvas = await html2canvas(legendSection, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const legendWidth = (legendCanvas.width / 2) * scale;
      const legendHeight = (legendCanvas.height / 2) * scale;
      const lx = margin + (availableWidth - legendWidth) / 2;
      const ly = margin + (availableHeight - legendHeight) / 2;
      pdf.addPage('a4', 'l');
      pdf.addImage(legendCanvas.toDataURL('image/png', 0.95), 'PNG', lx, ly, legendWidth, legendHeight, undefined, 'MEDIUM');
    } else {
      // Fallback: add a blank page with note
      pdf.addPage('a4', 'l');
      pdf.setFontSize(14);
      pdf.text('Notes and Rules', pdfWidth / 2, margin + 10, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Stableford Scoring and notes available in the app.', margin, margin + 20);
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