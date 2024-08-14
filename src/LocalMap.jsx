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
                    //console.log(imageURL + "localtiles/"+ minimapTiles[tile.floor]);
                    // We were showing the player here conditionally, but since the player can move freely, it doesn't work to render it inside tiles
                    return (
                        <div
                            style={{ display: "block", position: "absolute", left: tile.x * 42, top: tile.z * 42 }}
                            key={key}
                            onKeyDown={(e) => {
                                console.log(e);
                            }}
                        >
                            <img src={imageURL + "localtiles/"+ minimapTiles[tile.floor].img} style={{ pointerEvents: "none" }} />
                        </div>
                    );
                })}
                
                {/* With that done, place the player image on the map as well */}                
                <img src={imageURL + "worker.png"} style={{display:'block', position:'absolute', pointerEvents:'none', left:props.player.x*42, top:props.player.z*42, zIndex:2}} />
            </div>
        </div>
    );
}

// I think we're going to do something different than walkLag this time around... but we'll worry about that when we get there
const minimapTiles = [
    { id: 0, name: 'Air', img: 'air.png', desc:'Open air. Nice to breathe, but not nice to stand on', walkLag: 2},
    { id: 1, name: 'Dirt', img: 'dirt.png', desc:'Exposed dirt', walkLag: 4},
    { id: 2, name: 'Rock', img: 'rock.png', desc: 'Exposed rock', walkLag: 3},
    { id: 3, name: "Wheat Grass", img: "wheatgrass.png", desc: "Wheat. Tasteful grains for a variety of uses", walkLag: 6 },
    { id: 4, name: "Oat Grass", img: "oatgrass.png", desc: "Oat. Hearty grains for many purposes", walkLag: 6 },
    { id: 5, name: "Rye Grass", img: "ryegrass.png", desc: "Rye. Makes a sour tasting bread", walkLag: 6 },
    { id: 6, name: "Barley Grass", img: "barleygrass.png", desc: "Barley. A nutty grain", walkLag: 6 },
    { id: 7, name: "Millet Grass", img: "milletgrass.png", desc: "Millet. Its good for you", walkLag: 8 },
    { id: 8, name: "Maple Tree", img: "mapletreeone.jpg", desc: "Maple trees. Its sap is useful for syrups", walkLag: 8 },
    { id: 9, name: "Birch Tree", img: "mapletreeone.jpg", desc: "Birch trees. Its bark is good for making ropes", walkLag: 8 },
    { id: 10, name: "Oak Tree", img: "mapletreeone.jpg", desc: "Oak trees. Provides acorns - edible in a pinch", walkLag: 8 },
    { id: 11, name: "Mahogany Tree", img: "mapletreeone.jpg", desc: "Mahogany trees. Provides lots of shade", walkLag: 8 },
    { id: 12, name: "Pine Tree", img: "pinetreetwo.jpg", desc: "Pine trees. Green year-round, and provides pinecones", walkLag: 8 },
    { id: 13, name: "Cedar Tree", img: "pinetreetwo.jpg", desc: "Cedar trees. Grows tall and straight", walkLag: 8 },
    { id: 14, name: "Fir Tree", img: "pinetreetwo.jpg", desc: "Fir trees. Strong trees that make lots of sticks", walkLag: 8 },
    { id: 15, name: "Hemlock Tree", img: "pinetreetwo.jpg", desc: "Hemlock trees. Grows tall in tight clusters", walkLag: 8 },
    { id: 16, name: "Cherry Tree", img: "cherrytreeone.jpg", desc: "Cherry trees. Makes a tart fruit, good for many dishes", walkLag: 8 },
    { id: 17, name: "Apple Tree", img: "appletreetwo.jpg", desc: "Apple trees. Delicious fruits that everyone enjoys", walkLag: 8 },
    { id: 18, name: "Pear Tree", img: "peartreeone.jpg", desc: "Pear trees. Tasty fruits that excel in colder climates", walkLag: 8 },
    { id: 19, name: "Orange Tree", img: "orangetreetwo.jpg", desc: "Orange trees. Sweet fruits that enjoy warmer climates", walkLag: 8 },
    { id: 20, name: "Hawthorn Tree", img: "mapletreeone.jpg", desc: "Hawthorn trees. It seems to pulse with extra energy", walkLag: 30 }, // this tree has thorns
    {
        id: 21,
        name: "Dogwood Tree",
        img: "mapletreeone.jpg",
        desc: "Dogwood trees. You wouldn't think this could grow here, but it's determined",
        walkLag: 8,
    },
    {
        id: 22,
        name: "Locust Tree",
        img: "mapletreeone.jpg",
        desc: "Locust trees. It seems to have an extra glow in the sunlight",
        walkLag: 30, // this also has thorns
    },
    { id: 23, name: "Juniper Tree", img: "pinetreeone.jpg", desc: "Juniper trees. It seems to come alive at night", walkLag: 8 },
    { id: 24, name: "Barren Rock", img: "basicrock.jpg", desc: "Barren rock. Easy source of stone materials and building on", walkLag: 5 },
    { id: 25, name: "Desert Sands", img: "desert.jpg", desc: "Desert sands. Hot, dusty and hard to build on", walkLag: 6 },
    {
        id: 26,
        name: "Still Water",
        img: "smallpond.jpg",
        desc: "Sitting water. Lots of life grows in it, but drinking it makes you sick",
        walkLag: 25,
    },
    { id: 27, name: "Lava", img: "lava.png", desc: "Hot lava! Very dangerous, even from a distance", walkLag: 50 },
    { id: 28, name: "Ice", img: "ice.png", desc: "Slick ice. Very cold", walkLag: 10 },
    { id: 29, name: "Snow", img: "snow.png", desc: "Snowed-over ground. Very cold", walkLag: 14 },
    { id: 30, name: "Stream", img: "smallpond.jpg", desc: "Flowing water through a stream", walkLag: 25 },
    { id: 31, name: "Swamp", img: "emptygrass.jpg", desc: "Wet grounds. Some grass, mostly water", walkLag: 20 },
    { id: 32, name: "Cliff", img: "basicrock.jpg", desc: "Rugged cliff. Don't get too close to the edge", walkLag: 80 },
    { id: 33, name: "Rubble", img: "smallpond.jpg", desc: "Creek-side rubble. Lots of tiny rocks that the stream washed in", walkLag: 15 },
    { id: 34, name: "Bank", img: "basicrock.jpg", desc: "Creek bank. The streams are slowly eroding this wall", walkLag: 20 },
    { id: 35, name: "Carrots", img: "wildcarrot.jpg", desc: "Wild carrots. An excellent vegetable", walkLag: 8 },
    { id: 36, name: "Potatoes", img: "wildpotato.jpg", desc: "Wild potatoes. A very filling vegetable", walkLag: 8 },
    { id: 37, name: "Tomatoes", img: "wildtomato.png", desc: "Wild tomatoes. Useful for many cooking recipes", walkLag: 8 },
    { id: 38, name: "Turnips", img: "wildturnip.png", desc: "Wild turnips. A nutritious vegetable", walkLag: 8 },
    { id: 39, name: "Peanuts", img: "wildpeanut.png", desc: "Wild peanuts. A tasty snack", walkLag: 8 },
    { id: 40, name: "Maize", img: "wildmaize.png", desc: "Wild Maize - also known as corn. Has many uses", walkLag: 8 },
    { id: 41, name: "Beans", img: "wildbean.png", desc: "Wild beans. A very filling vegetable", walkLag: 8 },
    { id: 42, name: "Onions", img: "wildonion.png", desc: "Wild onion. A sharp taste on its own, but great with other foods", walkLag: 8 },
    { id: 43, name: "Broccoli", img: "wildbroccoli.png", desc: "Wild broccoli. A good vegetable", walkLag: 8 },
    { id: 44, name: "Pumpkins", img: "wildpumpkin.png", desc: "Wild pumpkin.", walkLag: 8 },
    { id: 45, name: "Grass", img: "emptygrass.jpg", desc: "Short grass space. Nothing major here, good for new projects", walkLag: 6 },
    { id: 46, name: "Farmland", img: "farmplot.png", desc: "Active farm space.", walkLag: 12 },
    { id: 47, name: "Dirt", img: "basicdirt.jpg", desc: "Open dirt pit. Too much foot traffic for plants to grow here", walkLag: 6 },
    { id: 48, name: "Gravel", img: "basicrock.jpg", desc: "Flat gravel surface. Won't turn into a muddy mess in the rain", walkLag: 4 },
];
