/*  GameDisplay.jsx
    Manages displaying the game to the player, so they can interact with it
    For the game Settlers & Warlords
*/

import React from "react";
import * as Three from "three";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import { DAX } from "./libs/DanAjax.js";
import { serverURL, imageURL, textureURL, chunkSize } from "./App.js";
import { game } from "./game.jsx";
import { minimapTiles } from "./minimapTiles.js";
import { BasicTile } from "./OneTile.jsx";


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
        <mesh position={props.position} onClick={props.onClick} scale={props.scale} >
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

    /* Game is now responsible for storing all map tiles, and as such, also responsible for loading new tile content */
    const [layerShown, setLayerShown] = React.useState(0);

    //console.log(props.player.x+game.displayLayer);

    // Before we can show a map, we need to pick out the tiles needed to be displayed
    let showTiles = [];
    for (let x = Math.floor(props.player.x) - 10; x <= Math.floor(props.player.x) + 10; x++) {
        for (let z = Math.floor(props.player.z) - 10; z <= Math.floor(props.player.z) + 10; z++) {
            if (
                typeof game.tiles[x] !== "undefined" &&
                typeof game.tiles[x][Math.floor(props.player.y+game.displayLayer)] !== "undefined" &&
                typeof game.tiles[x][Math.floor(props.player.y+game.displayLayer)][z] !== "undefined"
            ) {
                showTiles.push({ ...game.tiles[x][Math.floor(props.player.y+game.displayLayer)][z], x: x, y: props.player.y, z: z });
            }
        }
    }
    return <GameDisplay showTiles={showTiles} player={props.player} layerShown={layerShown} setLayerShown={setLayerShown} />;
}

