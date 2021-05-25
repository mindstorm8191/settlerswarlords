/*  game.jsx
    General objects & functions for managing the game
    For the game Settlers & Warlords
*/

import { LeanTo } from "./block_leanto.jsx";
import { ForagePost } from "./block_foragepost.jsx";
import { RockKnapper } from "./block_rockknapper.jsx";
import { Toolbox } from "./block_toolbox.jsx";
import { Hauler } from "./block_hauler.jsx";
import { StickMaker } from "./block_stickmaker.jsx";
import { TwineMaker } from "./block_twinemaker.jsx";
import { FlintToolMaker } from "./block_flinttoolmaker.jsx";
import { HuntingPost } from "./block_huntingpost.jsx";
import { ButcherShop } from "./block_butchershop.jsx";
import { FirewoodMaker } from "./block_firewoodmaker.jsx";
import { Campfire } from "./block_campfire.jsx";
import { Harvester } from "./block_harvester.jsx";
import { StrawDryer } from "./block_strawdryer.jsx";
import { FarmersPost } from "./block_farmerspost.jsx";
// Note the Recycler doesn't get created by the user, so doesn't get included here

let cardinalDirections = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

export let game = {
    isRunning: false,
    population: 4,      // This will be updated when the game starts
    foodCounter: 180,   // Players start with a 3-minute lead time to get food production going... shouldn't be too hard though
    tiles: [],          // all the tiles of the map
    blocks: [],         // All buildings or other structures on the map
    items: [],          // All items that have been generated. This list is kept so that items with decay can decay properly... all this
                        // needs to be ironed out though
    unlockedItems: [],  // Lists all items the player has had access to (including items received by trade)
    updateReact: null,  // This gets updated when the game begins, allowing us to trigger map updates every game tick
    timerLoop: null,    // Handle to the setInterval object, so we can edit this when needed
    workPoints: 0,      // Set & updated dynamically on every block update pass
    pickMode: false,    // Set to true if the currently selected block type is working to pick another file from the map
    blockTypes: [
        {name:'Lean-To',          image:'leanto.png',         alt:'leanto',           create:LeanTo,         prereq:[], unlocked:0, newFeatures:[]},
        {name:'Forage Post',      image:'foragepost.png',     alt:'forage post',      create:ForagePost,     prereq:[], unlocked:0, newFeatures:[]},
        {name:'Rock Knapper',     image:'rockKnapper.png',    alt:'rock knapper',     create:RockKnapper,    prereq:[], unlocked:0, newFeatures:[]},
        {name:'Toolbox',          image:'toolbox.png',        alt:'tool box',         create:Toolbox,        prereq:[], unlocked:0, newFeatures:[]},
        {name:'Hauler',           image:'hauler.png',         alt:'hauler',           create:Hauler,         prereq:[], unlocked:0, newFeatures:[]},
        {name:'Stick Maker',      image:'stickmaker.png',     alt:'stick maker',      create:StickMaker,     prereq:[['Flint Stabber']], unlocked:0, newFeatures:[]},
        {name:'Twine Maker',      image:'twinemaker.png',     alt:'twine maker',      create:TwineMaker,     prereq:[['Flint Knife']], unlocked:0, newFeatures:[]},
        {name:'Flint Tool Maker', image:'flintToolMaker.png', alt:'flint tool maker', create:FlintToolMaker, prereq:[['Twine'],['Short Stick', 'Long Stick']],                 unlocked:0, newFeatures:[]},
        {name:'Hunting Post',     image:'huntingpost.png',    alt:'Hunting Post',     create:HuntingPost,    prereq:[['Flint Spear']],                                         unlocked:0, newFeatures:[]},
        {name:'Butcher Shop',     image:'butchershop.png',    alt:'Butcher Shop',     create:ButcherShop,    prereq:[['Dead Deer', 'Dead Boar', 'Dead Wolf', 'Dead Chicken']], unlocked:0, newFeatures:[]},
        {name:'Firewood Maker',   image:'firewoodMaker.png',  alt:'Firewood Maker',   create:FirewoodMaker,  prereq:[['Dead Deer', 'Dead Boar', 'Dead Wolf', 'Dead Chicken']], unlocked:0, newFeatures:[]},
        {name:'Campfire',         image:'campfire.png',       alt:'Campfire',         create:Campfire,       prereq:[['Dead Deer', 'Dead Boar', 'Dead Wolf', 'Dead Chicken']], unlocked:0, newFeatures:[]},
        {name:'Harvester',        image:'harvester.png',      alt:'Harvester',        create:Harvester,      prereq:[['Flint Scythe']],                                        unlocked:0, newFeatures:[]},
        {name:'Straw Dryer',      image:'strawdryer.png',     alt:'Straw Dryer',      create:StrawDryer,     prereq:[['Wet Straw']],                                           unlocked:0, newFeatures:[]},
        {name:'Farmers Post',     image:'farmerspost.png',    alt:'Farmers Post',     create:FarmersPost,    prereq:[['Wet Straw']],                                           unlocked:0, newFeatures:[]}
    ],
    // For the newFeatures array: if an item in that list is added to the unlocked items, it only means that the left-side block will 'light up' green.
    // The specific features will have to be checked by the block's code
    travellers: [],     // List of travelling units. Primarily to display workers hauling items about the map

    getNextBlockId: ()=> {
        if(game.blocks.length===0) return 1;
        return game.blocks.reduce((carry,block)=>{
            if(block.id>carry) return block.id;
            return carry;
        }, 1) +1;
    },
    getNeighbors: (x,y) => {
        // Returns an array holding all neighboring blocks (in cardinal directions)
        if(typeof(x)==='undefined') {
            console.log('Error in game.getNeighbors: called function w/o X or Y value; these are required');
            return;
        }
        if(typeof(y)==='undefined') {
            console.log('Error in game.getNeighbors: called function w/o Y value; this is required');
            return;
        }
        return cardinalDirections.map(dir=>{
            return game.blocks.find(ele=>ele.tileX===x+dir.x && ele.tileY===y+dir.y);
        }).filter(ele => {
            return typeof(ele)!=='undefined';
        });
    },
    createItem: (buildingId, name, group, extras) => {
        // Handles creating a new item, while also adding it to the global itemsList structure
        // This ID only works because this items list never gets sorted or re-ordered
        if(typeof(buildingId)!=='number') console.log('Error: new item ('+ name +') gave us a building (type='+ typeof(buildingId) +')');
        let id = (game.items.length===0)?1:game.items[game.items.length-1].id+1;

        game.items.push({buildId: buildingId, id:id, group:group});
        // If this item isn't in the unlockedItems list, add it
        if(!game.unlockedItems.some(i=>i===name)) {
            game.unlockedItems.push(name);
            game.checkUnlocks(name);
        }
        return {
            id: id,
            name: name,
            group: group,
            ...extras
        };
    },
    moveItem: (itemId, newBlockId) =>{
        // Reports moving an item to a new block
        // First, find the slot in the items list
        let slot = game.items.findIndex(e=>e.id===itemId);
        if(slot===-1) return console.log('Error in game.moveItem: did not find item id='+ itemId);
        game.items[slot].buildId = newBlockId;
    },
    deleteItem: (itemId) =>{
        let slot = game.items.findIndex(e=>e.id===itemId);
        if(slot===-1) return console.log('Error in game.deleteItem: did not find item id='+ itemId);
        game.items.splice(slot,1);
    },
    toolCount: toolName => {
        // Returns the number of accessible tools found on the local map, when given a tool name
        return game.blocks.reduce((carry,block) => {
            if(block.name==='Toolbox') {
                if(block.onhand.length>0) {
                    if(block.onhand[0].name===toolName) {
                        return carry + block.onhand.length;
                    }
                }
            }
            return carry;
        }, 0);
    },
    toolLocation: (toolName) => {
        // Returns the block slot holding the desired tool, or -1 if none is found.
        // This is mainly to allow a status to be easily shown, but can be used to easily request tools
        return game.blocks.findIndex(block=>{
            if(block.name==='Toolbox') {
                return block.onhand.some(item=>{
                    if(item===null) {
                        console.log('Error in game.toolLocation: toolbox id='+ block.id +' has null item');
                        return false;
                    }
                    return item.name===toolName
                });
            }
            return false;
        });
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

        // So, from this vantage point (within setInterval, not within game.jsx), we actually cannot see any of the React useState
        // variables. They're null. However, that doesn't stop us from setting these values through the respective function calls.
        // So to do this effectively, we need to keep the primary data structure away from React. React will be provided a new copy
        // on every game tick, where everything can be re-rendered

        // Start with managing food consumption
        game.foodCounter--;
        while(game.foodCounter <= 0) {
            // Find a suitable food item to consume
            let foodList = game.items.filter((ele) => ele.group === "food");
            if(foodList.length>0) {
                let foodSlot = Math.floor(Math.random() * foodList.length);
                let foodStat = foodList[foodSlot];
                // With the new item management code, we can take this item and delete it from the correct block
                let targetBlock = game.blocks.find(b=>b.id===foodStat.buildId);
                if(typeof(targetBlock)!=='undefined') {
                    if(targetBlock.destroyItem(foodStat.id)) {
                        // Deleting the target food item was successful. Increase the food counter
                        game.items.splice(game.items.findIndex(i=>i.id===foodStat.id), 1);
                        game.foodCounter += 120.0 / game.population;
                        // With that handled, determine if we can increase the population. We can only increase the population
                        // if there is more than double the food than population
                        console.log('foodList.length='+ foodList.length);
                        if(game.foodCounter > 0 && (foodList.length-1) > game.population*2) {
                            game.population++;
                        }
                    }
                }
            }else{
                // Oh dear, we have run out of food. We need to reduce the population now
                game.population--;
                // Also reset the food counter, so the colony can continue to function
                game.foodCounter = 120;
                if(game.population===0) game.population = 1; // can't continue playing if there's nobody around
            }
        }

        game.workPoints = game.population;
        game.blocks.forEach((block) => {
            block.update();
            // With this building updated, update the correct tile in gameLocalTiles
            if (typeof block.progressBar !== "undefined") {
                let tile = game.tiles.find((t) => t.buildid === block.id);
                if(typeof(tile) !=='undefined') {
                    tile.progressBar = (block.progressBar * 60.0) / block.progressBarMax;
                    tile.progressBarColor = block.progressBarColor;
                }
            }
        });
        
        // Now plug in the updated gameLocalTiles into React
        game.updateReact([...game.tiles]);
    }
};