import React from 'react';
import MonacoEditor from 'react-monaco-editor';

const MonacoEditorComponent = () => {
    const editorDidMount = (editor, monaco) => {
        console.log('Editor mounted:', editor);
    };

    const onChange = (newValue) => {
        console.log('New value:', newValue);
    };

    return (
        <MonacoEditor
            width="800"
            height="600"
            language="javascript"
            theme="vs-dark"
            value="// Your code here"
            options={{
                selectOnLineNumbers: true,
            }}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
};

export default MonacoEditorComponent;