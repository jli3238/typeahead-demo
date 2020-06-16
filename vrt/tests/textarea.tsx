import React from 'react';
import Capture from './Capture';
import { TextArea } from '../../src/';

export default function TextAreaTests() {
  const value = 'Test value';
  const label = 'Test label';
  const error = 'Error message spans the entire width of the text box.';

  return (
    <>
      <Capture id="textarea">
        <TextArea />
      </Capture>
      <Capture id="textarea-baseline">
        <TextArea defaultValue={value} /> baseline
      </Capture>
      <Capture id="textarea-focus" focus>
        <TextArea />
      </Capture>
      <Capture id="textarea-hover" hover>
        <TextArea />
      </Capture>
      <Capture id="textarea-label">
        <TextArea label={label} />
      </Capture>
      <Capture id="textarea-placeholder">
        <TextArea placeholder="Placeholder" />
      </Capture>
      <Capture id="textarea-value">
        <TextArea defaultValue={value} />
      </Capture>
    </>
  );
}
