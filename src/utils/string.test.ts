import { isStringEmpty } from './string';

it('returns true for string of a single or multiple whitespaces', () => {
  let result = isStringEmpty(' ');
  expect(result).toEqual(true);
  result = isStringEmpty('   ');
  expect(result).toEqual(true);
});

it('returns false for alphanumeric string', () => {
  const result = isStringEmpty('a1');
  expect(result).toEqual(false);
});