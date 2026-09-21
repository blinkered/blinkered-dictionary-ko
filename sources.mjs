/**
 * The collections that attest Korean, and where each comes from.
 *
 * The only language-specific file in this repository. How to read a collection lives in
 * `@blinkered/attestation`; what lives here is which collections, and why those.
 *
 * Chosen for **family** as much as for volume. Three collections gathered by one organization
 * are one opinion, so what matters is how many genuinely separate gatherers a word can be found
 * by: a wiki, a newspaper crawler, a shelf of books, a sentence bank, a translation, the crawled
 * web, and any site we fetch ourselves.
 */

import { createReadStream, existsSync, readFileSync, readdirSync } from 'node:fs'
import { createInterface } from 'node:readline'
import {
  fileDocuments,
  fineweb2Documents,
  gutenbergBody,
  harvestDocuments,
  leipzigLocators,
  leipzigSentences,
  tatoebaDocuments,
  verseDocuments,
  wikiDocuments,
} from '@blinkered/attestation'

export const LANGUAGE = 'ko'

const CACHE = new URL('.cache/raw/', import.meta.url).pathname

/** A Leipzig package, with its sentence-to-URL index resolved up front. */
function leipzig(pkg) {
  const base = `${CACHE}${pkg}/${pkg}`
  const locators = leipzigLocators(
    readFileSync(`${base}-inv_so.txt`, 'utf8'),
    readFileSync(`${base}-sources.txt`, 'utf8'),
  )
  const lines = createInterface({
    input: createReadStream(`${base}-sentences.txt`),
    crlfDelay: Infinity,
  })
  return leipzigSentences(lines, locators)
}

/** A directory of Gutenberg texts, each named by its permanent ebook number. */
function gutenberg(dir) {
  const at = `${CACHE}${dir}`
  const books = readdirSync(at)
    .filter((file) => file.endsWith('.txt'))
    .map((file) => ({ locator: file.replace('.txt', ''), path: `${at}/${file}` }))
  return fileDocuments(books, async (path) => gutenbergBody(readFileSync(path, 'utf8')))
}

export const SOURCES = [
  {
    id: 'wiki:ko',
    what: 'Korean Wikipedia — modern encyclopedic prose',
    needs: `${CACHE}kowiki.xml.bz2`,
    documents: () => wikiDocuments(`${CACHE}kowiki.xml.bz2`),
  },
  {
    id: 'wikisource:ko',
    what: 'Wikisource — same Wikimedia family, so it corroborates rather than counts',
    needs: `${CACHE}kowikisource.xml.bz2`,
    documents: () => wikiDocuments(`${CACHE}kowikisource.xml.bz2`),
  },
  {
    id: 'tat',
    from: 'https://downloads.tatoeba.org/exports/per_language/kor/kor_sentences.tsv.bz2',
    what: 'Tatoeba — contemporary, conversational',
    needs: `${CACHE}kor_sentences.tsv`,
    documents: () => tatoebaDocuments(`${CACHE}kor_sentences.tsv`),
  },
  {
    id: 'fw2',
    // Where it came from, so a half-finished download is caught before it is read.
    from: 'https://huggingface.co/datasets/HuggingFaceFW/fineweb-2/resolve/main/data/kor_Hang/train/000_00000.parquet',
    what: 'FineWeb-2 — the crawled web, each document citing its own URL',
    needs: `${CACHE}fineweb2-kor.parquet`,
    documents: () => fineweb2Documents(`${CACHE}fineweb2-kor.parquet`),
  },
  {
    id: 'ia',
    // Scanned books are OCR, and OCR fails in a way that looks like text. Clean Gutenberg scores
    // a median 52% known words and never below 36%; the worst of these scored 1%, an English
    // book read as Cyrillic. Below this floor a book is not legible enough to attest anything.
    legible: 0.35,
    what: 'Internet Archive korean books — literature, and the register a newspaper never reaches',
    needs: `${CACHE}archive-ko`,
    // Not `booksbylanguage_korean`, which holds 441 items. Searching the language field
    // reaches 30,839, and that is what was actually fetched.
    from: 'https://archive.org/search?query=mediatype%3Atexts+AND+language%3A%22kor%22',
    documents: () => {
      const dir = `${CACHE}archive-ko`
      // A locator names the text, not the item: the catalogue page holds no word of the book.
      // `files.tsv` maps an item to the file we read; a book with no recorded name is skipped
      // rather than cited at a page that cannot support it.
      const named = new Map(
        readFileSync(`${dir}/files.tsv`, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => line.split('\t')),
      )
      const books = readdirSync(dir)
        .filter((file) => file.endsWith('.txt'))
        .map((file) => file.replace('.txt', ''))
        .filter((id) => named.has(id))
        // The filename is percent-encoded: two thirds of them contain spaces, and a locator with
        // a space in it would split into two locators, because the evidence format spends spaces
        // as separators. Encoding is also what the URL needs.
        .map((id) => ({
          locator: `${id}/${encodeURIComponent(named.get(id))}`,
          path: `${dir}/${id}.txt`,
        }))
      return fileDocuments(books, async (path) => readFileSync(path, 'utf8'))
    },
  },
].filter((source) => {
  // A collection that has not been downloaded is skipped with a warning rather than crashing
  // the build, and which collections a language actually has is a fact worth seeing in the log.
  // Checked by path rather than by calling `documents()`: these are lazy generators, so calling
  // one proves nothing and calling it twice would open the file twice.
  if (existsSync(source.needs)) return true
  process.stderr.write(`  (skipping ${source.id}: ${source.needs} is not in .cache/raw)\n`)
  return false
})

