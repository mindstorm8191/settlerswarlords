/*  block_foragepost.jsx
    For the Forage Post, the first food source for the colonists
    for the game Settlers & Warlords
*/

import React from "react";
import {buildingList, imageURL} from "./App.js";
import { DanCommon } from "./DanCommon.js";

export function ForagePost(mapTile) {
    // Check that there are no other forage posts in this area
    if(buildingList.some(e=>e.name==="Forage Post")) {
        console.log('There is already a forage post in this area');
        return 'cannotbuildmore';
    }
    let b = {
        id: (buildingList.length===0)?1:buildingList[buildingList.length-1].id+1,
        name: "Forage Post",
        descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it first.`,
        usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                another one in this area`,
        image: imageURL+'foragepost.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        update: ()=>{
            b.progressBar++;
            if(b.progressBar>=30) {
                b.onhand.push(DanCommon.getRandomFrom('Apple', 'Berries', 'Tree Nuts', 'Mushrooms'));
                b.progressBar = 0;
            }
        },
        SidePanel: ()=>{
            return <>
                <div>Progress: {parseInt((b.progressBar*100)/30)}%</div>
                <div>Food on hand: {b.onhand.length}</div>
            </>;
        }
    }
    return b;
}