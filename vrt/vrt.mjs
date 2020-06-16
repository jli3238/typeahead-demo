/* eslint-env browser */
import { promises as fs } from 'fs';
import Server from 'webpack-dev-server';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import * as log from '../tools/log.mjs';

const isUpdate = process.argv.includes('--update');
const SCREENSHOTS_PATH = './vrt/screenshots';

const compiler = webpack({
  mode: 'development',
  entry: './vrt/main.tsx',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  plugins: [
    new MiniCssExtractPlugin({ ignoreOrder: true })
  ],
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader', // webpack's parser does not yet support ?. or ??
        options: { cacheDirectory: process.env.CI !== 'true' }
      }, {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          onlyCompileBundledFiles: true
        }
      }]
    }, {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader']
    }, {
      test: /\.less$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
    }]
  }
});

const server = new Server(compiler, {
  contentBase: './vrt',
  liveReload: false,
  noInfo: true,
  stats: {
    all: false,
    colors: true,
    errors: true,
    warnings: true,
    warningsFilter: /export .* was not found in/
  }
});

server.listen(8123, '127.0.0.1', takeScreenshots);

async function launchBrowser(attempts = 1) {
  try {
    return await puppeteer.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  } catch (err) {
    log.error(err);
    log.warn('Puppeteer failed to launch Chromium, trying again...');
    if (attempts >= 5) {
      process.exit(1);
    }
    return launchBrowser(attempts + 1);
  }
}

async function takeScreenshots() {
  const browser = await launchBrowser();
  const [page] = await browser.pages();
  page.on('console', msg => {
    const text = msg.text();
    // skip react devtools promotion
    if (!text.includes('react-devtools')) {
      log.info(text);
    }
  });
  await page.goto('http://localhost:8123/', { timeout: 0 });

  const elements = await page.$$('.capture-component');
  const results = [];
  const filenames = [];
  for (const el of elements) {
    const filename = await captureElement(page, el, results);
    if (filenames.includes(filename)) {
      log.error(`Duplicate filename: "${filename}". Please look for duplicate capture IDs.`);
      process.exit(1);
    }
    filenames.push(filename);
  }
  if (isUpdate) {
    log.info(`Saved ${filenames.length} screenshots`);
  } else {
    log.info(`Checked ${filenames.length} screenshots`);
    await generateReport(results);
  }

  browser.close();
  server.close();
  await checkOutdatedScreenshots(filenames);

  if (process.exitCode === 1) {
    log.error('Please run `npm run vru` to update the screenshots');
  }
  process.exit();
}

async function captureElement(page, element, results) {
  // element.hover() moves page.mouse to make hover happen,
  // we need to reset it at the start of every test,
  // otherwise the mouse would hover on other tests.
  await page.mouse.move(0, 0);

  const [
    name,
    focus,
    hover
  ] = await element.evaluate(el => {
    el.dispatchEvent(new CustomEvent('screenshot'));
    return [
      el.id,
      el.classList.contains('focus'),
      el.classList.contains('hover')
    ];
  });
  const filename = `${name}.png`;
  const path = `${SCREENSHOTS_PATH}/${filename}`;

  if (focus) {
    await element.evaluate(el => el.firstElementChild.focus());
  }
  if (hover) {
    const child = await element.$(':first-child');
    await child.hover();
  }

  if (isUpdate) {
    await element.screenshot({ path, omitBackground: true });
  } else {
    const [png1, png2] = await Promise.all([
      fs.readFile(path).catch(err => err),
      element.screenshot({ omitBackground: true })
    ]);
    if (png1 instanceof Error) {
      log.error(png1.message);
      process.exitCode = 1;
    } else {
      const diff = await comparePNGs(png1, png2);
      if (diff !== null) {
        results.push({ name, expected: png1, actual: png2, diff });
        log.error(`Screenshot mismatch found for test ${name}`);
        process.exitCode = 1;
      }
    }
  }
  // workaround for elements at the bottom of the page being cut off:
  await element.evaluate(el => el.dispatchEvent(new CustomEvent('remove')));
  return filename;
}

async function comparePNGs(png1, png2) {
  const [raw1, raw2] = await Promise.all([
    pngToRaw(png1),
    pngToRaw(png2)
  ]);
  if (raw1.data.equals(raw2.data)) {
    return null;
  }
  return generateDiff(raw1, raw2);
}

function pngToRaw(png) {
  return sharp(png).raw().toBuffer({ resolveWithObject: true });
}

function generateDiff(raw1, raw2) {
  const width = Math.max(raw1.info.width, raw2.info.width);
  const height = Math.max(raw1.info.height, raw2.info.height);
  const minWidth = Math.min(raw1.info.width, raw2.info.width);
  const minHeight = Math.min(raw1.info.height, raw2.info.height);
  const d1 = raw1.data;
  const d2 = raw2.data;
  const diff = Buffer.alloc(width * height * 3);
  const redPixel = Buffer.from([0xFF, 0, 0]);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const idx = (i + j * width) * 3;
      const idx1 = (i + j * raw1.info.width) * 4;
      const idx2 = (i + j * raw2.info.width) * 4;
      // boundary check || rgba check
      if (j + 1 > minHeight
        || i + 1 > minWidth
        || d1[idx1] !== d2[idx2]
        || d1[idx1 + 1] !== d2[idx2 + 1]
        || d1[idx1 + 2] !== d2[idx2 + 2]
        || d1[idx1 + 3] !== d2[idx2 + 3]) {
        redPixel.copy(diff, idx);
      }
    }
  }

  return sharp(diff, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

async function generateReport(results) {
  if (results.length === 0) {
    return;
  }

  await fs.mkdir('./vrt/report', { recursive: true });
  const writePromises = [];
  const rows = [];

  for (const { name, expected, actual, diff } of results) {
    writePromises.push(
      fs.writeFile(`./vrt/report/${name}-expected.png`, expected),
      fs.writeFile(`./vrt/report/${name}-actual.png`, actual),
      fs.writeFile(`./vrt/report/${name}-diff.png`, diff)
    );
    rows.push(`
      <tr>
        <th>${name}</th>
        <th><img src="./${name}-expected.png"></th>
        <th><img src="./${name}-actual.png"></th>
        <th><img src="./${name}-diff.png"></th>
      </tr>
    `);
  }

  const html = `<!doctype html>
  <meta charset="utf-8">
  <table>
    <thead>
      <tr>
        <th>Test name</th>
        <th>Expected</th>
        <th>Actual</th>
        <th>Diff</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
    </tbody>
  </table>`;

  writePromises.push(
    fs.writeFile('./vrt/report/index.html', html)
  );
  await Promise.all(writePromises);
}

async function checkOutdatedScreenshots(savedFilenames) {
  // Delete outdated screenshots
  const entries = await fs.readdir(SCREENSHOTS_PATH);
  let deletedCount = 0;
  for (const entry of entries) {
    if (!savedFilenames.includes(entry)) {
      if (isUpdate) {
        await fs.unlink(`${SCREENSHOTS_PATH}/${entry}`);
      }
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    if (isUpdate) {
      log.info(`Deleted ${deletedCount} outdated screenshots`);
    } else {
      log.error(`Found ${deletedCount} outdated screenshots`);
      process.exitCode = 1;
    }
  }
}
