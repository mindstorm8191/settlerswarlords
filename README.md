Settlers and Warlords
Game like Evony (and Vesuvius), but focus on diplomatics instead of all-out war (war will still be an option, though), and developing your lands
to better your empire.

## Project Setup

This is set up in two parts, the client-side code runs through Netlify, while the server-side code is hosted elsewhere.
To run this local to your machine, you will need WAMP to run the back end code, while the front end runs through npm.
You will need to adjust the path to the ajax.php file within the front-end source, along with all the image paths.
Also note, the database is design to start with no map content; it will be generated upon the first player signing up.
From the project's root folder, run npm start.

Note: The rest of this is notes I generated for this project thus far. All this is subject to change

My plans for individual units are a bit up in the air now, not sure if any of this portion will be used. See lower for more concrete ideas

Players start with a fixed number of 'loyalists', which will work for free, so long as they are provided with food, shelter and protection for
themselves and their families.

Players will also have & gain crew, which require monetary payment for work. Money will be generated early on by selling resources of your camp.
The monetary gains of these will generally be more than what the loyalists costs to satisfy. Crew members may become loyalists if conditions are
right

Players will also be able to aquire slaves. The most common source is prisoners from wars. Slaves will require additional methods to contain
them, though regular escapes still take place no matter how much effort is put into containing them. Slaves will be limited to what jobs they
can perform. They will also require food & shelter, but less than the loyalists.

## Map construction

Maps will consist of an overview map, made of land plots that will extend 'indefinately' in all directions. Each land plot will consist of one
of the land types below. The selection of land types will be decided upon by a cluster-based algorithm (the same one I now use in DanIdle).
Each plot on the map will contain a set of map squares. The current number of squares per plot is 64 in an 8x8 grid.
Each plot will have its own inventory, which the player will have to manage between each of them to keep everything running smoothly. The player
may set up routine resource routes (for example, iron ores leading to a refinery location, iron ingots leading to other places).

## Army makeup

Conscripts - These will consist of slaves that are put into the armies. They won't have much fighting ability, but enough of them can still be
very effective. Like slaves, they will need additional methods to contain them, and may choose to riot against their commanders or allow
themselves to be captured if they are not contained enough.

Warriors - These will consist of crew, converted to fight. They will be able to receive training to improve their effectiveness in combat, and
can be given suitable gear to do even better.

Commanders - These will consist of loyalists who lead troop groups (armies) into battles. Armies will need at least one commander, but may use
multiple commanders to improve battle numbers. They will require a certain level of training before being useable, and do much better in combat
than untrained fighters.

## Land Types

We'll start with a simplified list of these: plains and forests to start, then desert, and mountain lands, etc, as game progress allows

-   Deep Desert - Resources will be scarce here, and the land won't be very valuable. Certain land locations will have oasis (any desert-spawning players will have one of these), and harbor a small amount of farming. The rest will be wide open and unuseable. However, many players may choose to develop these areas, as it will be cheaper to mine underground resources.
-   Light Desert - A mix between plains and desert. Plants are harder to grow here, but it is still very viable. Most common place to find saharah based animals (lions, antilope, boars, etc)
-   Plains - Ideal location for growing crops. Wheat is easily collected wildly here, but trees and wood are harder to find. Dedicated lands for growing trees will be recommended for early players, as wood will be expensive for trading.
-   Hilly plains - Capable of growing crops, but less ideal. Will benefit from irrigation efforts to increase water retention for farming.
-   Rocky Hills - Difficult area to build in, but contains a lot of trees that can be cut down. Easiest source of stones
-   Light Forests - A mix between plains and forests. Offers both trees and farmland. Trees can be cleared to make for farming as if it were farmland.
-   Heavy forests - Dense forest area. Travel is difficult through this area, and offers a very large source of trees.
-   Light Swamps - Has lots of plots that are water, that are placed at random through the map. This land makes for poor mining, as digging holes will fill rapidly with water (in-game miners will simply refuse to work for this reason). However, with enough work, this will make for good farming
    land, as irrigation is very easy.
-   Heavy Swamps - Consists mostly of water spaces. Very hard to inhabit. Determined players can bring in dirt to fill in lands to make it more
    habitable. This land is also impossible to mine in.
