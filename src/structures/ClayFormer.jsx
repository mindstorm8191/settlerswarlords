/*  ClayFormer.jsx
    Allows workers to shape clay into various forms, prior to drying. We might use this for other forming jobs, too
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

export function ClayFormer() {
    return {
        name: 'Clay Former',
        image: 'clayformer.png',
        tooltip: 'Forms clay into desired shapes before drying',
        locked: 1,
        prereq: [['Clay Ball']],
        newFeatures: [],
        canBuild: tile => '', // This can be built anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Clay Former',
                descr: `Clay has a wide variety of uses - namey the ability to hold hot liquids - but it must be formed into a shape before it can
                        be used`,
                usage: 'Mold clay balls into the shapes you need here. Various shaper tools will help improve quality',
                image: 'clayformer.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Form Clay Brick',
                        desc: 'Crafts a clay brick. Good for furnaces',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: [{name:'Clay Ball', qty:1}], role:'item', workSite:false}],
                        outputItems: ['Wet Clay Brick'],
                        buildTime: 20*30, // 30 seconds
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            game.clearItems(tile, [{name: 'Clay Ball', qty:1}], 'src/structures/ClayFormer.jsx->Form Clay Brick');
                            tile.items.push(game.createItem('Wet Clay Brick', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Form Handmade Clay Jar',
                        desc: 'Crafts a crude jar by hand',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: [{name:'Clay Ball', qty:2}], role:'item', workSite:false}],
                        outputItems: ['Wet Handmade Clay Jar'],
                        buildTime: 20*45, // 45 seconds
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            game.clearItems(tile, [{name: 'Clay Ball', qty:2}], 'src/structures/ClayFormer.jsx->Form Handmade Clay Jar');
                            tile.items.push(game.createItem('Wet Handmade Clay Jar'));
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}