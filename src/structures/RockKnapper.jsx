/*  RockKnapper.jsx
    Code for the Rock Knapper, a way to create the firs tools
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export function RockKnapper(tile) {

    // First, check the land type. This can only be built on barren rock
    if(tile.newlandtype===-1) {
        if(tile.landtype!==21) {
            return 'wrong land type';
        }
    }
    if(tile.newlandtype!==21 || tile.landtype!==21) {
        // Both must be 21 or this won't work
        return 'wrong land type';
    }

    let b = {
        id: game.getNextBlockId(),
        x: tile.x,
        y: tile.y,
        name: 'Rock Knapper',
        descr: `Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes you need.`,
        usage: `Knapps rocks to craft tools. Knives or stabbers can be made without any parts. Other tools can be made using wood & twine`,
        image: "rockknapper.png",
        progressBar: 0,
        progressBarMax: 8,
        progressBarColor: 'green',
        assignedWorkers: [],
        hasWork: ()=> {
            // Returns true if this building has work that can be auto-assigned

            // While here, update the assigned workers list
            b.assignedWorkers = game.blockCheckAssignedWorkers(b.id);
            if(b.assignedWorkers.length>=2) return false;  // This will need to be updated when more tool types become available

            // Check this tile's inventory to determine if we have all the available tools that can be crafted here
            let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
            if(typeof(tile)==='undefined') {
                console.log('Error in RockKnapper->hasWork(): could not find root tile');
                return false;
            }
            if(typeof(tile.items)==='undefined') {
                console.log('Warning in RockKnapper->hasWork(): items list does not exist in tile. A blank one will be added');
                tile.items = [];
                return true; // We already know this will be empty
            }
            if(tile.items.length===0) return true; // nothing here anyway!
            return (
                tile.items.findIndex(e=>e.name==='Flint Knife')===-1 ||
                tile.items.findIndex(e=>e.name==='Flint Stabber')===-1
            ); // so, return true if it can't find a knife or a stabber. If it finds both, it'll return false
        },
        canAssist: ()=> {
            // returns true/false if other workers can assist someone at this building.
            return false;
        },
        assignWorker: (newWorker) => {
            b.assignedWorkers.push(newWorker.id);
        },

    }
    return b;
}