-   Wet forests - Like swamps, but with a heavy layer of trees. Coupled with swampy soil, this makes for hard travelling, until road structures are added.
-   Jungle - Basically wet forests, but even worse. Has enough trees that the wet soil isn't really an issue anymore.
-   Rivers - Cuts through all land types in multiple directions

Land plotting will use a cluster-based generation algorithm, the same one used for my project DanIdle. This will allow expansion in any direction; it might not be a perfectly smooth transition, but it's close enough.

Ore types will use a separate map, and not be tied to the above-ground terrain. Ores found:

-   Brown Limonite, Yellow Limonite, Banded Iron
-   Chalcopyrite - source of copper, plus trace amounts of platinum and other ores
-   Cassiterite - source of tin

follow GregTech's entire resource tree
Actually, start with a few basic ores: iron, copper, tin, aluminum. We can expand on this later

### Hunting game types

Stick to a small list of game types, to each fill specific roles. No need to get fancy (yet. we can expand this later)

-   Wolf - Always hunts in packs. Can be dangerous to new camps. Common everywhere (even in deserts - these are just coyotes, right?)
-   Deer - easier to kill, but fast. Best to kill w/ ranged weapons. Common in plains and forests. Rare in deserts.
-   Hawks - can only be killed with ranged weapons. provides feathers. Common everywhere
-   Rabbits - small and fast. Can be caught and bred for easier meat supplies. Common everywhere
-   Chickens - small and provides feathers. Easily caught and can be bred for easy meat. Needs lots of seeds for feeding them. Also provides eggs for additional food, and feathers for arrows. Common in plains, rare everywhere else
-   Cows - Some can be found roaming wild. large, slow and easily captured. Best source of meats, and can be bred. Also provides milk. Common in plains, rare in forests and swamps.
-   Horses - Wild ones can be found frequently, while lost / escaped ones can be found too. large but fast. Difficult to capture, but can be tamed and used for work. Can be slaughtered for meats, but is better used for work & transport. Common in plains, rare everywhere else
-   Sheep - can be captured for source of wool. Common in plains and mountainous areas, rate everywhere else

#### other (dropped) animal ideas:

-   Buffalo - Travels in herds of 100 or more, but isn't a reliable food source unless a player becomes a travelling band (not sure how that'll
    work, though)
-   Donkeys - Not common to find, but easy to capture and tame.
-   Elephants - much larger than horses. Harder still to capture & tame, but do well in battle - don't use - horses fill same role. Not common to
    find. Travels in herds of 50 or more
-   Bear - Large and dangerous, especially for new camps. Only travels alone or with cubs
-   Coyotes - good desert animals, covers a lot of ground at night
-   Goats
-   Pigs - Minecraft does this, but we don't really have a specific role for these
-   Boars
-   Lizards
-   Snakes
-   Squirrels
-   Rats - small, like squirrels, but can still provide food when in numbers
-   Ferrets
-   Foxes - smaller than wolves and hunts alone. Not dangerous to humans
-   Alligators - Good meats, but dangerous
-   Antilope - like deer, but travels in packs. More common in plains and light deserts

---

## Magic elements

without magic, this is only another civ/dwarf fortress game.

-   Sorcerers - this will be its own npc civ type, which will be single persons controlling a whole land region (generally a forest). They survive well enough on their own, but are willing to trade some common goods for magic knowledge or magical artifacts. Attacking them is not advisable, as they will take a large army to defeat. There will be multiple sorcerer types, which deal with light or dark magic. Like all tribes, negative situations with neighbors may encourage better trades from them, or joining your ranks. Troops first encountering sorcerers will see signs of them before meeting. However, the sorcerer will already be well aware of the presence of intruders. Unlike other civilizations, sorcerers can warp around their whole area instantly - and may do the same to your troops

-   Werewolves - Wolf type people, works in packs. No moon morphing will be involved

-   Vampires - Only out at night. Usually not found as tribes, they choose to infiltrate existing tribes and slowly take over from inside, killing the weak and converting the strong

