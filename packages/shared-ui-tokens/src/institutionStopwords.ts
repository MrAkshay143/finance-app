/**
 * Stopwords to filter out during institution name normalization.
 * Stripping these leaves the core distinctive token (e.g. "HDFC Salary Account" -> "hdfc").
 */
export const INSTITUTION_STOPWORDS: string[] = [
  'bank',
  'banking',
  'ltd',
  'limited',
  'pvt',
  'private',
  'co',
  'corp',
  'corporation',
  'salary',
  'savings',
  'saving',
  'current',
  'checking',
  'account',
  'a/c',
  'ac',
  'credit',
  'debit',
  'card',
  'branch',
  'india',
  'indian',
  'the',
  'of',
  'and',
  'main',
  'primary',
  'joint',
  'personal',
  'wallet',
  'app',
  'online',
  'digital',
];

export const INSTITUTION_STOPWORD_SET = new Set<string>(INSTITUTION_STOPWORDS);
