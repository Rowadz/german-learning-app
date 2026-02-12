// Utility functions for analyzing German verbs and detecting relationships

import type {
  VocabEntry,
  VerbInfo,
  NounGroup,
  VerbPair,
  SeparablePrefix,
  GrammaticalCase,
  VerbPatternType,
} from '../types';

// Import the constants from types
import { OPPOSITE_PREFIXES, VERB_PATTERNS } from '../types';

// List of all separable prefixes for detection
const SEPARABLE_PREFIXES: SeparablePrefix[] = [
  'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu',
  'zurück', 'zusammen', 'hoch', 'herunter', 'runter', 'raus', 'rein', 'weg', 'weiter'
];

// Common German verbs that are NOT separable despite having prefix-like beginnings
const INSEPARABLE_VERBS = [
  'benutzen', 'bezahlen', 'bekommen', 'besuchen', 'beantworten',
  'entgegennehmen', 'vereinbaren', 'vergleichen', 'verpassen', 'vergessen',
  'überqueren',
];

// Verbs requiring specific cases
const VERB_CASE_MAP: Record<string, GrammaticalCase> = {
  'helfen': 'Dativ',
  'folgen': 'Dativ',
  'danken': 'Dativ',
  'gehören': 'Dativ',
  'gefallen': 'Dativ',
  'geben': 'Dativ', // indirect object
  // Most transitive verbs take Akkusativ (default)
};

/**
 * Extract the verb from a phrase like "die Tür aufschließen"
 * Returns the full infinitive verb
 */
export function extractVerbFromPhrase(phrase: string, noun: string): string {
  // Remove the noun part and get remaining words
  const withoutNoun = phrase.replace(noun, '').trim();
  // The verb is typically the last word (infinitive form)
  const words = withoutNoun.split(/\s+/);
  return words[words.length - 1] || '';
}

/**
 * Parse verb information from a phrase
 */
export function parseVerbInfo(phrase: string, noun: string): VerbInfo {
  const fullVerb = extractVerbFromPhrase(phrase, noun);

  // Check if it's a known inseparable verb
  const isInseparable = INSEPARABLE_VERBS.some(v => fullVerb.includes(v));

  let prefix: SeparablePrefix | undefined;
  let baseVerb = fullVerb;
  let isSeparable = false;

  if (!isInseparable) {
    // Try to find a separable prefix
    for (const p of SEPARABLE_PREFIXES) {
      if (fullVerb.startsWith(p)) {
        prefix = p;
        baseVerb = fullVerb.slice(p.length);
        isSeparable = true;
        break;
      }
    }
  }

  // Determine case requirement
  let caseRequired: GrammaticalCase = 'Akkusativ'; // Default for transitive verbs
  if (VERB_CASE_MAP[baseVerb]) {
    caseRequired = VERB_CASE_MAP[baseVerb];
  }

  // Get pattern tags
  const patternTags: VerbPatternType[] = VERB_PATTERNS[baseVerb] || [];

  // Check for preposition patterns in the phrase
  let preposition: string | undefined;
  let prepositionCase: GrammaticalCase | undefined;

  // Common preposition patterns
  const prepPatterns = [
    { prep: 'an', case: 'Dativ' as GrammaticalCase },
    { prep: 'auf', case: 'Dativ' as GrammaticalCase },
    { prep: 'bei', case: 'Dativ' as GrammaticalCase },
    { prep: 'mit', case: 'Dativ' as GrammaticalCase },
    { prep: 'nach', case: 'Dativ' as GrammaticalCase },
    { prep: 'zu', case: 'Dativ' as GrammaticalCase },
    { prep: 'für', case: 'Akkusativ' as GrammaticalCase },
    { prep: 'gegen', case: 'Akkusativ' as GrammaticalCase },
    { prep: 'um', case: 'Akkusativ' as GrammaticalCase },
  ];

  for (const { prep, case: prepCase } of prepPatterns) {
    if (phrase.includes(` ${prep} `) || phrase.includes(` ${prep}m `) || phrase.includes(` ${prep}r `)) {
      preposition = prep;
      prepositionCase = prepCase;
      break;
    }
  }

  return {
    baseVerb,
    fullVerb,
    prefix,
    isSeparable,
    caseRequired,
    preposition,
    prepositionCase,
    patternTags: patternTags.length > 0 ? patternTags : undefined,
  };
}

