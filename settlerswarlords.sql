-- phpMyAdmin SQL Dump
-- version 4.7.9
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 31, 2019 at 01:40 AM
-- Server version: 5.7.21
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `happens` datetime NOT NULL,
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=ascii COMMENT='used for error tracking';

-- --------------------------------------------------------

--
-- Table structure for table `sw_event`
--

DROP TABLE IF EXISTS `sw_event`;
CREATE TABLE IF NOT EXISTS `sw_event` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player` int(11) DEFAULT NULL,
  `mapid` int(11) DEFAULT NULL,
  `task` varchar(30) NOT NULL,
  `detail` text COMMENT 'specific info we need for this task',
  `starttime` datetime DEFAULT NULL COMMENT 'used for continuous processes',
  `endtime` datetime DEFAULT NULL COMMENT 'if continuous, when the next process completes',
  `continuous` int(11) NOT NULL DEFAULT '0' COMMENT '1 if continuous, 0 if not',
  `criticalprocess` int(11) NOT NULL DEFAULT '0' COMMENT '1 if this needs to be processed in order, 0 if not',
  UNIQUE KEY `id_3` (`id`),
  KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='stores all events that happen at a specific time';

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
-- Table structure for table `sw_inventory`
--

DROP TABLE IF EXISTS `sw_inventory`;
CREATE TABLE IF NOT EXISTS `sw_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mapid` int(11) NOT NULL,
  `solidweight` int(11) NOT NULL,
  `openspace` int(11) NOT NULL COMMENT 'space exposed to elements',
  `coveredspace` int(11) NOT NULL COMMENT 'space covered by a roof',
  `particleweight` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='total inventory space for individual land blocks';

-- --------------------------------------------------------

--
-- Table structure for table `sw_item`
--

DROP TABLE IF EXISTS `sw_item`;
CREATE TABLE IF NOT EXISTS `sw_item` (
  `name` varchar(50) NOT NULL COMMENT 'name of this item',
  `mapID` int(11) NOT NULL COMMENT 'ID associated with the map tile this is on',
  `amount` int(11) NOT NULL,
  `grouping` int(11) NOT NULL COMMENT '0-3 if solid, particle, liquid or gas',
  `weight` int(11) NOT NULL COMMENT 'per single unit',
  `size` int(11) NOT NULL COMMENT 'per single unit',
  `temp` int(11) NOT NULL COMMENT '-300 to +30000',
  `isFood` int(11) NOT NULL COMMENT 'set to 1 if this can be consumed',
  `priority` int(11) NOT NULL COMMENT 'used for ordering, like with food'
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- --------------------------------------------------------

--
-- Table structure for table `sw_knownmap`
--

DROP TABLE IF EXISTS `sw_knownmap`;
CREATE TABLE IF NOT EXISTS `sw_knownmap` (
  `playerid` int(11) NOT NULL COMMENT 'which player has this info',
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `lastcheck` datetime NOT NULL COMMENT 'last known update of this land',
  `owner` int(11) NOT NULL COMMENT 'last known owner of this place',
  `civ` int(11) NOT NULL COMMENT 'last known civilization here',
  `population` int(11) NOT NULL COMMENT 'last known population of this area'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='known map and last known states for this user. Includes owned lands';

-- --------------------------------------------------------

--
-- Table structure for table `sw_map`
--

DROP TABLE IF EXISTS `sw_map`;
CREATE TABLE IF NOT EXISTS `sw_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `biome` int(11) NOT NULL,
  `ugresource` int(11) NOT NULL,
  `ugamount` float NOT NULL COMMENT 'how much ore is here. between 0.5 and 2.0',
  `owner` int(11) DEFAULT '0' COMMENT 'which player inhabits this land',
  `population` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `coords` (`x`,`y`)
) ENGINE=MyISAM AUTO_INCREMENT=10202 DEFAULT CHARSET=latin1 COMMENT='world map';

-- --------------------------------------------------------

--
-- Table structure for table `sw_minimap`
--

