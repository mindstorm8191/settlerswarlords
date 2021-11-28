/*  localTiles.jsx
    Various structures to aid in displaying information about tiles of the local map
    For the game Settlers & Warlords
*/

import React from "react";

export function EmptyLandDescription(props) {
    // Provides a basic description of the land in the selected tile
    // Collects the correct land type from the tile that is selected

    // These are the natural land formations
    let landType = (props.tile.newlandtype===-1)?props.tile.landtype:props.tile.newlandtype
    let response='';
    switch(landType) {
        case 0: response='Wheat. Tasteful grains for a variety of uses'; break;
        case 1: response='Oat. Hearty grains for many purposes'; break;
        case 2: response='Rye. Makes a sour tasting bread'; break;
        case 3: response='Barley. A nutty grain'; break;
        case 4: response="Millet. It's good for you"; break;
        case 5: response='Maple trees. Its sap is useful for syrups'; break;
        case 6: response='Birch trees. Its bark is good for making ropes'; break;
        case 7: response='Oak trees. Provides acorns - edible in a pinch'; break;
        case 8: response='Mahogany trees. Provides lots of shade'; break;
        case 9: response='Pine trees. Green year-round, and provides pinecones'; break;
        case 10: response='Cedar trees. Grows all and straight'; break;
        case 11: response='Fir trees. Strong trees that make lots of sticks'; break;
        case 12: response='Hemlock trees. Grows tall in tight clusters'; break;
        case 13: response='Cherry trees. Makes a tart fruit, good for many dishes'; break;
        case 14: response='Apple trees. Delicious fruits that everyone enjoys'; break;
        case 15: response='Pear trees. Tasty fruits that excel in colder climates'; break;
        case 16: response='Orange trees. Sweet fruits that enjoy warmer climates'; break;
        case 17: response='Hawthorne trees. It seems to pulse with extra energy'; break;
        case 18: response="Dogwood trees. You wouldn't think this would grow here, but it's determined"; break;
        case 19: response='Locust trees. It seems to glow in the sunlight'; break;
        case 20: response='Juniper trees. It seems to come alive at night'; break;
        case 21: response='Barren rock. Easy source of stone materials and building on'; break;
        case 22: response='Desert sands. Hot, dusty and hard to build on'; break;
        case 23: response='Sitting water. Lots of life grows in it, but drinking it makes you sick'; break;
        case 24: response='Hot lava! Very dangerous, even from a distance'; break;
        case 25: response='Slick ice. Very cold'; break;
        case 26: response='Snowed-over ground. Very cold'; break;
        case 27: response='Flowing water through a stream'; break;
        case 28: response='Wet grounds. Some grass, mostly water'; break;
        case 29: response="Rugged cliff. Don't get close to the edge"; break;
        case 30: response='Creek-side rubble. Lots of tiny rocks that the stream washed in'; break;
        case 31: response='Creek bank. The streams are slowly eroding this wall'; break;
        // Now we get into the man-made land types
        case 32: response='Short grass space. Nothing major here, good for new projects'; break;
        case 33: response='Active farm space.'; break;
        case 34: response='Open dirt pit. Too much traffic for plants to grow here'; break;
        case 35: response="Flat gravel surface. Won't turn into a muddy mess in the rain"; break;
        // We'll add wood flooring, concrete, carpets, tile, etc when we reach those points
        default: response="Oops, there's no description of land type "+ landType; break
    }
    return <p>{response}</p>;
}

export const minimapImages = [
    "wheatgrass.png", // 0: wheat
    "oatgrass.png", // 1: oat
    "ryegrass.png", // 2: rye
    "barleygrass.png", // 3: barley
    "milletgrass.png", // 4: millet
    "mapletreeone.jpg", // 5: maple
    "mapletreeone.jpg", // 6: birch
    "mapletreeone.jpg", // 7: oak
    "mapletreeone.jpg", // 8: mahogany
    "pinetreetwo.jpg", // 9: pine
    "pinetreetwo.jpg", // 10: cedar
    "pinetreetwo.jpg", // 11: fir
    "pinetreetwo.jpg", // 12: hemlock
    "cherrytreeone.jpg", // 13: cherry
    "appletreeone.jpg", // 14: apple
    "peartreeone.jpg", // 15: pear
    "orangetreeone.jpg", // 16: orange
    "mapletreeone.jpg", // 17: hawthorne
    "mapletreeone.jpg", // 18: dogwood
    "mapletreeone.jpg", // 19: locust
    "pinetreeone.jpg", // 20: juniper
    "basicrock.jpg", // 21
    "desert.jpg", // 22
    "smallpond.jpg", // 23
    "lava.png", // 24
    "ice.png", // 25
    "snow.png", // 26
    "smallpond.jpg", // 27 stream
    "emptygrass.jpg", // 28 wetland
    "basicrock.jpg", // 29 cliff
    "smallpond.jpg", // 30 creekwash
    "basicrock.jpg", // 31 creekbank
    "emptygrass.jpg", // 32 empty grass
    "farmplot.png", // 33 farm plot
];