-   Faries - tiny flying forest dwellers, too fast to kill with normal weapons
-   Dwarves - underground dwellers living in vast cave systems
-   Elves - plains / forest creatures with excellent vision and plant enhancing magic. May trade for super-seeds or plant enhancing materials
-   Witches / warlocks - secluded group focused on developing their magical powers. Will trade for rare magical items
-   Ents - Giant walking trees. Lives only in forests, and will guard forest lands near it from being chopped down.

### Other dangerous creatures

-   Wisp - air type creature, can't be harmed by physical weapons. Fire is effective to defend against them, but won't be able to kill them
-   Dragons - fire breathing flyers, hard to kill, and rule the skies. Can be tamed and bred
-   Zombies / Undead / skeletons - mindless creatures with inhuman strength but slow moving. roamers, travels in packs
-   Giant insects and spiders
-   Armored cows (needs name)
-   Griffin - half horse half hawk creatures
-   Centaurs - Half horse half human creatures
-   Ogres - giant humanoids that don't have much IQ. Very dangerous for a new camp. Does things (like attack) mostly at random
-   Yeti - ice-based giant humanoid creatures. Only shows up in winter / cold biomes, spreading additional cold & ice

# Resource types

-   Lumber - Available in small quantities everywhere, but major sources are only available from forests. Forests can be depleted if wood is harvested too fast from them. All lands will replenish wood supply over time, but better lands will replenish its wood faster. Players can improve quality of woodlands, but only after a certain technology level. Wood will also be used for fueling furnaces for the production of iron, then alloys, then steel. We may eventually include multiple wood types, aka oak for soft lumber, pine for harder wood, but that will come later.
-   Stone - This will mainly be used for constructing stronger buildings and defense walls. Due to the high chances of attack or saboutage, stone structures will be in high demand. Buildings will have two general upgrade routes, one for increased production, the other for increased structure (making it harder to be destroyed by enemies).
-   Dirt - Different types of dirt will be available, each affecting how well certain plants will grow in the area. Transporting dirt types from one place to another can change how well certain plants can grow there, but over time the dirt composition will shift back to what it is naturally
    -   Chalky - High PH levels from limestone underground. Good for lilies or plants that can handle dry conditions
    -   Sandy - Contains high amounts of sand (silica) and quartz. Water drains from it very fast. Good for growing cactus and other shrubs. Modifying to slow drainage will change soil type.
    -   Mulch - Basically creek wash-outs, containing lots of wood material. Nutrient-rich and can support lots of plant types
    -   Silt - Dense soil, holds water well (aka too well). Good for swamp-hardy plants
    -   Gravel - Rock-heavy soil, difficult to grow anything in well
    -   Compost - Man-made dirt product produced from decaying plant products. Helps increase growth rates of plants it is used on
    -   Clay - Very dense soil, holds water even better than silt.
