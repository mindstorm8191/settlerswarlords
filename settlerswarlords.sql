-- phpMyAdmin SQL Dump
-- version 4.7.9
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 21, 2021 at 11:07 PM
-- Server version: 8.0.19
-- PHP Version: 7.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
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
-- Table structure for table `sw_error`
--

DROP TABLE IF EXISTS `sw_error`;
CREATE TABLE IF NOT EXISTS `sw_error` (
  `id` int NOT NULL AUTO_INCREMENT,
  `happens` datetime NOT NULL,
  `codelocation` text NOT NULL COMMENT 'where the error occurred at',
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=603 DEFAULT CHARSET=ascii COMMENT='used for error tracking';

-- --------------------------------------------------------

--
-- Table structure for table `sw_event`
--

DROP TABLE IF EXISTS `sw_event`;
CREATE TABLE IF NOT EXISTS `sw_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player` int DEFAULT NULL,
  `mapid` int DEFAULT NULL,
  `task` varchar(30) NOT NULL,
  `detail` text COMMENT 'specific info we need for this task',
  `timepoint` datetime DEFAULT NULL COMMENT 'point in time which this event should trigger for',
  `continuous` int NOT NULL DEFAULT '0' COMMENT '1 if continuous, 0 if not',
  `worldaffected` int NOT NULL DEFAULT '0' COMMENT '1 if this affects the world, 0 if not',
  UNIQUE KEY `id_3` (`id`),
  KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1898 DEFAULT CHARSET=ascii COMMENT='stores all events that happen at a specific time';

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
  `biome` int NOT NULL COMMENT 'biome as the user understands it'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='known map and last known states for this user. Includes owned lands';

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
  `resourceTime` timestamp NOT NULL COMMENT 'last time the resources were updated. Affects all resources at the same time',
  `name` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'Unique name given by the land owner',
  `items` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'JSON of items here',
  `processes` text NOT NULL COMMENT 'JSON of current processes running here',
  PRIMARY KEY (`id`),
  UNIQUE KEY `coords` (`x`,`y`)
) ENGINE=MyISAM AUTO_INCREMENT=1244523 DEFAULT CHARSET=latin1 COMMENT='world map';

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
  `buildid` int NOT NULL DEFAULT '0' COMMENT 'id of what building is here'
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
  `ajaxcode` int NOT NULL COMMENT 'used to verify messages sent via ajax',
  `ipaddress` varchar(45) NOT NULL COMMENT 'verifies messages are coming from proper source',
  `lastlogin` datetime NOT NULL COMMENT 'last time user logged in. Does not get reset with autologin',
  `currentx` int NOT NULL COMMENT 'current coordinates of "king" player piece',
  `currenty` int NOT NULL,
  `userType` int NOT NULL DEFAULT '0' COMMENT 'Type of user. 0=player, 1=mod',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=ascii COMMENT='all users';

-- --------------------------------------------------------

--
-- Table structure for table `sw_process`
--

DROP TABLE IF EXISTS `sw_process`;
CREATE TABLE IF NOT EXISTS `sw_process` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mapid` int NOT NULL,
  `buildingid` int NOT NULL,
  `actionid` int NOT NULL COMMENT 'relates to the available action of the building',
  `timeBalance` datetime NOT NULL COMMENT 'time point the related game state is at',
  `globalEffect` int NOT NULL COMMENT 'set to 1 if this affects blocks other than its own',
  `targetCount` int NOT NULL DEFAULT '0' COMMENT 'How many the user wants to make/keep on hand, or zero for infinite',
  `priority` int NOT NULL DEFAULT '1' COMMENT 'Priority of this task',
  `workers` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=356 DEFAULT CHARSET=latin1 COMMENT='for all events that have iterations';

-- --------------------------------------------------------

--
-- Table structure for table `sw_resourcegroup`
--

DROP TABLE IF EXISTS `sw_resourcegroup`;
CREATE TABLE IF NOT EXISTS `sw_resourcegroup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `forStructures` int NOT NULL COMMENT 'set to 1 if this group is part of fixed data for the game',
  `picksRandom` int NOT NULL COMMENT 'Set to 1 if one of the items are selected at random, or 0 if all are output',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `sw_structure`
