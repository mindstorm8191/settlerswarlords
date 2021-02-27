// component - LocalMap.jsx
// Provides an interface for users to interact with the map local to where the player is located
// for the game Settlers & Warlords

import React from "react";
import { DAX } from "./DanAjax.js";
import { serverURL, imageURL, PageChoices } from "./App.js";
import { DanInput } from "./DanInput.jsx";
import { ErrorOverlay} from "./comp_ErrorOverlay.jsx";

export function localMap_fillFromServerData(mapContent) {
    // Handles a bit of processing for the local map
    // mapContent - data received from the server
    // Returns an updated package of map content

    // We basically need to attach any active processes - and items of those processes - to the building instance
    mapContent.minimap = mapContent.minimap.map(tile => {
        if(tile.buildid===0) return tile;  // Nothing to update here
        tile.process = mapContent.processes.find(process => process.buildingId===tile.buildid); // This will either hold data or be null
        if(tile.process!==null && typeof tile.process !== 'undefined') {
            // Find any items for inputGroup, and attach the current quantity and calculated production rate
            if(tile.process.inputGroup!==null && typeof tile.process.inputGroup !== 'undefined') {
                tile.process.inputGroup = tile.process.inputGroup.map(root => {
                    let pickup = mapContent.items.find(item => item.name===root.name);
                    if(pickup===null) return root;
                    root.onHand = pickup.amount;
                    root.production = pickup.production-pickup.consumption;
                    return root;
                });
            }else{
                tile.process.inputGroup = 0;  // We can check for 0 later, but not for undefined
            }
            // Do the same for outputGroup
            if(tile.process.outputGroup!==null && typeof tile.process.outputGroup !== 'undefined') {
                tile.process.outputGroup = tile.process.outputGroup.map(root => {
                    let pickup = mapContent.items.find(item => item.name===root.name);
                    if(pickup===null) return root;
                    root.onHand = pickup.amount;
                    root.production = pickup.production-pickup.consumption;
                    return root;
                });
            }else{
                tile.process.outputGroup = 0;
            }
        }
        return tile;
    });
    return mapContent;
}