-   Grains - The basic food source for your people - but not the only one. Grains require processing into bread before consumption. Grains can also be fed to livestock, which provides meats.
-   Livestock - This will provide an easy source of meats for your people, but will require land, grains and salt to keep the livestock fed & healthy. Livestock will also have to be bred, and slaughtered to provide food. Slautering will also provide raw hides, feathers and other resources
-   Meats - A second source of food for your people. Meats can be gathered from hunting from the wilderness early on. Later, livestock can be aquired and developed. Raw and cooked meats will have a short shelf-life (represented as a constant consumption speed), and be drained very quickly unless it is eaten or salted. Because of the short shelf-life of meats, hunting expeditions will have to be done close to home.
-   Vegetables - A third source of food for people. Vegetable farms will be as easy to develop as grain farms, but take up less room.
-   Grape farms - Grape farms will be used solely for the production of wines, which increase happiness levels of citizens.
-   Salts - Salts will be used in the process of preserving meats, and will be required to keep livestock healthy. Salt will be mined from the ground, mostly. Later, salts can be collected from some waters, in drying spaces.
-   Ores - Ores will be the source of metals, such as iron. These ores will need to be processed in forges. The player will be able to manage what the forge produces from the ores. The forge will require a constant supply of wood to fuel its fires. Its outputs will initially only be iron, but with tech development, can be used to produce bronze, and then steel. Ores will be collected as a single resource; what it comes out to be will be decided at the smeltery; higher-value metals requiring more ores to aquire. Ores to find underground:
-   Cassiterite - Source of tin. Can extract zinc from it
-   Chalcopyrite - Source of copper, along with trace amounts of platinum. Extracting platinum will require advanced technology
-   Banded Iron - Rusty aka oxygen-rich iron ore
-   Brown / yellow lignite - Source of iron. Yellow limonite can yield nickel, but requires advanced processing
-   Coal - Easy fuel source. Can extract lignite from it. Spawns in very large quantities, but can be exhuasted all the same. Fairly common
-   Magnetite - Source of iron. Can extract vanadium from it
-   Vanadium Magnetite - Vanadium cannot be mined directly, but vanadium magnetite will be valuable as a trading item
-   Gold - not common, but players who locate it can dramatically shift the economy in their favor through production of coins
-   Malachite - Source of copper. Can extract brown limonite from it, and later, carbon, hydrogen & oxygen
-   Tetrahedrite - Source of copper. Can also extract anitmony from it (this is probably the only direct source of anitmony, used for producing acid-proof containers, mostly for batteries).
-   Stibnite - Sulfur-rich antimony. Cannot be used directly
-   Aluminum - Pure aluminum is rare to find, but is valuable to pre-electric civilizations
-   Bauxite - Much more common source of aluminum, but requires electrolyzation. Will also extract rutile (for titanium) and grossular dust (can be electrolyzed for calcium, silicon and more aluminum).
-   Pyrite - Source of sulfuric metals. Will need electrolyzation to extract iron form it and get pure sulfur. Advanced processing can extract phosporus
-   Sulfur - sulfur can sometimes be found in pure form. Sulfur will be used in the production of rubber, bleaching paper, making explosives, and producing fertilizers
-   Sphalerite - Sulfur-rich zinc. Advanced processing can also yield cadmium and yellow garnet dust Gregtech requires an electrolyzer to extract the sulfur from the zinc
-   Lignite - Can be used as fuel, but not as effective as coal. Contains trace levels of coal, which can be washed out
-   Quartz - Crystals... ??
-   Quartzite
-   Rock Salt
-   Salt
-   Lepidolite
-   Spodumene
-   Ruby
-   Cinnabar
-   Soapstone
-   Talc
-   Glauconite
-   Pentlandite
-   Nickel
-   Garnierite
-   Cobaltite
-   Platinum
-   Sheldonite
-   Palladium
-   Iridium
-   Pitchblende
-   Uranium
-   Uraninite
-   Plutonium
-   Monazite
-   Bastnasite
-   Neodymium
-   Molybdenum
-   Wulfenite
-   Molybdenite
-   Powellite
-   Sapphire
-   Almandine
-   Pyrope
-   Manganese
-   Grossular
-   Spessartine
-   Pyrolusite
-   Tantalite
-   Barite
-   Certus Quartz
-   Diamond
-   Graphite
-   Olivine
-   Bentonite
-   Glauconite
-   Apatite
-   Galena
-   Silver
-   Lea
-   Lapis
-   Lazurite
-   Sodalite
-   Calcite
-   Beryllium
-   Emerald
-   Thorium

---

## Buildings