DROP TABLE IF EXISTS `sw_minimap`;
CREATE TABLE IF NOT EXISTS `sw_minimap` (
  `mapid` int(11) NOT NULL COMMENT 'ID to the upper-level map',
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `landtype` int(11) NOT NULL COMMENT 'type of land',
  `buildid` int(11) NOT NULL DEFAULT '0' COMMENT 'id of what building is here'
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- --------------------------------------------------------

--
-- Table structure for table `sw_player`
--

DROP TABLE IF EXISTS `sw_player`;
CREATE TABLE IF NOT EXISTS `sw_player` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `password` varchar(32) NOT NULL,
  `email` varchar(50) NOT NULL,
  `ajaxcode` int(11) NOT NULL COMMENT 'used to verify messages sent via ajax',
  `ipaddress` varchar(45) NOT NULL COMMENT 'verifies messages are coming from proper source',
  `lastlogin` datetime NOT NULL COMMENT 'last time user logged in. Does not get reset with autologin',
  `currentx` int(11) NOT NULL COMMENT 'current coordinates of "king" player piece',
  `currenty` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=ascii COMMENT='all users';

-- --------------------------------------------------------

--
-- Table structure for table `sw_process`
--

DROP TABLE IF EXISTS `sw_process`;
CREATE TABLE IF NOT EXISTS `sw_process` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mapid` int(11) NOT NULL,
  `buildingid` int(11) NOT NULL,
  `actionid` int(11) NOT NULL COMMENT 'relates to the available action of the building',
  `timeBalance` datetime NOT NULL COMMENT 'time point the related game state is at',
  `globalEffect` int(11) NOT NULL COMMENT 'set to 1 if this affects blocks other than its own',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=latin1 COMMENT='for all events that have iterations';

-- --------------------------------------------------------

--
-- Table structure for table `sw_resourcegroup`
--

DROP TABLE IF EXISTS `sw_resourcegroup`;
CREATE TABLE IF NOT EXISTS `sw_resourcegroup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forStructures` int(11) NOT NULL COMMENT 'set to 1 if this group is part of fixed data for the game',
  `picksRandom` int(11) NOT NULL COMMENT 'Set to 1 if one of the items are selected at random, or 0 if all are output',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `sw_resourcegroup`
--

INSERT INTO `sw_resourcegroup` (`id`, `forStructures`, `picksRandom`) VALUES
(1, 1, 1),
(2, 1, 1),
(3, 1, 0),
(4, 1, 0),
(5, 1, 0),
(6, 1, 0),
(7, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sw_structure`
--

DROP TABLE IF EXISTS `sw_structure`;
CREATE TABLE IF NOT EXISTS `sw_structure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `buildtype` int(11) NOT NULL COMMENT 'what kind of building this is',
  `devlevel` int(11) NOT NULL,
  `fortlevel` int(11) NOT NULL COMMENT 'how strong this building',
  `detail` text COMMENT 'building-specific details to be managed',
  `worldmapid` int(11) NOT NULL COMMENT 'what world map this is at',
  `localx` int(11) NOT NULL,
  `localy` int(11) NOT NULL,
  `workersassigned` int(11) NOT NULL DEFAULT '0' COMMENT 'number of workers assigned to this building',
  `assigned` text COMMENT 'what this building is working on, with details',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=ascii COMMENT='stats about each structure. coords & owner will be handled by minimap';

-- --------------------------------------------------------

--
-- Table structure for table `sw_structureaction`
--

DROP TABLE IF EXISTS `sw_structureaction`;
CREATE TABLE IF NOT EXISTS `sw_structureaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `buildType` int(11) NOT NULL COMMENT 'which building can do this action',
  `minLevel` int(11) NOT NULL COMMENT 'minimum building level needed to complete this option',
  `name` varchar(50) NOT NULL COMMENT 'action name as described to user',
  `minWorkers` int(11) NOT NULL COMMENT 'minimum workers needed to do work',
  `maxWorkers` int(11) NOT NULL COMMENT 'max workers that can perform this task',
  `workerBonus` float NOT NULL COMMENT 'output rate increase by including more workers',
  `cycleTime` int(11) NOT NULL COMMENT 'number of seconds to output 1 item',
  `inputGroup` int(11) NOT NULL DEFAULT '0' COMMENT 'ID of a resource group. Items needed to produce 1 product item, or 0 if none',
  `outputGroup` int(11) NOT NULL DEFAULT '0' COMMENT 'ID of a resource group. All items output by this action, or 0 if none',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=latin1 COMMENT='each action a building can complete';

--
-- Dumping data for table `sw_structureaction`
--

INSERT INTO `sw_structureaction` (`id`, `buildType`, `minLevel`, `name`, `minWorkers`, `maxWorkers`, `workerBonus`, `cycleTime`, `inputGroup`, `outputGroup`) VALUES
(1, 1, 1, 'Forage for Food', 1, 1, 0, 75, 0, 1),
(2, 1, 1, 'Forage for Seeds', 1, 1, 0, 75, 0, 2),
(3, 4, 1, 'Collect Flint', 1, 1, 0, 50, 0, 3),
(4, 5, 1, 'Collect Sticks', 1, 1, 0, 60, 0, 4),
(5, 5, 1, 'Collect Twine', 1, 1, 0, 60, 0, 5),
(6, 3, 1, 'Craft Flint Spear', 1, 1, 0, 100, 7, 6),
(7, 0, 0, 'Consume Food', 0, 0, 0, 300, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sw_structureitem`
--

DROP TABLE IF EXISTS `sw_structureitem`;
CREATE TABLE IF NOT EXISTS `sw_structureitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resourceGroup` int(11) NOT NULL COMMENT 'ID of the resource group for this set',
  `name` varchar(50) NOT NULL,
  `amount` float NOT NULL DEFAULT '1' COMMENT 'how much is needed or produced by this, per action cycle',
  `storeType` int(11) NOT NULL COMMENT 'Type of storage needed. 1=solid, 2=particle/dust, 3=liquid, 4=gas',
  `weight` float NOT NULL,
  `volume` float NOT NULL COMMENT 'how much space this requires',
  `isFood` int(11) NOT NULL COMMENT 'Set to 1 if this type of item can be consumed',
  UNIQUE KEY `id` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=latin1 COMMENT='all items and their names, produced by the buildings';

--
-- Dumping data for table `sw_structureitem`
--

INSERT INTO `sw_structureitem` (`id`, `resourceGroup`, `name`, `amount`, `storeType`, `weight`, `volume`, `isFood`) VALUES
(1, 1, 'Apple', 1, 0, 1, 1, 1),
(2, 1, 'Berries', 1, 1, 0.1, 0.1, 1),
(3, 1, 'Tree Nuts', 1, 1, 0.1, 0.1, 1),
(4, 1, 'Mushrooms', 1, 0, 0.05, 0.5, 1),
(5, 2, 'Wheat Seeds', 1, 1, 0.5, 0.5, 0),
(6, 2, 'Carrot Seeds', 1, 1, 0.1, 0.1, 0),
(7, 2, 'Potato Seeds', 1, 1, 0.1, 0.1, 0),
(8, 3, 'Flint', 1, 0, 3, 1, 0),
(9, 4, 'Stick', 1, 0, 3, 3, 0),
(10, 5, 'Twine', 1, 0, 0.5, 2, 0),
(11, 6, 'Flint Spear', 1, 0, 5, 4, 0),
(12, 7, 'Flint', 1, 0, 0, 0, 0),
(13, 7, 'Twine', 1, 0, 0, 0, 0),
(14, 7, 'Stick', 1, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sw_structuretype`
--

DROP TABLE IF EXISTS `sw_structuretype`;
CREATE TABLE IF NOT EXISTS `sw_structuretype` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'name of this type of building',
  `level` int(11) NOT NULL COMMENT 'what level to get this to',
  `image` varchar(50) NOT NULL COMMENT 'path to the image needed for this',
  `buildtime` int(11) NOT NULL COMMENT 'number of seconds to build',
  `resources` text NOT NULL COMMENT 'list of items needed to build this',
  `landtype` text NOT NULL COMMENT 'comma-separated list of what type of land this needs',
  `minworkers` int(11) NOT NULL COMMENT 'minimum users needed to allow this to run',
  `maxworkers` int(11) NOT NULL COMMENT 'maximum users this structure can handle',
  `workerbonus` float NOT NULL DEFAULT '0' COMMENT 'bonus per worker above the minimum',
  `resourcesUsed` text NOT NULL COMMENT 'hourly resource cost',
  `output` text NOT NULL COMMENT 'type and amount of resources output by this block',
  `description` text NOT NULL COMMENT 'text shown to the user to describe the building',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=ascii;

--
-- Dumping data for table `sw_structuretype`
--

INSERT INTO `sw_structuretype` (`id`, `name`, `level`, `image`, `buildtime`, `resources`, `landtype`, `minworkers`, `maxworkers`, `workerbonus`, `resourcesUsed`, `output`, `description`) VALUES
(1, 'Forage Post', 1, 'foragepost.png', 0, '', '0', 1, 1, 0, '', '', 'Locates edible food sources in the area, gathering them for use. The local land can only support one worker finding food. The rate of resources collected reduces as the area land becomes more developed.'),
(2, 'Lean To', 1, 'leanto.png', 120, '', '1', 0, 0, 0, '', '', 'Before food, even before water, one must find shelter from the elements. It is the first requirement for survival; for the elements, at their worst, can defeat you faster than anything else.'),
(3, 'Tool Shop', 1, 'toolshop.png', 0, '', '0,1,3,5', 1, 1, 0, '', '', 'Tools are critical to the survival of your colony. This creates tools of all shapes and sizes - so long as you have the materials to do so. Start with sticks and flint.'),
(4, 'Rock Collector', 1, 'stonemaker.png', 0, '', '5', 1, 1, 0, '', '', 'Rocks are an important component for early tools. There are no ways to break rocks yet, but pebbles and stones are still available for your tools.'),
(5, 'Stick Collector', 1, 'stickmaker.png', 0, '', '1', 1, 1, 0, '', '', 'The forests are host to a wealth of useful resources. The first of those is loose sticks and twine. It might not be much, but it\'s enough to build your first tools');

-- --------------------------------------------------------

--
-- Table structure for table `sw_usertracker`
--

DROP TABLE IF EXISTS `sw_usertracker`;
CREATE TABLE IF NOT EXISTS `sw_usertracker` (
  `ipaddress` varchar(45) NOT NULL,
  `lasterror` datetime NOT NULL,
  `errorcount` int(11) NOT NULL,
  `blocktrigger` int(11) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
