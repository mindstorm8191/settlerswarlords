// LocalMap.jsx
// Provides content for the local map of the game
// for the game Settlers&Warlords

import React from "react";
import { DAX } from "./DanAjax.jsx";
import { serverURL, imageURL } from "./App.js";
import { MyInput } from "./MyInput.jsx";

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
    //              building - object describing building-specific stats
    //              buildType - object describing this type (and level) of building
    //              actions - array of objects, each object describing an action this building can do
    //      localMapBuildOptions - Array of objects, each object containing info about new buildings that can be built. Options are
    //          dependent upon the land type limits defined by the building
    //      onChangeLocalTiles - a callback function that is called whenever any map tiles has changed content
    //      onChangePage - a callback function to call whenever the selected page has changed

    const [selected, pickSelected] = React.useState(null);

    function handleTileUpdate(tiles) {
        props.onChangeLocalTiles(tiles);
        pickSelected(tiles[0]);
    }

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
                    /* Before trying to generate output, determine if there is active construction going on here */
                    let hasConstruction = 0;
                    if (parseInt(square.buildid) != 0) {
                        if (square.events !== undefined) {
                            /* Find an event that is a construction event for this */
                            console.log("Events is not undefined");
                            if (
                                square.events.find(eve => {
                                    if (eve.task === "newbuild") {
                                        console.log("We need the hard hat");
                                        return true;
                                    }
                                    return false;
                                })
                            ) {
                                hasConstruction = 1;
                            }
                        }
                    }
                    return (
                        <div
                            style={{
                                display: "block",
                                position: "absolute",
                                width: 55,
                                height: 55,
                                top: square.y * 55,
                                left: square.x * 55,
                                backgroundImage: "url(" + imageURL + minimapImages[square.landtype] + ")"
                            }}
                            key={key}
                            onClick={() => pickSelected(square)}
                        >
                            {parseInt(square.buildid) === 0 ? (
                                ""
                            ) : (
                                <div>
                                    <img
                                        src={imageURL + square.buildType.image}
                                        alt={"building"}
                                        style={{ pointerEvents: "none" }}
                                    />
                                    {hasConstruction === 0 ? (
                                        ""
                                    ) : (
                                        <img
                                            src={imageURL + "construction.png"}
                                            style={{
                                                pointerEvents: "none",
                                                position: "absolute",
                                                top: 0,
                                                left: 0
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <LocalTileDetail
                    tile={selected}
                    onChangeLocalTiles={handleTileUpdate}
                    localMapBuildOptions={props.localMapBuildOptions}
                />
            </div>
        </div>
    );
}

function LocalTileDetail(props) {
    // Shows content on the right of the displayed map.
    // Components that use this component:
    //      LocalMap
    // prop fields:
    //      tile - object containing data about the selected tile. Can be null
    //      onChangeLocalTiles - a callback function to update any tiles that have changed
    //      localMapBuildOptions - array of objects, each object being a building that can be built here

    if (props.tile === null) return <div style={{ position: "absolute", left: 440 }}>Select a tile to see options</div>;

    return (
        <div style={{ position: "absolute", left: 440 }}>
            {/*<span style={{ fontWeight: "bold" }}>{localmapTilenames[props.tile.landtype]}</span>*/}
            {parseInt(props.tile.buildid) === 0 ? (
                <div>
                    <p className="singleline">Nothing is built here. Choose an option below</p>
                    <LocalTileNewBuilding
                        tile={props.tile}
                        onChangeLocalTiles={props.onChangeLocalTiles}
                        localMapBuildOptions={props.localMapBuildOptions}
                    />
                </div>
            ) : (
                <LocalTileBuildingDetail tile={props.tile} />
            )}
        </div>
    );
}

function LocalTileBuildingDetail(props) {
    // Shows information about a given building
    // prop fields:
    //      tile - information about this location, including building stats, type of building, and choice of options
    //          x,y - coordinates on the minimap grid
    //          landtype - ID of the type of land here
    //          buildid - ID of the building here. This component will not be used if this is zero
    //          building - object containing information about the building here
    //              buildtype - ID of the type of building this is
    //              devlevel - development level of this building. Determines how much it can do
    //              fortlevel - fortification leve of this building. Determines how much damage this building can take
    //                  before being destroyed
    //              detail - building-specific information this might need. Does not have a use yet
    //              workersassigned - number of workers currently assigned to work at this building.
    //              assigned - details of what this building is working on.  Does not have a use yet
    //          buildType - object containing information about the type of building here
    //              name - Name of this building
    //              image - image to show for this building. This is only used in the local map
    //              description - Description of this building type
    //          actions - array of objects, each object being an action that the user can complete through this block
    //              name - name of this action, which can be shown to the user
    //              minWorkers - minimum workers that can be used to complete this action
    //              maxWorkers - maximum workers that can be used to complete this action
    //              workerBonus - production rate bonus per additional worker over the minimum
    //              cycleTime - how long a single process takes to complete (at minimum workers)
    //              inputGroup - array of objects, each object being a requirement for this process
    //              outputGroup - array of objects, each object being an output item for this process

    const [actionWorkers, setActionWorkers] = React.useState(
        props.tile.actions.map(ele => {
            return { n: ele.name, v: ele.minWorkers };
        })
    );

    const [actionAmount, setActionAmount] = React.useState(
        props.tile.actions.map(ele => {
            return { n: ele.name, v: 0 };
        })
    );

    function updateActionWorkers(fieldname, value) {
        // Handles updating the values within actionWorkers, whenever the user changes the input. Only one of these will be used in
        // the end, but we need to track them all
        //console.log('Set '+ fieldname +' = '+ value);
        const holder = actionWorkers.map(ele => {
            if (ele.n === fieldname) {
                //console.log('We have a hit!');
                return { n: fieldname, v: value };
            }
            return ele;
            //return (ele.n===fieldname)?{n:fieldname, v:value}:ele;
        });
        setActionWorkers(holder);
    }

    function updateActionAmount(fieldname, value) {
        // Handles updating the values within actionAmounts, whenever the user changes the input. Only one of these will be used in
        // the end, but we need to track them all
        let holder = actionAmount.map(ele => {
            return ele.n === fieldname ? { n: fieldname, v: value } : ele;
        });
        setActionAmount(holder);
    }

    function startAction(actionName) {
        // Starts an action process.  The actionName will determine which fields of the page to pull from.

        // We need to pass enough data so the server knows where to update. Start by grabbing the correct fields from input.
        let w = actionWorkers.find(ele => {
            return ele.n === actionName;
        });
        let a = actionAmount.find(ele => {
            return ele.n === actionName;
        });
        console.log(w);
        fetch(
            serverURL,
            DAX.serverMessage(
                "startAction",
                {
                    buildid: props.tile.buildid,
                    process: actionName,
                    workers: w.v,
                    amount: a.v === "" ? 0 : a.v
                },
                true
            )
        )
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                console.log(data);
            });
    }

    // Before diplaying all the options for this, we first need to determine if this building is under construction. If it is, we
    // can only show that, and none of the options
    let hasConstruction = 0;
    if (props.tile.events != undefined) {
        console.log("This building has an event");
        if (
            props.tile.events.find(ele => {
                return ele.task === "newbuild";
            })
        ) {
            hasConstruction = 1;
        }
    }

    return (
        <div>
            <p className="singleline" style={{ textAlign: "center", fontWeight: "bold" }}>
                {props.tile.buildType.name}
            </p>
            {hasConstruction === 1 ? (
                <p className="singleline">This building is still under construction</p>
            ) : (
                <div>
                    <p className="singleline">Dev level {props.tile.building.devlevel}</p>
                    <p className="singleline">Fort level {props.tile.building.fortlevel}</p>
                    <p>{props.tile.buildType.description}</p>
                    {/* Let's show the currently working action, if there is any */}
                    {props.tile.process === null ? (
                        ""
                    ) : (
                        <div>
                            <p className="singleline" style={{ textAlign: "center", fontWeight: "bold" }}>
                                In Progress
                            </p>
                            <p className="singleline">{JSON.stringify(props.tile.process)}</p>
                        </div>
                    )}
                    {/* Now, let's list some options from the available actions */}
                    <p className="singleline" style={{ textAlign: "center", fontWeight: "bold" }}>
                        Actions
                    </p>
                    {props.tile.actions.map((ele, key) => {
                        console.log("Workers array ={" + actionWorkers[key].n + "," + actionWorkers[key].v + "}");
                        return (
                            <div key={key} style={{ margin: 4, border: "1px solid orange", padding: 8 }}>
                                <p className="singleline" style={{ textAlign: "center" }}>
                                    {ele.name}
                                </p>
                                <p className="singleline">
                                    Number of workers:
                                    <MyInput
                                        onUpdate={updateActionWorkers}
                                        fieldName={actionWorkers[key].n}
                                        default={actionWorkers[key].v}
                                    />
                                    Range: {ele.minWorkers} to {ele.maxWorkers}
                                </p>
                                <p className="singleline">Resources Needed: none </p>
                                {/*we're currently not filling this out, for our current test object. We will need to determine this later*/}
                                <p className="singleline">
                                    Resources Output:
                                    {ele.outputGroup
                                        .map(item => {
                                            return item.name + " x" + item.amount;
                                        })
                                        .join(", ")}
                                </p>
                                <p className="singleline">
                                    Amount to produce:
                                    <MyInput
                                        onUpdate={updateActionAmount}
                                        fieldName={actionWorkers[key].n}
                                        placeholder="Leave blank for continuous"
                                    />
                                </p>
                                <span className="fakelink" onClick={() => startAction(ele.name)}>
                                    Start work
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function LocalTileNewBuilding(props) {
    // Shows a list of building options for a given tile, based on which land type was selected
    // Components that use this component:
    //      LocalTileDetail
    // prop fields:
    //      tile - object containing data about the selected tile.
    //      onChangeLocalTiles - a callback function to update any tiles that have changed content.
    //          parameters:
    //          tileList - array of objects, each object being the full details of the given tile. Will replace any tiles with matching X & Y coords
    //      localMapBuildOptions - array of object, each object being information about a building that can be built here. This is
    //          limited by the server based on what the player has the ability to build.

    function buildStructure(buildingName) {
        // Allows the user to start building a specific structure
        // buildingName - name of the building to start building here

        // The bulk of this will be a fetch command, and processing the response
        fetch(
            serverURL,
            DAX.serverMessage("addbuilding", { name: buildingName, localx: props.tile.x, localy: props.tile.y }, true)
        )
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

    // Based on the land types available, we can only build certain buildings. Run through the options list and display only the
    // options available for this land type.
    // To ensure that we display something, gather the list first, then see what options we have. This will be especially useful for
    // water, which starts with no options.
    console.log(props.tile.landtype);
    let available = props.localMapBuildOptions.filter(ele => {
        // Before being able to check this, convert the building's land types list into an array, split by commas
        return ele.landtype
            .split(",")
            .map(Number)
            .includes(parseInt(props.tile.landtype));
    });

    if (available.length === 0) {
        return <div>There is nothing to build here at this time.</div>;
    }

    return (
        <div>
            {available.map((ele, key) => {
                return (
                    <div key={key} style={{ border: "1px solid green", margin: 4, padding: 2 }}>
                        <p className="singleline" style={{ textAlign: "center", fontWeight: "bold" }}>
                            {ele.name} - Level 1
                        </p>
                        <p>{ele.description}</p>
                        <p className="singleline">Build Time: {ele.buildtime} seconds</p>
                        <p className="singleline">Equipment needed: none</p>
                        <p className="singleline" style={{ fontWeight: "bold", textAlign: "center" }}>
                            Operating Costs
                        </p>
                        <p className="singleline">
                            Workers needed: {ele.minworkers} to {ele.maxworkers}
                        </p>
                        <p className="singleline">Worker bonus: none</p>
                        <p className="singleline">Tools & Equipment: none</p>
                        <p className="singleline" style={{ textAlign: "center" }}>
                            <span className="fakelink" onClick={() => buildStructure(ele.name)}>
                                Build
                            </span>
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