All buildings will have two separate upgrade routes; one to increase productivity (or storage, or at least something), the other to improve durability from attacks. Some productivity levels will require a minimum durability level (aka a roof over a workshop, for example).
All buildings will also have a tools level. Tools will need to be provided by a tool shop (the tool shop working based on highest demand) or
higher level building. This way, specific tool types won't need to be tracked. Upgrading production levels of a specific building will
increase the maximum number of tools that building can hold. Some buildings that share the same purpose may share tools, like if a building
is added or removed. The player will be able to set a priority level on tools of each building, allowing some buildings to have priority of
having more tools, over other buildings. The more tools a specific building has, the faster the jobs there can be completed. All tools wear
out over time and need to be replaced.
Specific tool types will be an off-topic kind of thing, but the player will need to provide the correct resources to allow the proper tools
to be made
Foresters hut - Working space for a forester. First levels will not require any resources (everything starts from needing wood anyway), and
later levels will be for storing more chopped wood
Blacksmith - Turns metals into tools, weapons & armor. Armies will be able to attack without equipment, but will do much better with it.
Housing - Places for your people. Used only for sleeping at first, but later will develop into more useful & robust units that can be invested
into.
Lean-to - Offers temporary shelter for 1-2 people. Won't last long, but good in a pinch (and very cheap to build)
Thatch-roof hut - Very basic shelter for early colonists, made from sticks and straw
Tents - Quick & cheap temporary housing for individuals. Made from cloth, leather or merely animal skins. Can be stored away easily for
later use, or used for travellers. Several sizes will be available, from 2-man tents (carried on a backpack) to large tents, hauled
by a team of horses
Basic house - Offers housing for a single family. Uses a lot of lumber
Stone house - Uses stone instead of wood for lower structures. Requires less resources to keep warm in winter time. \* Need additional housing types, but no game incentive for more expensive units
Hops fields - requires wood to set up vine holding structures
Oast House - used later in game. Built to increase output of brewery by drying out hops before being cooked. Drying is done in the brewer
building already, but a dedicated building for hops drying will increase production output.
Quarry - dedicated place to collect stone from. Some places will have better total supply than others. Areas that don't have pickaxes will
resort to using fire & water to crack rocks
Mining Shaft - Central place to locate mineral ores from. Ores on a given map block will all be the same, but between map spots, ores will
be fully randomized. Players will not know what ores will be there until they begin mining. Only certain ores will be minable at game
start. Players will need pickaxes made of harder metals (or power tools) to mine later-game ores. Early-game mining
Pottery Kiln - Building where pottery is fired at. Later setups week have a separate building for producing unfired pottery shapes. Pottery will
probably be one of the earliest finished goods export for players. Will also make water transportation possible
Farmer's Shed - Small building used to store farming tools. All other farm related land will be for crops
Pastures - Fenced in areas for holding livestock of many kinds. Certain livestock will need heavier or smaller fencing setups. The type of fence
used will be chosen from the field's menu, then transported and installed there.
Slaughterhouse - Place where animals are taken to be slaughtered for meats.
Smoking House - Place where meats are placed in order to turn them into jerky for preservation
Orchards - Places used to grow & care for trees. Trees will take a long time to mature, but once they do, will produce lots of food.
Smeltery - Furnace used to turn ores into useable metals
Charcoal Pit - Dirt-based put used to turn firewood into charcoal. First use of this will be for running Smelteries
Tool Shop - Workshop dedicated to making tools, as well as weapons & armor
Dining Hall - Building used for feeding people. Early ones will have food crafted here. Later, player will use a dedicated kitchen building for
cooking
Blast Furnace - Turns iron and charcoal into steel. Rather expensive to build, and once finished, very charcoal-hungry to run
Saw Mill - Dedicated building for turning chopped wood into lumber, firewood and sawdust (sawdust can have later uses as well, such as for
paper). Before the sawmill is built, all wood products are made at the Forester's Hut. The Sawmill will benefit from being placed beside a
river (to take advantage of power by water flow).
Mill - Uses wind or water power to grind wheat into flour
Metal Shop - Uses power tools (starting with steam) to craft metal shapes that are used for tools. May be enhanced with tools by its own outputs
Steam Furnace - Later-game device - Central unit used to produce steam. Steam pipe routing will be part of the infastructure variable of the
map-plot that the steam furnace is in; it will work as a numeric value of how many building blocks may support steam. This will hopefully
encourage players to have all their steam devices close together.
Defensive structures
Watch tower - warns camps of incoming enemy troops. Depending on 'amount of time' the warning provides, increases defending troop effectiveness
by up to 100%.
Wood archer tower - elevated station that protects archers while giving them a vantage point to fire on enemies.

## Lands

Players will only be able to view one land at a time, and will take time to move between lands. This will function as a kind of 'king' piece,
for which the player will have to protect at all times. Any other lands which the player controls will be viewed from as a kind of map. They
may give general orders to such lands, but not have direct say over their happenings. Any change in orders (or major events) will take time for
messengers to get between there & the king. It will be assumed that messengers always know where the king is actually located.

