/*  GameDisplay.jsx
    Manages displaying the game to the player, so they can interact with it
    For the game Settlers & Warlords
*/

import React from "react";
import * as Three from "three";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
//import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import { DAX } from "./libs/DanAjax.js";
import { serverURL, imageURL, textureURL, chunkSize } from "./App.js";
import { game } from "./game.jsx";
import { minimapTiles } from "./minimapTiles.js";


function OneTile(props) {
    // Handles displaying individual tiles. This manages loading the specific texture to show as it loads
    // prop fields - data
    //    position = 3D coordinates of where tile should be
    //    tex = name of texture to load. This assumes all textures are at `textureURL +"localtiles/"+tex`
    // prop fields - functions
    //    onClick - passes onClick events to this mesh

    const texture = useLoader(TextureLoader, textureURL + "localtiles/" + props.tex);

    return (
        <mesh position={props.position} rotation={[-Math.PI / 2.0, 0, 0]} onClick={props.onClick}>
            <planeGeometry args={[1, 1]} />
            <React.Suspense fallback={<meshPhongMaterial color={"yellow"} />}>
                <meshStandardMaterial map={texture} />
            </React.Suspense>
        </mesh>
    );
}

function OneBlock(props) {
    // Handles displaying individual blocks. This handles loading the specific texture used to cover the block
    // prop fields - data
    //    position - 3D coordinates of where this cube should be
    //    tex - name of the texture to load. This assumes all textures are at (textureURL +"localtiles/"+ tex)
    // prop fields - functions
    //    onClick - passes onClick events to this mesh

    const texture = useLoader(TextureLoader, textureURL +"localtiles/"+ props.tex);

    return (
        <mesh position={props.position} onClick={props.onClick} >
            <boxGeometry args={[1,1,1]} />
            <React.Suspense fallback={<meshPhongMaterial color={"orange"} />}>
                <meshStandardMaterial map={texture} />
            </React.Suspense>
        </mesh>
    );
}

/*
const Tiletexture = ({ tilePic }) => {
    // This is part of Method One to show textures on the tiles we display
    const texture = useLoader(TextureLoader, textureURL + "localtiles/" + tilePic);
    return <meshStandardMaterial map={texture} />;
};
*/


export function ShowGame(props) {
    // Shows the main game screen
    // Prop fields - data
    // mapTiles - 3D array of tiles as collected from the server
    // player - details about the player, including their location. This will be used to determine camera position

    const [fetchMode, setFetchMode] = React.useState(true);

    React.useEffect(() => {
        // On load, we need to check the map's current range, to ensure there are enough tiles loaded that surround the player.
        // This can actually be a bit challenging; we need to group all map tiles into their respective chunks, to determine which set of chunks need loading
        // But, since any tile within a chunk can confirm or deny a chunk is loaded, we only have to look at a single tile for each chunk

        let chunksNeeded = [];
        let range = 1;
        for (let x = -range; x <= range; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -range; z <= range; z++) {
                    // Use Javascript tricks to check each slot of the array. Once one condition fails, it'll skip checking the rest
                    if (
                        typeof props.mapTiles[props.player.x + x * chunkSize] === "undefined" ||
                        typeof props.mapTiles[props.player.x + x * chunkSize][props.player.y + y * chunkSize] === "undefined" ||
                        typeof props.mapTiles[props.player.x + x * chunkSize][props.player.y + y * chunkSize][
                            props.player.z + z * chunkSize
                        ] === "undefined"
                    ) {
                        chunksNeeded.push([x, y, z]); // Note this stores based on chunk coords, not tile coords
                    }
                }
            }
        }
        if (fetchMode === true) {
            //console.log("Get " + chunksNeeded.length + " more chunks");
            if (chunksNeeded.length > 0) {
                setFetchMode(false); // Unfortunately, this trigger is always loading. To keep this script from constantly requesting map tiles, we need to
                // set a flag. This gets cleared after we receive new content
                if (chunksNeeded.length > 10) chunksNeeded.splice(10, chunksNeeded.length - 10); // Limit our fetch to 10 chunks
                fetch(serverURL + "/routes/loadmap.php", DAX.serverMessage({ chunkList: chunksNeeded }, true))
                    .then((res) => DAX.manageResponseConversion(res))
                    .catch((err) => console.log(err))
                    .then((data) => {
                        if (data.result !== "success") {
                            console.log("There was an error requesting map chunks", data);
                            return;
                        }
                        props.changeMapTiles(data.chunks);
                        setFetchMode(true);
                    });
            }
        } else {
            //console.log("Wait for chunks to load, waiting for " + chunksNeeded.length + " more chunks");
        }
    }, [props.mapTiles, props.player]);

    // Before we can show a map, we need to pick out the tiles needed to be displayed
    let showTiles = [];
    for (let x = Math.floor(props.player.x) - 10; x <= Math.floor(props.player.x) + 10; x++) {
        for (let z = Math.floor(props.player.z) - 10; z <= Math.floor(props.player.z) + 10; z++) {
            if (
                typeof props.mapTiles[x] !== "undefined" &&
                typeof props.mapTiles[x][props.player.y] !== "undefined" &&
                typeof props.mapTiles[x][props.player.y][z] !== "undefined"
            ) {
                showTiles.push({ ...props.mapTiles[x][props.player.y][z], x: x, y: props.player.y, z: z });
            }
        }
    }
    return <GameDisplay showTiles={showTiles} player={props.player} />;
}