/**
 * Pages fetched by searching for words the collections missed, one family per domain.
 *
 * Absent until a harvest has been run; see the repository README.
 */
export const HARVEST = existsSync(new URL('searched.tsv', import.meta.url).pathname)
  ? () => harvestDocuments(new URL('searched.tsv', import.meta.url).pathname)
  : undefined

/**
 * Korean publishers, each of which is its own family.
 *
 * This list is why Korean is shippable at all. Its ready-made corpora amount to three families —
 * a Wikipedia, a web crawl, and a sentence bank of sixty-five thousand tokens — so every word
 * needed all three, and the sentence bank knew 2,613 of the language's 38,467. Adding newspapers,
 * broadcasters, a wire service and a government portal turns that into any three of twenty-odd,
 * and the ceiling stops being Tatoeba.
 *
 * Chosen for register as much as for count: a wire service, a broadsheet, a tabloid, a
 * left-leaning independent, a tech title and a government portal do not write the same Korean.
 */
export const DOMAINS = [
  // Books, classics and scholarship. Korean's drop list says 16,800 words — 44% of its candidate
  // list — were seen by a web crawl and a Wikipedia and by nothing else. Twenty newspapers could
  // not reach them, because they are not news vocabulary. These are where they live.
  'encykorea.aks.ac.kr', 'itkc.or.kr', 'sillok.history.go.kr', 'db.history.go.kr',
  'munjang.or.kr', 'changbi.com', 'moonji.com', 'ltikorea.or.kr',
  'nl.go.kr', 'krpia.co.kr',
  // Wire service and the large dailies
  'yna.co.kr',
  'khan.co.kr',
  'donga.com',
  'joongang.co.kr',
  'hankookilbo.com',
  'seoul.co.kr',
  'segye.com',
  'munhwa.com',
  // Independents and weeklies, a different register from the broadsheets
  'ohmynews.com',
  'mediatoday.co.kr',
  'pressian.com',
  'sisain.co.kr',
  'hani.co.kr',
  'kukinews.com',
  // Broadcasters
  'kbs.co.kr',
  'imbc.com',
  'ytn.co.kr',
  'jtbc.co.kr',
  // Business and technology, where the loanwords live
  'hankyung.com',
  'mk.co.kr',
  'etnews.com',
  'zdnet.co.kr',
  'bloter.net',
  // Government, which writes a Korean nobody else writes
  'korea.kr',
]

/** Carried over from Blinkered's calibration; must be re-measured before anything ships. */
export const COMMON_CUT = 19257