function GameDisplay(props) {
    // Manages displaying the actual game. Because React-Three/Fiber displays refresh every second, doing heavy operations like filtering out target tiles leads to the
    // game lagging for more time than a frame update can handle... leading to the whole app freezing before anything is shown.
    // This component will be in charge of displaying the correct tiles, while Game() will manage what tiles should be fed to the display
    // prop fields - data
    //     showTiles - flat list of tiles to be displayed, ideally centered around the player
    //     player - a player object, holding the player's position

    const [lightMode, setLightMode] = React.useState("day");
    const [buildSelected, setBuildSelected] = React.useState(null);
    const [tileSelected, setTileSelected] = React.useState(null);
    const [showTutorial, setShowTutorial] = React.useState(0);
    const [tutorialSelected, setTutorialSelected] = React.useState(-1); // -1 represents no tutorial mode selected
    //const [layerShown, setLayerShown] = React.useState(0); // Adjustments here will be based on the player's current Y position

    /* This is part of Option One to display map tiles
    const tileSet = minimapTiles.map((tile) => {
        return <Tiletexture key={tile.id} tilePic={tile.img} />;
    });
    */

    //const { nodes, materials } = useGLTF(textureURL +"models/slopeoneup.gltf");
    const slope1up = useGLTF(textureURL +"models/slopeoneup.gltf");
    const slopeTextures = useLoader(TextureLoader, [
        textureURL +"localtiles/dirt.png"
    ]);
    //const slope1nodes = nodes;
    //const slope1materials = materials;

    function CameraDolly(props) {
        // React-Three hooks can only be used inside a <Canvas />.

        useFrame(({camera}) => {
            camera.position.x = game.playerPos[0];
            camera.position.z = game.playerPos[2];
        });
        return null;
    }

    return (
        <div
            key={10}
            id="canvas-container"
            style={{ position: "relative", height: "calc(100vh - 185px)" }}
            tabIndex="0"
            onKeyDown={(event)=>{
                if(event.key==='w' || event.key==='ArrowUp') {
                    game.playerDirections.down = -1;
                    game.tutorialTask.find(i=>i.name==='Startup').status = 1;
                }
                if(event.key==='s' || event.key==='ArrowDown') {
                    game.playerDirections.down = 1;
                    game.tutorialTask.find(i=>i.name==='Startup').status = 1;
                }
                if(event.key==='a' || event.key==='ArrowLeft') {
                    game.playerDirections.right = -1;
                    game.tutorialTask.find(i=>i.name==='Startup').status = 1;
                }
                if(event.key==='d' || event.key==='ArrowRight') {
                    game.playerDirections.right = 1;
                    game.tutorialTask.find(i=>i.name==='Startup').status = 1;
                }
                //console.log(event.key +' down');
            }}
            onKeyUp={(event) => {
                if(event.key==='w' || event.key==='s' || event.key==='ArrowUp' || event.key==='ArrowDown') {
                    game.playerDirections.down = 0;
                }
                if(event.key==='a' || event.key==='d' || event.key==='ArrowLeft' || event.key==='ArrowRight') {
                    game.playerDirections.right = 0;
                }
                //console.log(event.key +' up');
            }}
        >
            <Canvas
                style={{
                    position: "relative",
                    backgroundColor: "#101010",
                }}
                camera={{ position: [props.player.x, 12, props.player.z], rotation: [-Math.PI / 2.0, 0, 0] }}
                // We are leaving the camera's starting position based on the player's location
            >
                <CameraDolly />
                {/* For daylight, I want to have a point light that circles the player, and fades in & out at the horizon. We'll have to work toward that, though */}
                <pointLight position={[+5, 2, -1]} intensity={10} distance={10} color={"#FFFFBB"} />

                {lightMode === "night" ? (
                    <>
                        <ambientLight color={"#000000"} />
                    </>
                ) : (
                    <pointLight position={[game.playerPos[0]+5, 20, game.playerPos[2]-1]} intensity={400} distance={100} color={"white"} />
                )}

                {/* Render the map. We will mainly focus on ground tiles here, but some may contain blocks on top as well */}
                {props.showTiles.map((tile, key) => {
                    // All this has now been delegated to the OneTile file
                    return (
                        <BasicTile
                            tile={tile}
                            key={key}
                            onClick={(e)=>{
                                if(game.mapInteracter!==null) {
                                    game.mapInteracter(e,tile);
                                    return;
                                }
                                if(buildSelected !== null) {
                                    let newBuild = buildSelected.create(tile);
                                    // To Do: Check for error state and show error to user
                                    game.structures.push(newBuild);
                                    // That... might be all we have to do really do here
                                    setBuildSelected(null);
                                    setTileSelected(tile);
                                }else{
                                    setTileSelected(tile);
                                }
                            }}
                        />
                    );
                })}
                {/* Now we need to display the worker icon */}
                <mesh position={[props.player.x,0,props.player.z]} scale={[0.3,0.3,0.3]}>
                    <capsuleGeometry args={[1,1,4,8]} />
                    <meshPhongMaterial color={"red"} />
                </mesh>

                {/* Don't forget to display the workers */}
                {game.workers
                    .filter((w) => {
                        return w.spot[1] === props.player.y;
                    })
                    .map((w, key) => {
                        // Now, compute the worker's offset position based on the path they are following
                        let xOff = 0;
                        let yOff = 0;
                        let walkLag = 100;  // If we don't find the correct tile, set walkLag to really high
                        if(w.stepProgress>0) {
                            // We need to 'carefully' read the game.tiles array. The tile that the worker is in might not be loaded yet
                            if(!(typeof(game.tiles[w.spot[0]])==='undefined' ||
                               typeof(game.tiles[w.spot[0]][w.spot[1]])==='undefined' ||
                               typeof(game.tiles[w.spot[0]][w.spot[1]][w.spot[2]])==='undefined')) {
                                let tile = game.tiles[w.spot[0]][w.spot[1]][w.spot[2]];
                                let facts = minimapTiles.find(u=>u.id===tile.floor);
                                if(typeof(facts)!=='undefined') {
                                    walkLag = facts.walkLag;
                                }
                            }
                            
                            // Extract the directional value from their current direction
                            let direction = parseInt(w.path[0]);
                            xOff = ((direction % 3) - 1) * w.stepProgress;
                            yOff = (Math.floor(direction / 3.0) - 1) * w.stepProgress;
                        }
                        return (
                            <mesh position={[w.spot[0] + (xOff/walkLag), 0, w.spot[2] + (yOff/walkLag)]} scale={[0.3, 0.3, 0.3]}>
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
                        const RenderMesh = s.Render;
                        return (<RenderMesh />);
                    })}
            </Canvas>
            <div style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "lightgrey", padding: 5, fontWeight: "bold" }}>
                Player position: {game.playerPos[0]} x {game.playerPos[2]}<br />
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
                {game.structureTypes.filter(st=>st.locked===0).map((st, key) => {
                    return (
                        <div
                            style={{ border: "2px solid " + (st === buildSelected ? "red" : "black"), margin: 1, cursor: "pointer" }}
                            onClick={() => {
                                game.mapInteracter = null;
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
            {/* We also need buttons to control the viewed Y layer */}
            <div style={{position:'absolute', bottom:0, left:0, backgroundColor:'white', padding:5}} >
                <img
                    src={imageURL +'levelup.png'}
                    onClick={()=>{
                        props.setLayerShown(props.layerShown+1);
                        game.displayLayer++;
                    }}
                /><br />
                <img
                    src={imageURL +'levelplayer.png'}
                    onClick={()=>{
                        props.setLayerShown(0);
                        game.displayLayer = 0;
                    }}
                /><br />
                <img
                    src={imageURL +"leveldown.png"}
                    onClick={()=>{
                        props.setLayerShown(props.layerShown-1);
                        game.displayLayer--;
                    }}
                />
            </div>
            {/* Show a tutorial button*/}
            <div style={{position:'absolute', top:0, left:100, maxWidth:500, backgroundColor:'white', padding:5}}>
                {showTutorial===0?(
                    <>
                        <img className="fakelink" src={imageURL +"TutorialButton.png"} onClick={()=>setShowTutorial(1)} />
                        {/* Include a Save button. We don't keep this in the final game, but right now it is important to control how the game saves, until it is reliable */}
                        <div className="fakelink" onClick={()=>game.save()}>Save</div>
                    </>
                ):
                    tutorialSelected===-1?(
                        <>
                            <img src={imageURL +"exit.png"} className="fakelink" onClick={()=>setShowTutorial(0)} />
                            {game.tutorialTask.filter(task => {
                                // First, see if we have already completed & closed this task
                                if(game.tutorialComplete.some(done=>done===task.name)) return false;

                                // Next, see if we have unlocked this task
                                if(task.prereq.length===0) return true;
                                return game.tutorialComplete.some(done=>done===task.prereq[0]);
                                //if(game.tutorialComplete.some(done=>done===task.prereq[0]))
                            }).map((task,key)=>(
                                <div key={key} className="fakelink" onClick={()=>setTutorialSelected(task.id)}>
                                    {task.name}
                                </div>
                            ))
                        }</>
                    ):(
                        <>
                            <img src={imageURL +'exit.png'} className="fakelink" onClick={()=>setTutorialSelected(-1)} />
                            {game.tutorialTask[tutorialSelected].desc}
                            {game.tutorialTask[tutorialSelected].status===1?(
                                <span className="fakelink" onClick={()=>{
                                    game.tutorialComplete.push(game.tutorialTask[tutorialSelected].name);
                                    setTutorialSelected(-1);
                                }}>Complete</span>
                            ):('')}
                        </>
                    )
                }
                
                
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
        const SidePanel = building.RightPanel;
        const canWork = (building.recipe===null? '':building.recipe.canWork());
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
                        {building.recipes.filter(r=>r.canAssign()).map((r,key)=>{
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
                        <span style={{fontWeight:'bold', marginRight:10}}>Task: {building.recipe===null?('None'):(building.recipe.name)}</span>
                        {canWork===''?(
                            <>Progress: {Math.floor(building.workProgress*100.0/building.recipe.workerTime)}%</>
                        ):(
                            <>Can't work: {canWork}</>
                        )}                        
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


