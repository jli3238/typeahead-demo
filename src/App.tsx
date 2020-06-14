import React, { useState } from 'react';
import { Option } from './components/InputList';
import { TypeAhead } from '../src/components/TypeAhead';
import { api } from './utils/api';

function App() {
  
  const usersApiUrl = 'http://localhost:4000/twitter/user/search?username=chicago';
  const [value, setValue] = useState<readonly Option[]>([]);
  const placeholder = 'Search mention';

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
