/*  LoggersPost.jsx
    Allows workers to collect wood items from trees in the surrounding area. This is the first structure that makes use of tools
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export default function LoggersPost() {
    // Returns an object that can generate new Loggers Post structures. The structure itself will require no assembly and can be placed anywhere. However, tools will need to
    // be given to the workers so they can perform their jobs

    return {
        name: 'Loggers Post',
        image: 'loggerspost.png',
        tooltip: 'Use tools to collect fresh wood',
        locked: 1, // Now is when we will need an unlockedItems array
        prereqs: [['Flint Knife', 'Flint Stabber']],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on the selected tile. Otherwise, it will return an error string to show to the user
            // This structure can be build anywhere (so far)
            return '';
        },
        create: (tile) => {
            let b = {
                name: 'Loggers Post',
                descr: 'Wood is a valuable asset for producing additional tools and many other things',
                image: 'loggerspost.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name: 'Get Twine from Aged Wood',
                        workerTime: 20*10, // 10 seconds
                        canWork: ()=>{

                        },
                        validLocation: (tile)=>{
                            // Returns a 3D coordinate of where this worker needs to be to perform this task. For most tasks, this will be at the building location.
                            // For some, such as this Loggers Post, they will have to go to the correct location to perform their job
                            // We will assume that the worker has already picked up the tools required and will go to the closest location possible

                            // Last time we used a validLocations function - the worker code conducted the pathfinding search starting from the worker's location.
                            // We should follow that model again... time to start putting together some pathfinding code
                        },
                        onComplete: (location)=>{

                        }
                    }
                ]
            };
            return b;
        }
    }
}