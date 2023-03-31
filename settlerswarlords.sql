-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 31, 2023 at 09:46 PM
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='used for error tracking';

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='logs for debugging the game';

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `coords` (`x`,`y`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='world map';

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
  `newlandtype` int NOT NULL DEFAULT '-1' COMMENT 'What land this has been changed to by development. -1 if not changed',
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
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='all users';

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
