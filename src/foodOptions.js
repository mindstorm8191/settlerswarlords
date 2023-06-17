/*  foodOptions.js
    Provides details about specific food items that can be consumed
    For the game Settlers & Warlords
*/

export const foodOptions = [
    { name: "Cherries", harvestTime: 20 * 8 },
    { name: "Apple", harvestTime: 20 * 2 },
    { name: "Pear", harvestTime: 20 * 2 },
    { name: "Orange", harvestTime: 20 * 2 },
    { name: "Carrot Plant", harvestTime: 20 * 10, conversion: "Carrot", minReload: 20 * 60 * 8, maxReload: 20 * 60 * 16 },
    { name: "Potato Plant", harvestTime: 20 * 12, converison: "Potato", minReload: 20 * 60 * 7, maxReload: 20 * 60 * 20 },
    { name: "Tomato Plant", harvestTime: 20 * 5, conversion: "Tomato", minReload: 20 * 60 * 5, maxReload: 20 * 60 * 10 },
    { name: "Turnip Plant", harvestTime: 20 * 8, conversion: "Turnip", minReload: 20 * 60 * 8, maxReload: 20 * 60 * 25 },
    { name: "Peanut Plant", harvestTime: 20 * 12, conversion: "Raw Peanuts", minReload: 20 * 60 * 5, maxReload: 20 * 60 * 12 },
    { name: "Maize Plant", harvestTime: 20 * 4, conversion: "Corn Cob", minReload: 20 * 60 * 5, maxReload: 20 * 60 * 10 },
    { name: "Bean Plant", harvestTime: 20 * 15, conversion: "Beans", minReload: 20 * 60 * 6, maxReload: 20 * 60 * 12 },
    { name: "Onion Plant", harvestTime: 20 * 5, conversion: "Onion", minReload: 20 * 60 * 7, maxReload: 20 * 60 * 12 },
    { name: "Broccoli Plant", harvestTime: 20 * 7, conversion: "Broccoli", minReload: 20 * 60 * 10, maxReload: 20 * 60 * 20 },
    { name: "Pumpkin Plant", harvestTime: 20 * 4, conversion: "Pumpkin", minReload: 20 * 60 * 15, maxReload: 20 * 60 * 30 },
    { name: "Mushroom", harvestTime: 20 * 7, minReload: 20 * 60 * 8, maxReload: 20 * 60 * 18 },
    {
        name: "Cherry Tree",
        harvestTime: 20 * 60,
        resultOutput: [
            { name: "Barren Cherry Tree", qty: 1 },
            { name: "Cherries", qty: 15 },
        ],
        conversion: "Cherries",
        minReload: 20 * 60 * 10,
        maxReload: 20 * 60 * 30,
    },
    {
        name: "Apple Tree",
        harvestTime: 20 * 60,
        resultOutput: [
            { name: "Barren Apple Tree", qty: 1 },
            { name: "Apple", qty: 30 },
        ],
        conversion: "Apple",
        minReload: 20 * 60 * 20,
        maxReload: 20 * 60 * 45,
    },
    {
        name: "Pear Tree",
        harvestTime: 20 * 60,
        resultOutput: [
            { name: "Barren Pear Tree", qty: 1 },
            { name: "Pear", qty: 25 },
        ],
        conversion: "Pear",
        minReload: 20 * 60 * 15,
        maxReload: 20 * 60 * 35,
    },
    {
        name: "Orange Tree",
        harvestTime: 20 * 60,
        resultOutput: [
            { name: "Barren Orange Tree", qty: 1 },
            { name: "Orange", qty: 35 },
        ],
        conversion: "Orange",
        minReload: 20 * 60 * 15,
        maxReload: 20 * 60 * 30,
    },
];
