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
    what: 'Tatoeba — contemporary, conversational',
    needs: `${CACHE}kor_sentences.tsv`,
    documents: () => tatoebaDocuments(`${CACHE}kor_sentences.tsv`),
  },
  {
    id: 'fw2',
    what: 'FineWeb-2 — the crawled web, each document citing its own URL',
    needs: `${CACHE}fineweb2-kor.parquet`,
    documents: () => fineweb2Documents(`${CACHE}fineweb2-kor.parquet`),
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
