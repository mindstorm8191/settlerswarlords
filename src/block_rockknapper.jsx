/* rockknapper.jsx
    Provides the Rock Knapper, the first means to produce tools from rocks
    For the game Settlers & Warlords
*/

import React from "react";
import {buildingList, imageURL} from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";

export function RockKnapper(mapTile) {
    // These can only be built on rock areas
    if(mapTile.landtype!==2) return 'wronglandtype';

    let b = {
        id: (buildingList.length===0)?1:buildingList[buildingList.length-1].id+1,
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
        update: ()=>{
            if(b.currentCraft==='') return;

            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(b.currentCraft);
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
            const [newMode, setNewMode] = React.useState(b.currentCraft);
            return (
                <>
                    <div>Choose what to craft</div>
                    <ClickableLabel
                        onClick={cur=>{
                            if(b.currentCraft===cur) return;
                            b.currentCraft='Flint Knife';
                            b.progressBar=0;
                            setNewMode('Flint Knife');
                        }}
                        mode={(newMode==='Flint Knife')?'selected':'other'}
                        options={labelOptions}
                    >
                        <img src={imageURL +"item_flintKnife.png"} alt="Flint Knife" />
                        Flint Knife
                    </ClickableLabel>
                    <ClickableLabel
                        onClick={cur=>{
                            if(b.currentCraft===cur) return;
                            b.currentCraft='Flint Stabber';
                            b.progressBar=0;
                            setNewMode('Flint Stabber');
                        }}
                        mode={(newMode==='Flint Stabber')?'selected':'other'}
                        options={labelOptions}
                    >
                        <img src={imageURL +"item_flintStabber.png"} alt="Flint Stabber" />
                        Flint Stabber
                    </ClickableLabel>
                </>
            );
        }
    }
    return b;
}

