/*  block_twinemaker.jsx
    Collects bark from select trees, turning it into twine, to be used as an early rope
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL } from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function TwineMaker(mapTile) {
    if(mapTile.landtype!==1) return 'wronglandtype';

    let b = {
        id: game.getNextBlockId(),
        name: "Twine Maker",
        descr: `Rope is an essential tool for survival, providing hundreds of potential uses to get things done. Twine isn't a very
                effective rope, but it is available, and will do for now.`,
        usage: `Produces twine from bark and vines in the forest`,
        image: imageURL +'twinemaker.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        toolGroups: [
            {group:'knife', options: ['Flint Knife'], required:true, selected:'', loaded:null}
        ],
        possibleOutputs: ()=> ['Twine'],
        willAccept: item=>false, // This block doesn't accept any input items
        takeItem: item=>false,
        update: ()=>{
            if(!b.checkTools()) return; // No tool loaded here (yet)
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
            if(game.workPoints<=0) return; // Nobody available to do work here
            game.workPoints--;
            b.useTools();
            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(game.createItem(b, 'Twine', 'item', {}));
                b.progressBar = 0;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            return (
                <>
                    <Priority />
                    <p className="singleline">Items on hand: {b.onhand.length===0?'nothing':'Twine x'+ b.onhand.length}</p>
                    <Tools />
                </>
            );
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                tools: b.toolGroups.map(t=>{
                    return {
                        group: t.group,
                        selected: t.selected,
                        loaded: t.loaded
                    }
                })
            }
        },
        load: content=>{
            b.priority = content.priority;
            b.progressBar = content.progress;
            b.onhand      = content.items;
            b.toolGroups = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockRequiresTools(b), blockSharesOutputs(b));
}