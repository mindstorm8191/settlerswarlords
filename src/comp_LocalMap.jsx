/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL } from "./App.js";
import { game } from "./game.jsx";
import { DraggableMap } from "./comp_DraggableMap.jsx";


export function LocalMap(props) {
    
    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
    const [buildSelected, setBuildSelected] = React.useState(null); // which building is selected, or null otherwise

    if(props.localTiles===null) {
        // This can happen when the player logs out
        return <div>No map content available</div>;
    }

    function addBuilding(tile) {
        // Handles adding a new building to the map
        // tile - what tile was clicked on when adding a building

        if(buildSelected===null) {
            console.log('Player tried to place building, but no building type was selected');
            return;
        }
        if(tile===null) {
            console.log('PLayer tried to place a building, but no tile is selected?');
            return;
        }

        let b = buildSelected.create(tile);
        if(typeof b ==='string') {
            console.log('Building creation rejected: '+ b);
            return;
        }
        // Add this building to the game's block list
        game.blockList.push(b);

        // Also add this to the given tile. We'll have to update the base tiles to get this to work
        let tileIndex = game.tiles.findIndex(ele=>ele.x===tile.x && ele.y===tile.y);
        game.tiles[tileIndex].buildid = b.id;
        game.tiles[tileIndex].image = b.image;

        // With the game tiles updated, trigger React to update the map
        // For this, we need to provide new instances of the updated tiles. Our function has us provide an array of them.
        // It will replace the whole list with a new one, inserting the updated one in place of the old one.
        props.onTileUpdate([{...game.tiles[tileIndex], buildid:b.id, buildImage:b.image}]);

        // Clear the selected building type while we're here
        setBuildSelected(null);
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
                    {game.blockTypes.map((block, key) => {
                        // First, determine if this is the currently selected building
                        let bColor = 'black'; if(buildSelected!==null && block.name===buildSelected.name) bColor = 'red';

                        return (
                            <div key={key} style={{display:'inline-block', border:'1px solid '+ bColor, width:40, height:40}}
                                onClick={()=>{
                                    if(buildSelected==block) {
                                        setBuildSelected(null);
                                    }else{
                                        setBuildSelected(block);
                                    }
                                }}>
                                <img src={imageURL +"structures/"+ block.image} alt={block.name} />
                            </div>
                        );
                    })}
                </div>
                <DraggableMap style={{width:'100%', height:'calc(100vh - 185px)'}}>
                    {props.localTiles.map((tile, key) => {
                        // For each location, we need to determine if a worker is here.
                        let hasWorker = props.localWorkers.some(ele => {
                            return parseInt(ele.x)===parseInt(tile.x) && parseInt(ele.y)===parseInt(tile.y);
                        });

                        return (
                            <div
                                key={key}
                                className="localmaptile"
                                style={{
                                    top: tile.y * 42,
                                    left: tile.x * 42,
                                    backgroundImage:
                                        "url(" +
                                        imageURL +
                                        "localtiles/" +
                                        minimapImages[parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype] +
                                        ")",
                                }}
                                onClick={()=>{
                                    if(buildSelected!==null) {
                                        addBuilding(tile);
                                    }
                                    // Later on, when we have pickMode, we will manage that here. For now, there is only one.
                                    setSelected(tile);
                                }}
                            >
                                {/*Display contents of the tile. This is a multiple-choice result */}
                                {(parseInt(tile.buildid)!==0 && hasWorker===true) ? (
                                    <>
                                        <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', display:'block', position:'absolute', top:1, left:1,}} draggable="false" />
                                        <img src={imageURL +"worker.png"} alt="Worker" style={{pointerEvents:'none', display:'block', position:'absolute', top:1, left:1}} draggable="false" />
                                    </>
                                ): (hasWorker===true) ? (
                                    <img src={imageURL +"worker.png"} alt="worker" />
                                ): parseInt(tile.buildid)===0 ? (
                                    ""
                                ): (
                                    <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', border:0}} draggable="false" />
                                )}
                            </div>
                        );
                    })}
                </DraggableMap>
                <div id="localmaprightpanel">
                    {buildSelected !== null ? (
                        "Click a map tile to place this building"
                    ) : (selected===null)? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid)===0?(
                        <>
                            <EmptyLandDescription tile={selected} />
                            <p className="singleline">Nothing is built here. Click a block from the left to place it here</p>
                        </>
                    ) : (
                        <LocalMapBuildingDetail bid={selected.buildid} />
                    )}
                </div>
            </div>
        </>
    );
}

