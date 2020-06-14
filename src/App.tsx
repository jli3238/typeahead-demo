import React, { useMemo, useState } from 'react';
import { Option } from './components/InputList';
import { TypeAhead } from '../src/components/TypeAhead';

function App() {
  const languages = [
    'English',
    'Español',
    'Français',
    'Italiano',
    'Português',
    '中文',
    '日本語',
    'Ænglisc'
  ] as const;

  const staticOptions: readonly Option[] = languages.map(lang => ({ id: lang, name: lang }));
  const [value, setValue] = useState<readonly Option[]>([]);
  const placeholder = 'Search mention';
  const options = useMemo(() => {
    const customOptions = value.filter(option => !staticOptions.some(staticOption => staticOption.id === option.id));
    return staticOptions.concat(customOptions);
  }, [value, staticOptions]);
  
  function onSearchSync(text: string): readonly Option[] {
    const filteredOptions = options.filter(option => option.name.includes(text));
    const newOption = { id: `new-${text}`, name: `Custom: "${text}"` };
    if (!filteredOptions.some(o => o.id === newOption.id)) {
      filteredOptions.push(newOption);
    }
    return filteredOptions;
  }

  function onSearchAsync(text: string) {
    return new Promise<readonly Option[]>(function(resolve){
      setTimeout(() => resolve(onSearchSync(text)), 200);
    });
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
