/*  OneTile.jsx
    Manages displaying individual tiles of the world
    For the game Settlers & Warlords
*/

import React from "react";
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

export function OneTile(props) {
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
                dHash.push({form:'.', show:tile.floor});
                if(x===0 || z===0) cHash.push({form:'.', show:tile.floor});
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