/**
 * Extract article from a German noun phrase
 */
export function extractArticle(noun: string): 'der' | 'die' | 'das' {
  const lower = noun.toLowerCase().trim();
  if (lower.startsWith('der ')) return 'der';
  if (lower.startsWith('das ')) return 'das';
  return 'die'; // Default
}

/**
 * Extract base noun without article
 */
export function extractNounBase(noun: string): string {
  return noun.replace(/^(der|die|das)\s+/i, '').trim();
}

/**
 * Check if two verbs are opposites based on their prefixes
 */
export function areVerbsOpposites(verb1: VerbInfo, verb2: VerbInfo): boolean {
  // Must have same base verb
  if (verb1.baseVerb !== verb2.baseVerb) return false;

  // Must both have prefixes
  if (!verb1.prefix || !verb2.prefix) return false;

  // Check if prefixes are known opposites
  const opposites1 = OPPOSITE_PREFIXES[verb1.prefix] || [];
  const opposites2 = OPPOSITE_PREFIXES[verb2.prefix] || [];

  return opposites1.includes(verb2.prefix) || opposites2.includes(verb1.prefix);
}

/**
 * Check if two verbs are related (same action type but different prefixes)
 */
export function areVerbsRelated(verb1: VerbInfo, verb2: VerbInfo): boolean {
  // Same base verb means related
  if (verb1.baseVerb === verb2.baseVerb) return true;

  // Same pattern tags mean semantic relation
  if (verb1.patternTags && verb2.patternTags) {
    const shared = verb1.patternTags.filter(t => verb2.patternTags!.includes(t));
    return shared.length > 0;
  }

  return false;
}

/**
 * Detect opposite verb pairs within a set of entries
 */
export function detectOppositePairs(entries: VocabEntry[]): VerbPair[] {
  const pairs: VerbPair[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];

      // Skip if different nouns
      if (entry1.noun !== entry2.noun) continue;

      const verb1 = entry1.verbInfo || parseVerbInfo(entry1.phrase, entry1.noun);
      const verb2 = entry2.verbInfo || parseVerbInfo(entry2.phrase, entry2.noun);

      // Create unique pair key
      const pairKey = [entry1.id, entry2.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;

      if (areVerbsOpposites(verb1, verb2)) {
        pairs.push({
          verb1EntryId: entry1.id,
          verb2EntryId: entry2.id,
          relationship: 'opposite',
        });
        processedPairs.add(pairKey);
      } else if (areVerbsRelated(verb1, verb2)) {
        pairs.push({
          verb1EntryId: entry1.id,
          verb2EntryId: entry2.id,
          relationship: 'similar',
        });
        processedPairs.add(pairKey);
      }
    }
  }

  return pairs;
}

/**
 * Group entries by their noun
 */
export function groupEntriesByNoun(entries: VocabEntry[]): NounGroup[] {
  const groups = new Map<string, VocabEntry[]>();

  // Group entries by noun
  entries.forEach(entry => {
    const existing = groups.get(entry.noun) || [];
    groups.set(entry.noun, [...existing, entry]);
  });

  // Convert to NounGroup array
  return Array.from(groups.entries()).map(([noun, groupEntries]) => ({
    noun,
    nounBase: extractNounBase(noun),
    article: extractArticle(noun),
    category: groupEntries[0].category,
    entryIds: groupEntries.map(e => e.id),
    verbPairs: detectOppositePairs(groupEntries),
  }));
}

/**
 * Find the opposite entry ID for a given entry
 */
export function findOppositeEntryId(
  entry: VocabEntry,
  allEntries: VocabEntry[]
): string | undefined {
  const sameNounEntries = allEntries.filter(
    e => e.noun === entry.noun && e.id !== entry.id
  );

  const entryVerb = entry.verbInfo || parseVerbInfo(entry.phrase, entry.noun);

  for (const other of sameNounEntries) {
    const otherVerb = other.verbInfo || parseVerbInfo(other.phrase, other.noun);
    if (areVerbsOpposites(entryVerb, otherVerb)) {
      return other.id;
    }
  }

  return undefined;
}

