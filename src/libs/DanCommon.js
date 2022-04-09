// dancommon.js
// general-purpose functions of usefulness, created by me

export const DanCommon = {
    getRandomFrom(choicelist) {
        // Selects a random item from a list of choices.
        // choicelist - list of objects to select from
        // Example useage: myfood = randomfrom(['apple', 'mushroom', 'berry', 'treenut']); has 1 in 4 chance to return berry
        return choicelist[Math.floor(Math.random() * choicelist.length)];
    },

    multiReplace(workstring, target, replacewith) {
        // Works like string.replace(), but replaces all instances, instead of just one.
        // We need this function to turn output options (which is full item names with spaces) into DOM ids (which cannot contain spaces)
        if (typeof workstring != "string") {
            console.error("multiReplace works with strings. Got " + typeof workstring + ". workstring = " + workstring);
            return "";
        }
        let updated = workstring.replace(target, replacewith);
        while (updated !== workstring) {
            workstring = updated;
            updated = workstring.replace(target, replacewith);
        }
        return updated;
    },

    flatten(multidimlist) {
        // Flattens a 2D array into a 1D array. Useful when combining multiple lists (in a list) into one.
        return [].concat.apply([], multidimlist);
    },

    removeDuplicates(list) {
        // Removes duplicate items within an array.
        return [...new Set(list)];
    },

    manhattanDist(x1, y1, x2, y2) {
        // Returns the Manhattan Distance of two points.
        // The Manhattan distance is the different in X plus the difference in Y; as if you were traveling through city blocks.
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    },

    within(value, target, threshhold) {
        // Returns true if the given value is close to the target value, within the threshhold. Aka 193 is near 200 +/- 10
        if (value < target - threshhold) return false;
        if (value > target + threshhold) return false;
        return true;
    },

    hasAny(searchable, options) {
        // Returns true if any character in the options list is found in the searchable string
        return !options.split("").every(ele => {
            return searchable.indexOf(ele) === -1;
        });
    }
};
