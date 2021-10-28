// DanAjax
// A collection of functions to aid in communicating with the server
// For the project Settlers & Warlords

export const DAX = {
    serverMessage: (command, content, includeUserData) => {
        // Handles building a message that is sent to the server.  This cleans up the repetitiveness of the code here, whenever
        // fetch calls are made
        // command - action value to send to the server. Determines generally what the server will do for the client
        // content - any other data to send to the server with this request
        // includeUserData - Set to true if userdata should be provided with the message, or false if not.
        let packout = { action: command, ...content };
        if (includeUserData) {
            packout.userid = localStorage.getItem("userid");
            packout.access = localStorage.getItem("access");
            console.log("Userid info included. value is" + includeUserData + ". Sending " + JSON.stringify(packout));
        }
        return {
            method: "post",
            mode: 'cors',           // CORS is primarily responsible for ensuring that the responding server grants this script access to its data
            headers: new Headers({
                "Content-Type": "text/plain;charset=UTF-8"
            }),
            body: JSON.stringify(packout)
        };
    },

    manageResponseConversion: (response) => {
        return response.text().then(text => {
            try {
                return JSON.parse(text);
            } catch (error) {
                console.log("Parsing failed. Server said "+ text);
                //throw new Error("Parsing failed. Server said: " + text);
                return {
                    result: 'fail',
                    cause: 'serverError',
                    message: "The server responded with an error: "+ text
                };
            }
        });
    },

    sendError: (message) => {
        // Manages sending an error message to the server.
        fetch("ajax.php", DAX.serverMessage("reporterror", { msg: message }));
    }
}