--

DROP TABLE IF EXISTS `sw_structure`;
CREATE TABLE IF NOT EXISTS `sw_structure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buildtype` int NOT NULL COMMENT 'what kind of building this is',
  `devlevel` int NOT NULL,
  `fortlevel` int NOT NULL COMMENT 'how strong this building',
  `detail` text COMMENT 'building-specific details to be managed',
  `worldmapid` int NOT NULL COMMENT 'what world map this is at',
  `localx` int NOT NULL,
  `localy` int NOT NULL,
  `workersassigned` int NOT NULL DEFAULT '0' COMMENT 'number of workers assigned to this building',
  `assigned` text COMMENT 'what this building is working on, with details',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=321 DEFAULT CHARSET=ascii COMMENT='stats about each structure. coords & owner will be handled by minimap';

-- --------------------------------------------------------

--
-- Table structure for table `sw_structureaction`
--

DROP TABLE IF EXISTS `sw_structureaction`;
CREATE TABLE IF NOT EXISTS `sw_structureaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buildType` int NOT NULL COMMENT 'which building can do this action',
  `minLevel` int NOT NULL DEFAULT '1' COMMENT 'minimum building level (dev level only) needed to complete this option',
  `name` varchar(50) NOT NULL COMMENT 'action name as described to user',
  `minWorkers` int NOT NULL DEFAULT '1' COMMENT 'minimum workers needed to do work',
  `maxWorkers` int NOT NULL DEFAULT '1' COMMENT 'max workers that can perform this task',
  `workerBonus` float NOT NULL DEFAULT '0' COMMENT 'output rate increase by including more workers',
  `cycleTime` int NOT NULL DEFAULT '3600' COMMENT 'number of seconds to output 1 item',
  `inputGroup` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'JSON of items needed for this process',
  `outputGroup` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'JSON of items made by this process',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=latin1 COMMENT='each action a building can complete';

--
-- Dumping data for table `sw_structureaction`
--

INSERT INTO `sw_structureaction` (`id`, `buildType`, `minLevel`, `name`, `minWorkers`, `maxWorkers`, `workerBonus`, `cycleTime`, `inputGroup`, `outputGroup`) VALUES
(1, 1, 1, 'Forage for Food', 1, 1, 0, 3600, '', '[{\"name\":\"Apple\", \"amount\":12, \r\n\"isFood\":1},{\"name\":\"Berries\", \"amount\":12, \"isFood\":1},{\"name\":\"Tree Nuts\", \"amount\":12, \"isFood\":1},{\"name\":\"Mushrooms\", \"amount\":12, \"isFood\":1}]'),
(2, 1, 1, 'Forage for Seeds', 1, 1, 0, 75, '', ''),
(3, 4, 1, 'Collect Flint', 1, 1, 0, 3600, '', '[{\"name\":\"Flint\", \"amount\":72, \"isFood\":0}]'),
(4, 5, 1, 'Collect Sticks', 1, 1, 0, 3600, '', '[{\"name\":\"Stick\", \"amount\":60, \"isFood\":0}]'),
(5, 5, 1, 'Collect Twine', 1, 1, 0, 3600, '', '[{\"name\":\"Twine\", \"amount\":60, \"isFood\":0}]'),
(6, 3, 1, 'Craft Flint Spear', 1, 1, 0, 3600, '[{\"name\":\"Flint\",\"amount\":36,\"isFood\":0},{\"name\":\"Stick\",\"amount\":36,\"isFood\":0},{\"name\":\"Twine\",\"amount\":36,\"isFood\":0}]', '[{\"name\":\"Flint Spear\",\"amount\":36,\"isFood\":0}]'),
(7, 0, 0, 'Consume Food', 0, 0, 0, 300, '', ''),
(8, 6, 1, 'Hunt Game', 1, 1, 0, 3600, '[{\"name\":\"Flint Spear\",\"amount\":12,\"isFood\":0},{\"name\":\"Stick\",\"amount\":36,\"isFood\":0},{\"name\":\"Flint Knife\",\"amount\":12,\"isFood\":0}]', '[{\"name\":\"Meats\",\"amount\":72,\"isFood\":1},{\"name\":\"Feathers\",\"amount\":12,\"isFood\":0},{\"name\":\"Bones\",\"amount\":24,\"isFood\":0},{\"name\":\"Animal Skin\",\"amount\":24,\"isFood\":0}]'),
(10, 7, 1, 'Craft Hide Armor', 1, 1, 0, 3600, '[{\"name\":\"Animal Skin\",\"amount\":30,\"isFood\":0},{\"name\":\"Bones\",\"amount\":12,\"isFood\":0},{\"name\":\"Flint Knife\",\"amount\":1.5,\"isFood\":0}]', '[{\"name\":\"Hide Armor\",\"amount\":6,\"isFood\":0}]'),
(11, 3, 1, 'Craft Flint Knife', 1, 1, 0, 3600, '[{\"name\":\"Flint\",\"amount\":120,\"isFood\":0}]', '[{\"name\":\"Flint Knife\",\"amount\":60,\"isFood\":0}]'),
(12, 3, 1, 'Craft Flint Hatchet', 1, 1, 0, 3600, '[{\"name\":\"Flint\",\"amount\":36,\"isFood\":0},{\"name\":\"Stick\",\"amount\":36,\"isFood\":0},{\"name\":\"Twine\",\"amount\":36,\"isFood\":0}]', '[{\"name\":\"Flint Hatchet\",\"amount\":36,\"isFood\":0}]'),
(13, 3, 1, 'Craft Flint Hoe', 1, 1, 0, 3600, '[{\"name\":\"Flint\",\"amount\":36,\"isFood\":0},{\"name\":\"Stick\",\"amount\":36,\"isFood\":0},{\"name\":\"Twine\",\"amount\":36,\"isFood\":0}]', '[{\"name\":\"Flint Hoe\",\"amount\":36,\"isFood\":0}]'),
(14, 3, 1, 'Craft Satchel', 1, 1, 0, 3600, '[{\"name\":\"Animal Skin\",\"amount\":50,\"isFood\":0},{\"name\":\"Bones\",\"amount\":18,\"isFood\":0}]', '[{\"name\":\"Satchel\",\"amount\":5,\"isFood\":0}]');

