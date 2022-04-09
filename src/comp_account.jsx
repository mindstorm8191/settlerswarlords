/* comp_account.jsx
    React components related to account management
    for the game Settlers & Warlords
*/

import React from "react";

import { DanInput } from "./libs/DanInput.jsx";
import { DanCommon } from "./libs/DanCommon.js";
import { DAX } from "./libs/DanAjax.js";

import { serverURL } from "./App.js"; // For messages to the server, we need the server's URL
import { ErrorOverlay } from "./comp_ErrorOverlay.jsx"; // A convenient tool to show errors

export function AccountBox(props) {
        // Handles displaying account access at the top right of the page
    // prop fields - data
    //      user - full package of the user data, as received from the server. This will be null before they have logged in
    //      errorText - Error received when user tried to log in
    // prop fields - functions
    //      onLogin - Gets called when the user has requested to log in (or out)
    //                No, that's not correct. This gets called to handle updating app content after the server has replied

    const [fields, setFields] = React.useState({ username: "", password: "" });
    const [userError, setUserError] = React.useState("");

    let isLoggedIn = false;
    if(props.user !==null) isLoggedIn = true;
    //console.log('typeof props.user='+ typeof props.user);

    function inputUpdate(field, value) {
        fields[field] = value;
        setFields(fields);
    }

    function handleLogin() {
        // Make sure the user has filled out some data, before sending it to the server
        if (fields.username === "") {
            setUserError("Please provide a user name & password");
            return;
        }
        if (fields.password === "") {
            setUserError("Please provide your password");
            return;
        }
        console.log('Send to server,', fields);
        fetch(serverURL +'routes/login.php', DAX.serverMessage(fields, false))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Error received from server:", data);
                    setUserError("The server responded with an error state");
                    return;
                }
                props.onLogin(data);
            });
    }

    function handleLogout() {
        // Allows the user to log out, by sending a message to the server
        fetch(serverURL, DAX.serverMessage("logout", [], true))
        .then(res => DAX.manageResponseConversion(res))
        .catch(err => console.log(err))
        .then(data => {
            if(data.result !== "success") {
                // We should probably enable the Error Overlay here...
                console.log("Error from server:", data);
                return;
            }
            // Update login information, by just clearing it out
            props.onLogin(null);
        })
    }

    return (
        <div id="loginblock" >
            {isLoggedIn?(
                <div>
                    <p>Hello, {props.user.name}!</p>
                    <br />
                    <input type="button" value="Logout" onClick={handleLogout} />
                </div>
            ):(
                <>
                    <form id="loginform">
                        <p className="singleline">
                            <DanInput placeholder="username" onUpdate={inputUpdate} fieldName="username" />
                        </p>
                        <p className="singleline">
                            <DanInput placeholder="password" onUpdate={inputUpdate} fieldName="password" onEnter={handleLogin} />
                        </p>
                        <p className="singleline">
                            <input type="button" value="login" onClick={handleLogin} />
                        </p>
                    </form>
                    {(props.errorText==='')?'':(
                        <div style={{backgroundColor:'LightGreen'}}>{props.errorText}</div>
                    )}
                </>
            )}
            <ErrorOverlay content={userError} onContinue={setUserError} />
        </div>
    );
}