Each land will have its own inventory. The player will be in charge of moving resources between places in order to satisfy resource demands of
each place. Lands will not automatically search for resources, and will petition the king to receive them. If a land runs out of resources
to produce something for which it is assigned, then production will simply stop. If they run out of food, it may become deserted.

The game will advise players to build a city and have everything centralized, but the actual setups are up to the player. The player can set up
regular shipments of resources between lands which, ideally, will balance out supply and demand. Armies will be used for the transportation of
your goods. Other goods might be transported by citizens - but only for citizen purposes.

Lands will have a road quality level, which determines how hard it is for convoys to travel through. The player may send workers and resources
to improve the road quality score, thus allowing resources to flow more easily. Road quality levels will also be related to enemies camped in
the land, which may raid convoys moving through. Unlike other structures, the quality of roads will be an all-chunk setting. Players may also
choose to destroy roads on a map (useful to slow down enemies during retreat), and roads will wear out over time in a gradual quality decrease,
independent of use.

Players may expand their area. Any lands not claimed by other players (or sentient NPCs) can be claimed easily by the player. Players will
send scouts to any area neighboring their current territory. If possible, they may send colonists to these new lands and start making use of
it. The orders to send scouts, and the results of that scouting, will take time to get back to the king.

Lands will have a stability/safety level. If safety level is high, colonists may choose to settle there, even if other places have more
capacity & resources for citizens. If safety level is low, existing citizens will choose to flee to neighboring areas

## Land Plots

For each location on the map, there will be a fixed number of land plots. The current total count will be 36 in a 6x6 grid.
Some of these will be consumed by land formations, such as rock cliffs, lakes and steep hills, which the player will be unable to modify
(until they have lots of tech and time).
Others may be consumed by heavy forests, swamps, etc which can be developed to be more easily manageable.
Each building type / land use will consume 1 (and only 1) land plot. The player will need additional lands elsewhere in order to build all
possible buildings. For some land uses, the player will have several dozen land plots used for that purpose.

## Troop Management

Players won't control or watch troops directly. To control troops not in the capital, they will send messengers to meet the troops - based on
where they are believed to be located. Messenger sends may fail for some reasons (armies not found, access refused, messenger MIA aka killed
or enslaved). Armies may also send messages to the player, to report their conditions, findings of the lands, or major events (like attacks).

If an army cannot be located, the player will be notified by that messenger. Players may post notices for all their messengers to report as soon
as an army is found again.

Armies which do not receive orders may remain stationed for some time. Depending on loyalty, they may either attempt to return home or disband.
If that army is in dangerous territory, they may choose to return home sooner. Players may order armies to remain in given locations.

Armies that are known to be traveling can still receive messengers - they will simply route to intercept them.

Players will be able to send troops to camp at certain friendly locations to guard such lands. Players will send messengers to these locations
to change orders or receive condition updates.

When armies are sent to an attack, they will return 1 messenger right after the battle is complete. When players elect armies to return after a
battle, the messenger will arrive much earlier than the rest of the troops. Armies can be left in locations to take over lands, or even march
onward to new targets. Messengers on return trips can also be captured by enemies. Rather than showing reports immediately when attacks happen
(as with other games), players will need to wait for a messenger to return home before knowing what happened (missing or late messengers is also
possible).

Messenger reports will contain plenty of data to report how the soldiers are doing, outcome of battles, and any other incidents they
encountered. Armies will ideally be self-sufficient while deployed, but need regular shipments of food, if they are large.

## Troop stationing options

