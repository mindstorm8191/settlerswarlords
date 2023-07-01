-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 01, 2023 at 10:45 AM
-- Server version: 8.0.21
-- PHP Version: 7.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `settlerswarlords`
--

-- --------------------------------------------------------

--
-- Table structure for table `sw_blog`
--

DROP TABLE IF EXISTS `sw_blog`;
CREATE TABLE IF NOT EXISTS `sw_blog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `onday` date NOT NULL COMMENT 'What day this blog entry was added',
  `title` text NOT NULL,
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sw_blog`
--

INSERT INTO `sw_blog` (`id`, `onday`, `title`, `content`) VALUES
(1, '2023-01-08', 'A doable challenge', '<p>\r\n    This version of the game (seven) seems to be coming along alright, but hasn\'t escaped some changes along the way. A few\r\n    weeks ago I got back into playing Dwarf Fortress (by the way there\'s a new Steam version out, with full graphics and proper\r\n    controls), and have realized how much my game borrows concepts from it, but not fully. Dwarf Fortress lets you assign work,\r\n    but leaves it to your dwarves to decide who does it, and when. I started to realize that players probably won\'t care which\r\n    worker completes a given task, just as long as it gets done. Having already completed the code that assigns work to workers,\r\n    this means I need to rewrite things... but not everything. I rewrote everything related to workers completing assignments,\r\n    and it\'s been a success, so far.\r\n</p>\r\n<p>\r\n    Now I\'m onto bigger challenges - this one I didn\'t expect. This being a web game, I\'ll need to periodically save the state\r\n    of the game back to the server. It\'s simple enough, except for one problem: the local map is 41x41 tiles large (1681 in\r\n    total), and they all have data to send back. Even for a freshly started game, it took over 2 minutes! Not ideal for a\r\n    multi-user game, when this is saving content for only 1 person. But I have solutions in mind, and I want to future-proof\r\n    this, for when later game states get crazy.\r\n</p>\r\n<ol>\r\n    <li>\r\n        Send map data to the server one chunk at a time. This will spread the work on the server over a larger time frame. I can\r\n        create a complete copy of the existing tiles on the client side, dropping chunks as I send them\r\n    </li>\r\n    <li>\r\n        Send only tiles that get modified. This will probably have the most significant impact on the amount of data needed to\r\n        send. But, in planning for late-game, this may have diminishing effects.\r\n    </li>\r\n    <li>\r\n        Change the way I update the tiles. Databases allow you to insert new data, or in the same statement, update data instead\r\n        if it finds a matching record ID. The advantage of this method (besides preventing duplicate data) is you can send data\r\n        about a lot of records all in one statement. My last method required sending one tile to the database at a time, waiting\r\n        for a response before sending another. So this may have an even larger impact on the time it takes to save.\r\n    </li>\r\n</ol>\r\n<p>I think all these changes will make everything work, now and in future challenges. I just need to get it built</p>'),
(2, '2022-04-09', 'Let\'s start version 7!', 'Guess what? We\'re starting version 7! Maybe I AM a little crazy... but it doesn\'t matter. After spending a lot of time on version 6, I started to realize things weren\'t as fun as I had wanted it to be. I wanted resource production to be tetious, but this was TOO tedious. This time, work will be centered around a per-worker level. Workers are assigned tasks (or a series of tasks) and they determine how to accomplish that. This may feel a lot more like Dwarf Fortress, but I don\'t mind.'),
(3, '2023-01-28', 'Actual blog started', '<p>What is this? It\'s a blog! I decided that I like sharing updates to the game\'s progress, but doing so too frequently means nobody sees what has happened so far. So the solution is to make the blog data more robust. When I get this working, you should be able to view previous entries with ease.</p>\r\n<p>Development wise, I\'m in a pickle. The saving & loading of the game state \'works\', but there are still some errors in the process - only it\'s nothing that I can narrow down and correct. There\'s also an issue where idle workers won\'t pick up unassigned tasks. I don\'t know why this is happening either (other than the workers being lazy)</p>\r\n<p>Right now the only solution I know of is to start logging more content. This means building a logging system, and simply dump content until I can spot something that isn\'t correct. We\'ll see if this works! The only other option is to rebuild some / all of the code... which might be a viable solution, only so I can build the project from the ground up with saving & loading content in mind. But first we\'ll see if logging can teach me anything</p>'),
(4, '2023-02-19', 'Let\'s start version 8', '<p>Yes; I have decided to start revamping the entire game - again. I feel like I made some good progress with the last version, and was about to really progress with the tech tree. But a few major bugs was preventing any real progress.</p>\r\n<ul>\r\n  <li>The first problem: worker tasks weren\'t saving and reloading correctly. Adding the saving & loading so late in development left lots of potential bugs that I couldn\'t find.\r\n  <li>Tasks couldn\'t manage multiple quantities (maybe an easy fix) or workers assisting one another (I\'m thinking of just dropping this feature now).\r\n</ol>\r\n<p>I started building a new task system that\'s very robust. But it seemed to only add complexity; and in programming, any extra complexity is only an invitation for more bugs. My plan, now, is to incorporate game saving early on in development, so that I can identify bugs much earlier. And of course the task management code will be totally redone, again.</p>\r\n<p>This will be a lot of work, yes, but I think the end result will be worthwhile.</p>'),
(6, '2023-04-10', 'In the thick of it', '<p>I have been working on the new version of this game for a few weeks now, adding new features where I can, and have started working on implementing the new task system. At this point, all this is proving difficult! But I think I can still make it work.</p>\r\n<p>There\'s a few aspects that is making this part difficult.</p>\r\n<ol>\r\n<li>One, some tasks have to be performed where specific items are located (such as cutting down a tree, which happens at the tree). Ideally, this location would be decided after we know everything else is ready (thus getting a shortest path for the worker), but when would that be? I have decided to pick a work location first... for now. But generally it is easy to get lost on what needs done first, last, etc.\r\n<li>Secondly, I am planning on certain crafting recipes to allow different items to be used, but at variable quantities. For example, I could use one of one type of item, or 3 of another type, to get the same result. This is doubly-hard because I will need to pick from one of the options, and then be able to select all the items of that - or craft more if there isn\'t enough. But which one should get crafted?\r\n</ol>\r\n<p>I still think this is possible, but it\'ll take time. I\'ll just keep at it</p>'),
(7, '2023-05-06', 'Task management system working as planned', '<p>Finally! After like a month of working on this, I think my task management system is going to work as I had planned it.</p>\r\n<p>Completing this system was very challenging. At one point I had to determine which recipe to use from a tasks\' options, before even knowing what items were on the map to pick from - and even before knowing where to complete the task at. I didn\'t want to make the task structure even more complex, as I never know when the parameters might change (especially after saving & reloading the game).</p>\r\n<p>I opted to go with a temporary data structure; I literally create it only to decide what recipes to use (tag items as part of this task) before dropping the data again. But it was enough to organize what I needed done, and make a determination on the recipe. Not every aspect about this has been tested yet (edge-case testing can be challenging), and the code goes for the simplest solution in some places (instead of the most ideal), but I think that any issues that arise can be addressed.</p>\r\n<p>What this means for the rest of the game is that I can finally push forward, start adding new features, and grow the tech tree. Creating new tasks for buildings is much simpler this time around, and since it all uses the same code base, there\'s much less chance of bugs to resolve. Here\'s hoping I can make some good progress this time!</p>'),
(8, '2023-06-28', 'Expanding in multiple directions', '<p>Progress on developing Setters & Warlords is still going steadily, even if I haven\'t blogged about it.</p>\r\n<p>After getting the task management system working, I decided to switch directions and start working on exploring the world map. Players <i>can</i> explore the world map now... but that\'s about it - it needs a lot more work put into it. I need to figure out pathfinding, server-side. I then switched to adding more tech progression. After struggling with the Hay Dryer for a while, we now have thatch tiles and can build a covered drying space, our first serious structure.</p>\r\n<p>Development at this point can branch out in a dozen different directions, primarily because the game\'s tech tree does too. It\'s an exciting time, but also challenging: Which direction do I need to work on next? It will take a while to put work into each direction, but I plan to complete it all eventually.</p>');

