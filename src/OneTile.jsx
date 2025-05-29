/*  OneTile.jsx
    Manages displaying individual tiles of the world
    For the game Settlers & Warlords
*/

import React from "react";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import { textureURL } from "./App.js";
import { game } from "./game.jsx";
import { minimapTiles } from "./minimapTiles.js";


function FloorTile(props) {
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

function BlockTile(props) {
    // Handles displaying individual solid-block tiles. This handles loading the specific texture used to cover the block
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

export function BasicTile(props) {
    // Handles displaying individual tiles.
    // prop fields - data
    //      tile - What tile of the map to display
    //      key - key value gathered from using array.map
    //      onClick - Action taken when the user clicks on this tile. This must be passed to the mesh that handles it.

    // Note that this function and OneTile performs the same job. We're going to do things differently here; not worry about neighbor content, and just show _something_. Dynamic
    // rendering of tiles is going to be challenging, and... not something I personally enjoy. Besides, I don't have anything working yet. I should get something basic working
    // here, move on to other tasks, and get back to figuring out tile rendering when necessary.

    const downSlope = useGLTF(textureURL +"models/slopehole3.gltf");
    const downSlopeTex = useLoader(TextureLoader, textureURL +"localtiles/dirt.png");

    if(typeof(props.tile.slope)==='undefined' || props.tile.slope===0) {
        // No slope content to worry about. Create like we used to
        if(props.tile.show===0) {
            return (
                <FloorTile 
                    key={props.key}
                    position={[props.tile.x,0,props.tile.z]}
                    tex={minimapTiles[Math.abs(props.tile.floor)].img}
                    onClick={props.onClick}
                />
            );
        }else{
            // Check if this is a tree type. If so, we can generate a block on top, and call it a tree tile
            if(minimapTiles[props.tile.show].category==='tree') {
                return (
                    <>
                        <FloorTile 
                            key={props.key}
                            position={[props.tile.x, 0, props.tile.z]}
                            tex={minimapTiles[Math.abs(props.tile.floor)].img}
                            onClick={props.onClick}
                        />
                        <BlockTile
                            key={props.key+1}
                            position={[props.tile.x, 0, props.tile.z]}
                            tex={minimapTiles[Math.abs(props.tile.show)].img}
                            onClick={props.onClick}
                        />
                    </>
                );
            }else{
                // Something new is here... we need to render something, at least
                return (
                    <>
                        <BlockTile 
                            key={props.key}
                            position={[props.tile.x, 0, props.tile.z]}
                            tex={minimapTiles[Math.abs(props.tile.show)].img}
                            onClick={props.onClick}
                        />
                        {/* Draw a white ball above this tile, to show something is up with it 
                        <mesh position={[props.tile.x, 0.5, props.tile.z]}>
                            <sphereGeometry args={[1,16,16]} />
                            <meshPhongMaterial color={"white"} />
                        </mesh>*/}
                    </>
                );
            }
        }
    }else{
        // Check if we have a slope of some kind
        if(props.tile.slope===1) {
            // It's an up-slope! Draw a small box above the tile floor
            return (
                <>
                    <FloorTile 
                        key={props.key}
                        position={[props.tile.x, 0, props.tile.z]}
                        tex={minimapTiles[Math.abs(props.tile.floor)].img}
                        onClick={props.onClick}
                    />
                    <BlockTile key={props.key+1} position={[props.tile.x, 0, props.tile.z]} tex={minimapTiles[1].img} scale={[0.5,0.5,0.5]} />
                </>
            );
        }
        if(props.tile.slope===-1) {
            // It's a down-slope! Unlike regular tiles, I can't simply insert a void-space into a FloorTile (without doing some funky mesh editing).
            // So we'll need a model for this one.
            return (
                <React.Suspense fallback={
                    <mesh key={props.key} position={[props.tile.x, 0, props.tile.z]} onClick={props.onClick}>
                        <boxGeometry args={[.75,.75,.75]} />
                        <meshPhongMaterial color={'red'} opacity={0.4} transparent />
                    </mesh>
                }>
                    <mesh
                        key={props.key}
                        position={[props.tile.x, 0, props.tile.z]}
                        scale={[1,1,1]}
                        geometry={downSlope.nodes.CubeFloor.geometry}
                        material={downSlope.materialsCubeFloorMaterial}
                        onClick={props.onClick}
                    >
                        <meshStandardMaterial map={downSlopeTex} />
                    </mesh>
                </React.Suspense>
            );
        }
    }
}

export function OmniTile(props) {
    // Handles displaying individual tiles.
    // prop fields - data
    //      tile - What tile of the map to display
    //      key - key value gathered from using array.map

    // The real objective of this tile is to be able to wrap the onClick functionality into a single object

    // No matter what type of tile we have, we still need to generate data based on what is around this tile.
    // Unlike before, we will generate objects in an array, instead of a string
    let dHash = [];
    let cHash = [];
    for(let x=-1; x<=1; x++) {
        for(let z=-1; z<=1; z++) {
            if(x===0 && z===0) continue;  // Don't worry about the current tile we're in, for this part
            let neighbor = game.tiles[props.tile.x+x][props.tile.y][props.tile.z+z];
            if(typeof(neighbor)==='undefined' || typeof(neighbor.slope)==='undefined') { // Account for missing edge tiles
                dHash.push({form:'.', show:props.tile.floor});
                if(x===0 || z===0) cHash.push({form:'.', show:props.tile.floor});
                continue;
            }
            if(neighbor.tile!==0) { // Aka not air, so a solid block
                dHash.push({form:'f', show:neighbor.tile});
                if(x===0 || z===0) cHash.push({form:'f', show:neighbor.tile});
                continue;
            }
            if(neighbor.floor===0) { // aka ground is open to air
                dHash.push({form:'o', show:neighbor.tile});
                if(x===0 || z===0) cHash.push({form:'o', show:neighbor.tile});
                continue;
            }
            if(neighbor.slope===1) {  // It's an up-slope!
                dHash.push({form:'u', show:neighbor.tile});
                if(x===0 || z===0) cHash.push({form:'u', show:neighbor.tile});
                continue;
            }
            if(neighbor.slope===-1) {  // It's a down-slope!
                dHash.push({form:'d', show:neighbor.tile});
                if(x===0 || z===0) cHash.push({form:'d', show:neighbor.tile});
                continue;
            }
        }
    }

    // Next, decide what to show for this tile.  If there is no tile in this square, our job should be... pretty easy
    if(typeof(props.tile.slope)==='undefined' || props.tile.slope===0) {
        // Also consider if this tile has anything solid in it
        if(typeof(props.tile.tile)==='undefined' || props.tile.tile===0) {
            return (
                <FloorTile position={[props.tile.x,0,props.tile.z]} tex={minimapTiles[Math.abs(props.tile.floor)].img} />
            );
        }else{

        }
    }
}


