# Blinkered dictionary: Korean

The Korean word list, and the evidence for every word in it.

Built by [`blinkered-attestation`](../blinkered-attestation). The rule, the evidence format and
the reasoning live there; what lives here is Korean.

## What is in this repository

```
sources.mjs        which collections attest Korean, and why those
ATTESTATIONS.tsv   the evidence: every candidate, what saw it, and where
words.txt          what survived, in Blinkered's own format
dropped.tsv        what did not, and how close it came
SATURATION.md      what each family was worth, measured from the evidence
searched.tsv       the harvest: which pages were fetched, and what they held
```

`.cache/` holds the downloaded collections and is not tracked. Everything here is regenerable
with `pnpm build`.

## Korean needs no analyser

Blinkered deals letters, and Korean is written in syllable blocks: 각 is one character on the
page and three letters underneath. The list ships the letters — `ㄱㅏㄱ` — and the internet is
written in blocks, so a naive scan of Korean text would match nothing at all.

This is not a hard problem, only an easy one to miss. Hangul syllables occupy a contiguous
Unicode range with an arithmetic decomposition, so the fold in Blinkered's own engine turns 각
into ㄱㅏㄱ deterministically and a Korean page is searched exactly like a German one. Japanese
needs a morphological analyser for the same job; Korean needs arithmetic.

## What actually carried this language

Korean is the case that proved the harvest.

```
                             kept            of 38,467 candidates
  wiki, wikisource, tat       2,600  (6.8%)
  + FineWeb-2 Korean          2,613  (6.8%)
  + 20 Korean publishers     17,465 (45.4%)
```

Three collections satisfied the rule and reached under seven percent of the list, because
Korean's Wikipedia and Wikisource are one organization and the sentence bank is small. What the
language needed was not more text but more *gatherers*, and the cheapest source of independent
gatherers is the web itself: a domain we fetch ourselves is a publisher, and a publisher is a
family.

Twenty Korean news sites, fetched politely through their own sitemaps and feeds, took the list
from 2,600 words to 17,465.

**`searched.tsv` records counts, never prose.** Each row is a page URL and the words it held with
their frequencies. Storing the text would have republished twenty newspapers, which is the exact
thing this whole method exists to avoid; an attestation is a citation, and a citation does not
carry the article with it.

## Where the returns stop

[`SATURATION.md`](SATURATION.md) has the full curve. It is the clearest answer we have to "how
many families does a language need":

```
   3  joongang.co.kr   13,904  36.1%  +13,904
   4  khan.co.kr       14,907  38.8%   +1,003
   5  seoul.co.kr      15,386  40.0%     +479
   7  tatoeba          15,930  41.4%     +262
  19  bloter.net       17,462  45.4%      +31
  20  etnews.com       17,464  45.4%       +2
  22  donga.com        17,465  45.4%       +0
```

The third family is worth thirty-six points and the twenty-second is worth nothing. Somewhere
around eight to ten publishers Korean has seen everything Korean news can show it, and the
remaining fifty-five percent of the candidate list is not waiting behind another newspaper — it
is inflected forms, rare compounds and proper nouns that a news register does not reach.

## Reading the result

**The keep rate is not the check. The drop list is.** Korean keeps 45.4%, which sounds poor and
is not a verdict on the attestation: it is the share of somebody else's dictionary we could
independently prove. A list built from a morphologically productive language will always score
lower than German's, whose candidates are 36,000 words rather than 38,000 of a much longer tail.

`dropped.tsv` is sorted by how close each word came — two families first, then one, then none.
Someone who reads Korean should look at the two-family end before this list ships, because that
is where a missing collection shows up.

## Rebuilding

```sh
pnpm install
pnpm build       # writes the evidence, words.txt, dropped.tsv
pnpm conform     # checks that words.txt says only what the evidence supports
pnpm saturation  # re-measures what each family was worth
pnpm verify --sample 10      # fetches cited pages and checks they hold the word
pnpm harvest 250 # fetches more pages from the publishers in DOMAINS
```

A change here is not finished until the roll-up in `blinkered-attestation` is regenerated —
`node scripts/languages.mjs` there. That is
[the rule](../blinkered-attestation/README.md#the-rule-for-changing-a-language), and it exists
because a summary nobody can trust is worse than no summary.

## Before this ships

The common-tier cut in `sources.mjs` is carried over from Blinkered's calibration against the
**old** list, and has to be re-measured before this reaches the game. Skipping it is a silent
fault rather than a loud one: the word floor ends up above what any board can reach, every draw
is rejected, and the generator plays its best failed attempt while reporting failure.
