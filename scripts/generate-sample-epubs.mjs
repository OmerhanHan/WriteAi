/**
 * Builds minimal EPUB 3 files into public/epubs for local preview.
 * Run: node scripts/generate-sample-epubs.mjs
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'epubs')
const tmpRoot = join(root, '.tmp-epubs')

const books = [
  {
    id: 'city-life',
    title: 'City Life',
    author: 'Writer App',
    body: `
      <h1>City Life</h1>
      <p>Living in a big city can be exciting. There are shops, parks, museums, and people from many places.</p>
      <p>However, cities can also be noisy and expensive. Some people prefer quiet towns. Others love the energy of city streets.</p>
      <p>What do you like most about the place where you live?</p>
    `,
  },
  {
    id: 'morning-routines',
    title: 'Morning Routines',
    author: 'Writer App',
    body: `
      <h1>Morning Routines</h1>
      <p>Some people wake up early and go for a run. Others drink coffee and read the news.</p>
      <p>A good morning routine can make the whole day feel calmer. Try waking up ten minutes earlier and writing three things you want to do.</p>
    `,
  },
  {
    id: 'travel-notes',
    title: 'Travel Notes',
    author: 'Writer App',
    body: `
      <h1>Travel Notes</h1>
      <p>Last summer I visited a coastal town. The market smelled of spices and fresh bread.</p>
      <p>I learned a few words of the local language and got lost twice — both times I found a friendly café.</p>
      <p>Travel is not only about places. It is about noticing small details.</p>
    `,
  },
  {
    id: 'academic-pack',
    title: 'Academic Pack',
    author: 'Writer App',
    body: `
      <h1>Urban Green Spaces</h1>
      <p>Researchers argue that parks and trees improve public health in dense cities. Access to green space is linked with lower stress and higher physical activity.</p>
      <p>However, unequal distribution remains a concern. Neighbourhoods with lower average incomes often have fewer well-maintained parks.</p>
      <p>Policy makers therefore face a dual challenge: expand green coverage and ensure fair access across districts.</p>
    `,
  },
  {
    id: 'true-false',
    title: 'True / False Practice',
    author: 'Writer App',
    body: `
      <h1>Bees and Cities</h1>
      <p>Urban beekeeping has grown in recent years. Some cities now host hives on rooftops.</p>
      <p>Scientists note that city bees sometimes find more flowers than bees in intensive farmland. Still, pollution and pesticides remain risks.</p>
      <p><em>Practice:</em> Decide whether statements about this passage are True, False, or Not Given.</p>
    `,
  },
  {
    id: 'matching-heads',
    title: 'Matching Headings',
    author: 'Writer App',
    body: `
      <h1>Paragraph Themes</h1>
      <p><strong>A.</strong> Libraries are changing. Many now offer digital loans and community workshops.</p>
      <p><strong>B.</strong> Reading on screens is popular, yet paper books remain preferred for deep focus by many learners.</p>
      <p><strong>C.</strong> Teachers often combine both formats to build flexible reading habits.</p>
    `,
  },
  {
    id: 'old-library',
    title: 'The Old Library',
    author: 'Writer App',
    body: `
      <h1>The Old Library</h1>
      <p>Behind the town square stood a library nobody visited. Dust danced in the afternoon light.</p>
      <p>One day, Mira found a key under a loose floorboard. The key opened a room of maps — and a story waiting to be finished.</p>
    `,
  },
  {
    id: 'lost-letter',
    title: 'Lost Letter',
    author: 'Writer App',
    body: `
      <h1>Lost Letter</h1>
      <p>The envelope had no return address. Inside was a single page: “Meet me where the river bends, at dusk.”</p>
      <p>Tom almost threw it away. Then he noticed the date — written tomorrow.</p>
    `,
  },
]

function containerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
}

function contentOpf(book) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:writer-app:${book.id}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-03-22T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
  </spine>
</package>`
}

function navXhtml(book) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>Nav</title></head>
<body>
  <nav epub:type="toc"><ol><li><a href="chapter.xhtml">${escapeXml(book.title)}</a></li></ol></nav>
</body>
</html>`
}

function chapterXhtml(book) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; padding: 1.2em; color: #2C2416; }
    h1 { font-size: 1.6em; margin-bottom: 0.8em; }
    p { margin: 0.8em 0; }
  </style>
</head>
<body>
${book.body}
</body>
</html>`
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEpub(book) {
  const dir = join(tmpRoot, book.id)
  mkdirSync(join(dir, 'META-INF'), { recursive: true })
  mkdirSync(join(dir, 'EPUB'), { recursive: true })
  writeFileSync(join(dir, 'mimetype'), 'application/epub+zip')
  writeFileSync(join(dir, 'META-INF', 'container.xml'), containerXml())
  writeFileSync(join(dir, 'EPUB', 'content.opf'), contentOpf(book))
  writeFileSync(join(dir, 'EPUB', 'nav.xhtml'), navXhtml(book))
  writeFileSync(join(dir, 'EPUB', 'chapter.xhtml'), chapterXhtml(book))

  const out = join(outDir, `${book.id}.epub`)
  // mimetype must be first and stored (no compression) for strict EPUB validators
  execFileSync('zip', ['-X0', out, 'mimetype'], { cwd: dir })
  execFileSync('zip', ['-Xr9D', out, 'META-INF', 'EPUB'], { cwd: dir })
  console.log('wrote', out)
}

mkdirSync(outDir, { recursive: true })
if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true })
mkdirSync(tmpRoot, { recursive: true })

for (const book of books) buildEpub(book)

rmSync(tmpRoot, { recursive: true, force: true })
console.log('Done:', books.length, 'epubs in public/epubs')