-- --------------------------------------------------------

--
-- Table structure for table `sw_structureitem`
--

DROP TABLE IF EXISTS `sw_structureitem`;
CREATE TABLE IF NOT EXISTS `sw_structureitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resourceGroup` int NOT NULL COMMENT 'ID of the resource group for this set',
  `name` varchar(50) NOT NULL,
  `amount` float NOT NULL DEFAULT '1' COMMENT 'how much is needed or produced by this, per action cycle',
  `storeType` int NOT NULL COMMENT 'Type of storage needed. 1=solid, 2=particle/dust, 3=liquid, 4=gas',
  `weight` float NOT NULL,
  `volume` float NOT NULL COMMENT 'how much space this requires',
  `isFood` int NOT NULL COMMENT 'Set to 1 if this type of item can be consumed',
  UNIQUE KEY `id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=34 DEFAULT CHARSET=latin1 COMMENT='all items and their names, produced by the buildings';

--
-- Dumping data for table `sw_structureitem`
--

INSERT INTO `sw_structureitem` (`id`, `resourceGroup`, `name`, `amount`, `storeType`, `weight`, `volume`, `isFood`) VALUES
(5, 2, 'Wheat Seeds', 1, 1, 0.5, 0.5, 0),
(6, 2, 'Carrot Seeds', 1, 1, 0.1, 0.1, 0),
(7, 2, 'Potato Seeds', 1, 1, 0.1, 0.1, 0),
(8, 3, 'Flint', 1, 0, 3, 1, 0),
(9, 4, 'Stick', 1, 0, 3, 3, 0),
(10, 5, 'Twine', 1, 0, 0.5, 2, 0),
(11, 6, 'Flint Spear', 1, 0, 5, 4, 0),
(12, 7, 'Flint', 1, 0, 0, 0, 0),
(13, 7, 'Twine', 1, 0, 0, 0, 0),
(14, 7, 'Stick', 1, 0, 0, 0, 0),
(23, 16, 'Feathers', 1, 0, 0, 0, 0),
(22, 16, 'Bones', 2, 0, 0, 0, 0),
(21, 16, 'Meats', 6, 0, 0, 0, 1),
(20, 15, 'Flint Spear', 1, 0, 0, 0, 0),
(24, 16, 'Animal Skin', 2, 0, 0, 0, 0),
(29, 19, 'Animal Skin', 5, 0, 0, 0, 0),
(26, 15, 'Stick', 3, 0, 0, 0, 0),
(31, 20, 'Hide Armor', 1, 0, 0, 0, 0),
(30, 19, 'Flint Knife', 0.25, 0, 0, 0, 0),
(32, 21, 'Flint', 2, 0, 0, 0, 0),
(33, 23, 'Flint Knife', 1, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sw_structuretype`
--

