import React, { useState } from 'react';
import { Option } from './components/InputList';
import { TypeAhead } from '../src/components/TypeAhead';
import { api } from './utils/api';

function App() {
  // const languages = [
  //   'English',
  //   'Spanish',
  //   'French',
  //   'Italian',
  //   'Portugue',
  //   'German',
  //   'Dutch',
  //   'Janpanese',
  //   'Chinese'
  // ] as const;

  const usersApiUrl = 'http://localhost:4000/twitter/user/search?username=chicago';

  // const staticOptions: readonly Option[] = languages.map(lang => ({ id: lang, name: lang }));
  const [value, setValue] = useState<readonly Option[]>([]);
  const placeholder = 'Search mention';
  // const options = useMemo(() => {
  //   const customOptions = value.filter(option => !staticOptions.some(staticOption => staticOption.id === option.id));
  //   return staticOptions.concat(customOptions);
  // }, [value, staticOptions]);
  
  // function onSearchSync(text: string): readonly Option[] {
  //   const filteredOptions = options.filter(option => option.name.includes(text));
  //   const newOption = { id: `new-${text}`, name: `Custom: "${text}"` };
  //   if (!filteredOptions.some(o => o.id === newOption.id)) {
  //     filteredOptions.push(newOption);
  //   }
  //   return filteredOptions;
  // }

  async function onSearchAsync(text: string) {
    let users = await api.get<Option[]>(usersApiUrl);
    users = users ? users.slice(0, 50) : [];
    const filteredOptions = users.filter(user => user.name.includes(text));
    const newOption = { id: `new-${text}`, name: `Custom: "${text}"` };
    if (!filteredOptions.some(o => o.id === newOption.id)) {
      filteredOptions.push(newOption);
    }
    return filteredOptions;
  }

  return (
    <div className="App">
      <main className="typeahead-demo">
        <TypeAhead 
          value={value}
          onChange={setValue}
          onSearch={onSearchAsync}
          label="Twitter"
          placeholder={placeholder}
        />
      </main>
    </div>
  );
}

export default App;
