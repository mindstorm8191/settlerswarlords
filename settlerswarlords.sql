-- phpMyAdmin SQL Dump
-- version 4.7.9
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 31, 2019 at 11:11 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=ascii COMMENT='used for error tracking';

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
  `detail` text,
  `starttime` datetime DEFAULT NULL COMMENT 'used for continuous processes',
  `endtime` datetime DEFAULT NULL COMMENT 'if continuous, when the next process completes',
  `continuous` int(11) NOT NULL DEFAULT '0' COMMENT '1 if continuous, 0 if not',
  `criticalprocess` int(11) NOT NULL COMMENT '1 if this needs to be processed in order, 0 if not',
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
  `groupID` int(11) NOT NULL COMMENT 'ID associated with this item group',
  `amount` int(11) NOT NULL,
  `grouping` int(11) NOT NULL COMMENT '0-3 if solid, particle, liquid or gas',
  `weight` int(11) NOT NULL COMMENT 'per single unit',
  `size` int(11) NOT NULL COMMENT 'per single unit',
  `temp` int(11) NOT NULL COMMENT '-300 to +30000',
  `priority` int(11) NOT NULL COMMENT 'used for ordering, like with food'
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

--
-- Dumping data for table `sw_item`
--

INSERT INTO `sw_item` (`name`, `groupID`, `amount`, `grouping`, `weight`, `size`, `temp`, `priority`) VALUES
('Apple', 1, 1, 0, 0, 0, 0, 0),
('Berries', 1, 1, 1, 0, 0, 0, 0),
('Tree Nuts', 1, 1, 1, 0, 0, 0, 0),
('Mushrooms', 1, 1, 1, 0, 0, 0, 0);

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
  PRIMARY KEY (`id`)
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=ascii COMMENT='all users';

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
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='similar to events, but handles continuous processes';

-- --------------------------------------------------------

--
-- Table structure for table `sw_resourcegroup`
--

DROP TABLE IF EXISTS `sw_resourcegroup`;
CREATE TABLE IF NOT EXISTS `sw_resourcegroup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forStructures` int(11) NOT NULL COMMENT 'set to 1 if this group is part of fixed data for the game',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `sw_resourcegroup`
--

INSERT INTO `sw_resourcegroup` (`id`, `forStructures`) VALUES
(1, 1);

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=ascii COMMENT='stats about each structure. coords & owner will be handled by minimap';

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
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COMMENT='each action a building can complete';

--
-- Dumping data for table `sw_structureaction`
--

INSERT INTO `sw_structureaction` (`id`, `buildType`, `minLevel`, `name`, `minWorkers`, `maxWorkers`, `workerBonus`, `cycleTime`, `inputGroup`, `outputGroup`) VALUES
(1, 1, 1, 'Forage for food', 1, 1, 0, 60, 0, 1);

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
  `resources` text COMMENT 'list of items needed to build this',
  `landtype` text NOT NULL COMMENT 'comma-separated list of what type of land this needs',
  `minworkers` int(11) NOT NULL COMMENT 'minimum users needed to allow this to run',
  `maxworkers` int(11) NOT NULL COMMENT 'maximum users this structure can handle',
  `workerbonus` float NOT NULL DEFAULT '0' COMMENT 'bonus per worker above the minimum',
  `resourcesUsed` text NOT NULL COMMENT 'hourly resource cost',
  `output` text NOT NULL COMMENT 'type and amount of resources output by this block',
  `description` text NOT NULL COMMENT 'text shown to the user to describe the building',
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=ascii;

--
-- Dumping data for table `sw_structuretype`
--

INSERT INTO `sw_structuretype` (`id`, `name`, `level`, `image`, `buildtime`, `resources`, `landtype`, `minworkers`, `maxworkers`, `workerbonus`, `resourcesUsed`, `output`, `description`) VALUES
(1, 'Forage Post', 1, 'foragepost.png', 0, '', '0', 1, 1, 0, '', '', 'Locates edible food sources in the area, gathering them for use. The local land can only support one worker finding food. The rate of resources collected reduces as the area land becomes more developed.'),
(2, 'Lean To', 1, 'leanto.png', 120, '', '1', 0, 0, 0, '', '', 'Before food, even before water, one must find shelter from the elements. It is the first requirement for survival; for the elements, at their worst, can defeat you faster than anything else.');

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
