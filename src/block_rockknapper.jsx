/* rockknapper.jsx
    Provides the Rock Knapper, the first means to produce tools from rocks
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function RockKnapper(mapTile) {
    // These can only be built on rock areas
    if(mapTile.landtype!==2) return 'wronglandtype';

    let b = {
        id: game.getNextBlockId(),
        name: "Rock Knapper",
        descr: `Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes you need.`,
        usage: `Knapp rocks to craft either knives or stabbers - you must select one before crafting can begin. Once crafted, place
                into a toolbox to use in nearby blocks.`,
        image: imageURL +'rockKnapper.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        currentCraft: '',
        hasItem: nameList =>{
            // returns true if this block can output any item in the name list
            return nameList.some(name => {
                return b.onhand.some(item=>item.name===name);
            });
        },
        getItem: name=>{
            // Returns an item, removing it from this inventory
            let slot = b.onhand.find(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0]; // splice returns an array of all deleted items; we only need the one item
        },
        update: ()=>{
            if(b.currentCraft==='') return; // User needs to select something to craft!
            if(b.onhand.length>=3) return;  // we can only hold 3 finished tools here
            if(game.workPoints<=0) return; // we have nobody to work this block
            game.workPoints--;
            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(game.createItem(b, b.currentCraft, 'tool', {efficiency:1, endurance:30}));
                b.progressBar=0;
            }
        },
        SidePanel: ()=>{
            let labelOptions = [
                {name:'selected', bgColor:'green'},
                {name:'other', bgColor:'red'},
                {name:'disabled', bgColor:'white'}
            ];
            // Maybe we can still use useState here?
            const [curCraft, setCurCraft] = React.useState(b.currentCraft);
            // This will trigger updates locally, but it will only matter for a short duration. Once the game updates again, this will be
            // irrelevant, but it keeps the interface responsive!

            const Priority = b.ShowPriority;

            return (
                <>
                    <Priority />
                    On Hand: {(b.onhand.length===0)?'nothing':b.onhand[0].name +' x'+ b.onhand.length}
                    <div>Choose what to craft</div>
                    <ClickableLabel
                        mode={curCraft==='Flint Knife'?'selected':'other'}
                        options={labelOptions}
                        onClick={cur=>{
                            if(b.currentCraft===cur) return;
                            b.currentCraft='Flint Knife';
                            b.progressBar=0;
                            setCurCraft('Flint Knife');
                        }}
                    >
                        <img src={imageURL +"item_flintKnife.png"} alt="Flint Knife" />
                        Flint Knife
                    </ClickableLabel>
                    <ClickableLabel
                        onClick={cur=>{
                            if(b.currentCraft===cur) return;
                            b.currentCraft='Flint Stabber';
                            b.progressBar=0;
                            setCurCraft('Flint Stabber');
                        }}
                        mode={curCraft==='Flint Stabber'?'selected':'other'}
                        options={labelOptions}
                    >
                        <img src={imageURL +"item_flintStabber.png"} alt="Flint Stabber" />
                        Flint Stabber
                    </ClickableLabel>
                </>
            );
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b));
}