function LocalMapBuildingDetail(props) {
    return <div>Ooooh, its a building!</div>;
}

function EmptyLandDescription(props) {
    // Provides a basic description of the land in the selected tile
    // Collects the correct land type from the tile that is selected

    // These are the natural land formations
    let landType = (props.tile.newlandtype===-1)?props.tile.landtype:props.tile.newlandtype
    let response='';
    switch(landType) {
        case 0: response='Wheat. Tasteful grains for a variety of uses'; break;
        case 1: response='Oat. Hearty grains for many purposes'; break;
        case 2: response='Rye. Makes a sour tasting bread'; break;
        case 3: response='Barley. A nutty grain'; break;
        case 4: response="Millet. It's good for you"; break;
        case 5: response='Maple trees. Its sap is useful for syrups'; break;
        case 6: response='Birch trees. Its bark is good for making ropes'; break;
        case 7: response='Oak trees. Provides acorns - edible in a pinch'; break;
        case 8: response='Mahogany trees. Provides lots of shade'; break;
        case 9: response='Pine trees. Green year-round, and provides pinecones'; break;
        case 10: response='Cedar trees. Grows all and straight'; break;
        case 11: response='Fir trees. Strong trees that make lots of sticks'; break;
        case 12: response='Hemlock trees. Grows tall in tight clusters'; break;
        case 13: response='Cherry trees. Makes a tart fruit, good for many dishes'; break;
        case 14: response='Apple trees. Delicious fruits that everyone enjoys'; break;
        case 15: response='Pear trees. Tasty fruits that excel in colder climates'; break;
        case 16: response='Orange trees. Sweet fruits that enjoy warmer climates'; break;
        case 17: response='Hawthorne trees. It seems to pulse with extra energy'; break;
        case 18: response="Dogwood trees. You wouldn't think this would grow here, but it's determined"; break;
        case 19: response='Locust trees. It seems to glow in the sunlight'; break;
        case 20: response='Juniper trees. It seems to come alive at night'; break;
        case 21: response='Barren rock. Easy source of stone materials and building on'; break;
        case 22: response='Desert sands. Hot, dusty and hard to build on'; break;
        case 23: response='Sitting water. Lots of life grows in it, but drinking it makes you sick'; break;
        case 24: response='Hot lava! Very dangerous, even from a distance'; break;
        case 25: response='Slick ice. Very cold'; break;
        case 26: response='Snowed-over ground. Very cold'; break;
        case 27: response='Flowing water through a stream'; break;
        case 28: response='Wet grounds. Some grass, mostly water'; break;
        case 29: response="Rugged cliff. Don't get close to the edge"; break;
        case 30: response='Creek-side rubble. Lots of tiny rocks that the stream washed in'; break;
        case 31: response='Creek bank. The streams are slowly eroding this wall'; break;
        // Now we get into the man-made land types
        case 32: response='Short grass space. Nothing major here, good for new projects'; break;
        case 33: response='Active farm space.'; break;
        case 34: response='Open dirt pit. Too much traffic for plants to grow here'; break;
        case 35: response="Flat gravel surface. Won't turn into a muddy mess in the rain"; break;
        // We'll add wood flooring, concrete, carpets, tile, etc when we reach those points
        default: response="Oops, there's no description of land type "+ landType; break
    }
    return <p>{response}</p>;
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

