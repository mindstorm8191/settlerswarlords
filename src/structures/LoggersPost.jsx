/*  LoggersPost.jsx
    Provides the means to cut down trees for logs and branches
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

/* Sticks
Users will need long & short sticks; fallen sticks will only be useable for firewood, so other sticks must be cut fresh from the trees.
Each tree will have a set number of long sticks on them; they can be removed from standing trees. This will leave a 'removed stick' at
the location. When the tree is cut down, it will generate fewer sticks, based on the amount of removed sticks there.
For now, all trees will generate a fixed number of long sticks: 6. Workers will cut long sticks in half to get short sticks
*/

let treetypes = [
    {tileId: 5, name: 'Maple Tree', logs: 15, sticks: 20},
    {tileId: 6, name: 'Birch Tree', logs: 1, sticks: 6},
    {tileId: 7, name: 'Oak Tree', logs: 12, sticks: 16},
    {tileId: 8, name: 'Mahogany Tree', logs: 8, sticks: 20},
    {tileId: 9, name: 'Pine Tree', logs: 8, sticks: 6},
    {tileId: 10, name: 'Cedar Tree', logs: 6, sticks: 6},
    {tileId: 11, name: 'Fir Tree', logs: 4, sticks: 4},
    {tileId: 12, name: 'Hemlock Tree', logs: 7, sticks: 15},
    {tileId: 13, name: 'Cherry Tree', logs: 0, sticks: 8},
    {tileId: 14, name: 'Apple Tree', logs: 1, sticks: 12},
    {tileId: 15, name: 'Pear Tree', logs: 0, sticks: 6},
    {tileId: 16, name: 'Orange Tree', logs: 1, sticks: 10},
    {tileId: 17, name: 'Hawthorn Tree', logs: 4, sticks: 12},
    {tileId: 18, name: 'Dogwood Tree', logs: 0, sticks: 6},
    {tileId: 19, name: 'Locust Tree', logs: 10, sticks: 24},
    {tileId: 20, name: 'Juniper Tree', logs: 3, sticks: 6}
];

