# Settlers and Warlords

This game is a blend of a factory-builder game and an MMO game. It is a conceptual expansion of a previous project of mine, DanIdle, accounting for land expansion, travel limitations, and managing neighboring civilizations (some hostile). Players will be encouraged to trade & negotiate with each other, instead of using all-out war for dominance. MMO player strength will be limited by the challenges of holding large amounts of land.

![Game Map](img/homepage_gameshot.png)

Players will start the game with a piece of land, and 4 workers - nothing else. They will have to manage survival needs (food, shelter, warmth, safety, health) while building their technology from the land around them.

![World Map](img/homepage_worldmap.png)

The world will be fraught with dangers, some magical and unnatural, and also other players.

I have learned a lot about early technology through working on this project (How do you mine without a pickaxe? Where does twine come from? How do you ferment wine?) I hope to, if nothing else, spark interest in the subject for others.

This is planned to be a community project. If you're interested in the game, download the project and check it out for yourself! Feel free to ask questions, post new issues, tackle existing issues and commit changes.

### See it in action

I had this project (in a work-in-progress state) on a website for a long time. Unfortunately the rules on the web host changed, and they took my site down. I plan to get this game running again on a website somewhere soon.

## Project Setup

It is possible to get this running on your own computer, using a few steps.

1. You will need WAMP (or substitute another setup that provides PHP and MySQL), and also NPM (provided when installing node.js). Make sure WAMP is running.

2. Unzip all the files into a folder where your WAMP server's public HTML content can be displayed. This can be a subfolder if you have other projects, or from the root.

3. In src/App.js, set serverURL, imageURL and textureURL to WAMP's relative path of your project (it's currently set to be a subfolder called settlerswarlords; you can change it to whatever, this only affects matters during development).

4. Next, navigate to the project's root folder using Command Prompt (or equivalent if not in Windows), and run 'npm install'. This will set up everything needed for the client code. This may take a while; while running you can do steps 5 & 6

5. With WAMP installed, you'll have phpMyAdmin set up on your computer, giving you easy access to create, view & edit your database from your browser by going to localhost/phpmyadmin. Create a new database, then import the file settlerswarlords.sql, which has the project's tables. Note that most of the tables will be empty; game content will be generated by the code. While here, you may want to create a new user and set its permissions. This will allow the app to access the database.

6. Edit the file at server/config.php to fit the login credentials for your database.

7. Once the npm install process done, you can run 'npm start' to start the client code. If WAMP is running and your serverURL & imageURL variables are set correctly, you will see the banner image at top - you're ready to go! The database tables start empty except for blog entries; the world is generated when the first player creates an account. So sign yourself up and enjoy!

If you have any issues getting this project running, please contact me and I will do my best to help

## Development

There is a lot planned for this game, and a lot to get done. Ultimately, I want players to have to work toward unlocking new technologies, relying on automating common tasks to make the process easier. Here are a few progression trees:

-   [Tech Tree](/notes/techtree.md)
-   [Automation Path](/notes/automationtree.md)
-   [Means of War](/notes/wartree.md)

And additional information

-   [World Gen](/notes/worldgen.md)
-   [World History](/notes/worldhistory.md)
-   [Magic System](/notes/magicsystem.md)
-   [Underground Biomes](/notes/undergroundbiomes.md)
-   [Worker Crafting](/notes/workercrafting.md)
-   [Future Processes Planned](/notes/futureprocesses.md)
-   [Influences from other games](/notes/influences.md)
-   [Plans for monetization](/notes/monetizationstrategies.md)

Currently, players can start playing the game, but there's only two structures available: the lean-to and forage post. I am still working on getting workers to accept tasks properly.
