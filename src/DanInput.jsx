// DanInput.jsx
// An enhanced input box, that sends its content back to the calling object. It can also handle completing actions when the
// enter key is pressed.
// For Settlers&Warlords

import React from "react";

export function DanInput(props) {
    // Handles all things needed for a generic input box
    // prop values:
    //    onUpdate - Required. What function to call when the content of the input box changes
    //    default - Optional. What value this field should start with
    //    placeholder - Optional. What value to place in the input box before the user adds content. This is an HTML trick
    //    fieldName - Optional. Name of this input box, for the parent component. onUpdate() will be called with parameters
    //          (fieldName, value), even if fieldName is not set.
    //    onEnter - Optional. What function to call when the user presses enter
    //    onFocus - Optional. What function to call when the user selects the input box
    //    onBlur - Optional. What function to call when the user exits the input box

    const [name, setName] = React.useState(props.default === undefined ? "" : props.default);
    function watchChange(e) {
        // Internal function to update the internal React field whenever the user types in the box
        setName(e.target.value);
        if (typeof props.onUpdate === "function") {
            props.onUpdate(props.fieldName, e.target.value);
        }
    }

    function watchKey(e) {
        // Internal function to check if the user presses enter
        if (e.keyCode === 13) {
            if (props.onEnter !== undefined) {
                props.onEnter();
            }
        }
    }

    function watchFocus() {
        // Internal function to call something when the user selects 
        if(props.onFocus !== undefined) {
            props.onFocus();
        }
    }

    function watchBlur() {
        // Internal function to call something when the user leaves the input box
        if (props.onBlur !== undefined) {
            props.onBlur();
        }
    }

    return (
        <input
            value={name}
            onChange={(e) => watchChange(e)}
            onKeyDown={(r) => watchKey(r)}
            onFocus={()=> watchFocus()}
            onBlur={() => watchBlur()}
            placeholder={props.placeholder === undefined ? "" : props.placeholder}
        />
    );
}
