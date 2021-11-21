/* comp_account.jsx
    React components related to account management
    for the game Settlers & Warlords
*/

import React from "react";

import { DanInput } from "./DanInput.jsx";
import { DanCommon } from "./DanCommon.js";
import { DAX } from "./DanAjax.js";
import { ErrorOverlay } from "./comp_ErrorOverlay.jsx";

import { serverURL } from "./App.js";

export function AccountBox(props) {
    // Handles displaying account access at the top right of the page
    // prop fields - data
    //      user - full package of the user data, as received from the server. This will be null before they have logged in
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
            )}
            <ErrorOverlay content={userError} onContinue={setUserError} />
        </div>
    );
}

export function RegisterForm(props) {
    // Provides a form for users to sign up to the game
    // prop fields
    //    onLogin - What function to call when the user has successfully signed up. This will accept
    //      all the data received from the server

    const [fields, setFields] = React.useState({ username: "", password: "", pass2: "", email: "" });
    const [userError, setError] = React.useState("");
    const [serverError, setServerError] = React.useState("");
    const [showPrivacy, setShowPrivacy] = React.useState(0);

    function handleRegister() {
        // Handles starting the registration process
        //console.log("This part needs to be written. Reference RegisterForm->handleRegister");

        // Start by checking that pass 1 & 2 match
        if (fields.password !== fields.pass2) {
            setError("Your passwords don't match. We need a better error message than something going to console.log");
            return;
        }

        // Check that the username doesn't contain any weird characters
        if (DanCommon.hasAny(fields.username, ".,~`!#$%^&*()+=[]{};:\"<>?/|'\\")) {
            setError("You cannot use special characters for your username");
            return;
        }
        if (DanCommon.hasAny(fields.email, " ~`!#$%^&*()+=[]{};:\",<>?/|'\\")) {
            setError("You cannot use special characters for your email");
            return;
        }
        if (fields.username.length < 4) {
            setError("Please provide a good username, to set you apart from others");
            return;
        }
        if (fields.email.length < 5) {
            setError("Please provide a valid email address.");
            return;
        }

        // Also ensure the email address has a valid format
        if (
            fields.email.indexOf(".") === -1 || // email has a dot
            fields.email.indexOf(".") === fields.email.length - 1 || // dot is not last character
            fields.email.indexOf(".") === 0 || // dot is not first character
            fields.email.indexOf("@") === -1 || // email has a @
            fields.email.indexOf("@") === 0 || // @ is not first character
            fields.email.indexOf("@") === fields.email.length - 1 || // @ is not last character
            fields.email.indexOf("@", fields.email.indexOf("@") + 1) !== -1 || // email does not have two @'s
            fields.email.indexOf("@.") !== -1 // domain does not start with .
        ) {
            setError("Please provide a valid email address");
            return;
        }

        // Now, send data to the server.
        fetch(
            serverURL +"routes/signup.php",
            DAX.serverMessage({ username: fields.username, password: fields.password, pass2: fields.pass2, email: fields.email }, false)
        )
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    setServerError(data.message);
                    return;
                }
                // Send the server's response to the parent component. This will be the same content as if they had only logged in.
                props.onLogin(data);
            });
    }

    function inputUpdate(field, value) {
        // This is called whenever an input field gets updated. Handles storing the input's content within this component
        // (since it seems that accessing it on demand isn't an option)
        // field - name of the field to update
        // value - new value to store there
        fields[field] = value;
        setFields(fields);
    }

    return (
        <div>
            <div style={{ fontSize: 20 }}>Sign up today - its free</div>
            <p className="singleline">
                <DanInput placeholder="Username" onUpdate={inputUpdate} fieldName="username" />
            </p>
            <p className="singleline">
                <DanInput placeholder="Password" onUpdate={inputUpdate} fieldName="password" />
            </p>
            <p className="singleline">
                <DanInput placeholder="Pass Again" onUpdate={inputUpdate} fieldName="pass2" />
            </p>
            <p className="singleline">
                <DanInput placeholder="Email" onUpdate={inputUpdate} fieldName="email" onEnter={handleRegister} />
            </p>
            <p className="singleline">
                <input type="button" value="Sign Up" onClick={handleRegister} />
                <span className="fakelink" style={{paddingLeft:5}} onClick={()=>{setShowPrivacy(1-showPrivacy);}}>Show Privacy policy</span>
            </p>
            {showPrivacy===0? (""):(
                <div style={{border:"1px solid", maxWidth:500, margin:5, padding:7}}>
                    Privacy Policy? I haven't figured that part out yet. But I am collecting email addresses... I only intend to use those
                    to recover account passwords. In the future I may use emails to provide news of updates about this game. If this policy
                    changes in the future, I will let you know... probably by email
                </div>
            )}
            {userError === "" ? (
                ""
            ) : (
                <p className="singleline" style={{ color: "red" }}>
                    {userError}
                </p>
            )}
            <ErrorOverlay content={serverError} onContinue={setServerError} />
        </div>
    );
}