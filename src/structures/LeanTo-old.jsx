/*  LeanTo.jsx
    Provides a lean-to, a primitive structure that can be built anywhere with trees. Consists only of a stick leaning against a tree,
    with leafy branches laid on top. Doesn't require tools to be built!
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function LeanTo() {
    // Returns an object that can generate new structures. This should be attached to the game object under game.structureTypes, as game.structure contains
    // active structure instances

    return {
        name: 'Lean-To',
        image: 'leanto.png',
        tooltip: 'Your first shelter',
        locked: 0,
        prereqs: [],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on this tile. Otherwise, the return value will be an error string
            if(tile.floor>=9 && tile.floor<=24) return '';
            return 'This must be placed on a tile with trees';
        },
        create: tile=>{
            let b = {
                name: 'Lean To',
                status: 'building',
                progress: 0,
                recipeSelected: -1,
                recipes: [
                    {
                        id: 0,
                        name: 'Build',
                        desc: 'Constructs this structure',
                        itemsNeeded: [],
                        buildTime: (20*30), // half a minute
                    }
                ]
            };
            // Since constructing this is the only thing that can be done, we can assign that now
            b.recipeSelected = 0; // We might choose another means to pick which recipe to use. But this will do for now
            return b;
        }
    }    
}