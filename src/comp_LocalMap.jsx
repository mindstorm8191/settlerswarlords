/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL, game } from "./App.js";
import { DraggableMap } from "./comp_DraggableMap.jsx";


export function LocalMap(props) {
    if(props.localTiles===null) {
        // This can happen when the player logs out
        return <div>No map content available</div>;
    }

    return (
        <>
            <div style={{ display: "flex", width: "100%" }}>
                <div>Area details here</div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ width: 180 }}>
                    {/*Provide a save button (obviously this needs more work, but we'll add it later*/}
                    <div>Save</div>
                    {/*List all building options currently available*/}
                </div>
                <DraggableMap style={{width:'100%', height:'calc(100vh - 185px)'}}>
                    {props.localTiles.map((tile, key) => {
                        return (
                            <div
                                key={key}
                                style={{
                                    display: "block",
                                    position: "absolute",
                                    width: 40,
                                    height: 40,
                                    top: tile.y * 42,
                                    left: tile.x * 42,
                                    backgroundImage:
                                        "url(" +
                                        imageURL +
                                        "localtiles/" +
                                        minimapImages[parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype] +
                                        ")",
                                    cursor: "pointer",
                                    border: "1px solid green",
                                }}
                            ></div>
                        );
                    })}
                </DraggableMap>
            </div>
        </>
    );
}

export const minimapImages = [
    "wheatgrass.png", // 0: wheat
    "oatgrass.png", // 1: oat
    "ryegrass.png", // 2: rye
    "barleygrass.png", // 3: barley
    "milletgrass.png", // 4: millet
    "mapletreeone.jpg", // 5: maple
    "mapletreeone.jpg", // 6: birch
    "mapletreeone.jpg", // 7: oak
    "mapletreeone.jpg", // 8: mahogany
    "pinetreetwo.jpg", // 9: pine
    "pinetreetwo.jpg", // 10: cedar
    "pinetreetwo.jpg", // 11: fir
    "pinetreetwo.jpg", // 12: hemlock
    "cherrytreeone.jpg", // 13: cherry
    "appletreeone.jpg", // 14: apple
    "peartreeone.jpg", // 15: pear
    "orangetreeone.jpg", // 16: orange
    "mapletreeone.jpg", // 17: hawthorne
    "mapletreeone.jpg", // 18: dogwood
    "mapletreeone.jpg", // 19: locust
    "pinetreeone.jpg", // 20: juniper
    "basicrock.jpg", // 21
    "desert.jpg", // 22
    "smallpond.jpg", // 23
    "lava.png", // 24
    "ice.png", // 25
    "snow.png", // 26
    "smallpond.jpg", // 27 stream
    "emptygrass.jpg", // 28 wetland
    "basicrock.jpg", // 29 cliff
    "smallpond.jpg", // 30 creekwash
    "basicrock.jpg", // 31 creekbank
    "emptygrass.jpg", // 32 empty grass
    "farmplot.png", // 33 farm plot
];