export function LocalMap(props) {
    // Handles displaying local map content, along with buildings and their options on the right side
    // prop fields - data
    //      localMap - full map content as received from the server. Note that this will contain all events in an events structure now
    // prop fields - functions
    //      setPage      - handles changing the selected page. Only passed to TabPicker
    //      onTileUpdate - handles any map tiles that have been updated

    // minimap images could be global later, but for now we only need them here
    const minimapImages = ["emptygrass.jpg", "pinetreetwo.jpg", "smallpond.jpg", "desert.jpg", "smallpond.jpg", "basicrock.jpg", "basicore.jpg"];
    const [detailed, setDetailed] = React.useState(null); // which square is selected to show details on the right

    return (
        <div>
            <span className="haslinespacing">Biome: {props.localMap.biome}</span>
            <span className="haslinespacing">Population: {props.localMap.population}</span>
            <PageChoices selected={"localmap"} onPagePick={props.setPage} />
            <div id="localmapbox">
                {props.localMap.minimap.map((square, key) => {
                    // Before trying to display this tile, determine if there is any active construction going on
                    let hasConstruction = 0;
                    if(parseInt(square.buildid)!==0) {
                        props.localMap.events.find(eve => {
                            if(eve.task === 'BuildingUpgrade') {
                                let details = JSON.parse(eve.detail);
                                if(details.buildid===square.buildid) {
                                    hasConstruction=1;
                                    return true;
                                }
                            }
                            return false;
                        });
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
                                backgroundImage: "url(" + imageURL + minimapImages[square.landtype] + ")",
                                cursor: "pointer",
                            }}
                            key={key}
                            onClick={() => setDetailed(square)}
                        >
                            {parseInt(square.buildid) === 0 ? (
                                ""
                            ) : (
                                <div>
                                    <img src={imageURL + square.buildType.image} alt={"building"} style={{ pointerEvents: "none" }} />
                                    {hasConstruction === 0 ? (
                                        ""
                                    ) : (
                                        <img
                                            src={imageURL + "construction.png"}
                                            alt={"under construction"}
                                            style={{ pointerEvents: "none", position: "absolute", top: 0, left: 0 }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div style={{ position: "absolute", left: 500 }}>
                {detailed === null ? (
                    "Click a tile to view options"
                ) : parseInt(detailed.buildid) === 0 ? (
                    <EmptyLandShowBuildChoices
                        landType={detailed.landtype}
                        buildTypes={props.localMap.buildoptions}
                        onTileUpdate={props.onTileUpdate}
                        x={detailed.x}
                        y={detailed.y}
                    />
                ) : (
                    <LocalTileBuildingDetail tile={detailed} />
                )}
            </div>
        </div>
    );
}

function EmptyLandShowBuildChoices(props) {
    // List building types that can be built here, allowing the user to select one to build
    // prop fields
    //      landType - land ID of the selected land. Helps determine what can be built at this location
    //      buildTypes - list of all the buildings available to the player. This is received from the server as a buildoptions array
    //      onTileUpdate - callback function to handle updating tiles when received from the server
    //      x - X coordinate on the localmap of this tile. Only used for sending data to the server
    //      y - Y coordinate

    const [selected, setSelected] = React.useState(null);

    function buildStructure(buildName) {
        // Allows the user to start construction of a given building
        // buildingName - name of the building to start building here

        // The build of this will be fetching data from the server
        fetch(serverURL, DAX.serverMessage("addbuilding", { name: buildName, localx: props.x, localy: props.y }, true))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Server reported error", data);
                    return;
                }
                props.onTileUpdate([data.newmaptile]);
            });
    }

    function LandDescription() {
        // Provides a basic description of the land on this selected tile
        // landType - ID of the land type. This should be provided by props.landType

        switch (props.landType) {
            case 0:
                return <p>Grassland. Excellent for new construction and farming</p>;
            case 1:
                return <p>Forest. Best source of wood and other materials</p>;
            case 2:
                return <p>Swamp area. Not very useful</p>;
            case 3:
                return <p>Desert. Hot and hard to build on</p>;
            case 4:
                return <p>Open water. A vital resource for life</p>;
            case 5:
                return <p>Exposed rock. Easy source of stone materials and building on</p>;
            case 6:
                return <p>Exposed ore. Easy mineral access</p>;
            default:
                return <p>Land type {props.landId} has not been coded yet</p>;
        }
    }

    return (
        <div>
            {LandDescription()}
            <p className="singleline">Nothing is built here. Choose an option below</p>
            {props.buildTypes.map((ele, key) => {
                // First, filter out the land types. Our 'data package' receives land types as a comma-delimited string, so we first
                // have to convert that for each building type.
                let landTypes = ele.landtype.split(",").map((rev) => parseInt(rev));
                //console.log("Landtypes (" + props.landType + "): ", landTypes);
                if (!landTypes.includes(props.landType)) return '';
                return (
                    <div key={key}>
                        {ele === selected ? (
                            <div className="buildingListSelected">
                                {ele.name}
                                <p>{ele.description}</p>
                                {/* Show construction time, if there is any */}
                                {ele.buildtime === 0 ? "" : <p className="singleline">Construction time: {ele.buildtime} seconds</p>}
                                <p className="singleline" style={{ textAlign: "center" }}>
                                    <span className="fakelink" onClick={() => buildStructure(ele.name)}>
                                        Build
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <p className="singleline buildingListChoice" onClick={() => setSelected(ele)}>
                                {ele.name}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function LocalTileBuildingDetail(props) {
    // Shows cnotent on the right about the selected building.
    // Components that use this component: LocalMap
    // prop fields - data
    //     tile - object containing all the data about the building to show

    const [pickedAction, setPickedAction] = React.useState(null);
    const [actionWorkers, setActionWorkers] = React.useState(1);
    const [priority, setPriority] = React.useState(1);
    const [errorContent, setErrorContent] = React.useState('');

    // When this gets updated with new content, we need to refresh some choices
    React.useEffect(() => {
        return () => {
            setPickedAction(null);
            setPriority(1);
        };
    }, [props.tile]);

    console.log('Props provided:', props);

    function changeActionWorkers(f, value) {
        setActionWorkers(value);
    }

    function changePriority() {
        console.log("Code has been ran!");
        fetch(serverURL, DAX.serverMessage("setpriority", { buildid: props.tile.building.id, priority: priority }, true))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Error in priority update", data);
                    return;
                }
                console.log("Priority updated successfully");
            });
    }

    function startAction(actionName) {
        // Handles allowing a user to start a given action.
        console.log("Using building data:", props.tile.building);
        fetch(
            serverURL,
            DAX.serverMessage("addprocess", { buildid: props.tile.building.id, process: actionName, workers: actionWorkers, tomake: 0 }, true)
        )
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Error in adding action:", data);
                    setErrorContent(data.message);
                    return;
                }
                // Now, we... well, I don't know what to do now
            });
    }

    return (
        <div>
            <p>
                <span style={{fontWeight:"bold", marginRight:20}}>{props.tile.buildType.name}</span>
                <span style={{ marginRight: 20}}>Dev level: {props.tile.building.devlevel}</span>
                <span>Fort level: {props.tile.building.fortlevel}</span>
            </p>
            <p>{props.tile.buildType.description}</p>
            {/*If there is an active process for this building, show it here */}
            {typeof props.tile.process === 'undefined' ? (
                <p>No activity</p>
            ):(
                <div>
                    <p className="singleline simpletitle">
                        Current Activity:
                    </p>
                    <div style={{ justifyContent:'center', display:'flex', marginRight:20}}>
                        {/* Show the name of this process */}
                        <div style={{flexBasis:'100%'}}>
                            <p className="singleline">
                                {props.tile.process.name}, priority {props.tile.process.priority}, workers 1
                            </p>

                            {/* Show input items, if there are any */}
                            {props.tile.process.inputGroup === 0 ? (
                                <p className="singleline">Input items: none</p>
                            ):(
                                <div>
                                    <p className="singleline">Input Items:</p>
                                    {props.tile.process.inputGroup.map((ele,key) => (
                                        <p key={key} className="singleline">
                                            {ele.name}, on hand={ele.onHand}, producing {ele.production}/hr
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Also show output items */}
                            {props.tile.process.outputGroup === 0 ? (
                                <p className="singleline">Output items: none</p>
                            ):(
                                <div>
                                    <p className="singleline">Output Items:</p>
                                    {props.tile.process.outputGroup.map((ele,key) => (
                                        <p key={key} className="singleline">
                                            {ele.name}, on hand={ele.onHand}, producing {ele.production}/hr
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Next, show an input box for priority, to allow the user to change it */}
                        <div style={{ flexBasic: "100%" }}>
                            <p className="singleline">
                                Priority:{" "}
                                <DanInput
                                    default={props.tile.process.priority}
                                    onUpdate={(f, value) => setPriority(value)}
                                    onEnter={changePriority}
                                    onBlur={changePriority}
                                />
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/*Now, show a list of possible actions this building provides */}
            <p className="singleline" style={{ fontWeight: "bold" }}>
                {props.tile.process === null ? "" : "Other "}Actions
            </p>
            {props.tile.actions.map((ele, key) => {
                if (ele === pickedAction) {
                    return (
                        <div key={key} style={{ border: "1px solid black", margin: 8 }}>
                            <p className="singleline" style={{ textAlign: "center" }}>
                                {ele.name}
                            </p>
                            <p className="singleline">
                                # of workers: <DanInput onUpdate={changeActionWorkers} fieldName={"actionWorker"} default={actionWorkers} />
                                Range: {ele.minWorkers} to {ele.maxWorkers}
                            </p>
                            <p className="singleline">
                                Resources Needed: <span style={{ margin: 8 }}></span>
                                {ele.inputGroup === 0
                                    ? "none"
                                    : ele.inputGroup.map((item, kel) => (
                                          <span key={kel} className="commalist">
                                              {item.name} x{item.amount} (have {item.amount === undefined ? 0 : item.amount})
                                          </span>
                                      ))}
                            </p>
                            <p className="singleline">
                                Resources Produced: <span style={{ margin: 8 }}></span>
                                {ele.outputGroup === 0
                                    ? "none"
                                    : ele.outputGroup.map((item, kel) => (
                                          <span key={kel} className="commalist">
                                              {item.name} x{item.amount} (have {item.amount === undefined ? 0 : item.amount})
                                          </span>
                                      ))}
                            </p>
                            <p className="singleline" style={{ textAlign: "center" }}>
                                <span className="fakelink" onClick={() => startAction(ele.name)}>
                                    Start Work
                                </span>
                            </p>
                        </div>
                    );
                }
                return (
                    <div key={key} style={{ cursor: "pointer" }} onClick={() => setPickedAction(ele)}>
                        {ele.name}
                    </div>
                );
            })}
            <ErrorOverlay content={errorContent} onContinue={setErrorContent} />
        </div>
    )
}

