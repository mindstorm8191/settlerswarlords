/*  Campfire.jsx
    Provides a way to cook things, starting with meats
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

export function Campfire() {
    return {
        name: 'Campfire',
        image: 'campfire.png',
        tooltip: 'Cook things over a fire',
        locked: 1,
        prereq: [['Dead Boar', 'Dead Chicken', 'Dead Deer', 'Dead Wolf']], // We will need to include all dead animals, but we're not there yet
        newFeatures: [],
        canBuild: tile => {
            let tileFacts = minimapTiles.find(r=>r.id===tile.landtype);
            if(tileFacts.name.indexOf('Tree')!==-1) return 'Campfires in trees is dangerous';
            if(tileFacts.name==='Still Water') return "Can't place in water";
            if(tileFacts.name==='Stream') return "Can't place in water";
            if(tileFacts.name==='Swamp') return "Can't place in water";
            return '';
        },
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Campfire',
                desc: `Fire is man's ultimate tool, even in primitive times. Not only does it provide warmth, it cooks food, unlocking
                       nutrients that would otherwise be inaccessible to the body. Such easy access to nutrients allows humans to do more.`,
                usage: `Needs a steady supply of firewood to maintain heat. Once hot, cooking speeds will be based on fire heat. Workers
                        won't start the fire until it is needed`,
                image: 'campfire.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Gather Firewood',
                        desc: "Gather wood so it's available when needed",
                        taskType: 'gatherfood',
                        itemsNeeded: [{options: [{name:'Debarked Fallen Log', qty:1},
                                                 {name:'Fallen Branch', qty:1},
                                                 {name:'Fallen Stick', qty:1},
                                                 {name:'Fallen Log', qty:1}], role:'item', workSite:true}],
                        outputItems: [],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: ()=>true    // we don't seem to need an onComplete task here
                    }
                ]
            };
            return b;
        }
    }
}