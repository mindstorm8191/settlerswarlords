/*  LocalMap.jsx
    Manages displaying the game screen for users to play on
    For the game Settlers & Warlords
*/

import React from 'react';
import { DAX } from "./libs/DanAjax.js";

import { serverURL, imageURL } from "./App.js";
import { game } from "./game.jsx";

export function LocalMap(props) {
    // Manages displaying the game
    // prop fields - data
    //     mapTiles - array of tiles for this map
    //     player - object holding all relevant player data
    // prop fields - functions
    //     changeMapTiles - manages changes to the tiles displayed to this user

    const [mapLoading, setMapLoading] = React.useState(0); // This will be set to whenever we are requesting more map content from the server. We
    // will show some kind of loading icon on the screen.

    // As we load this React component, we need to set the game's handle so it can update the position in real time
    const [scrollSet, setScrollSet] = React.useState([]);
    
    React.useEffect(() => {
        // On load, check the map's range, and ensure there are enough tiles around the player already loaded
        // This is actually a bit challenging; we need to somehow group all map tiles into their respective chunks, to compare which chunks we are actually missing
        // Since any tile within a chunk can effectively confirm that chunk is loaded, we should be able to avoid that problem simply by checking every 8 tiles
        // from the player's location.
        //expandTiles(props.mapTiles, 1);
        let chunksNeeded = [];
        let range = 1;
        // Instead of finding each missing chunk and sending an individual request for it, we need to make a full list and request them all at once
        // ... but that would be a TON of data being fetched, all at once. Maybe we can put a limit on the number of tiles requested at once?
        for (let x = -range; x <= range; x++) {
            for (let y = -range; y <= range; y++) {
                for (let z = -range; z <= range; z++) {
                    // With boolean OR, Javascript will check each condition one at a time. It will accept the first answer that returns true and skip the
                    // rest; otherwise this check would fail!
                    if (
                        typeof props.mapTiles[props.player.x + x * 8] === "undefined" ||
                        typeof props.mapTiles[props.player.x + x * 8][props.player.y + y * 8] === "undefined" ||
                        typeof props.mapTiles[props.player.x + x * 8][props.player.y + y * 8][props.player.z + z * 8] === "undefined"
                    ) {
                        // Add this location to the list. Note we need the chunk coordinates, not the real coordinates
                        chunksNeeded.push([x, y, z]);
                    }
                }
            }
        }

        console.log(chunksNeeded.length + " chunks left to load");
        if (chunksNeeded.length > 0) {
            if (chunksNeeded.length > 10) chunksNeeded.splice(10, chunksNeeded.length - 10); // limit the number of grabs to 10
            fetch(serverURL + "/routes/loadmap.php", DAX.serverMessage({ chunkList: chunksNeeded }, true))
                .then((res) => DAX.manageResponseConversion(res))
                .catch((err) => console.log(err))
                .then((data) => {
                    if (data.result !== "success") {
                        console.log("There was an error in requesting map chunks");
                    }
                    // Now, we need to apply these chunks to the tile map. Fortunately, we have a function in the chain for that
                    props.changeMapTiles(data.chunks);
                });
        }
    }, [props.mapTiles]);

    const divRef = React.useRef();
    React.useEffect(()=>{
        // Manages updating the view screen of the game, to keep it with the player
        //console.log('reference:', divRef);
        if(divRef) {
            // we should be able to get the width of our viewing window via divRef.current.offsetWidth and divRef.current.offsetHeight
            // assuming a width of 1000 and a height of 600, the middle will be [500,300]
            // if the player is at [0,0], then we want the center of the map to be at [500,300]... therefore top & left should be [-500,-300]
            let pixelPosition = [props.player.x*42, props.player.z*42];
            let midWidth = divRef.current.offsetWidth/2;
            let midHeight = divRef.current.offsetHeight/2;
            setScrollSet([midWidth-pixelPosition[0], midHeight-pixelPosition[1]]);
        }
    }, [props.player]);

    

    // Before we can generate a map, we need to pick out the tiles of the map to display
    let showTiles = [];
    for (let x = Math.floor(props.player.x)-20; x <= Math.floor(props.player.x) + 20; x++) {
        for (let z = Math.floor(props.player.z)-20; z <= Math.floor(props.player.z) + 20; z++) {
            //if (typeof props.mapTiles[x]) showTiles.push({ ...props.mapTiles[x][4][z], x: x, y: 4, z: z });
            if (
                typeof props.mapTiles[x] !== "undefined" &&
                typeof props.mapTiles[x][props.player.y] !== "undefined" &&
                typeof props.mapTiles[x][props.player.y][z] !== "undefined"
            ) {
                showTiles.push({ ...props.mapTiles[x][props.player.y][z], x: x, y: 4, z: z });
            }
        }
    }

    // For now, just focus on displaying the 4th map layer, that should have grass tiles on it
    // We can't really use DraggableMap for the local map, as we will be bound to the player's location
    return (
        <div
            style={{ display: "block", position: "relative", overflow: "hidden", width: "100%", height: 700 }}
            tabIndex={0}
            onKeyDown={(e) => {
                console.log("Type!", e);
                // We want to allow the user to press both up & down, and for that to cancel each other out. When either key is released, the other key should
                // continue to work. So we will need 4 inputs variables for this
                if(e.key==='w') game.playerDirections.up = 1;
                if(e.key==='s') game.playerDirections.down = 1;
                if(e.key==='a') game.playerDirections.left = 1;
                if(e.key==='d') game.playerDirections.right = 1;
            }}
            onKeyUp={(e) => {
                if(e.key==='w') game.playerDirections.up = 0;
                if(e.key==='s') game.playerDirections.down = 0;
                if(e.key==='a') game.playerDirections.left = 0;
                if(e.key==='d') game.playerDirections.right = 0;
            }}
            ref={divRef}
        >
            <div style={{position:'absolute', top:scrollSet[1], left:scrollSet[0]}} >
            {/*<div style={{position:'absolute', top:42*8, left:42*8}}>*/}
                {showTiles.map((tile, key) => {
                    // We were showing the player here conditionally, but since the player can move freely, it doesn't work to render it inside tiles
                    return (
                        <div
                            style={{ display: "block", position: "absolute", left: tile.x * 42, top: tile.z * 42 }}
                            key={key}
                            onKeyDown={(e) => {
                                console.log(e);
                            }}
                        >
                            <img src={imageURL + "localtiles/barleygrass.png"} style={{ pointerEvents: "none" }} />
                        </div>
                    );
                })}
                
                {/* With that done, place the player image on the map as well */}                
                <img src={imageURL + "worker.png"} style={{display:'block', position:'absolute', pointerEvents:'none', left:props.player.x*42, top:props.player.z*42, zIndex:2}} />
            </div>
        </div>
    );
}
