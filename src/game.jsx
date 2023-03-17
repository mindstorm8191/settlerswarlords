/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

import { DanLog } from "./libs/DanLog.js";

export const game = {
    timerLoop: null, // Contains a timer handle when the game starts
    tiles: [], // all tiles of the local map
    workers: [], // all workers on this map
    structuresList: [], // all structures added to this map
    localMapBiome: '',

    setup: (content) => {
        // Sets up the game, using content received from the server
        // content - all content received from the server, as it was provided. It should contain the following
        //      result - should be 'success'. This flag is checked prior to this function
        //      userid - ID of the player
        //      usertype - should be 'player'. If not 'player' this function shouldn't be ran
        //      ajaxcode - code used to validate client messages
        //      localContent - object containing:
        //          biome - Name of the biome of this area
        //          population - How many workers are located here
        //      localTiles - list of all tiles for this area
        //      structures - all structures built in this area
        //      workers - list of all workers in this area
        //      tasks - all existing tasks for this area
        //      unlockedItems - all items unlocked in this area
        // No return value

        // Manage unlocked items here

        game.localMapBiome = content.localContent.biome;
        //let reports = 0;

        // All tiles have their items sent as JSON, we'll have to convert that to objects. We'll also need to separate items from groupings,
        // as they are originally  We also have to include a modified field, to
        // denote any tiles that have been modified.
        game.tiles = content.localTiles.map((t) => {
            let source = JSON.parse(t.items);
            let items = [];
            for (let x = 0; x <= source.length - 1; x++) {
                if (typeof source[x].amount !== "undefined") {
                    let count = source[x].amount;
                    delete source[x].amount;
                    for (let y = 0; y < count; y++) {
                        items.push(source[x]);
                    }
                } else {
                    items.push(source[x]);
                }
            }
            return { ...t, items: items, modified: false };
        });

        game.workers = content.workers;
    },
};