-- --------------------------------------------------------

--
-- Table structure for table `sw_error`
--

DROP TABLE IF EXISTS `sw_error`;
CREATE TABLE IF NOT EXISTS `sw_error` (
  `id` int NOT NULL AUTO_INCREMENT,
  `happens` datetime NOT NULL,
  `codelocation` text NOT NULL COMMENT 'where the error occurred at',
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=ascii COMMENT='used for error tracking';

-- --------------------------------------------------------

--
-- Table structure for table `sw_event`
--

DROP TABLE IF EXISTS `sw_event`;
CREATE TABLE IF NOT EXISTS `sw_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task` varchar(30) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL COMMENT 'type of action this event is',
  `detail` text CHARACTER SET ascii COLLATE ascii_general_ci COMMENT 'JSON content for this task to work',
  `timepoint` datetime DEFAULT NULL COMMENT 'point in time which this event should trigger for',
  UNIQUE KEY `id_2` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2145 DEFAULT CHARSET=ascii COMMENT='stores all events that happen at a specific time';

-- --------------------------------------------------------

--
-- Table structure for table `sw_globals`
--

DROP TABLE IF EXISTS `sw_globals`;
CREATE TABLE IF NOT EXISTS `sw_globals` (
  `varname` varchar(50) NOT NULL,
  `varvalue` text NOT NULL,
  UNIQUE KEY `varname` (`varname`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='all persistent global values for the game';

-- --------------------------------------------------------

--
-- Table structure for table `sw_knownmap`
--

DROP TABLE IF EXISTS `sw_knownmap`;
CREATE TABLE IF NOT EXISTS `sw_knownmap` (
  `playerid` int NOT NULL COMMENT 'which player has this info',
  `x` int NOT NULL,
  `y` int NOT NULL,
  `lastcheck` datetime NOT NULL COMMENT 'last known update of this land',
  `owner` int NOT NULL COMMENT 'last known owner of this place',
  `civ` int NOT NULL COMMENT 'last known civilization here',
  `population` int NOT NULL COMMENT 'last known population of this area',
  `biome` int NOT NULL COMMENT 'biome as the user understands it',
  `isexploring` int NOT NULL DEFAULT '0' COMMENT 'set to 1 if there is a group going to scout this tile',
  PRIMARY KEY (`playerid`,`x`,`y`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='known map and last known states for this user. Includes owned lands';

-- --------------------------------------------------------

--
-- Table structure for table `sw_log`
--

DROP TABLE IF EXISTS `sw_log`;
CREATE TABLE IF NOT EXISTS `sw_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `happens` datetime NOT NULL COMMENT 'when this entry was added',
  `codelocation` text NOT NULL COMMENT 'where in the source this was called',
  `loggroup` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'subject group',
  `content` text NOT NULL COMMENT 'full info for this, in JSON',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='logs for debugging the game';

-- --------------------------------------------------------

--
-- Table structure for table `sw_map`
--

DROP TABLE IF EXISTS `sw_map`;
CREATE TABLE IF NOT EXISTS `sw_map` (
  `id` int NOT NULL AUTO_INCREMENT,
  `x` int NOT NULL,
  `y` int NOT NULL,
  `biome` int NOT NULL,
  `ugresource` int NOT NULL,
  `ugamount` float NOT NULL COMMENT 'how much ore is here. between 0.5 and 2.0',
  `civilization` int NOT NULL DEFAULT '-1' COMMENT 'ID of civilization type, or -1 if none',
  `civlevel` float NOT NULL DEFAULT '0' COMMENT 'strength of civilization here',
  `owner` int DEFAULT '0' COMMENT 'which player inhabits this land',
  `population` int NOT NULL DEFAULT '0',
  `name` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'Unique name given by the land owner',
  `structures` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'JSON of all running blocks in the map',
  `workers` text NOT NULL COMMENT 'JSON of all workers here',
  `unlockeditems` text NOT NULL COMMENT 'List of all items unlocked here',
  `tasks` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'details of all tasks in this area',
  `foodCounter` double NOT NULL DEFAULT '180' COMMENT 'counter on food production (this may be expanded later)',
  `localmaptick` int NOT NULL DEFAULT '0' COMMENT 'Tick value to track local map updates',
  PRIMARY KEY (`id`),
  UNIQUE KEY `coords` (`x`,`y`)
) ENGINE=MyISAM AUTO_INCREMENT=2446489 DEFAULT CHARSET=latin1 COMMENT='world map';

-- --------------------------------------------------------

--
-- Table structure for table `sw_minimap`
--

DROP TABLE IF EXISTS `sw_minimap`;
CREATE TABLE IF NOT EXISTS `sw_minimap` (
  `mapid` int NOT NULL COMMENT 'ID to the upper-level map',
  `x` int NOT NULL,
  `y` int NOT NULL,
  `landtype` int NOT NULL COMMENT 'type of land',
  `structureid` int NOT NULL DEFAULT '0' COMMENT 'id of what structure is here',
  `originalland` int NOT NULL COMMENT 'What this land naturally is. Nature will slowly work back to this land type',
  `items` text NOT NULL,
  PRIMARY KEY (`mapid`,`x`,`y`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- --------------------------------------------------------

--
-- Table structure for table `sw_player`
--

DROP TABLE IF EXISTS `sw_player`;
CREATE TABLE IF NOT EXISTS `sw_player` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `password` varchar(32) NOT NULL,
  `email` varchar(50) NOT NULL,
  `emailcode` int NOT NULL,
  `ajaxcode` int NOT NULL COMMENT 'used to verify messages sent via ajax',
  `ipaddress` varchar(45) NOT NULL COMMENT 'verifies messages are coming from proper source',
  `lastlogin` datetime NOT NULL COMMENT 'last time user logged in. Does not get reset with autologin',
  `currentx` int NOT NULL COMMENT 'current coordinates of "king" player piece',
  `currenty` int NOT NULL,
  `userType` int NOT NULL DEFAULT '0' COMMENT 'Type of user. 0=player, 1=mod',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=277 DEFAULT CHARSET=ascii COMMENT='all users';

-- --------------------------------------------------------

--
-- Table structure for table `sw_traveler`
--

DROP TABLE IF EXISTS `sw_traveler`;
CREATE TABLE IF NOT EXISTS `sw_traveler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player` int NOT NULL COMMENT 'id of who controls this group. 0 if controlled by NPC',
  `sourcex` int NOT NULL COMMENT 'where these travellers come from',
  `sourcey` int NOT NULL,
  `x` int NOT NULL COMMENT 'current location of travelers',
  `y` int NOT NULL,
  `workers` text NOT NULL COMMENT 'JSON of workers in party',
  `items` text NOT NULL COMMENT 'JSON of all items carried',
  `commands` text NOT NULL COMMENT 'JSON list of commands for travelers to complete',
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Extra info for this group',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='every travelling party';

-- --------------------------------------------------------

--
-- Table structure for table `sw_usertracker`
--

DROP TABLE IF EXISTS `sw_usertracker`;
CREATE TABLE IF NOT EXISTS `sw_usertracker` (
  `ipaddress` varchar(45) NOT NULL,
  `lasterror` datetime NOT NULL,
  `errorcount` int NOT NULL,
  `blocktrigger` int NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