DROP TABLE IF EXISTS `sw_structuretype`;
CREATE TABLE IF NOT EXISTS `sw_structuretype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'name of this type of building',
  `devlevel` int NOT NULL COMMENT 'what level to get this to',
  `fortlevel` int NOT NULL DEFAULT '1' COMMENT 'Defense level of this building. Follows a different ',
  `image` varchar(50) NOT NULL COMMENT 'path to the image needed for this',
  `buildtime` int NOT NULL COMMENT 'number of seconds to build',
  `resources` text NOT NULL COMMENT 'list of items needed to build this',
  `landtype` text NOT NULL COMMENT 'comma-separated list of what type of land this needs',
  `minworkers` int NOT NULL COMMENT 'minimum users needed to allow this to run',
  `maxworkers` int NOT NULL COMMENT 'maximum users this structure can handle',
  `workerbonus` float NOT NULL DEFAULT '0' COMMENT 'bonus per worker above the minimum',
  `resourcesUsed` text NOT NULL COMMENT 'hourly resource cost',
  `output` text NOT NULL COMMENT 'type and amount of resources output by this block',
  `prereqs` text NOT NULL COMMENT 'list of items the player must have access to before this can be built. Do not use spaces between elements, only 1 comma',
  `description` text NOT NULL COMMENT 'text shown to the user to describe the building',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=ascii;

--
-- Dumping data for table `sw_structuretype`
--

INSERT INTO `sw_structuretype` (`id`, `name`, `devlevel`, `fortlevel`, `image`, `buildtime`, `resources`, `landtype`, `minworkers`, `maxworkers`, `workerbonus`, `resourcesUsed`, `output`, `prereqs`, `description`) VALUES
(1, 'Forage Post', 1, 1, 'foragepost.png', 0, '0', '0,5', 1, 1, 0, '', '', '', 'Locates edible food sources in the area, gathering them for use. The local land can only support one worker finding food. The rate of resources collected reduces as the area land becomes more developed.'),
(2, 'Lean To', 1, 1, 'leanto.png', 120, '0', '1', 0, 0, 0, '', '', '', 'Before food, even before water, one must find shelter from the elements. It is the first requirement for survival; for the elements, at their worst, can defeat you faster than anything else.'),
(3, 'Tool Shop', 1, 1, 'toolshop.png', 0, '0', '0,1,3,5', 1, 1, 0, '', '', '', 'Tools are critical to the survival of your colony. This creates tools of all shapes and sizes - so long as you have the materials to do so. Start with sticks and flint.'),
(4, 'Rock Collector', 1, 1, 'stonemaker.png', 1, '0', '5', 1, 1, 0, '', '', '', 'Rocks are an important component for early tools. There are no ways to break rocks yet, but pebbles and stones are still available for your tools.'),
(5, 'Stick Collector', 1, 1, 'stickmaker.png', 0, '0', '1', 1, 1, 0, '', '', '', 'The forests are host to a wealth of useful resources. The first of those is loose sticks and twine. It might not be much, but it\'s enough to build your first tools'),
(6, 'Hunting Post', 1, 1, 'huntingpost.png', 0, '0', '0,1,3,5', 1, 3, 0, '', '', 'Flint Spear', 'Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, the body will struggle to survive.'),
(7, 'Armory', 1, 1, 'armory.png', 0, '', '0', 0, 0, 0, '', '', 'Animal Skin', 'Produces armor for your army, ranging from animal hides to advanced knight plating.');

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
