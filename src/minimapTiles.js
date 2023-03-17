/*  minimapTiles.js
    Provides an array of tiles for the minimap, including a path to an image for it, and a simple description
    For the game Settlers & Warlords
*/

// This list will probably grow as the game grows. Apparently 40 tiles is very few for a game like this
export const minimapTiles = [
    { id: 0, name: "Wheat Grass", img: "wheatgrass.png", desc: "Wheat. Tasteful grains for a variety of uses", walkLag: 6 },
    { id: 1, name: "Oat Grass", img: "oatgrass.png", desc: "Oat. Hearty grains for many purposes", walkLag: 6 },
    { id: 2, name: "Rye Grass", img: "ryegrass.png", desc: "Rye. Makes a sour tasting bread", walkLag: 6 },
    { id: 3, name: "Barley Grass", img: "barleygrass.png", desc: "Barley. A nutty grain", walkLag: 6 },
    { id: 4, name: "Millet Grass", img: "milletgrass.png", desc: "Millet. Its good for you", walkLag: 8 },
    { id: 5, name: "Maple Tree", img: "mapletreeone.jpg", desc: "Maple trees. Its sap is useful for syrups", walkLag: 8 },
    { id: 6, name: "Birch Tree", img: "mapletreeone.jpg", desc: "Birch trees. Its bark is good for making ropes", walkLag: 8 },
    { id: 7, name: "Oak Tree", img: "mapletreeone.jpg", desc: "Oak trees. Provides acorns - edible in a pinch", walkLag: 8 },
    { id: 8, name: "Mahogany Tree", img: "mapletreeone.jpg", desc: "Mahogany trees. Provides lots of shade", walkLag: 8 },
    { id: 9, name: "Pine Tree", img: "pinetreetwo.jpg", desc: "Pine trees. Green year-round, and provides pinecones", walkLag: 8 },
    { id: 10, name: "Cedar Tree", img: "pinetreetwo.jpg", desc: "Cedar trees. Grows tall and straight", walkLag: 8 },
    { id: 11, name: "Fir Tree", img: "pinetreetwo.jpg", desc: "Fir trees. Strong trees that make lots of sticks", walkLag: 8 },
    { id: 12, name: "Hemlock Tree", img: "pinetreetwo.jpg", desc: "Hemlock trees. Grows tall in tight clusters", walkLag: 8 },
    { id: 13, name: "Cherry Tree", img: "cherrytreeone.jpg", desc: "Cherry trees. Makes a tart fruit, good for many dishes", walkLag: 8 },
    { id: 14, name: "Apple Tree", img: "appletreeone.jpg", desc: "Apple trees. Delicious fruits that everyone enjoys", walkLag: 8 },
    { id: 15, name: "Pear Tree", img: "peartreeone.jpg", desc: "Pear trees. Tasty fruits that excel in colder climates", walkLag: 8 },
    { id: 16, name: "Orange Tree", img: "orangetreeone.jpg", desc: "Orange trees. Sweet fruits that enjoy warmer climates", walkLag: 8 },
    { id: 17, name: "Hawthorn Tree", img: "mapletreeone.jpg", desc: "Hawthorn trees. It seems to pulse with extra energy", walkLag: 30 }, // this tree has thorns
    {
        id: 18,
        name: "Dogwood Tree",
        img: "mapletreeone.jpg",
        desc: "Dogwood trees. You wouldn't think this could grow here, but it's determined",
        walkLag: 8,
    },
    {
        id: 19,
        name: "Locust Tree",
        img: "mapletreeone.jpg",
        desc: "Locust trees. It seems to have an extra glow in the sunlight",
        walkLag: 30, // this also has thorns
    },
    { id: 20, name: "Juniper Tree", img: "pinetreeone.jpg", desc: "Juniper trees. It seems to come alive at night", walkLag: 8 },
    { id: 21, name: "Barren Rock", img: "basicrock.jpg", desc: "Barren rock. Easy source of stone materials and building on", walkLag: 5 },
    { id: 22, name: "Desert Sands", img: "desert.jpg", desc: "Desert sands. Hot, dusty and hard to build on", walkLag: 6 },
    {
        id: 23,
        name: "Still Water",
        img: "smallpond.jpg",
        desc: "Sitting water. Lots of life grows in it, but drinking it makes you sick",
        walkLag: 25,
    },
    { id: 24, name: "Lava", img: "lava.png", desc: "Hot lava! Very dangerous, even from a distance", walkLag: 50 },
    { id: 25, name: "Ice", img: "ice.png", desc: "Slick ice. Very cold", walkLag: 10 },
    { id: 26, name: "Snow", img: "snow.png", desc: "Snowed-over ground. Very cold", walkLag: 14 },
    { id: 27, name: "Stream", img: "smallpond.jpg", desc: "Flowing water through a stream", walkLag: 25 },
    { id: 28, name: "Swamp", img: "emptygrass.jpg", desc: "Wet grounds. Some grass, mostly water", walkLag: 20 },
    { id: 29, name: "Cliff", img: "basicrock.jpg", desc: "Rugged cliff. Don't get too close to the edge", walkLag: 80 },
    { id: 30, name: "Rubble", img: "smallpond.jpg", desc: "Creek-side rubble. Lots of tiny rocks that the stream washed in", walkLag: 15 },
    { id: 31, name: "Bank", img: "basicrock.jpg", desc: "Creek bank. The streams are slowly eroding this wall", walkLag: 20 },
    { id: 32, name: "Carrots", img: "wildcarrot.jpg", desc: "Wild carrots. An excellent vegetable", walkLag: 8 },
    { id: 33, name: "Potatoes", img: "wildpotato.jpg", desc: "Wild potatoes. A very filling vegetable", walkLag: 8 },
    { id: 34, name: "Tomatoes", img: "wildtomato.png", desc: "Wild tomatoes. Useful for many cooking recipes", walkLag: 8 },
    { id: 35, name: "Turnips", img: "wildturnip.png", desc: "Wild turnips. A nutritious vegetable", walkLag: 8 },
    { id: 36, name: "Peanuts", img: "wildpeanut.png", desc: "Wild peanuts. A tasty snack", walkLag: 8 },
    { id: 37, name: "Maize", img: "wildmaize.png", desc: "Wild Maize - also known as corn. Has many uses", walkLag: 8 },
    { id: 38, name: "Beans", img: "wildbean.png", desc: "Wild beans. A very filling vegetable", walkLag: 8 },
    { id: 39, name: "Onions", img: "wildonion.png", desc: "Wild onion. A sharp taste on its own, but great with other foods", walkLag: 8 },
    { id: 40, name: "Broccoli", img: "wildbroccoli.png", desc: "Wild broccoli. A good vegetable", walkLag: 8 },
    { id: 41, name: "Pumpkins", img: "wildpumpkin.png", desc: "Wild pumpkin.", walkLag: 8 },
    { id: 42, name: "Grass", img: "emptygrass.jpg", desc: "Short grass space. Nothing major here, good for new projects", walkLag: 6 },
    { id: 43, name: "Farmland", img: "farmplot.png", desc: "Active farm space.", walkLag: 12 },
    { id: 44, name: "Dirt", img: "basicdirt.jpg", desc: "Open dirt pit. Too much foot traffic for plants to grow here", walkLag: 6 },
    { id: 45, name: "Gravel", img: "basicrock.jpg", desc: "Flat gravel surface. Won't turn into a muddy mess in the rain", walkLag: 4 },
];
