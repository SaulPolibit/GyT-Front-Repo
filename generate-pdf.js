const { chromium } = require('playwright');
const path = require('path');

async function generatePDF() {
  console.log('Starting PDF generation...');

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Load the HTML file
  const htmlPath = path.join(__dirname, 'polibit-sales-deck-standalone.html');
  await page.goto(`file://${htmlPath}`);

  // Wait for the page to load
  await page.waitForTimeout(1000);

  const totalSlides = 17;
  const screenshots = [];

  // Take screenshot of each slide
  for (let i = 0; i < totalSlides; i++) {
    console.log(`Capturing slide ${i + 1}/${totalSlides}...`);

    // Take screenshot of the current slide
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'png'
    });
    screenshots.push(screenshotBuffer);

    // Click next button if not on last slide
    if (i < totalSlides - 1) {
      await page.click('#next-btn');
      await page.waitForTimeout(500); // Wait for transition
    }
  }

  console.log('All screenshots captured. Creating PDF...');

  // Create a new page for PDF generation
  const pdfPage = await context.newPage();

  // Create HTML content with all screenshots
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        .slide-image {
          width: 100%;
          height: 100vh;
          object-fit: contain;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .slide-image:last-child {
          page-break-after: auto;
        }
      </style>
    </head>
    <body>
  `;

  screenshots.forEach((screenshot, index) => {
    const base64Image = screenshot.toString('base64');
    htmlContent += `<img src="data:image/png;base64,${base64Image}" class="slide-image" />\n`;
  });

  htmlContent += `
    </body>
    </html>
  `;

  // Set content and generate PDF
  await pdfPage.setContent(htmlContent);
  await pdfPage.waitForTimeout(1000);

  const pdfPath = path.join(__dirname, 'polibit-sales-deck.pdf');
  await pdfPage.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  console.log(`PDF generated successfully: ${pdfPath}`);

  await browser.close();
}

generatePDF().catch(console.error);
