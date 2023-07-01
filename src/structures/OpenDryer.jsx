/*  OpenDryer.jsx
    Provides an open space for things to dry from natural air, without getting wet from rain
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

export function OpenDryer() {
    return {
        name: 'Open Dryer',
        image: 'opendryer.png',
        tooltip: 'Dry items (like clay) in a rainproof space',
        locked: 1,
        prereq: [['Thatch Tile']],
        newFeatures: [],
        canBuild: tile=>{
            // We should be able to build on anything that isn't trees (or water)
            if(tile.landtype<=4) return '';
            if(tile.landtype===minimapTiles.find(i=>i.name==='Grass').id) return '';
            if(tile.landtype===minimapTiles.find(i=>i.name==='Barren Rock').id) return '';
            return 'Must be built on open terrain';
        },
        create: tile=>{
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Open Dryer',
                descr: `Thatch roofing tiles gives way to one critical ability: keeping rain off of surfaces. Clay items, which must dry
                        thoroughly before being cooked, can benefit greatly from this.`,
                usage: `Consisting of a roof with open sides, provides an ideal place to dry out items. Once built, just place items here until dry`,
                image: 'opendryer.png',
                mode: 'notbuilt',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Build',
                        desc: 'Build this structure',
                        taskType: 'construct',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Wooden Pole', qty:4}], role:'item', workSite:false},
                            {options: [{name:'Long Stick', qty:11}], role:'item', workSite:false},
                            {options: [{name:'Short Stick', qty:2}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:16}], role:'item', workSite:false},
                            {options: [{name:'Thatch Tile', qty:20}], role:'item', workSite:false}
                        ],
                        outputItems: [],
                        buildTime: 20*60*4, // 4 minutes... structures will take a long time
                        hasQuantity: false,
                        canAssign: ()=>false,
                        onComplete: worker => {
                            b.mode = 'inuse';
                            let tile = game.tiles.find(tile=>tile.x===b.x && tile.y===b.y);
                            game.clearItems(tile, [
                                {name: 'Wooden Pole', qty:4},
                                {name: 'Long Stick', qty:11},
                                {name: 'Short Stick', qty:2},
                                {name: 'Small Rope', qty:16},
                                {name: 'Thatch Tile', qty:20}
                            ]);
                            tile.modified = true;
                        }
                    }
                ],

                onSave: ()=>{
                    // save information specific to this structure type
                    return {
                        mode: b.mode
                    };
                },
                onLoad: pack=>{
                    b.mode = pack.mode;
                }
            };
            return b;
        }
    }
}