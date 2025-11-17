const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');

async function generatePPTX() {
  console.log('Starting PPTX generation...');

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
  const tempDir = path.join(__dirname, 'temp-slides');

  // Create temp directory for screenshots
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Take screenshot of each slide
  for (let i = 0; i < totalSlides; i++) {
    console.log(`Capturing slide ${i + 1}/${totalSlides}...`);

    // Take screenshot of the current slide
    const screenshotPath = path.join(tempDir, `slide-${i + 1}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });

    // Click next button if not on last slide
    if (i < totalSlides - 1) {
      await page.click('#next-btn');
      await page.waitForTimeout(500); // Wait for transition
    }
  }

  await browser.close();

  console.log('All screenshots captured. Creating PPTX...');

  // Create PowerPoint presentation
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.author = 'Polibit';
  pptx.company = 'Polibit';
  pptx.title = 'Polibit Sales Deck';
  pptx.subject = 'Investment Management Platform';

  // Define slide layout (16:9 aspect ratio)
  pptx.layout = 'LAYOUT_16x9';

  // Add each screenshot as a slide
  for (let i = 0; i < totalSlides; i++) {
    console.log(`Adding slide ${i + 1}/${totalSlides} to PPTX...`);

    const slide = pptx.addSlide();
    const imagePath = path.join(tempDir, `slide-${i + 1}.png`);

    // Add image to fill the entire slide
    slide.addImage({
      path: imagePath,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%'
    });
  }

  // Save the presentation
  const outputPath = path.join(__dirname, 'polibit-sales-deck.pptx');
  await pptx.writeFile({ fileName: outputPath });

  console.log(`PPTX generated successfully: ${outputPath}`);

  // Clean up temp directory
  console.log('Cleaning up temporary files...');
  fs.readdirSync(tempDir).forEach(file => {
    fs.unlinkSync(path.join(tempDir, file));
  });
  fs.rmdirSync(tempDir);

  console.log('Done!');
}

generatePPTX().catch(console.error);
