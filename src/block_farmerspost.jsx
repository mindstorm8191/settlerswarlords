/*  farmerspost.jsx
    Manages farmlands around the block, producing plant products
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import { game } from "./game.jsx";
import { blockHasWorkerPriority } from "./blockHasWorkerPriority.jsx";
import { blockHasMultipleOutputs } from "./blockHasMultipleOutputs.jsx";
import { blockRequiresTools } from "./blockRequiresTools.jsx";
import { blockSharesOutputs } from "./blockSharesOutputs.jsx";

const seedsList = ['Wheat Grain', 'Oat Grain', 'Rye Grain', 'Barley Grain', 'Millet Grain', 'Strawberry Seed', 'Rice Seed',
                   'Potato Seed', 'Carrot Seed', 'Bean Seed', 'Corn Seed', 'Garlic Seed', 'Squash Seed', 'Onion Seed'];
                   //'Grape Seed', 'Blueberry Seed'];

export function FarmersPost(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Farmers Post",
        descr: `Edible plants are everywhere, but in the wild, they don't grow in enough places to support anyone. Farming allows humans
                to cultivate crops on a larger scale, supporting much more people.`,
        usage: `Clear lands to collect grains, straw and a chance to find seeds. Plant seeds to let them grow and harvest them when complete`,
        image: imageURL +'farmerspost.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        seeds: [], // We can use seeds from this category, accept new seeds from other blocks, or output seeds when needed
        outputSeeds: false, // Set to true for this block to output the seeds it has on hand... We might increase precision on this to
                // control which seeds get output... we might not
        toolGroups: [
            {group:'scythe', options: ['Flint Scythe'], required:true, selected:'', loaded:null},
            {group:'hoe', options: ['Flint Hoe'], required:true, selected:'', loaded:null}
        ],
        tileSet: [], // contains all tiles w/ data we have activity in
        possibleOutputs: ()=>{
            return ['Wet Straw', ...seedsList, 'Strawberries', 'Rice', 'Potatoes', 'Carrots', 'Beans', 'Corn', 'Garlic', 'Squash',
                    'Onion', 'Grapes', 'Blueberries'];
        },
        // willOutput is handled by blockSharesOutputs. We can use this despite the seed plans, as newly made seeds will be put back
        // into the seeds input slot (unless full)
        // hasItem is handled by blockSharesOutputs
        // getItem is handled by blockSharesOutputs
        // getItemFrom is handled by blockSharesOutputs
        // findItems is handled by blockSharesOutputs
        willAccept: item => {
            // Returns true if this block will accept the given item
            // Basically, if it's a seed, we'll accept it. But there's a lot of seeds.
            // Since we're using the seeds list elsewhere too, we'll move that list to a constant.
            return seedsList.includes(item.name) && b.seeds.length<5;
        },
        takeItem: item => {
            // Accept an item from another block. Returns true if the item is accepted, or false if not
            if(!seedsList.includes(item.name)) {
                console.log('Error: Received item '+ item.name +', not in seeds list');
                return false;
            }
            b.seeds.push(item);
            return true;
        },
        fetchItem: itemId => {
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            item = b.seeds.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            
            // We didn't find the item in our onhand list. We might still find it in the tools list
            for(let i=0;i<b.toolGroups.length;i++) {
                if(b.toolGroups[i].loaded!==null) {
                    if(b.toolGroups[i].loaded.id===itemId) return b.toolGroups[i].loaded;
                }
            }
            return null;
        },
        destroyItem: itemId => {
            let slot = b.onhand.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.onhand.splice(slot,1);    // We can leave Game to delete the item, since all they need is the id
                return true;
            }
            slot = b.seeds.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.seeds.splice(slot,1);
                return true;
            }
            // Now check the tools structure
            return b.toolGroups.some(ele=>{
                if(ele.loaded===null) return false;
                if(ele.loaded.id!==itemId) return false;
                ele.loaded = null;
                return true;
            });
        },
        update: ()=>{
            // This will operate in multiple modes at once... in a sense. When there are plants to harvest, this will collect them (before
            // foods rot on the plant). Otherwise, it will prepare land for planting, and plant crops... so long as there's land to be used
            // for growing

            // Before determining if this block will do any work, update all the land plot data we currently have
            b.tileSet.forEach(ele=>{
                if(ele.mode==='grow') {
                    ele.counter++;
                }
            });
            // Determine if we can do work here
            if(game.workPoints<=0) return;
            if(!b.checkTools()) return;     // no tools loaded

            // Process any lands needing work. Since all new lands we're planting on are at the end, we don't need to worry about
            // plants staying on too long because we're too busy planting
            for(let i=0; i<b.tileSet.length; i++) {
                if(b.tileSet[i].mode==='plant') {
                    // We're still working on planting here. Continue the process
                    console.log('Farmers post: planting @ '+ b.tileSet[i].x +','+ b.tileSet[i].y);
                    game.workPoints--;
                    b.useTools();
                    b.tileSet[i].counter++;
                    if(b.tileSet[i].counter>60) {
                        // This is ready to move to the growing phase
                        b.tileSet[i].mode = 'grow';
                        b.tileSet[i].counter = 0;
                        // We should have already set the grow target and spoillevel earlier
                    }
                    return;
                }
                if(b.tileSet[i].mode==='grow') {
                    // Waiting for plants to grow. Determine if this has grown enough
                    if(b.tileSet[i].counter>=b.tileSet[i].spoilLevel) {
                        // Set this to the spoil state. It will still need to be cleared, but will provide seeds only (crop specific), no food
                        b.tileSet[i].mode = 'spoiled';
                    }
                    if(b.tileSet[i].counter>=b.tileSet[i].growTarget) {
                        b.tileSet[i].mode = 'harvest';
                    }
                    b.tileSet[i].counter = 0;
                }
                if(b.tileSet[i].mode==='spoiled' || b.tileSet[i].mode==='harvest') {
                    // Make progress on harvesting these items
                    game.workPoints--;
                    b.useTools();
                    b.tileSet[i].counter++;
                    if(b.tileSet[i].counter>b.tileSet[i].harvestTime) {
                        // Output the seeds we expect
                        for(let j=0; j<b.tileSet[i].seedQty; j++) {
                            if(b.seeds.length>20) {
                                b.onhand.push(game.createItem(b.id, b.tileSet[i].seed, 'item'));
                            }else{
                                b.seeds.push(game.createItem(b.id, b.tileSet[i].seed, 'item'));
                            }
                        }
                        // Now output the crops we expect, if not spoiled
                        if(b.tileSet[i].mode==='harvest' && b.tileSet[i].product!=='none') {
                            for(let j=0; j<b.tileSet[i].productQty; j++) {
                                b.onhand.push(game.createItem(b.id, b.tileSet[i].product, b.tileSet[i].productGroup, b.tileSet[i].productExtras));
                            }
                        }
                        // Now, clear this tile of the plant-growing status. We need to locate the block first
                        let tile = game.tiles.find(ele=>ele.x===b.tileSet[i].x && ele.y===b.tileSet[i].y);
                        if(typeof(tile)==='undefined') {
                            console.log('Error in Farmers Post: Target block not found when removing growth status');
                            return;
                        }
                        tile.newlandtype = 12;
                        b.tileSet.splice(i, 1);
                    }
                    return;
                }
            }

            // ...oh, still here? That means none of our current tiles need work (or we have no tiles at all)
            if(b.seeds.length<=0) return;

            // Find another tile to add to our list, so we can start planting things
            let target = game.tiles.find(ele=>{
                if(ele.x<b.tileX-10) return false; // too far left
                if(ele.x>b.tileX+10) return false; // too far right
                if(ele.y<b.tileY-10) return false; // too far up
                if(ele.y>b.tileY+10) return false; // too far right
                if(ele.newlandtype===12) return true; // only land type acceptable
                return false;
            });
            if(typeof(target)==='undefined') {
                console.log('Farmers Post did not find any valid lands to farm on');
                return;
            }
            target.newlandtype = 13;

            // This would work, but we haven't used any work points yet. As we create the object, we also need to
            // account for 1 cycle of the planting phase
            game.workPoints--;
            b.useTools();
            let pack = {};
            switch(b.seeds[0].name) {
                case 'Wheat Grain': pack = {seedQty:6, product:'none', productQty:0, productGroup:'item', productExtras:{}, harvestTime:20, growTarget:200, spoilLevel:300}; break;
                case 'Oat Grain': pack = {seedQty:5, product:'none', productQty:0, productGroup:'item', productExtras:{}, harvestTime:22, growTarget:180, spoilLevel:350}; break;
                case 'Rye Grain': pack = {seedQty:7, product:'none', productQty:0, productGroup:'item', productExtras:{}, harvestTime:28, growTarget:280, spoilLevel:350}; break;
                case 'Barley Grain': pack = {seedQty:5, product:'none', productQty:0, productGroup:'item', productExtras:{}, harvestTime:22, growTarget:250, spoilLevel:350}; break;
                case 'Millet Grain': pack = {seedQty:4, product:'none', productQty:0, productGroup:'item', productExtras:{}, harvestTime:30, growTarget:260, spoilLevel:330}; break;
                case 'Strawberry Seed': pack = {seedQty:3, product:'Strawberry', productQty:5, productGroup:'food', productExtras:{lifetime:300}, harvestTime:20, growTarget:120, spoilLevel:200}; break;
                case 'Rice Seed': pack = {seedQty:7, product:'Rice', productQty:5, productGroup:'food', productExtras:{lifetime:450}, harvestTime:30, growTarget:160, spoilLevel:350}; break;
                case 'Potato Seed': pack = {seedQty:5, product:'Potato', productQty:12, productGroup:'item', productExtras:{}, harvestTime:35, growTarget:250, spoilLevel:400}; break;
                case 'Carrot Seed': pack = {seedQty:4, product:'Carrot', productQty:5, productGroup:'food', productExtras:{lifetime:600}, harvestTime:35, growTarget:220, spoilLevel:350}; break;
                case 'Bean Seed': pack = {seedQty:6, product:'Bean', productQty:8, productGroup:'item', productExtras:{}, harvestTime:25, growTarget:250, spoilLevel:350}; break;
                case 'Corn Seed': pack = {seedQty:4, product:'Corn', productQty:8, productGroup:'food', productExtras:{lifetime:300}, harvestTime:15, growTarget:250, spoilLevel:350}; break;
                case 'Garlic Seed': pack = {seedQty:5, product:'Garlic', productQty:4, productGroup:'food', productExtras:{lifetime:450}, harvestTime:30, growTarget:300, spoilLevel:400}; break;
                case 'Squash Seed': pack = {seedQty:4, product:'Squash', productQty:5, productGroup:'item', productExtras:{}, harvestTime:20, growTarget:350, spoilLevel:450}; break;
                case 'Onion Seed': pack = {seedQty:4, product:'Onion', productQty:5, productGroup:'food', productExtras:{lifetime:500}, harvestTime:30, growTarget:300, spoilLevel:450}; break;
            }
            b.tileSet.push({
                x: target.x,
                y: target.y,
                mode: 'plant',
                counter: 1,
                seed: b.seeds[0].name,
                ...pack
            });
            b.seeds.splice(0,1);    // Finally, remove the seed from our inputs
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            const Outputs = b.ShowOutputs;
            return <>
                <Priority />
                <Outputs />
                {b.tileSet.length===0?(
                    <p className="singleline">No current targets</p>
                ):
                    b.tileSet.map((ele,key)=>{
                        switch(ele.mode) {
                            case 'plant': return <p key={key} className="singleline">Planting {ele.seed}, {Math.floor((ele.counter/60)*100)}% complete</p>;
                            case 'grow':  return <p key={key} className="singleline">Growing {ele.seed}, {Math.floor((ele.counter/ele.growTarget)*100)}% complete</p>;
                            case 'harvest': return <p key={key} className="singleline">Harvesting {ele.seed}, {Math.floor((ele.counter/ele.harvestTime)*100)}% complete</p>;
                            case 'spoiled': return <p key={key} className="singleline">Removing {ele.seed}, {Math.floor((ele.counter/ele.harvestTime)*100)}% complete</p>;
                            default: return <p key={key} className="singleline">Unknown mode={ele.mode} for {ele.seed}</p>;
                        }
                    })
                }
                <Tools />
            </>;
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar, // well... we're not using this yet. We need to. Keep this
                items: b.onhand,
                seeds: b.seeds,
                targets: b.tileSet,
                tools: b.saveTools()
            };
        },
        load: content => {
            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.onhand      = content.items;
            b.seeds       = content.seeds;
            b.tileSet     = content.targets;
            b.loadTools(content);
        }
    };

    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b), blockSharesOutputs(b));
}

