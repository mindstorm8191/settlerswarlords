-- phpMyAdmin SQL Dump
-- version 4.7.9
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 26, 2019 at 11:37 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=ascii COMMENT='used for error tracking';

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
  `endtime` datetime DEFAULT NULL,
  `continuous` int(11) NOT NULL DEFAULT '0' COMMENT '1 if continuous, 0 if not',
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
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='individual inventory sets';

-- --------------------------------------------------------

--
-- Table structure for table `sw_item`
--

DROP TABLE IF EXISTS `sw_item`;
CREATE TABLE IF NOT EXISTS `sw_item` (
  `mapid` int(11) NOT NULL COMMENT 'which map this is for',
  `name` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL,
  `grouping` int(11) NOT NULL COMMENT '0-3 if solid, particle, liquid or gas',
  `weight` int(11) NOT NULL COMMENT 'per single unit',
  `size` int(11) NOT NULL COMMENT 'per single unit',
  `temp` int(11) NOT NULL COMMENT '-300 to +30000',
  `priority` int(11) NOT NULL COMMENT 'used for ordering, like with food',
  PRIMARY KEY (`mapid`,`name`),
  UNIQUE KEY `inventory` (`mapid`,`name`)
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=ascii;

--
-- Dumping data for table `sw_structuretype`
--

INSERT INTO `sw_structuretype` (`id`, `name`, `level`, `image`, `buildtime`, `resources`, `landtype`, `minworkers`, `maxworkers`, `workerbonus`, `resourcesUsed`, `output`, `description`) VALUES
(1, 'Forage Post', 1, 'foragepost.png', 0, NULL, '0', 1, 1, 0, '', '', 'Locates edible food sources in the area, gathering them for use. The local land can only support one worker finding food. The rate of resources collected reduces as the area land becomes more developed.');

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
