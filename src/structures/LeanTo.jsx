/*  LeanTo.jsx
    Provides a lean-to, the first building for players. A primitive shelter that can be built anywhere that has trees. Consists only of a stick leaning against a tree, with
    leafy branches laid on top. Doesn't require tools to be built!
    For the game Settlers & Warlords
*/

import React from "react";
//import * as Three from "three";
//import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
//import { useGLTF } from "@react-three/drei";
//import { TextureLoader } from "three/src/loaders/TextureLoader";

export default function LeanTo() {
    // Returns an object that can generate new structures, and also provides basic data about the structure. This object will be attached to the game object under
    // game.structureTypes. game.structures will contain all active instances of this structure

    return {
        name: 'Lean-To',
        image: 'leanto.png',
        tooltip: 'Your first shelter',
        locked: 0,
        prereqs: [],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on the selected tile. Otherwise, the return value will be an error string
            // To do: Determine all forest tiles and update this function to only allow building in a forest tile
            return '';
        },
        create: tile => {
            let b = {
                name: 'Lean To',
                desc: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                       for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                       on top, this is fast & easy to set up, but won't last long in the elements itself.`,
                image: 'leanto.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                state: 'not built',
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name:'Build', // because somebody has to go bring the materials here and put it all together
                        workerTime:20*20,  // 20 seconds
                        canAssign: ()=>{
                            return false;
                        },
                        canWork: ()=>{
                            // Returns true if a worker can be assigned this task at this time.
                            // This is separate from canAssign, as that determines if the player can assign this task to the structure
                            return (b.state==='not built');
                        },
                        onComplete: ()=>{
                            b.state = 'in use';
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                            b.recipe = null;
                        }
                    }
                ],
                update: ()=>{},
                doWork: () => {
                    if(b.recipe.name==='Build') {
                        b.workProgress++;
                        if(b.workProgress>=b.recipe.workerTime) b.recipe.onComplete();
                    }
                },
                render: () => {
                    return (
                        <mesh position={[b.position[0], 0, b.position[2]]}>
                            <boxGeometry args={[.75,.75,.75]} />
                            <meshPhongMaterial color={(b.state==='in use'?'green':'red')} opacity={0.4} transparent />
                        </mesh>
                    );
                },
                rightPanel: () => {
                    return <div>Status: {b.state}</div>;
                    //return <div>Hello world!</div>;
                }
            };
            b.recipe = b.recipes[0];
            return b;
        }
    }
}