function GameDisplay(props) {
    // Manages displaying the actual game. Because React-Three/Fiber displays refresh every second, doing heavy operations like filtering out target tiles leads to the
    // game lagging for more time than a frame update can handle... leading to the whole app freezing before anything is shown.
    // This component will be in charge of displaying the correct tiles, while Game() will manage what tiles should be fed to the display
    // prop fields - data
    //     showTiles - flat list of tiles to be displayed, ideally centered around the player

    const [lightMode, setLightMode] = React.useState("night");
    const [buildSelected, setBuildSelected] = React.useState(null);
    const [tileSelected, setTileSelected] = React.useState(null);

    /* This is part of Option One to display map tiles
    const tileSet = minimapTiles.map((tile) => {
        return <Tiletexture key={tile.id} tilePic={tile.img} />;
    });
    */

    return (
        <div key={10} id="canvas-container" style={{ position: "relative", height: "calc(100vh - 185px)" }}>
            <Canvas
                style={{
                    position: "relative",
                    backgroundColor: "#101010",
                }}
                camera={{ position: [0, 12, 0], rotation: [-Math.PI / 2.0, 0, 0] }}
            >
                {/* For daylight, I want to have a point light that circles the player, and fades in & out at the horizon. We'll have to work toward that, though */}
                <pointLight position={[5, 2, -1]} intensity={10} distance={10} color={"#FFFFBB"} />

                {lightMode === "night" ? (
                    <>
                        <ambientLight color={"#000000"} />
                    </>
                ) : (
                    <pointLight position={[5, 20, -1]} intensity={400} distance={100} color={"white"} />
                )}

                {/* Render the map. We will mainly focus on ground tiles here, but some may contain blocks on top as well */}
                {props.showTiles.map((tile, key) => {
                    if(tile.show!==-1 && minimapTiles[tile.show].category==='tree') {
                        return (
                            <>
                                <OneTile
                                    key={key}
                                    position={[tile.x, 0, tile.z]}
                                    tex={minimapTiles[Math.abs(tile.floor)].img}
                                    onClick={(e) => {
                                        // Note that the onClick event must work on the mesh. The OneTile component has to pass it to its mesh
                                        if (buildSelected !== null) {
                                            let newBuild = buildSelected.create(tile);
                                            // To do: check for error state and show error to user
                                            game.structures.push(newBuild);
                                            // That... might be all we actually have to do here
                                            setBuildSelected(null);
                                            setTileSelected(tile);
                                        } else {
                                            setTileSelected(tile);
                                        }
                                    }}
                                />
                                <OneBlock key={key+1} position={[tile.x,0,tile.z]} tex={minimapTiles[tile.show].img} /> 
                            </>
                        );    
                    }
                    return (
                        <OneTile
                            key={key}
                            position={[tile.x, 0, tile.z]}
                            tex={minimapTiles[Math.abs(tile.floor)].img}
                            onClick={(e) => {
                                // Note that the onClick event must work on the mesh. The OneTile component has to pass it to its mesh
                                if (buildSelected !== null) {
                                    let newBuild = buildSelected.create(tile);
                                    // To do: check for error state and show error to user
                                    game.structures.push(newBuild);
                                    // That... might be all we actually have to do here
                                    setBuildSelected(null);
                                    setTileSelected(tile);
                                } else {
                                    setTileSelected(tile);
                                }
                            }}
                        />
                    );
                })}
                {/* Don't forget to display the workers */}
                {game.workers
                    .filter((w) => {
                        return w.spot[1] === props.player.y;
                    })
                    .map((w, key) => {
                        return (
                            <mesh position={[w.spot[0], 1, w.spot[2]]} scale={[0.3, 0.3, 0.3]}>
                                <capsuleGeometry args={[1, 1, 4, 8]} />
                                <meshPhongMaterial color={"yellow"} />
                            </mesh>
                        );
                    })}

                {/* We also need to show each individual building */}
                {game.structures
                    .filter((s) => {
                        // Future task: determine what buildings are shown for buildings taller than one tile
                        return s.position[1] === props.player.y;
                    })
                    .map((s, key) => {
                        return s.render();
                    })}
            </Canvas>
            <div style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "lightgrey", padding: 5, fontWeight: "bold" }}>
                <span
                    style={{ marginRight: 15, cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => {
                        if (lightMode === "night") {
                            setLightMode("day");
                        } else {
                            setLightMode("night");
                        }
                    }}
                >
                    Toggle Day/Night
                </span>
            </div>
            <RightPanel tile={tileSelected} />
            {/* Create a space where players can select a building to put down */}
            <div style={{ position: "absolute", top: 0, left: 0, backgroundColor: "grey", padding: 5 }}>
                {/*<img src={imageURL + "structures/leanto.png"} alt={"lean to"} style={{ cursor: "pointer" }} />*/}
                {game.structureTypes.map((st, key) => {
                    return (
                        <div
                            style={{ border: "2px solid " + (st === buildSelected ? "red" : "black"), margin: 1, cursor: "pointer" }}
                            onClick={() => {
                                if (st === buildSelected) {
                                    setBuildSelected(null);
                                } else {
                                    setBuildSelected(st);
                                }
                            }}
                        >
                            <img src={imageURL + "structures/" + st.image} alt={st.name} key={key} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RightPanel(props) {
    // Determines what content to show on the right-side panel of the game. This is where players can interact with structures and other elements
    // prop fields - data
    //      tile - which tile is selected by the user

    if (props.tile === null) {
        return (
            <div style={{ position: "absolute", top: 0, right: 0, width:300, backgroundColor: "grey", padding: 5 }}>
                Click a tile to learn more about it
            </div>
        );
    }
    let tileData = minimapTiles[props.tile.floor];
    if (typeof tileData === "undefined") {
        // Some tile types aren't working correctly...
        return (
            <div style={{ position: "absolute", top: 0, right: 0, width:300, backgroundColor: "grey", padding: 5 }}>
                Error - tile type of {props.tile.floor} not found
            </div>
        );
    }

    //Next, determine if this tile has a structure associated with it.
    // To Do: Handle buildings larger than one block in size
    let building = game.structures.find((b) => {
        if (b.position[0] === props.tile.x && b.position[1] === props.tile.y && b.position[2] === props.tile.z) return true;
        return false;
    });
    if (typeof building !== "undefined") {
        const SidePanel = building.rightPanel;
        return (
            <div style={{ position: "absolute", top: 0, right: 0, width: 300, backgroundColor: "white", padding: 5, maxWidth: 300 }}>
                <div style={{ fontWeight: "bold" }}>{building.name}</div>
                {building.desc}
                <br />

                {/* Show the SidePanel content, that shows unique fields for this structure. Not all structure have (or need) a SidePanel function */}
                {typeof SidePanel === "undefined" ? "" : <SidePanel />}

                {/* Show facts about the recipe used here. If no recipe is selected, allow the user to pick one */}
                {building.recipe===null?(
                    <>
                        <div style={{fontWeight:'bold'}}>Select Recipe</div>
                        {building.recipes.map((r,key)=>{
                            return (
                                <div
                                    key={key}
                                    className="fakelink"
                                    onClick={()=>{
                                        building.recipe = r;
                                    }}
                                >
                                    {r.name}
                                </div>
                            );
                        })}
                    </>
                ):(
                    <div>
                        Progress: {Math.floor(building.workProgress*100.0/building.recipe.workerTime)}%
                        {/* I think we can also show a common scroll bar of progress percent here */}
                        <div className="fakelink" onClick={()=>{
                            building.recipe = null;
                            building.workProgress = 0;
                            if(building.workerAssigned!==null) {
                                console.log('Got workerAssigned type of '+ typeof(building.workerAssigned));
                                building.workerAssigned.job = null;
                                building.workerAssigned = null;
                            }
                        }}>Change Recipe</div>
                    </div>
                )}
                <ListItems tile={props.tile} />
            </div>
        );
    }

    return (
        <div style={{ position: "absolute", top: 0, right: 0, width: 300, backgroundColor: "grey", padding: 5 }}>
            {tileData.name}
            <br />
            {tileData.desc}
            <br />
            <ListItems tile={props.tile} />
        </div>
    );
}

function ListItems(props) {
    // Lists all items at a given location, grouping them as needed
    // prop fields - data
    //      tile - what tile to show the items for. All items are stored on tiles, not in structures

    // First, determine if this tile even has an items list; not all tiles will
    if(typeof(props.tile.items)==='undefined') {
        return <span>No items here (nd)[{props.tile.x},{props.tile.y},{props.tile.z}]</span>;
    }
    //console.log('Got items', props.tile.items);
    if(props.tile.items.length===0) {
        // The array exists but is empty
        return <span>No items here (0)[{props.tile.x},{props.tile.y},{props.tile.z}]</span>;
    }

    // Create a new list from the items list provided. This will ensure any similar items are shown with a count, instead of being listed twice
    let newList = [];
    for(let i=0; i<props.tile.items.length; i++) {
        let slot = newList.findIndex(item => item.name===props.tile.items[i].name);
        if(slot===-1) {
            // No matches found. Add to the list
            if(typeof(props.tile.items[i].amt)==='undefined') {
                newList.push({name:props.tile.items[i].name, amt:1});
            }else{
                newList.push({name:props.tile.items[i].name, amt:props.tile.items[i].amt});
            }
        }else{
            if(typeof(props.tile.items[i].amt)==='undefined') {
                newList[slot].amt++;
            }else{
                //console.log(newList[slot]);
                newList[slot].amt = newList[slot].amt + props.tile.items[i].amt;
            }
        }
    }

    return (<div>
        <div style={{fontWeight:'bold'}}>Items [{props.tile.x},{props.tile.y},{props.tile.z}]</div>
        {newList.map((item,key) => {
            return (<div key={key}>{item.name} {item.amt===1?'':'x'+item.amt}</div>);
        })}
    </div>);
}
