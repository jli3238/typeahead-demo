// Additional Feature 6. Add unit tests
import { isOptionSelected } from './utils';

const options = [
  { id: 1, name: 'name1' },
  { id: 2, name: 'name2' },
  { id: 3, name: 'name3' },
];
it('returns true if the selected id belongs to one of the options', () =>
{
  const id = 1;
  expect(isOptionSelected(id, options)).toEqual(true);
});
;
it('returns false if the selected id doesn\'t belong to one of the options', () =>
{
  const id = 4;
  expect(isOptionSelected(id, options)).toEqual(false);
});