-   Guard lands - Troops will manage security in the area, dealing with any attackers directly
-   Limit trading - Troops may station around the area to restrict trade caravans from passing through, or charge tolls for trade caravans to pass. Armies may also restrict trade from certain locations / factions. Open trade will keep the location's citizens happy.
-   Support construction - Armies may assist citizens in constructing buildings and development of the land. This can greatly improve the happiness of the citizens there.
-   Support durability - Armies may work solely to increase the durability of existing structures, as if to prepare for war. Can both increase and decrease citizen's sense of safety and relations with the player.
-   Support resourcing - Armies will assist citizens in collection / production of resources
-   Support guards - Armies may support existing guards by being added to their ranks. This will impove the security rating of the lands and increase trust
-   Increase infastructure - Armies may be assigned to improve roads in the area, which will allow for easier travel of armies and trade caravans through a given town
-   Destroy infastructure - Armies can be tasked with destroying roadways in an area. This will be useful to slow down advancing enemy armies
-   Trade with Locals - Armies may be tasked with trading goods with locals. The player may ask the armies to trade eagerly, fairly or harshly.
-   Trading eagerly (or sometimes just fairly) will increase relations with the locals there. at a fair rate.

## Land variables

Infastructure - road-way strength. Affects how long it takes armies to travel through. Works as a multiplier of how much time it takes troops
travel between lands. Multipliers run from .2 to 20
Fortification level - How well-guarded the land is. When high, enemy armies will have more trouble conquering the land, even when the defending
player has few troops in the location. When low, the land can easily be captured. Siege weapons can be used to lower the fortification level
of a given land, but will also weaken / destroy other buildings there. Only highly-skilled siege weapon usage will protect existing buildings
while destroying military ones
Population - How many citizens are in the area
Relations - Status of negotiations of the given land. When low, citizens will be hostile to armies stationed there. When high, citizens may
reduce support costs of armies stationed there, or may even join their ranks freely. Various player actions can affect relations in good or
bad ways. The starting negotiation levels of newly-found citizens can range from very good to very poor.
Safety - How safe a place is to stay in. When safety is high, new citizens will settle in a given area. When it is low, citizens will flee to
find new places to live. When battles take place in a given area, safety levels will drop significantly. Nearby areas may have their safety
levels affected as well. After battles, safety levels will increase slowly, so long as the land or neighboring land doesn't get attacked
again. Increasing fortification levels and rebuilding damaged buildings can increase safety levels as well.

## First land plots

Water source - Dedicated place for people to gather water. Units won't be able to transport water with starting tools.
Forest / wood source - Units dedicated to this will only be able to collect sticks and vine-string at first. For every 10 sticks they collect,
they will get 1 vine string. When vine string isn't used anymore, capacity for that item will fill up & they won't collect any more.
Farmland - Units dedicated to this will work to support existing wheat growing there
Dirt / clay source - Units here will start to collect clay with only their hands & feet
Stone - Units here will only be able to collect pebbles and round boulders (1 round boulder for every 20 pebbles). Boulders can be used
early-game for road blocks, or with clay to claim lands from water. Pebbles will be used to craft early tools
Mines won't be available at the start of the game - no tools to dig holes with.

## Starting buildings

"Now that we have food in our bellies, and a place to rest, let's get some better tools."

-   Lean-to - First structures for players to build. Provides short-term shelter for colonists.
-   Forage Post - Storage spot for goods gathered by gatherers. This structure can dedicate units to gathering at game start, without any material requirements. Things that can be found when foraging
    -   Apples
    -   Blackthorn berries, Blackberries, Rose Hip Berries, Elderberries
    -   Hazel nuts, Chest nuts, Beech nuts
    -   Puffball mushrooms, bracket mushrooms
-   Tool Shop - Players will also set up a tool shop, which will consume wood for producing tools. First tools made will benefit the shop itself.
-   Hunting post - storage spot for meats collected by hunting. Hunters will require, at minimum, a wooden spear, which can be made from the tool shop. Hunters can also have traps built, which will aid them in collecting meats. Meats stored at the hunter's post will not last very long. The hunter's post will produce meats and animal skins, among many other types of resources. As the land there (and surrounding lands) get more development and people, the yields of the hunter's post will go down.
-   Cooker's station - A post dedicated to cooking foods (especially meats during early-game). This should be placed by the campfire, to take advantage of its fire.
-   Armory - Place to store weapons & armor. Initial weapons & armor will be made of wood (carved chest plates, helmets, shields, wood-only spears). Players can invest in increasingly better equipment; new higher-quality equipment will be provided to soldiers based on their skill, and lower-quality items will be passed 'down the line' until spare equipment remains. Players will provide enough weapons & armor for their existing population. The game will recommend producing enough equipment for that end.
    Flint Stabber - First tool to cut wood limbs. Not strong enough to cut down trees.
    Flint-toothed saw - First saw for cutting trees down. Requires sticks and stones to build. Player will order this to be constructed at the
    tool shop, and will be put to immediate use by the forest area. Each new saw will

