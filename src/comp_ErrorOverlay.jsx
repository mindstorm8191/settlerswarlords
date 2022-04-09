/*
    ErrorOverlay
    A component to overlay an error message across the whole page
    for the project Settlers & Warlords
*/

import React from "react";
import parse from "html-react-parser";

export function ErrorOverlay(props) {
    // Displays a full-page error box to the user. Useful for displaying complex errors. Will provide an accept button to
    // Prop fields:
    //      content - Text error to display to the user
    //      onContinue - callback function called when the user has accepted the error.
    //                   This will pass an empty string. An empty string
    // Easy usage example
    //  const [error, setError] = React.useState('');
    //  ----- something to set the error state -----
    //  return (<ErrorOverlay content={error} onContinue={setError} />);

    if (props.content === "") return null;

    return (
        <div
            style={{
                /* This is the container */
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                /*margin:'auto',*/
                zIndex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    /* This is the overlay, to set the background grey */
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "gray",
                    opacity: 0.7,
                }}
            ></div>
            <div
                style={{
                    position: "absolute",
                    margin: "auto",
                    zIndex: 2,
                    border: "4px solid red",
                    background: "white",
                    padding: 5,
                    opacity: 1.0,
                }}
            >
                {/* This is the old method: <p>{props.content}</p>*/}
                {parse(props.content)}
                <button onClick={() => props.onContinue("")}>Okay</button>
            </div>
        </div>
    );
}
