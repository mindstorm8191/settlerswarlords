// component - LocalMap.jsx
// Provides an interface for users to interact with the map local to where the player is located
// for the game Settlers & Warlords

import React from "react";
import { DAX } from "./DanAjax.js";
import { serverURL, imageURL, PageChoices, buildingList, gameLocalTiles } from "./App.js";
import { DanInput } from "./DanInput.jsx";
import { ErrorOverlay} from "./comp_ErrorOverlay.jsx";

export function localMap_fillFromServerData(mapContent) {
    // Handles a bit of processing for the local map
    // mapContent - data received from the server
    // Returns an updated package of map content

    return mapContent.map(tile => {
        // Right now, we only need to make sure all tiles have a buildid field. Since we get no buildings from the server, this should be simple
        tile.buildid = 0;
        return tile;
    });
}

export function LocalMap(props) {
    // Handles displaying local map content, along with buildings and their options on the right side
    // prop fields - data
    //      localTiles - All tiles of the local map
    //      localStats - Additional information about this local map
    // prop fields - functions
    //      setPage      - handles changing the selected page. Only passed to TabPicker
    //      onTileUpdate - handles any map tiles that have been updated

    // minimap images could be global later, but for now we only need them here
    const minimapImages = ["emptygrass.jpg", "pinetreetwo.jpg", "basicrock.jpg", "desert.jpg", "smallpond.jpg", "basicrock.jpg", "basicore.jpg"];
    const [selected, setSelected] = React.useState(null); // which square is selected to show details on the right
    const [scrollPos, setScrollPos] = React.useState({moveState:false,x:0,y:0});

    function startPan() {
        setScrollPos({...scrollPos, moveState:true});
    }

    function continuePan(e) {
        if(!scrollPos.moveState) return;
        setScrollPos({moveState:true, x:scrollPos.x+e.movementX, y:scrollPos.y+e.movementY});
    }

    function endPan() {
        setScrollPos({...scrollPos, moveState:false});
    }

    function placeBuilding(buildingName) {
        // Check that we have a map tile selected, and that there is no building declared here
        if(selected===null) return;
        if(selected.buildid!==0) return;

        // Let's start by creating our object first
        let b = {
            id: (buildingList.length===0)?1:buildingList[buildingList.length-1].id+1,
                // We can pick a unique ID by looking at the last building, and going +1 of that - as long as the list isn't empty
                // This will only work until we prioritize buildings (to use work points correctly)
            image: imageURL+'leanto.png',
            mode: 'building',
            progressBar: 0,
            progressBarMax: 120,
            progressBarColor: 'brown',
            tileX: selected.x,
            tileY: selected.y,
            update: () => {
                if(b.mode==='building') {
                    b.progressBar++;
                    if(b.progressBar>=120) {
                        b.mode = 'in use';
                        b.progressBar = 300;
                        b.progressBarMax = 300;
                        b.progressBarColor = 'green';
                    }
                }else{
                    b.progressBar--;
                    if(b.progressBar<=0) {
                        b.mode = 'building';
                        b.progressBar = 0;
                        b.progressBarMax = 120;
                        b.progressBarColor = 'brown';
                    }
                }
            }
        }
        buildingList.push(b);
        
        // We also need to update the local tiles
        let tile = gameLocalTiles.find(ele=>ele.x===selected.x && ele.y===selected.y);
        tile.buildid = b.id;

        // Update the specific tile. We already have a function to help us do that; it accepts any number of updated tiles,
        // swapping out any based on X&Y coordinates
        props.onTileUpdate([{...selected, buildid:b.id, buildimage:b.image}]);
    }

    return (
        <>
            <div style={{display:'flex', width:'100%'}}>
                <div>
                    <span className="haslinespacing">Biome: {props.localStats.biome}</span>
                    <span className="haslinespacing">Population: {props.localStats.population}</span>
                    <PageChoices selected={"localmap"} onPagePick={props.setPage} />
                </div>
            </div>
            <div style={{display:'flex', width:'100%'}}>
                <div style={{width:180}}>
                    <img src={imageURL +'leanto.png'} alt="leanto" onClick={()=>placeBuilding('leanto')}/>
                    <img src={imageURL +'foragepost.png'} alt="forage post"/>
                    <img src={imageURL +'rockKnapper.png'} alt="rock knapper"/>
                    <img src={imageURL +'toolbox.png'} alt="toolbox"/>
                </div>
                <div id="localmapbox">
                    {/* This is the map container, that helps us scroll the whole map at once */}
                    <div
                        style={{position:'absolute', top:scrollPos.y, left:scrollPos.x}}
                        onMouseDown={startPan}
                        onMouseMove={continuePan}
                        onMouseUp={endPan}
                    >
                        {props.localTiles.map((tile, key) => {
                            let hasConstruction=0;
                            
                            return (
                                <div
                                    style={{
                                        display: "block",
                                        position: "absolute",
                                        width: 55,
                                        height: 55,
                                        top: tile.y * 57,
                                        left: tile.x * 57,
                                        backgroundImage: "url(" + imageURL + minimapImages[tile.landtype] + ")",
                                        backgroundColor: 'green',
                                        cursor: "pointer",
                                        border: (tile===selected)?'1px solid black':'1px solid green'
                                    }}
                                    key={key}
                                    onClick={() => setSelected(tile)}
                                >
                                    {parseInt(tile.buildid) === 0 ? (
                                        ""
                                    ) : (
                                        <>
                                            <img src={tile.buildimage} alt={"building"} style={{ pointerEvents: "none" }} draggable="false"/>
                                            {typeof(tile.progressBar)==='undefined'? (''):
                                                <div style={{
                                                    backgroundColor: tile.progressBarColor,
                                                    bottom:0,
                                                    height:5,
                                                    width:tile.progressBar
                                                }}></div>
                                            }
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div id="localmaprightpane">
                    {selected === null ? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid) === 0 ? (
                        <EmptyLand
                            landType={selected.landtype}
                            onTileUpdate={props.onTileUpdate}
                            x={selected.x}
                            y={selected.y}
                        />
                    ) : (
                        <LocalTileBuildingDetail tile={selected} />
                    )}
                </div>
            </div>
        </>
    );
}

function EmptyLand(props) {
    // Shows information about an empty block that the user has selected
    // prop fields
    //      landType - land ID of the selected land. Helps determine what can be built at this location
    //      buildTypes - list of all the buildings available to the player. This is received from the server as a buildoptions array
    //      onTileUpdate - callback function to handle updating tiles when received from the server
    //      x - X coordinate on the localmap of this tile. Only used for sending data to the server
    //      y - Y coordinate

    function LandDescription() {
        // Provides a basic description of the land on this selected tile
        // landType - ID of the land type. This should be provided by props.landType

        switch (props.landType) {
            case 0: return <p>Grassland. Excellent for new construction and farming</p>;
            case 1: return <p>Forest. Best source of wood and other materials</p>;
            case 2: return <p>Barren rock. Easy source of stone materials and building on</p>;
            case 3: return <p>Desert. Hot and hard to build on</p>;
            case 4: return <p>Open water. A vital resource for life</p>;
            case 5: return <p>Hot lava! Very dangerous, even from a distance</p>;
            case 6: return <p>Slick ice. Very cold</p>;
            case 7: return <p>Snowed-over ground. Very cold</p>;
            default: return <p>Land type {props.landId} has not been coded yet</p>;
        }
    }

    return (
        <>
            {LandDescription()}
            <p className="singleline">Nothing is built here. Select a block from the left to place it here</p>
        </>
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

    
    return <>Hello world!</>;
}