### Land aquisition process

-   Scout - enter the land with scouts and determine what level of civilization exists there.
-   Send formal units
    -   Army assault - If the scout sent was killed or did not return, the player may choose to attack the land by force, possibly overthrowing whatever threat is there - if the army survives to return. The army may send a messenger right at the start of combat, or that messenger may be unable to escape.
    -   Survey mission - If no civilization was found in the land, the player may send a small army to survey the lands. This report will help determine what resources are in the area.
    -   Meet the neighbors - The player may send an embassy to meet & negotiate with the citizens there. This will give a report, detailing several factors:
        -   Trading situations - From dire to comfortable
        -   Safety situations - from dire to comfortable. Groups in dire situations will be more open to unbalanced trades and troop occupation
        -   Desperate for certain resources (such as food) and have nothing useful to trade away.
        -   Desperate for something but have something else to trade
        -   Settled in and not have any need for trading
        -   Willing to trade certain resources, but not be in need of anything
        -   Relations level - from very poor to very good. The skill level of the embassador can have an effect on this. Some newly found civilizations may not want any interaction, or may even view the player as hostile to start with.

## Combat

Programming detailed combat will be difficult, especially since, chances are, defending players won't be online to defend their city. It will be
easier to allow certain percent-bonuses for including certain elements.

All battles will take at least 5 minutes, or longer if battles are very large or it is a close call to determine victory.
Only a limited number of troops may engage each other at a time. The current target is 100 on each side. As troops on the front lines are killed
from each side, additional troops will fill in the gaps to replenish the front 100.
Defensive structures will help improve the stats of the defending player. Troop load-outs will also play a factor. The only difference between
same-sized armies will be training.

## Player start path

Players will start with ~10 colonists, no buildings or resources
Set up some lean-to's in some trees. This will tie up one worker for a short time
Set up food foraging in the area. This will provide some food to keep the existing colonists going
Build a flint tool shop. This will produce basic tools to get sticks and twine
Set up a forest gatherer. No building needed. This will require flint tools, and output a a choice of sticks or twine
Sticks & twine will allow better tools to be crafted at the tool shop. Adding flint axes will enable the forest gatherer to collect logs

## Additional thoughts

Pay-to-win is always frowned upon
"One can't really win when one has no real opponent"
Play-wise, strategy is valued more than number-crunching
Focus on forcing players to deal with more problems, the larger they get
If players cannot advance aka grow, their game will become stagnant and they will choose to leave. Dealing with more problems at larger size may
not work well. Players will need to benefit greatly by improving lands, so they can deal with additional problems (like from other players).
Dealing with new problems can be fun.

## What tech level to get up to?

(-) static tech level will be more fair to younger players, as it will balance the game better
(+) increasing tech levels will essentially open new doors for players as they progress through the game.
(+) Rail lines in existing areas can make bulk shipping much faster & cheaper - this could make things fun
(-) Additional tech will be harder to code. Could add all late tech stuff later in dev process. Do initial tech levels now. Worry about advanced
tech (including transportation by horses) later
Center of game will be about multiplayer and negotiating with others

## Lessons learned from researching other games

-   Paying real money for goods is frowned upon, but most people will ignore it. Pay-to-win games are frustrating, even to later-game players,
    and cause for them to quit/give up on a game.
-   The game must keep the player busy, with either things to do 'at home', or things to explore in the world. That said, 'filler' content
    does not help anything; work must be for a specific bonus / requirement for something
-   Players need to have something to use troops for, at all times. Idle troops feels like wasted potential. There should be more for troops
    to do besides war and gathering resources.
-   Tutorials should not be the greater source of goods, over in-game production. Completing quests should be important, but more as a guide
    for how to advance, instead of a resource provider
-   Allowing alliances to rally together for an attack is a good way to coordinate them. We should add this feature to this game as well.