/**
 * Find related entry IDs for a given entry (same noun, different verbs)
 */
export function findRelatedEntryIds(
  entry: VocabEntry,
  allEntries: VocabEntry[]
): string[] {
  return allEntries
    .filter(e => e.noun === entry.noun && e.id !== entry.id)
    .map(e => e.id);
}

/**
 * Enhance a VocabEntry with verb metadata
 */
export function enhanceEntry(
  entry: VocabEntry,
  allEntries: VocabEntry[]
): VocabEntry {
  const verbInfo = parseVerbInfo(entry.phrase, entry.noun);
  const oppositeEntryId = findOppositeEntryId(entry, allEntries);
  const relatedEntryIds = findRelatedEntryIds(entry, allEntries);

  return {
    ...entry,
    verbInfo,
    oppositeEntryId,
    relatedEntryIds: relatedEntryIds.length > 0 ? relatedEntryIds : undefined,
  };
}

/**
 * Enhance all entries in a collection
 */
export function enhanceAllEntries(entries: VocabEntry[]): VocabEntry[] {
  return entries.map(entry => enhanceEntry(entry, entries));
}

/**
 * Get entries grouped by verb pattern type
 */
export function groupEntriesByPattern(
  entries: VocabEntry[]
): Map<VerbPatternType, VocabEntry[]> {
  const groups = new Map<VerbPatternType, VocabEntry[]>();

  entries.forEach(entry => {
    const verbInfo = entry.verbInfo || parseVerbInfo(entry.phrase, entry.noun);
    const patterns = verbInfo.patternTags || [];

    patterns.forEach(pattern => {
      const existing = groups.get(pattern) || [];
      groups.set(pattern, [...existing, entry]);
    });
  });

  return groups;
}

/**
 * Mask the prefix in a verb phrase for drill exercises
 */
export function maskPrefix(phrase: string, verbInfo: VerbInfo): string {
  if (!verbInfo.prefix || !verbInfo.isSeparable) {
    return phrase;
  }

  // Replace the prefix with underscores
  return phrase.replace(
    new RegExp(`\\b${verbInfo.prefix}(${verbInfo.baseVerb})`, 'i'),
    `___$1`
  );
}

/**
 * Generate a fill-in-the-blank question from an example sentence
 */
export function createBlankFromExample(
  example: string,
  verbInfo: VerbInfo
): { sentence: string; answer: string } {
  // For separable verbs, the prefix appears at the end in present tense
  // e.g., "Ich schließe die Tür auf" -> "Ich schließe die Tür ___"

  if (verbInfo.isSeparable && verbInfo.prefix) {
    // Try to find the separated prefix at end of sentence or before comma/period
    const prefixRegex = new RegExp(`\\b${verbInfo.prefix}([.,!?]?)$`, 'i');
    if (prefixRegex.test(example)) {
      return {
        sentence: example.replace(prefixRegex, '___$1'),
        answer: verbInfo.prefix,
      };
    }
  }

  // For infinitive forms, mask the whole verb
  const verbRegex = new RegExp(`\\b${verbInfo.fullVerb}\\b`, 'i');
  if (verbRegex.test(example)) {
    return {
      sentence: example.replace(verbRegex, '___'),
      answer: verbInfo.fullVerb,
    };
  }

  // Default: return original with verb as answer
  return {
    sentence: example,
    answer: verbInfo.fullVerb,
  };
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Split a German sentence into words for sentence building exercise
 */
export function splitSentenceIntoWords(sentence: string): string[] {
  // Keep punctuation with the word it's attached to
  return sentence
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Normalize a German text for comparison (lowercase, trim, handle umlauts)
 */
export function normalizeGerman(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');
}

/**
 * Compare two German strings for equality (case-insensitive, umlaut-tolerant)
 */
export function compareGermanStrings(a: string, b: string): boolean {
  return normalizeGerman(a) === normalizeGerman(b);
}

/**
 * Calculate similarity score between two strings (for partial credit)
 * Returns a number between 0 and 1
 */
export function calculateSimilarity(a: string, b: string): number {
  const s1 = normalizeGerman(a);
  const s2 = normalizeGerman(b);

  if (s1 === s2) return 1;

  // Levenshtein distance based similarity
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Simple character-based similarity
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}
