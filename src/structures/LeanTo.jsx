/*  LeanTo.jsx
    Provides a lean-to, the first building for players. A primitive shelter that can be built anywhere that has trees. Consists only of a stick leaning against a tree, with
    leafy branches laid on top. Doesn't require tools to be built!
    For the game Settlers & Warlords
*/

import React from "react";
//import * as Three from "three";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import {imageURL, textureURL } from "../App.js";

import { game } from "../game.jsx";

export default function LeanTo() {
    // Returns an object that can generate new structures, and also provides basic data about the structure. This object will be attached to the game object under
    // game.structureTypes. game.structures will contain all active instances of this structure

    return {
        name: 'Lean-To',
        image: 'leanto.png',
        tooltip: 'Your first shelter',
        locked: 0,
        prereq: [],
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
                id: game.getNextStructureId(),
                state: 'not built',
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name:'Build', // because somebody has to go bring the materials here and put it all together
                        workerTime:20*20,  // 20 seconds
                        toolsNeeded: [],
                        canAssign: ()=>false,  // This is set when the building is placed down; players cannot set it
                        canWork: ()=>{
                            // Returns true if a worker can be assigned this task at this time.
                            // This is separate from canAssign, as that determines if the player can assign this task to the structure
                            //return (b.state==='not built');
                            if(b.state==='not built') return '';
                            return 'No work needed';
                        },
                        workLocation: (tile, position) => {
                            // Returns true if this location is suitable for completing this job

                            // The only valid location for this task is at the site
                            return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                        },
                        doWork: () => {
                            // Returns true if the work here is done. This may apply a new path to the worker if necessary.
                            b.workProgress++;
                            if(b.workProgress>=b.recipe.workerTime) {
                                b.state = 'in use';
                                b.workerAssigned.job = null;
                                b.workerAssigned = null;
                                b.recipe = null;
                            }
                        },
                    }
                ],
                update: ()=>{},
                /*doWork: () => {
                    if(b.recipe.name==='Build') {
                        b.workProgress++;
                        if(b.workProgress>=b.recipe.workerTime) b.recipe.onComplete();
                    }
                },*/
                Render: () => {
                    const { nodes, materials } = useGLTF(textureURL +"models/leanto.gltf");
                    const textures = useLoader(TextureLoader, [
                        textureURL +"localtiles/dirt.png",
                        textureURL +"localtiles/oakbark.png",
                        textureURL +"localtiles/leafyfloor.png"
                    ]);
                    return (
                        <React.Suspense fallback={
                            <mesh position={[b.position[0], 0, b.position[2]]}>
                                {/* this is in case the real model doesn't work */}
                                <boxGeometry args={[.75,.75,.75]} />
                                <meshPhongMaterial color={(b.state==='in use'?'green':'red')} opacity={0.4} transparent />
                            </mesh>
                        }>
                            <mesh
                                position={[b.position[0], 0.55, b.position[2]]}
                                scale={[.5,.5,.5]}
                                geometry={nodes.Base.geometry}
                                material={materials.BaseMaterial}
                            >
                                <meshStandardMaterial map={textures[0]} />
                                <mesh
                                    geometry={nodes.Support.geometry}
                                    material={materials.SupportMaterial}
                                >
                                    <meshStandardMaterial map={textures[1]} />
                                </mesh>
                                <mesh
                                    geometry={nodes.Canopy.geometry}
                                    material={materials.CanopyMaterial}
                                >
                                    <meshStandardMaterial map={textures[2]} />
                                </mesh>
                            </mesh>
                            
                        </React.Suspense>
                    );
                },
                RightPanel: () => {
                    return <div>Status: {b.state}</div>;
                },
                save: ()=> {
                    // Outputs data needed to save this structure to the server
                    return {state: b.state};
                }
            };
            b.recipe = b.recipes[0];
            tile.structure = b.id;
            tile.modified = 1;
            // On creation, we can trigger this task as completed. We don't have to wait for it to finish being built.
            game.tutorialTask.find(i=>i.name==='Shelter').status=1;
            return b;
        }
    }
}
