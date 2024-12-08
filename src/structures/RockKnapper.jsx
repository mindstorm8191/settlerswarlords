/*  RockKnapper.jsx
    Provides a structure to let players create their first tools. Rock Knapping is the art of hammering rocks together to shape rocks into tools. Many bloody fingers has become
    the byproduct of this field
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export default function RockKnapper() {
    // Returns an object that can generate new Rock Knapper structures. The structure itself will require no assembly, but must be built on rocky surfaces, where rocks can
    // be found & used

    return {
        name: 'Rock Knapper',
        image: 'rockknapper.png',
        tooltip: 'Create your first tools',
        locked: 0,
        prereqs: [],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on the selected tile. Otherwise, it will return an error string to show to the user
            // To do: Determine all rock based tiles and update this function to only allow building on those tiles. We will also need to update GameDisplay()
            // to provide the error to the user
            return '';
        },
        create: (tile) => {
            let b = {
                name: 'Rock Knapper',
                desc: `Tools are critical to survival, and rocks are your first craftable tools. Rock knapping is the art of smashing rocks into the shapes you need.`,
                image: 'rockknapper.png',
                position: [tile.x, tile.y, tile.z],  // remember kids, this is an array, not an object. X is at position[0], not position.x
                size: [1,1,1],
                state: 'not built',
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name: 'Craft Flint Knife',
                        workerTime: 20*8, // 8 seconds
                        canWork: ()=> {
                            // Returns true if this task can currently be worked by a worker. This will determine when workers stop working here to find new work
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return false;
                            return (mytile.items.reduce((carry,item)=>{
                                if(item.name==='Flint Knife') {
                                    carry++;
                                }
                                return carry;
                            }, 0)<5);
                        },
                        onComplete: ()=>{
                            // Add this item to a tile
                            // Start with getting the correct tile
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') {
                                console.log("Error! Could not find correct tile to put new item");
                                return;
                            }
                            mytile.items.push({name:'Flint Knife', endurance:60, efficiency:1});
                            b.workProgress = 0;
                        }
                    },{
                        name: 'Craft Flint Stabber',
                        workerTime: 20*8, // 8 seconds
                        canWork: ()=>{
                            // Returns true if this task can currently be worked by a worker.
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return false;
                            return (mytile.items.reduce((carry,item)=>{
                                if(item.name==='Flint Stabber') {
                                    carry++;
                                }
                                return carry;
                            }, 0)<5);
                        },
                        onComplete: ()=>{
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return;
                            mytile.items.push({name:'Flint Stabber', endurance:60, efficiency:1});
                            b.workProgress = 0; // On second though, setting this should be in the calling code, not here every time
                        }
                    }

                ],
                doWork: () => {
                    b.workProgress++;
                    if(b.workProgress>=b.recipe.workerTime) {
                        b.recipe.onComplete();
                        if(!b.recipe.canWork()) {
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
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
                //rightPanel: () => {
                  //  return <div>Hello world!</div>;
                //}
            };
            return b;
        }
    }
}
