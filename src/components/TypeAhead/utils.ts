import { Option } from '../Common/InputList';

export function isOptionSelected<O extends Option>(id: O['id'], options: readonly O[]): boolean {
  return options.some(selectedOption => selectedOption.id === id);
}
