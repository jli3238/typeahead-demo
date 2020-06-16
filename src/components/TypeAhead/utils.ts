import { Option } from '../InputList';

type FilterFunc<O extends Option> = (option: O, text: string) => boolean;

function defaultFilter(option: Option, text: string): boolean {
  return option.name.includes(text);
}

export function filterStaticOptions<O extends Option>(
  options: readonly O[],
  inputValue: string,
  filter: FilterFunc<O> = defaultFilter
): readonly O[] {
  return options.filter(option => filter(option, inputValue));
}

export function isOptionSelected<O extends Option>(id: O['id'], options: readonly O[]): boolean {
  return options.some(selectedOption => selectedOption.id === id);
}
