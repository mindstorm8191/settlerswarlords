// MyInput.jsx
// An enhanced input box, that sends its content back to the calling object. It can also handle completing actions when the
// enter key is pressed.
// For Settlers&Warlords

import React from 'react';

export function MyInput(props) {
    // Handles all things needed for a generic input box
    // prop values:
    //    placeholder - Optional. What value to place in the input box before the user adds content. This is an HTML trick
    //    onUpdate - what function to call when the content of the input box changes
    //    fieldName - Optional. Name of this input box, for the parent component. onUpdate() will be called with parameters
    //          (fieldName, value), even if fieldName is not set.
    //    onEnter - Optional. What function to call when the user presses enter

    const [name, setName] = React.useState(props.default === undefined ? "" : props.default);
    function watchChange(e) {
        // Internal function to update the internal React field whenever the user types in the box
        setName(e.target.value);
        props.onUpdate(props.fieldName, e.target.value);
    }
    function watchKey(e) {
        // Internal function to check if the user presses enter
        if (e.keyCode === 13) {
            if (props.onEnter !== undefined) {
                props.onEnter();
            }
        }
    }
    return (
        <input
            value={name}
            onChange={e => watchChange(e)}
            onKeyDown={r => watchKey(r)}
            placeholder={props.placeholder === undefined ? "" : props.placeholder}
        />
    );  
}