/*  Hunters Post
    Allows workers to hunt for animals, providing meats and better nutrition
    For the game Settlers & Warlords
*/

// We're not fully ready to add this structure into the game. We need to sort out the remaining bugs in the worker code, first. If it's not stable,
// I can't add complexity to it.

import { game } from "../game.jsx";

export function HuntersPost() {
    return {
        name: 'Hunters Post',
        image: 'huntingpost.png',
        tooltip: 'Hunt for meats around your area',
        locked: 1,
        prereq: [['Flint Spear']],
        newFeatures: [],
        canBuild: tile => '', // this can be built anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Hunters Post',
                descr: `Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, the body will
                        struggle to survive. Fortunately, there are plenty of huntable animals around you`,
                usage: `Send workers to surrounding lands with a spear to kill animals. They can be hauled back and cooked over a fire`,
                image: 'huntingpost.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Go Hunt',
                        desc: 'Venture out and attempt to kill an animal',
                        taskType: 'craft',
                        workLocation: 'custom',
                        itemsNeeded: [{options: [{name:'Flint Spear', qty:1}], role:'tool', workSite:false}],
                        outputItems: ['Dead Deer', 'Dead Wolf', 'Dead Chicken', 'Dead Boar'],
                        // We'll probably have more, I think, but this'll do for now
                        buildTime: 20*60*3, // out for 3 minutes each time
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker => {
                            // I don't really know how much we'll use this function, yet
                        }
                    }
                ]
            }
        }
    }
}