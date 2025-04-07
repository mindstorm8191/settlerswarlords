/*  RopeMaker.jsx
    Allows players to use fibers to produce rope products. Ropes are very expensive in early technology, but extremely useful in a lot of ways, especially when making tools.
    For the game Settlers & Warlords
*/

import React from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
//import { useGLFT } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { imageURL, textureURL } from "../App.js";

import { game } from "../game.jsx";

export default function RopeMaker() {
    // Returns an object that can generate new structures

    return {
        name: 'Rope Maker',
        image: 'ropemaker.png', // Remember, this is relative to img/structures
        tooltip: 'Make ropes from fibers',
        locked: 1,
        prereq: [['Bark Fibers']],
        canBuild: (tile) => {
            // Determines if this structure can be built at this location. Returns an empty string if so, or an error string to show the user if not.
            return '';
        },
        create: tile => {
            let b = {
                name: 'Rope Maker',
                descr: `Rope is an essential tool, providing hundreds of potential uses to get things done. It has been used for thousands of years, and is still in use today. Your
                early rope sources will be limited, and large ropes will be costly, but some tasks cannot be done without it. Crafting rope does not require tools, but can go much
                faster with them.`,
                image: 'ropemaker.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                canGetItems: false,
                recipes: [
                    {
                        name: 'Small Rope from Bark Fibers',
                        // We're not going to have workers choose the best recipe here! That will be the player's responsibility now.
                        workerTime: 20 * 40, // 40 seconds
                        toolsNeeded: [],
                        itemsNeeded: [{name: 'Bark Fibers', qty: 1}],
                        canAssign: ()=>true,
                        canWork: ()=>{
                            // Returns true if this can can currently be worked by a worker
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return false;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            return (mytile.items.reduce((carry,item) => {
                                if(item.name==='Small Rope') carry++;
                                return carry;
                            }, 0) < 5) && mytile.items.some(i=>i.name==='Bark Fibers');
                        },
                        workLocation: (tile, position) => {
                            // Returns true if this location is suitable for completing this job
                            return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                        },
                        doWork: () => {
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;
                            b.workProgress = 0;

                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return;
                            let slot = mytile.items.findIndex(i=>i.name==='Bark Fibers');
                            if(slot===-1) {
                                console.log('Error at RopeMaker: work completed but there is no Bark Fibers here');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.items.push(game.createItem('Small Rope', {}));
                            mytile.modified = 1;

                            if(b.recipe.canWork()) return;
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    }
                ],
                Render: () => {
                    const texture = useLoader(TextureLoader, textureURL +'structures/ropemaker.png');
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"orange"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                }
                // This structure doesn't need a save function
            };
            tile.structure = b.id;
            tile.modified = 1;
            return b;
        }
    }
}