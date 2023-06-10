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
    'Maple Tree', 'Birch Tree', 'Oak Tree', 'Mahogany Tree', 'Pine Tree', 'Cedar Tree', 'Fir Tree', 'Hemlock Tree',
    'Cherry Tree', 'Apple Tree', 'Pear Tree', 'Orange Tree', 'Hawthorne Tree', 'Dogwood Tree', 'Locust Tree', 'Juniper Tree'
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
                            {options: treetypes.map(t=>({name: t, qty:1})), role:'item', workSite:true},
                            {options: [{name: 'Flint Stabber', qty:1}], role:'tool', workSite: false}
                        ],
                        outputItems: ['Long Stick', 'Removed Stick'],
                        buildTime: 20 * 90, // 1.5 minutes
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = tile.items.findIndex(i=>treetypes.includes(i.name));
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
                        buildTime: 20 * 90,
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
                    }
                ]
            }
            return b;
        }
    }
}