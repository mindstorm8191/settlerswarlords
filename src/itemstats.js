/*  itemstats.js
    Provides information & details about all items available
    For the game Settlers & Warlords
*/

export const itemStats = [
    {
        name: "Animalskin Hat",
        role: "clothing",
        position: "head",
        armorFactor: 0,
        thermalFactor: 5,
        baseEndurance: 10, // clothing endurance will behave differently than tool endurance. This counts the number of times it takes a hit
        img: "animalskinhat.png",
        desc: "A hat made of animal skins. Keeps your head warm",
    },
    {
        name: "Animalskin Pants",
        role: "clothing",
        position: "legs",
        armorFactor: 0,
        thermalFactor: 5,
        baseEndurance: 10,
        img: "animalskinpants.png",
        desc: "Some pants made from animal skins. Keeps you warm",
    },
    {
        name: "Animalskin Satchel",
        role: "backpack", // we'll probably make a backpack later, with a capacity of 6
        capacity: 3,
        img: "animalskinsatchel.png",
        desc: "A satchel made from animal skins. Good for carrying small things",
    },
    {
        name: "Animalskin Shirt",
        role: "clothing",
        position: "torso",
        armorFactor: 0,
        thermalFactor: 5,
        baseEndurance: 10,
        img: "animalskinshirt.png",
        desc: "A shirt made from animal skins. Keeps you warm",
    },
    {
        name: "Animalskin Shoes",
        role: "clothing",
        position: "feet",
        armorFactor: 0,
        thermalFactor: 5,
        baseEndurance: 10, // we need something extra to count toward walking endurance... maybe eventually
        img: "animalskinshoes.png",
        desc: "Some shoes made from animal skins. Keeps your feet warm",
    },
    {
        name: "Apple",
        role: "food",
        foodTime: 20 * 30, // 30 seconds is not a lot for an apple
        harvestTime: 20 * 2,
        lifespan: 20 * 90, // fruits won't survive long on their own
        conversion: "Rotten Fruit",
        conversionQty: 1,
        img: "apple.png",
        desc: "An apple, edible straight from the tree",
    },
    {
        name: "Apple Tree",
        role: "foodprovider", // food providers can provide food simply by harvesting. This is done at the Forage Post
        logs: 1,
        sticks: 12,
        harvestTime: 20 * 40,
        img: "appletree.png",
        output: [
            { name: "Barren Apple Tree", qty: 1 },
            { name: "Apple", qty: 30 },
        ],
        minReplenish: 20 * 60 * 5,
        maxReplenish: 20 * 60 * 15,
        conversion: "Apple",
        desc: "A tree growing apples. This grows best in normal climates",
    },
    { name: "Bark Fibers", role: "item", img: "twinestrips.png", desc: "Pieces of bark fiber" },
    { name: "Barley Grass", role: "item", img: "barleygrass.png", desc: "Fields of barley, growing naturally" },
    { name: "Barley Hay", role: "item", img: "barleyhay.png", desc: "Barley grasses, both straw and seed" },
    {
        name: "Bean Plant",
        purpose: "item", // bean plants don't produce edible foods directly
        harvestTime: 20 * 15,
        img: "beanplant.png",
        minReload: 20 * 60 * 3,
        maxReload: 20 * 60 * 8,
        conversion: "Raw Beans",
        desc: "Wild Beans growing",
    },
    {
        name: "Birch Tree",
        role: "item",
        logs: 1,
        sticks: 6,
        img: "mapletree.png",
        desc: "Typically tall and narrow, growing in tight clusters. Their seeds aren't edible",
    },
    { name: "Boar Skin", role: "item", img: "boarskin.png", desc: "Boar skin, freshly cleaned. Very warm" },
    { name: "Bone", role: "item", img: "bone.png", desc: "Animal bone. Has many uses" },
    {
        name: "Bone Needle",
        role: "tool",
        img: "boneneedle.png",
        baseEndurance: 20 * 60,
        baseEfficiency: 1,
        desc: "A crude needle. Useful for sewing",
    },
    {
        name: "Broccoli",
        role: "food",
        foodTime: 20 * 60,
        lifespan: 20 * 60 * 4,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "broccoli.png",
        desc: "Crunchy and healthy",
    },
    {
        name: "Broccoli Plant",
        role: "foodprovider",
        harvestTime: 20 * 10,
        img: "broccoliplant.png",
        minReplenish: 20 * 60 * 9,
        maxReplenish: 20 * 60 * 20,
        conversion: "Broccoli",
        desc: "Broccoli, growing wildly",
    },
    {
        name: "Carrot",
        role: "food",
        foodTime: 20 * 90,
        lifespan: 20 * 60 * 8,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "carrot.png",
        desc: "Crunchy and healthy",
    },
    {
        name: "Carrot Plant",
        role: "foodprovider",
        harvestTime: 20 * 10,
        img: "carrotplant.png",
        minReplenish: 20 * 60 * 6,
        maxReplenish: 20 * 60 * 18,
        conversion: "Carrot",
        desc: "Wild carrots growing. Can be harvested",
    },
    {
        name: "Cedar Tree",
        role: "item",
        logs: 6,
        sticks: 6,
        img: "pinetree.png",
        desc: "Produces nuts which are edible, but poisonous in large numbers",
    },
    {
        name: "Cherries",
        role: "food",
        foodTime: 20 * 30,
        harvestTime: 20 * 8,
        lifespan: 20 * 90,
        conversion: "Rotten Fruit",
        conversionQty: 1,
        img: "cherries.png",
        desc: "A bunch of cherries. An easy snack",
    },
    {
        name: "Cherry Tree",
        role: "foodprovider",
        logs: 0,
        sticks: 8,
        harvestTime: 20 * 60,
        img: "appletree.png",
        output: [
            { name: "Barren Cherry Tree", qty: 1 },
            { name: "Cherries", qty: 15 },
        ],
        minReplenish: 20 * 60 * 3,
        maxReplenish: 20 * 60 * 15,
        conversion: "Cherries",
        desc: "A tree growing cherries. Cherry trees can grow almost anywhere",
    },
    { name: "Clay Ball", role: "item", img: "clayball.png", desc: "A ball of clay, ready to be molded" },
    { name: "Connected Log", role: "item", img: "connectedlog.png", desc: "Log pieces, all connected. Too heavy to move by hand!" },
    {
        name: "Cooked Boar Meat",
        role: "food",
        foodTime: 20 * 60 * 5,
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "cookedboarmeat.png",
        desc: "Boar meat, cooked & ready to eat",
    },
    {
        name: "Cooked Chicken Meat",
        role: "food",
        foodTime: 20 * 60 * 5,
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "cookedchickenmeat.png",
        desc: "Chicken meat, cooked & ready to eat",
    },
    {
        name: "Cooked Deer Meat",
        foodTime: 20 * 60 * 5,
        role: "food",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "cookeddeermeat.png",
        desc: "Deer meat, cooked & ready to eat",
    },
    {
        name: "Cooked Wolf Meat",
        foodTime: 20 * 60 * 5,
        role: "food",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "cookedwolfmeat.png",
        desc: "Wolf meat, cooked & ready to eat",
    },
    {
        name: "Corn Cob",
        foodTime: 20 * 50,
        role: "food",
        lifespan: 20 * 60 * 10,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "corncob.png",
        desc: "Fresh corn. Normally cooked, but can be eaten raw",
    },
    {
        name: "Dead Boar",
        role: "perishableitem",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 12,
        img: "deadboar.png",
        desc: "A giant pig. Dangerous alive, but dead now. Makes a lot of good meat",
    },
    {
        name: "Dead Chicken",
        role: "perishableitem",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 2,
        img: "deadchicken.png",
        desc: "A chicken. Small, but makes good meat",
    },
    {
        name: "Dead Deer",
        role: "perishableitem",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 8,
        img: "deaddeer.png",
        desc: "A deer. Fast creatures, but dead now. Makes good meat",
    },
    {
        name: "Dead Wolf",
        role: "perishableitem",
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Meat",
        conversionQty: 5,
        img: "deadwolf.png",
        desc: "A wolf. Dangerous in packs, but dead now. Makes good meat",
    },
    { name: "Debarked Fallen Log", role: "item", img: "debarkedfallenlog.png", desc: "A rotten log, without bark" },
    { name: "Deer Skin", role: "item", img: "deersking.png", desc: "Deer skin, freshly cleaned. Very warm" },
    { name: "Dirt Ball", role: "item", img: "dirtball.png", desc: "A ball of dirt" },
    {
        name: "Dogwood Tree",
        role: "item",
        logs: 0,
        sticks: 6,
        img: "mapletree.png",
        desc: "A small tree, but it seems determined to grow here",
    },
    { name: "Dried Barley Hay", role: "item", img: "barleyhay.png", desc: "Barley grasses, dried and ready for use" },
    { name: "Dried Millet Hay", role: "item", img: "millethay.png", desc: "Millet grasses, dried and ready for use" },
    { name: "Dried Oat Hay", role: "item", img: "oathay.png", desc: "Oat grasses, dried and ready for use" },
    { name: "Dried Rye Hay", role: "item", img: "ryehay.png", desc: "Rye grasses, dried and ready for use" },
    { name: "Dried Wheat Hay", role: "item", img: "wheathay.png", desc: "Wheat grasses, dried and ready for use" },
    { name: "Fallen Branch", role: "item", img: "fallenbranch.png", desc: "A rotten branch, decaying on the ground" },
    { name: "Fallen Log", role: "item", img: "fallenlog.png", desc: "A rotten log, decaying on the ground" },
    { name: "Fallen Stick", role: "item", img: "fallenstick.png", desc: "A rotten stick, decaying on the ground" },
    { name: "Feather", role: "item", img: "feather.png", desc: "Chicken feathers. Has many uses" },
    { name: "Fir Tree", role: "item", log: 4, sticks: 4, img: "pinetree.png", desc: "Also produces pine cones, but a smaller variety" },
    { name: "Flint", role: "item", img: "flint.png", desc: "Flint rock, easy to hammer into shapes" },
    {
        name: "Flint Hatchet",
        role: "tool",
        baseEndurance: 20 * 60 * 3,
        baseEfficiency: 2,
        img: "flinthatchet.png",
        desc: "Flint blade for cutting wood. Better than a Flint Stabber!",
    },
    {
        name: "Flint Knife",
        role: "tool",
        baseEndurance: 20 * 60,
        baseEfficiency: 1,
        img: "flintknife.png",
        desc: "Flint, cut to provide a sharp edge",
    },
    {
        name: "Flint Scythe",
        role: "tool",
        baseEndurance: 20 * 60 * 3,
        baseEfficiency: 1,
        img: "flintscythe.png",
        desc: "Flint blade for cutting grasses",
    },
    {
        name: "Flint Shovel",
        role: "tool",
        baseEndurance: 20 * 60 * 3,
        baseEfficiency: 1,
        img: "flintshovel.png",
        desc: "Flint shaped into a shovel blade. Good for moving dirt",
    },
    {
        name: "Flint Spear",
        role: "tool",
        baseEndurance: 20 * 60,
        baseEfficiency: 1,
        img: "flintspear.png",
        desc: "Flint point on a long stick. Good for hunting or... defense",
    },
    {
        name: "Flint Stabber",
        role: "tool",
        baseEndurance: 20 * 60,
        baseEfficiency: 1,
        img: "flintstabber.png",
        desc: "Flint, cut to a tool for smashing wood",
    },
    { name: "Gravel", role: "item", img: "gravel.png", desc: "A collection of small rocks of various types" },
    {
        name: "Hawthorne Tree",
        role: "item",
        logs: 4,
        sticks: 12,
        img: "mapletree.png",
        desc: "This tree seems unusually full of life",
    },
    { name: "Hemlock Tree", role: "item", logs: 7, sticks: 15, img: "pinetree.png", desc: "Produces even smaller pine cones" },
    {
        name: "Juniper Tree",
        role: "item",
        logs: 3,
        sticks: 6,
        img: "mapletree.png",
        desc: "A tree. It seems to come alive at night",
    },
    {
        name: "Locust Tree",
        role: "item",
        logs: 10,
        sticks: 24,
        img: "mapletree.png",
        desc: "A strong locust tree. It seems to pulse with extra energy",
    },
    { name: "Log Chunk", role: "item", img: "logchunk.png", desc: "A chunk of a tree. Has a lot of good uses" },
    { name: "Long Stick", role: "item", img: "longstick.png", desc: "A long piece of wood. Good for tools" },
    {
        name: "Mahogany Tree",
        role: "item",
        logs: 8,
        sticks: 20,
        img: "mapletree.png",
        desc: "Produces large fruits. The insides are edible, but the outsides are poisonous",
    },
    {
        name: "Maize Plant",
        role: "foodprovider",
        harvestTime: 20 * 4,
        img: "maizeplant.png",
        minReplenish: 20 * 60 * 5,
        maxReplenish: 20 * 60 * 16,
        conversion: "Corn Cob",
        desc: "Maize, growing wildly. Also known as corn",
    },
    { name: "Maple Tree", role: "item", logs: 15, sticks: 20, img: "mapletree.png", desc: "Produces Samaras, the helicopter style seeds" },
    { name: "Millet Grass", role: "item", img: "milletgrass.png", desc: "Field of millet, growing wild" },
    { name: "Millet Hay", role: "item", img: "millethay.png", desc: "Millet grasses, both straw and seed" },
    { name: "Oak Tree", role: "item", logs: 12, sticks: 16, img: "mapletree.png", desc: "Produces acorns, which are edible..." },
    { name: "Oat Grass", role: "item", img: "oatgrass.png", desc: "Fields of oats, growing naturally" },
    { name: "Oat Hay", role: "item", img: "oathay.png", desc: "Oat grasses, both straw and seed" },
    { name: "Oat Seed", role: "item", img: "oatseed.png", desc: "The seeds of oat grass, unprocessed" },
    {
        name: "Onion",
        role: "persihableitem",
        lifespan: 20 * 60 * 8,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "onion.png",
        desc: "Too sharp to eat alone, but very useful in many recipes",
    },
    {
        name: "Onion Plant",
        role: "item",
        harvestTime: 20 * 8,
        img: "onionplant.png",
        minReplenish: 20 * 60 * 8,
        maxReplenish: 20 * 60 * 17,
        conversion: "Onion",
        desc: "Wild Onions growing",
    },
    {
        name: "Orange",
        role: "food",
        foodTime: 20 * 30,
        lifespan: 20 * 60 * 6,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "orange.png",
        desc: "Orange, a juicy fruit",
    },
    {
        name: "Orange Tree",
        role: "foodprovider",
        logs: 1,
        sticks: 10,
        harvestTime: 20 * 60,
        img: "appletree.png",
        output: [
            { name: "Barren Orange Tree", qty: 1 },
            { name: "Orange", qty: 22 },
        ],
        minReplenish: 20 * 60 * 5,
        maxReplenish: 20 * 60 * 10,
        desc: "A tree growing oranges. Orange trees grow best in warm climates",
    },
    {
        name: "Peanut Plant",
        role: "item", // fresh peanuts cannot be eaten
        harvestTime: 20 * 8,
        img: "peanutplant.png",
        minReplenish: 20 * 60 * 4,
        maxReplenish: 20 * 60 * 12,
        conversion: "Raw Peanuts",
        desc: "Wild peanuts growing",
    },
    {
        name: "Pear",
        role: "food",
        foodTime: 20 * 30,
        lifespan: 20 * 60 * 5,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "pear.png",
        desc: "Pears, a simple fruit",
    },
    {
        name: "Pear Tree",
        role: "foodprovider",
        logs: 0,
        sticks: 8,
        harvestTime: 20 * 60,
        img: "appletree.png",
        output: [
            { name: "Barren Pear Tree", qty: 1 },
            { name: "Pear", qty: 15 },
        ],
        minReplenish: 20 * 60 * 15,
        maxReplenish: 20 * 60 * 25,
        desc: "A pear tree growing naturally. Grows best in cold climates",
    },
    { name: "Pine Cone", role: "item", img: "pinecone.png", desc: "Dropped from pine trees. Has edible parts" },
    { name: "Pine Tree", role: "item", logs: 8, sticks: 6, img: "pinetree.png", desc: "Produces pinecones, that contain edible nuts" },
    {
        name: "Potato",
        role: "food",
        foodTime: 20 * 60 * 2.5,
        lifespan: 20 * 60 * 7, // potatoes last a good long time
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "potato.png",
        desc: "A very filling vegetable",
    },
    {
        name: "Potato Plant",
        role: "foodprovider",
        harvestTime: 20 * 12,
        img: "potatoplant.png",
        minReplenish: 20 * 60 * 7,
        maxReplenish: 20 * 60 * 20,
        conversion: "Potato",
        desc: "Wild potatoes growing. Can be harvested",
    },
    {
        name: "Pumpkin",
        role: "food",
        foodTime: 20 * 90,
        lifespan: 20 * 60 * 8,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "pumpkin.png",
        desc: "Small pumpkin, its tastey",
    },
    {
        name: "Pumpkin Plant",
        role: "foodprovider",
        harvestTime: 20 * 5,
        img: "pumpkinplant.png",
        minReplenish: 20 * 60 * 11,
        maxReplenish: 20 * 60 * 25,
        coversion: "Pumpkin",
        desc: "Pumpkins, growing wildly",
    },
    {
        name: "Raw Beans",
        role: "perishableitem",
        lifespan: 20 * 60 * 10,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "rawbeans.png",
        desc: "Beans, freshly picked. Need to be dried first",
    },
    {
        name: "Raw Boar Meat",
        role: "perishableitem",
        lifespan: 20 * 60 * 6,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "rawboarmeat.png",
        desc: "Boar meat, freshly cut. You should probably cook it",
    },
    {
        name: "Raw Chicken Meat",
        role: "perishableitem",
        lifespan: 20 * 60 * 6,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "rawchickenmeat.png",
        desc: "Chicken meat, freshly cut. You should probably cook it",
    },
    {
        name: "Raw Deer Meat",
        role: "perishableitem",
        lifespan: 20 * 60 * 6,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "rawdeermeat.png",
        desc: "Deer meat, freshly cut. You should probably cook it",
    },
    {
        name: "Raw Peanuts",
        role: "item",
        img: "rawpeanuts.png",
        desc: "Peanuts, freshly collected. Must be kept dry for a time before roasting",
    },
    {
        name: "Raw Wolf Meat",
        role: "perishableitem",
        lifespan: 20 * 60 * 6,
        conversion: "Rotten Meat",
        conversionQty: 1,
        img: "rawwolfmeat.png",
        desc: "Wolf meat, freshly cut. You should probably cook it",
    },
    { name: "Removed Stick", role: "item", img: "removedstick.png", desc: "Not real! Represents a stick missing from the trees" },
    { name: "Rye Grass", role: "item", img: "ryegrass.png", desc: "Field of natural rye grain" },
    { name: "Rye Hay", role: "item", img: "ryehay.png", desc: "Rye grasses, both straw and seed" },
    { name: "Short Stick", role: "item", img: "shortstick.png", desc: "A short piece of wood. Good for tools" },
    { name: "Small Rope", role: "item", img: "smallrope.png", desc: "A 1-foot rope, handles 5 pounds" },
    { name: "Straw", role: "item", img: "straw.png", desc: "Grass shoots with the seeds removed" },
    {
        name: "Straw Hat",
        role: "clothing",
        position: "head",
        armorFactor: 0,
        thermalFactor: -5,
        baseEndurance: 5, // These are more prone to wear, however
        img: "strawhat.png",
        desc: "A hat made of straw. Keeps your head cool",
    },
    { name: "Thatch Tile", role: "item", img: "thatchtile.png", desc: "A roofing tile, made from straw" },
    {
        name: "Tomato",
        role: "food",
        foodTime: 20 * 30,
        lifespan: 20 * 60 * 4,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "tomato.png",
        desc: "Very tasty, and has many uses in cooking",
    },
    {
        name: "Tomato Plant",
        role: "foodprovider",
        harvestTime: 20 * 2,
        conversion: "Tomato",
        minReplenish: 20 * 60 * 5,
        maxReplenish: 20 * 60 * 12,
        img: "tomatoplant.png",
        desc: "Wild tomatoes. Very tasty",
    },
    {
        name: "Turnip",
        role: "food",
        foodTime: 20 * 60,
        lifespan: 20 * 60 * 8,
        conversion: "Rotten Plant",
        conversionQty: 1,
        img: "turnip.png",
        desc: "A sharp taste when raw, sweet when cooked. Has many uses",
    },
    {
        name: "Turnip Plant",
        role: "foodprovider",
        harvestTime: 20 * 8,
        conversion: "Turnip",
        minReplenish: 20 * 60 * 5,
        maxReplenish: 20 * 60 * 10,
        img: "turnipplant.png",
        desc: "Turnips, growing wild",
    },
    { name: "Wet Clay Brick", role: "item", img: "wetclaybrick.png", desc: "A clay brick. Must be dried before firing" },
    // Generally, clay items will take 3 minutes to dry out. Real-life drying takes 24 to 72 hours, per Google
    { name: "Wet Handmade Clay Jar", role: "item", img: "wethandmadeclayjar.png", desc: "A simple clay jar. Must be dried before firing" },
    { name: "Wheat Grass", role: "item", img: "wheatgrass.png", desc: "Golden fields of wheat, growing wildly" },
    { name: "Wheat Hay", role: "item", img: "wheathay.png", desc: "Golden wheat, both straw and seed" },
    { name: "Wheat Seed", role: "item", img: "wheatseed.png", desc: "The seeds of wheat grass, unprocessed" },
    { name: "Wolf Skin", role: "item", img: "wolfskin.png", desc: "Wolf skin, freshly cleaned. Very warm" },
    {
        name: "Wood Pitchfork",
        role: "tool",
        baseEndurance: 20 * 60 * 3,
        baseEfficiency: 1,
        img: "woodpitchfork.png",
        desc: "A pitchfork, made of sticks. Better than nothing",
    },
    { name: "Wooden Bucket", role: "item", img: "woodenbucket.png", desc: "A bucket, made of wood. Good for non-food liquids" },
    {
        name: "Wooden Creek Water Bucket",
        role: "item",
        img: "woodenwaterbucket.png",
        desc: "A bucket, made of wood, filled with creek water",
    },
    { name: "Wooden Pole", role: "item", img: "woodenpole.png", desc: "A long pole of wood. Good for structures" },
    {
        name: "Wooden Pond Water Bucket",
        role: "item",
        img: "woodenwaterbucket.png",
        desc: "A bucket, made of wood, filled with pond water",
    },
];