export function LoggersPost() {
    // This is the data structure in the game object aka game.structureTypes
    return {
        name: 'Loggers Post',
        image: 'loggerspost.png',
        tooltip: 'Manage nearby trees and collect wood',
        locked: 1,
        prereq: [['Flint Knife', 'Flint Stabber']],
        newFeatures: [],
        canBuild: tile => '',  // this can be built anywhere (the return value expects a string)
        create: tile => {
            // Returns a new structure instance
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Loggers Post',
                descr: `Wood is a valuable asset in producing tools of all shapes and sizes - not to mention fuel for your fires. Use this to
                        collect wood and manage your forests`,
                usage: `Collect sticks from surrounding trees, and twine from fallen logs`,
                image: 'loggerspost.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Get Fibers from Aged Wood',
                        desc: 'Collect Twine for tools',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: [{name: 'Fallen Log', qty:1}], role:'item', workSite:true},
                            {options: [{name: 'Flint Knife', qty:1}], role:'tool', workSite:false}
                        ],
                        // Recipes here would be nice. But it doesn't really solve the issue of managed options either. We would still want
                        // to have choices in the way something is built. So we still want to have options for 
                        outputItems: ['Bark Fibers', 'Debarked Fallen Log'],
                        buildTime: 20 * 40, // 40 seconds
                        hasQuantity: true,
                        canAssign: ()=>true, // this can always be assigned
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = tile.items.findIndex(i=>i.name==='Fallen Log');
                            tile.items.splice(slot,1);
                            tile.items.push(
                                game.createItem('Debarked Fallen Log', 'item'),
                                game.createItem('Bark Fibers', 'item')
                            );
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Long Stick',
                        desc: 'Cut sticks from trees',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: treetypes.map(t=>({name: t.name, qty:1})), role:'item', workSite:true},
                            {options: [{name: 'Flint Stabber', qty:1}], role:'tool', workSite: false}
                        ],
                        outputItems: ['Long Stick', 'Removed Stick'],
                        buildTime: 20 * 60, // 1 minute
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = tile.items.findIndex(i=>treetypes.some(u=>u.name===i.name));
                            if(slot===-1) {
                                console.log('Error in LoggersPost: there are no trees here');
                                return;
                            }
                            tile.items.push(
                                game.createItem('Long Stick', 'item'),
                                game.createItem('Removed Stick', 'item')
                            );
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Short Stick',
                        desc: 'Cut long sticks in half',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Long Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Flint Stabber', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Short Stick'],
                        buildTime: 20 * 60, // 1 minute
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: x => {
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Delete the long stick, create two short sticks
                            let slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Error: Could not find Long Stick at structure');
                                return;
                            }
                            tile.items.splice(slot, 1);
                            tile.items.push(
                                game.createItem('Short Stick', 'item'),
                                game.createItem('Short Stick', 'item')
                            );
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Down Tree',
                        desc: 'Turn standing trees into useful wood products',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: treetypes.map(u=>({name:u.name, qty:1})), role:'item', workSite:true},
                            {options: [{name: 'Flint Hatchet', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Connected Log', 'Log Chunk'],
                        buildTime: 20 * 60 * 2, // 2 minutes
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Flint Hatchet'),
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            // Determining trees will be a little harder than other tasks, as we will also produce a lot of freed sticks
                            // Start by selecting (to remove) the first tree type available
                            let slot = tile.items.findIndex(i=>treetypes.some(u=>u.name===i.name));
                            let treestats = treetypes.find(u=>u.name===tile.items[slot].name);

                            // get a count of the removed sticks here
                            let removedsticks = tile.items.filter(i=>i.name==='Removed Stick').length;
                            let stickcount = treestats.sticks - removedsticks;

                            // Remove all the Removed Sticks items
                            tile.items = tile.items.filter(i=>i.name!=='Removed Stick');

                            // Now add the correct number of logs...
                            if(treestats.logs===1) {
                                tile.items.push(game.createItem('Log Chunk'));
                            }else{
                                for(let i=0; i<treestats.logs; i++) tile.items.push(game.createItem('Connected Log', 'item'));
                            }
                            for(let i=0; i<stickcount; i++) tile.items.push(game.createItem('Long Stick', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Log Chunk',
                        desc: 'Cut connected logs into manageable pieces for moving',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: [{name: 'Connected Log', qty:1}], role:'item', workSite:true },
                            {options: [{name: 'Flint Hatchet', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Log Chunk'],
                        buildTime: 20 * 60 * 2, // 2 minutes, just like cutting down a tree
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Flint Hatchet'),
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = 0;
                            // This time, it will work one of two ways: if there are two connected logs remaining, they will both be
                            // converted into log chunks. Otherwise, you will get one log chunk for one connected log
                            if(tile.items.filter(i=>i.name==='Connected Log').length>2) {
                                // Convert 1 connected log to 1 log chunk; the rest stays
                                slot = tile.items.findIndex(i=>i.name==='Connected Log');
                                tile.items.splice(slot,1);
                                tile.items.push(game.createItem('Log Chunk', 'item'));
                            }else{
                                tile.items.splice(tile.items.findIndex(i=>i.name==='Connected Log'), 1);
                                tile.items.splice(tile.items.findIndex(i=>i.name==='Connected Log'), 1);
                                tile.items.push(game.createItem('Log Chunk', 'item'), game.createItem('Log Chunk', 'item'));
                            }
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Wooden Bucket',
                        desc: 'Craft a bucket from a log chunk',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Log Chunk', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Flint Hatchet', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Wooden Bucket'],
                        buildTime: 20 * 90, // 1.5 minutes
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Log Chunk'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Log Chunk');
                            if(slot===-1) { console.log('Error: could not find Connected Log at structure'); return; }
                            tile.items.splice(slot,1);
                            tile.items.push(game.createItem('Wooden Bucket'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Cut Wooden Pole',
                        desc: 'Craft wooden poles from connected logs',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: [{name: 'Connected Log', qty:3}], role:'item', workSite:true},
                            {options: [{name: 'Flint Hatchet', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Wooden Pole'],
                        buildTime: 20 * 60 * 2, // 2 minutes... but you get 4 poles from it
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Connected Log'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            game.clearItems(tile, [{name: 'Connected Log', qty:3}],
                                'src/structures/LoggersPost.jsx->Task Cut Wooden Pole->onComplete');
                            tile.items.push(
                                game.createItem('Wooden Pole', 'item'),
                                game.createItem('Wooden Pole', 'item'),
                                game.createItem('Wooden Pole', 'item'),
                                game.createItem('Wooden Pole', 'item')
                            );
                            tile.modified = true;
                        }
                    }
                ]
            }
            return b;
        }
    }
}