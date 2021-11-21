/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL } from "./App.js";


export function LocalMap(props) {
    // Manages displaying the local map, where the 'king piece' is located at.

    const minimapImages = [
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

    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
    const [scrollPos, setScrollPos] = React.useState({ moveState: false, x: 0, y: 0 });

    function startPan() {
        setScrollPos({ ...scrollPos, moveState: true });
    }

    function continuePan(e) {
        if (!scrollPos.moveState) return;
        setScrollPos({ moveState: true, x: scrollPos.x + e.movementX, y: scrollPos.y + e.movementY });
    }

    function endPan() {
        setScrollPos({ ...scrollPos, moveState: false });
    }

    function EmptyLandDescription() {
        // Provides a basic description o f the land in the selected tile
        // Collects the correct land type from the tile that is selected

        // These are the natural land formations
        let landType = (selected.newlandtype===-1)?selected.landtype:selected.newlandtype
        switch(landType) {
            case 0: return <p>Wheat. Tasteful grains for a variety of uses</p>;
            case 1: return <p>Oat. Hearty grains for many purposes</p>;
            case 2: return <p>Rye. Makes a sour tasting bread</p>;
            case 3: return <p>Barley. A nutty grain</p>;
            case 4: return <p>Millet. It's good for you</p>;
            case 5: return <p>Maple trees. Its sap is useful for syrups</p>;
            case 6: return <p>Birch trees. Its bark is good for making ropes</p>;
            case 7: return <p>Oak trees. Provides acorns - edible in a pinch</p>;
            case 8: return <p>Mahogany trees. Provides lots of shade</p>;
            case 9: return <p>Pine trees. Green year-round, and provides pinecones</p>;
            case 10: return <p>Cedar trees. Grows all and straight</p>;
            case 11: return <p>Fir trees. Strong trees that make lots of sticks</p>;
            case 12: return <p>Hemlock trees. Grows tall in tight clusters</p>;
            case 13: return <p>Cherry trees. Makes a tart fruit, good for many dishes</p>;
            case 14: return <p>Apple trees. Delicious fruits that everyone enjoys</p>;
            case 15: return <p>Pear trees. Tasty fruits that excel in colder climates</p>;
            case 16: return <p>Orange trees. Sweet fruits that enjoy warmer climates</p>;
            case 17: return <p>Hawthorne trees. It seems to pulse with extra energy</p>;
            case 18: return <p>Dogwood trees. You wouldn't think this would grow here, but it's determined</p>;
            case 19: return <p>Locust trees. It seems to glow in the sunlight</p>;
            case 20: return <p>Juniper trees. It seems to come alive at night</p>;
            case 21: return <p>Barren rock. Easy source of stone materials and building on</p>;
            case 22: return <p>Desert sands. Hot, dusty and hard to build on</p>;
            case 23: return <p>Sitting water. Lots of life grows in it, but drinking it makes you sick</p>;
            case 24: return <p>Hot lava! Very dangerous, even from a distance</p>;
            case 25: return <p>Slick ice. Very cold</p>;
            case 26: return <p>Snowed-over ground. Very cold</p>;
            case 27: return <p>Flowing water through a stream</p>;
            case 28: return <p>Wet grounds. Some grass, mostly water</p>;
            case 29: return <p>Rugged cliff. Don't get close to the edge</p>;
            case 30: return <p>Creek-side rubble. Lots of tiny rocks that the stream washed in</p>;
            case 31: return <p>Creek bank. The streams are slowly eroding this wall</p>;
            // Now we get into the man-made land types
            case 32: return <p>Short grass space. Nothing major here, good for new projects</p>;
            case 33: return <p>Active farm space.</p>;
            case 34: return <p>Open dirt pit. Too much traffic for plants to grow here</p>;
            case 35: return <p>Flat gravel surface. Won't turn into a muddy mess in the rain</p>;
            // We'll add wood flooring, concrete, carpets, tile, etc when we reach those points
        }
    }

    return (
        <>
            <div style={{ display: "flex", width: "100%" }}>
                <div>Area details here</div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ width: 180 }}>
                    {/*Provide a save button*/}
                    <div>Save</div>
                    {/*List all building options currently available*/}
                    Buildings here
                </div>
                <div id="localmapbox">
                    {/*This is the map container, that lets us scroll the whole map at once*/}
                    <div
                        style={{ position: "absolute", top: scrollPos.y, left: scrollPos.x }}
                        onMouseDown={startPan}
                        onMouseMove={continuePan}
                        onMouseUp={endPan}
                    >
                        {props.localTiles.map((tile, key) => (
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
                                        "url(" + imageURL + minimapImages[parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype] + ")",
                                    cursor: "pointer",
                                    border: tile === selected ? "1px solid black" : "1px solid green",
                                }}
                                onClick={()=> {
                                    return setSelected(tile); // We will later have to add management of pickMode here
                                }}
                            >
                                {/*That div needs an onClick event*/}
                                {parseInt(tile.buildid) === 0 ? "" : "Bldg"}
                            </div>
                        ))}
                    </div>
                </div>
                <div id="localmaprightpanel">
                    {selected === null ? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid) === 0 ? (
                        <>
                            {EmptyLandDescription()}
                            <p className="singleLine">Nothing is built here. Click a block from the left to place it here</p>
                        </>
                    ) : (
                        <>Show building details here</>
                    )}
                </div>
            </div>
        </>
    );
}