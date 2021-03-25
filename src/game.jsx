/*  game.jsx
    General objects & functions for managing the game
    For the game Settlers & Warlords
*/

import { LeanTo } from "./block_leanto.jsx";
import { ForagePost } from "./block_foragepost.jsx";
import { RockKnapper } from "./block_rockknapper.jsx";
import { Toolbox } from "./block_toolbox.jsx";
import { StickMaker } from "./block_stickmaker.jsx";


let cardinalDirections = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

export let game = {
    isRunning: false,
    foodCounter: 180,   // Players start with a 3-minute lead time to get food production going
    tiles: [],          // all the tiles of the map
    blocks: [],         // All buildings or other structures on the map
    items: [],          // All items that have been generated. This list is kept so that items with decay can decay properly... all this
                        // needs to be ironed out though
    unlockedItems: [],  // Lists all items the player has had access to (including items received by trade)
    updateReact: null,  // This gets updated when the game begins, allowing us to trigger map updates every game tick
    timerLoop: null,    // Handle to the setInterval object, so we can edit this when needed
    workPoints: 0,      // Set & updated dynamically on every block update pass
    blockTypes: [
        {name:'leanto',      image:'leanto.png',      alt:'leanto',       create:LeanTo, prereq:[], unlocked:0, newFeatures:0},
        {name:'foragepost',  image:'foragepost.png',  alt:'forage post',  create:ForagePost, prereq:[], unlocked:0, newFeatures:0},
        {name:'rockknapper', image:'rockKnapper.png', alt:'rock knapper', create:RockKnapper, prereq:[], unlocked:0, newFeatures:0},
        {name:'toolbox',     image:'toolbox.png',     alt:'tool box',     create:Toolbox, prereq:[], unlocked:0, newFeatures:0},
        {name:'stickmaker',  image:'stickmaker.png',  alt:'stick maker',  create:StickMaker, prereq:[['Flint Stabber']], unlocked:0, newFeatures:0}
    ],

    getNextBlockId: ()=> {
        if(game.blocks.length===0) return 1;
        return game.blocks.reduce((carry,block)=>{
            if(block.id>carry) return block.id;
            return carry;
        }, 1) +1;
    },
    getNeighbors: (x,y) => {
        // Returns an array holding all neighboring blocks (in cardinal directions)
        return cardinalDirections.map(dir=>{
            return game.blocks.find(ele=>ele.tileX===x+dir.x && ele.tileY===y+dir.y);
        }).filter(ele => {
            return typeof(ele)!=='undefined';
        });
    },
    createItem: (buildingId, name, group, extras) => {
        // Handles creating a new item, while also adding it to the global itemsList structure
        let item = { id: game.items.length === 0 ? 1 : game.items[game.items.length - 1] + 1, name, group, ...extras };
        game.items.push(item);
        // If this item isn't in the unlockedItems list, add it
        if(!game.unlockedItems.some(i=>i===name)) {
            game.unlockedItems.push(name);
            game.checkUnlocks(name);
        } 
        return item;
    },
    sortBlocks: (a,b) => {
        if(typeof(a.priority)==='undefined') {
            if(typeof(b.priority)==='undefined') return 0;
            return 1; // B will have priority over A, because it has a value
        }
        if(typeof(b.priority)==='undefined') return -1;
        return a.priority - b.priority;
    },
    checkUnlocks: newItem => {
        // Checks if the new item unlocks anything

        // Some blocks gain new features whenever certain items become available. We want to highlight those block types when they do
        game.blockTypes
            .filter(block => block.state === 1) // block is already enabled
            .filter(block => !(block.hasNewOptions === undefined)) // block has the correct function
            .filter(block => block.hasNewOptions(newItem))  // function states new features unlocked from this item
            .forEach(block => {block.newFeatures = 1;});

        // Now for the real task at hand
        game.blockTypes.filter(block => {
            if(block.unlocked === 1) return false; // This is already unlocked, no need to re-unlock it
            if(block.prereq.length===0) return true; // This has no prerequisites; this block should be available at the start of the game
            return block.prereq.every(andE => {
                return andE.some(orE => {
                    return game.unlockedItems.includes(orE);
                });
            });
        }).forEach(block => {
            // With React, we can just set this, and check it when we display the blocks
            block.unlocked = 1;
        });
    },
    update: ()=>{
        if (!game.isRunning) return;

        // So, from this vantage point (within setInterval, not withing game.jsx), we actually cannot see any of the React useState
        // variables. They're null. However, that doesn't stop us from setting these values through the respective function calls.
        // So to do this effectively, we need to keep the primary data structure away from React. React will be provided a new copy
        // on every game tick, where everything can be re-rendered

        // Start with managing food consumption
        game.foodCounter--;
        if (game.foodCounter <= 0) {
            // Find a suitable food item to consume
            let foodList = game.items.filter((ele) => ele.group === "food");
            let foodSlot = Math.floor(Math.random() * foodList.length);
            let food = foodList[foodSlot];
            // With the food picked up from the food list, we also need to find (and remove) it from the block it's in
            let foundFood = game.blocks.forEach((building) => {
                if (typeof building.onhand === "undefined") return false;
                let slot = building.onhand.findIndex((i) => i.id === food.id);
                if (slot === -1) return false; // Our target food wasn't found in this building block
                building.onhand.splice(slot, 1);
                return true;
            });
            foodList.splice(foodSlot, 1);
            game.foodCounter += 120 / 4; // 4 is our population... we need to make population accessible from this setInterval location
        }

        game.workPoints = game.population;
        game.blocks.forEach((block) => {
            block.update();
            // With this building updated, update the correct tile in gameLocalTiles
            if (typeof block.progressBar !== "undefined") {
                let tile = game.tiles.find((t) => t.buildid === block.id);
                tile.progressBar = (block.progressBar * 60.0) / block.progressBarMax;
                tile.progressBarColor = block.progressBarColor;
            }
        });
        
        // Now plug in the updated gameLocalTiles into React
        game.updateReact([...game.tiles]);
    }
};