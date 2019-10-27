// LocalMap.jsx
// Provides content for the local map of the game
// for the game Settlers&Warlords

import React from 'react';
import {DAX} from './DanAjax.jsx';
import {serverURL, imageURL} from './App.js';

const minimapImages = [
    "emptygrass.jpg",
    "pinetreetwo.jpg",
    "smallpond.jpg",
    "desert.jpg",
    "smallpond.jpg",
    "basicrock.jpg",
    "basicore.jpg"
];

const localmapTilenames = ["Grass", "Trees", "Water", "Sands", "Water", "Rocks", "Exposed Ores"];

export function LocalMap(props) {
    // Handles displaying the local map content
    // prop fields
    //      localMap - object containing information about this land area. Inner fields:
    //          biome - name of the type of land that is here
    //          population - how many colonists live here
    //          ugresource - name of the type of underground resource here
    //          ugamount - relative value of how much underground resource is here
    //          owner - ID of the player here. Not used in this component (yet)
    //          minimap - array of objects, each object describing a specific tile of the local map
    //              x,y - coordinates on the minimap grid
    //              landtype - ID of the type of land here
    //              buildid - ID of the building here. If zero, the remaining fields of this object will not exist
    //              buildtype - ID of the type of building here. References to the building type data
    //              devlevel - level of the development of this building
    //              fortlevel - level of the fortification of this building
    //              detail - building-specific details that this building might use, depending on type
    //              workersassigned - how many workers are assigned to work at this building
    //              assigned - general-text describing what is being worked on here
    //              name - name of the building here
    //              image - what image to use to display this building
    //              minworkers - minimum number of workers needed to allow this building to run
    //              maxworkers - maximum number of workers this building can handle
    //              workerbonus - output bonus per worker above the minimum
    //              resoucesUsed - hourly resource cost
    //              output - type and amount of resources output by this block
    //              description - text shown to describe this building to the user
    //      onChangeLocalTiles - a callback function that is called whenever any map tiles has changed content
    //      onChangePage - a callback function to call whenever the selected page has changed

    const [selected, pickSelected] = React.useState(null);
    return (
        <div>
            <span style={{ margin: 10 }}>Biome: {props.localMap.biome}</span>
            <span style={{ margin: 10 }}>Population: {props.localMap.population}</span>
            <span
                className="fakelink"
                style={{ margin: 10 }}
                onClick={() => {
                    props.onChangePage("worldmap");
                }}
            >
                World Map
            </span>
            <div style={{ width: "100%", position: "relative" }}>
                {props.localMap.minimap.map((square, key) => {
                    return (
                        <div
                            style={{
                                display: "block",
                                position: "absolute",
                                width: 55,
                                height: 55,
                                top: square.y * 55,
                                left: square.x * 55,
                                backgroundImage: "url("+ imageURL + minimapImages[square.landtype] +')'
                            }}
                            key={key}
                            onClick={()=>pickSelected(square)}
                        >
                            {parseInt(square.buildid)===0?'':
                                (<img src={imageURL + square.image} alt={'building'} style={{pointerEvents: "none"}} />)
                            }
                        </div>
                    );
                })}
                <LocalTileDetail tile={selected} onChangeLocalTiles={props.onChangeLocalTiles} />
            </div>
        </div>
    );
}

function LocalTileDetail(props) {
    // Shows content on the right of the displayed map.
    // prop fields:
    //      tile - object containing data about the selected tile. Can be null
    //      onpChangeLocalTiles - a callback function to update any tiles that have changed

    if (props.tile === null)
        return <div style={{ position: "absolute", left: 440 }}>Select a tile to see options</div>;

    return (
        <div style={{ position: "absolute", left: 440 }}>
            <span style={{ fontWeight: "bold" }}>{localmapTilenames[props.tile.landtype]}</span>
            {parseInt(props.tile.buildid) === 0 ? (
                <div>
                    <p className="singleline">Nothing is built here. Choose an option below</p>
                    <LocalTileNewBuilding tile={props.tile} onChangeLocalTiles={props.onChangeLocalTiles} />
                </div>
            ) : (
                <div>Something has already been built here</div>
            )}
        </div>
    );
}

function LocalTileNewBuilding(props) {
    // Shows a list of building options for a given tile, based on which land type was selected
    // prop fields:
    //      tile - object containing data about the selected tile.
    //      onChangeLocalTiles - a callback function to update any tiles that have changed content.
    //          parameters:
    //          tileList - array of objects, each object being the full details of the given tile. Will replace any tiles with matching X & Y coords

    function buildStructure(buildingName) {
        // Allows the user to start building a specific structure
        // buildingName - name of the building to start building here

        // The bulk of this will be a fetch command, and processing the response
        fetch(serverURL, DAX.serverMessage("addbuilding", { name: buildingName, localx: props.tile.x, localy: props.tile.y }, true))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                if (data.result !== "success") {
                    console.log("Server reported error:");
                    console.log(data);
                    return;
                }
                // When the server returns data, we want to update the block we have selected. We will route this data piece back to
                // the previous object(s) so that it can be attached properly.
                props.onChangeLocalTiles([data.newmaptile]);
            });
    }

    switch (localmapTilenames[props.tile.landtype]) {
        case "Grass":
            return (
                <div>
                    <p className="singleline" style={{ textAlign: "center", fontWeight: "bold" }}>
                        Forage Post - Level 1
                    </p>
                    <p className="singleline">
                        Collects food items from surrounding lands, to feed your colonists
                    </p>
                    <p className="singleline">Build Time: 0 secs</p>
                    <p className="singleline">Equipment needed: none</p>
                    <p> </p>
                    <p className="singleline" style={{ fontWeight: "bold", textAlign: "center" }}>
                        Operational costs
                    </p>
                    <p className="singleline">Workers Needed: 1 to 1</p>
                    <p className="singleline">Tools & Equipment: none</p>
                    <span className="fakelink" onClick={() => buildStructure("Forage Post")}>
                        Build
                    </span>
                </div>
            );
        default:
            return (
                <div>This land type ({localmapTilenames[props.tile.landtype]}) hasn't been handled yet</div>
            );
    }
}