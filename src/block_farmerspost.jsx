/*  farmerspost.jsx
    Manages farmlands around the block, producing plant products
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import { game } from "./game.jsx";

export function ForagePost(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Forage Post",
        descr: `Edible plants are everywhere, but in the wild, they don't grow in enough places to support anyone. Farming allows humans
                to grow crops on a larger scale, supporting much more people.`,
        usage: `Clear lands to collect grains, straw and a chance to find seeds. Plant seeds to let them grow and harvest them when complete`,
        image: imageURL +'farmerspost.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        seeds: [], // We can use seeds from this category, accept new seeds from other blocks, or output seeds when needed
        toolGroups: [
            {group:'scythe', options: ['Flint Scythe'], required:true, selected:'', loaded:null},
            {group:'hoe', options: ['Flint Hoe'], required:true, selected:'', loaded:null}
        ],
        tileSet: [], // contains all tiles w/ data we have activity in
        targetMode: 'clearland',
        update: ()=>{
            // This will operate in multiple modes at once... in a sense. The player can decide if this should focus on clearing
            // land, or focus on planting & harvesting. If there is no work in the selected one, then work will be done in the other
            // ... we should build something different for clearing lands. Trying to manage two tasks in the same block isn't wise
        }
    };
}