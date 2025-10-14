-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 10, 2025 at 07:34 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `online_shop`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('admin','super_admin') DEFAULT 'admin',
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `role`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$12$ELQzi1UKLpB5ayuyPtL8DecWlLFayfeS7Br8TEb/Rfk52Xn.lf/ie', 'Admin', 'User', 'super_admin', 'active', '2025-09-15 15:03:33', '2025-07-08 14:40:18', '2025-09-15 15:03:33');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'เสื้อผ้า', 'เสื้อผ้าแฟชั่นสำหรับทุกเพศทุกวัย', '2025-07-04 12:51:56', '2025-07-04 12:51:56'),
(2, 'ของใช้', 'ของใช้ในบ้านและของใช้ส่วนตัว', '2025-07-04 12:51:56', '2025-07-04 12:51:56'),
(3, 'อาหาร', 'อาหารและเครื่องดื่ม', '2025-07-04 12:51:56', '2025-07-04 12:51:56'),
(4, 'อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์และแกดเจต', '2025-07-04 12:51:56', '2025-07-04 12:51:56'),
(5, 'กีฬา', 'อุปกรณ์กีฬาและออกกำลังกาย', '2025-07-04 12:51:56', '2025-07-04 12:51:56');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `first_order_date` datetime DEFAULT NULL,
  `last_order_date` datetime DEFAULT NULL,
  `total_orders` int(11) DEFAULT 0,
  `total_spent` decimal(12,2) DEFAULT 0.00,
  `status` enum('active','inactive') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `phone`, `email`, `password`, `address`, `date_of_birth`, `gender`, `email_verified`, `last_login`, `first_order_date`, `last_order_date`, `total_orders`, `total_spent`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'สมชาย ใจดี', '', '081-234-5678', NULL, '', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', NULL, NULL, 0, NULL, '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 1340.00, 'active', NULL, '2025-08-23 18:04:22', '2025-08-23 18:04:22'),
(2, 'nattakit', '', '0811111111', NULL, '', NULL, NULL, NULL, 0, NULL, '2025-07-04 21:32:08', '2025-07-04 21:32:08', 1, 450.00, 'active', NULL, '2025-08-23 18:04:22', '2025-09-05 12:27:38'),
(3, 'สมหญิง รักดี', '', '082-345-6789', NULL, '', '456 ถนนพหลโยธิน ตำบลสุเทพ อำเภอเมือง เชียงใหม่ 50200', NULL, NULL, 0, NULL, '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 1250.00, 'active', NULL, '2025-08-23 18:04:22', '2025-09-05 12:29:30'),
(4, 'อนุชา สมบูรณ์', '', '083-456-7890', NULL, '', '', NULL, NULL, 0, NULL, '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 630.00, 'active', NULL, '2025-08-23 18:04:22', '2025-09-05 12:29:54'),
(8, 'ณัฎฐกิตติ์ พลอยตระกูล', '', '0835174913', 'Nattakit@gmail.com', '', '17/1 หมู่10 ป่าเป้า ซอย1/5', NULL, NULL, 0, NULL, '2025-09-15 22:09:43', '2025-09-18 22:26:33', 15, 4800.00, 'active', NULL, '2025-09-15 15:09:43', '2025-09-18 15:26:33');

-- --------------------------------------------------------

--
-- Stand-in structure for view `customer_stats`
-- (See below for the actual view)
--
CREATE TABLE `customer_stats` (
);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_number` varchar(50) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','confirmed','shipped','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `manage_status` enum('confirm','delivery','finish') DEFAULT 'confirm'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `order_number`, `customer_name`, `customer_phone`, `customer_address`, `customer_email`, `notes`, `total_amount`, `status`, `created_at`, `updated_at`, `manage_status`) VALUES
(1, 1, 'ORD1704123456', 'สมชาย ใจดี', '081-234-5678', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', NULL, NULL, 1340.00, 'paid', '2025-07-04 12:53:08', '2025-08-23 18:04:22', 'confirm'),
(2, 3, 'ORD1704123457', 'สมหญิง รักดี', '082-345-6789', '456 ถนนพหลโยธิน ตำบลสุเทพ อำเภอเมือง เชียงใหม่ 50200', NULL, NULL, 1250.00, 'completed', '2025-07-04 12:53:08', '2025-09-05 12:29:32', 'confirm'),
(3, 4, 'ORD1704123458', 'อนุชา สมบูรณ์', '083-456-7890', '', NULL, NULL, 630.00, 'completed', '2025-07-04 12:53:08', '2025-09-05 12:29:54', 'confirm'),
(4, 2, 'ORD1751639528042RF52', 'nattakit', '0811111111', NULL, NULL, NULL, 450.00, 'completed', '2025-07-04 14:32:08', '2025-09-05 12:27:38', 'confirm'),
(11, NULL, 'ORD48660441N24Q12', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'crystalza55@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:04:20', '2025-09-15 15:10:17', 'confirm'),
(12, 8, 'ORD4898398475LTBF', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'crystalza55@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:09:43', '2025-09-15 15:10:16', 'confirm'),
(13, 8, 'ORD49421648X2OFLK', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:17:01', '2025-09-15 15:17:01', 'confirm'),
(14, 8, 'ORD50111284QF7BLW', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:28:31', '2025-09-15 15:28:31', 'confirm'),
(15, 8, 'ORD50114006JFKY64', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:28:34', '2025-09-15 15:28:34', 'confirm'),
(16, 8, 'ORD501145077Q5YT3', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:28:34', '2025-09-15 15:28:34', 'confirm'),
(17, 8, 'ORD5011517433FET7', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:28:35', '2025-09-15 15:28:35', 'confirm'),
(18, 8, 'ORD50123522FWHFOI', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'pending', '2025-09-15 15:28:43', '2025-09-15 15:28:43', 'confirm'),
(19, 8, 'ORD50124109MXJ1GA', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:28:44', '2025-09-23 17:56:45', 'confirm'),
(20, 8, 'ORD50124576ZEBPJS', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:28:44', '2025-09-23 17:56:46', 'confirm'),
(21, 8, 'ORD50125071RCBJQA', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:28:45', '2025-09-23 17:56:44', 'confirm'),
(22, 8, 'ORD5102495114DRV0', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:43:44', '2025-09-23 17:56:43', 'confirm'),
(23, 8, 'ORD51568711DOK7PB', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'confirmed', '2025-09-15 15:52:48', '2025-09-23 17:56:42', 'confirm'),
(24, 8, 'ORD51923654E3HN5Q', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', NULL, 320.00, 'completed', '2025-09-15 15:58:43', '2025-09-23 17:56:40', 'confirm'),
(25, 8, 'ORD078915398POURL', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', 'rreererer', 320.00, 'completed', '2025-09-18 15:04:51', '2025-09-23 17:57:20', 'confirm'),
(26, NULL, 'ORD08888591KR03VZ', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', 'กไำดไำำดไำเำพ', 320.00, 'completed', '2025-09-18 15:21:28', '2025-09-23 17:50:19', 'confirm'),
(27, 8, 'ORD09193379N1OBU5', 'ณัฎฐกิตติ์ พลอยตระกูล', '0835174913', '17/1 หมู่10 ป่าเป้า ซอย1/5', 'Nattakit@gmail.com', 'ggggggggggg', 320.00, 'cancelled', '2025-09-18 15:26:33', '2025-09-18 15:30:43', 'confirm');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `created_at`) VALUES
(1, 1, 1, 2, 450.00, '2025-07-04 12:53:13'),
(2, 1, 3, 1, 890.00, '2025-07-04 12:53:13'),
(3, 2, 4, 1, 1250.00, '2025-07-04 12:53:13'),
(4, 3, 1, 1, 450.00, '2025-07-04 12:53:13'),
(5, 3, 5, 1, 180.00, '2025-07-04 12:53:13'),
(6, 4, 1, 1, 450.00, '2025-07-04 14:32:08'),
(7, 11, 6, 1, 320.00, '2025-09-15 15:04:20'),
(8, 12, 6, 1, 320.00, '2025-09-15 15:09:43'),
(9, 13, 6, 1, 320.00, '2025-09-15 15:17:01'),
(10, 14, 6, 1, 320.00, '2025-09-15 15:28:31'),
(11, 15, 6, 1, 320.00, '2025-09-15 15:28:34'),
(12, 16, 6, 1, 320.00, '2025-09-15 15:28:34'),
(13, 17, 6, 1, 320.00, '2025-09-15 15:28:35'),
(14, 18, 6, 1, 320.00, '2025-09-15 15:28:43'),
(15, 19, 6, 1, 320.00, '2025-09-15 15:28:44'),
(16, 20, 6, 1, 320.00, '2025-09-15 15:28:44'),
(17, 21, 6, 1, 320.00, '2025-09-15 15:28:45'),
(18, 22, 6, 1, 320.00, '2025-09-15 15:43:44'),
(19, 23, 6, 1, 320.00, '2025-09-15 15:52:48'),
(20, 24, 6, 1, 320.00, '2025-09-15 15:58:43'),
(21, 25, 6, 1, 320.00, '2025-09-18 15:04:51'),
(22, 26, 6, 1, 320.00, '2025-09-18 15:21:28'),
(23, 27, 6, 1, 320.00, '2025-09-18 15:26:33');

-- --------------------------------------------------------

--
-- Stand-in structure for view `order_stats`
-- (See below for the actual view)
--
CREATE TABLE `order_stats` (
`total_orders` bigint(21)
,`total_customers` bigint(21)
,`total_revenue` decimal(32,2)
,`avg_order_value` decimal(14,6)
,`status` enum('pending','paid','confirmed','shipped','completed','cancelled')
,`order_date` date
);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` enum('promptpay','bank_transfer','cash') DEFAULT 'promptpay',
  `amount` decimal(10,2) NOT NULL,
  `payment_slip` varchar(255) DEFAULT NULL,
  `payment_date_time` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `payment_method`, `amount`, `payment_slip`, `payment_date_time`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'promptpay', 1340.00, 'slip-001.jpg', '2024-01-15 11:30:00', 'โอนผ่าน ธ.กสิกรไทย', 'verified', '2025-07-04 12:53:19', '2025-07-04 12:53:19'),
(2, 2, 'promptpay', 1250.00, 'slip-002.jpg', '2024-01-14 16:45:00', 'โอนผ่าน ธ.ไทยพาณิชย์', 'verified', '2025-07-04 12:53:19', '2025-07-04 12:53:19');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock_quantity`, `category_id`, `image_url`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'เสื้อยืดสีขาว', 'เสื้อยืดผ้าคอตตอน 100% สีขาว ใส่สบาย ระบายอากาศดี', 450.00, 24, 1, '/uploads/products/tshirt-white.jpg', 1, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11'),
(3, 'กางเกงยีนส์ผู้ชาย', 'กางเกงยีนส์ผู้ชาย สีน้ำเงิน ผ้าดีมีความยืดหยุ่น', 890.00, 15, 1, '/uploads/products/jeans-men.jpg', 0, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11'),
(4, 'กระเป๋าสะพาย', 'กระเป๋าสะพายหนังแท้ สีน้ำตาล ใส่ของได้เยอะ', 1250.00, 8, 2, '/uploads/products/product-1759696273165-33462139.png', 1, 1, '2025-07-04 12:52:42', '2025-10-05 20:31:13'),
(5, 'แก้วกาแฟเซรามิค', 'แก้วกาแฟเซรามิคสีขาว ความจุ 300ml', 180.00, 50, 2, '/uploads/products/mug-ceramic.jpg', 0, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11'),
(6, 'น้ำมันมะพร้าวธรรมชาติ', 'น้ำมันมะพร้าวแท้ 100% ไม่ผ่านการกลั่น ขนาด 250ml', 320.00, 3, 3, '/uploads/products/coconut-oil.jpg', 1, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11'),
(7, 'หูฟังไร้สาย', 'หูฟังไร้สายคุณภาพสูง เสียงใสชัด', 2500.00, 12, 4, '/uploads/products/wireless-headphone.jpg', 1, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11'),
(8, 'ลูกฟุตบอล', 'ลูกฟุตบอลมาตรฐาน FIFA ขนาด 5', 650.00, 18, 5, '/uploads/products/football.jpg', 0, 1, '2025-07-04 12:52:42', '2025-10-05 18:02:11');

-- --------------------------------------------------------

--
-- Stand-in structure for view `product_stats`
-- (See below for the actual view)
--
CREATE TABLE `product_stats` (
`id` int(11)
,`name` varchar(255)
,`price` decimal(10,2)
,`stock_quantity` int(11)
,`category_id` int(11)
,`category_name` varchar(100)
,`total_sold` decimal(32,0)
,`total_revenue` decimal(42,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(6, 'shop_description', 'ร้านค้าออนไลน์ที่ให้บริการสินค้าคุณภาพดี ราคาสุดคุ้ม', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(7, 'free_shipping_minimum', '500', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(8, 'currency', 'THB', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(9, 'timezone', 'Asia/Bangkok', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(10, 'shop_name', 'เบบี๋แคท (Bybe CAT)', '2025-08-25 16:12:44', '2025-09-03 15:29:37'),
(11, 'promptpay_number', '0987654321', '2025-08-25 16:12:44', '2025-09-03 15:29:37'),
(12, 'shop_address', 'ที่อยู่ทดสอบ', '2025-08-25 16:12:44', '2025-09-03 15:29:37'),
(13, 'shop_phone', '02-999-999', '2025-08-25 16:12:44', '2025-09-03 15:29:37'),
(14, 'shop_email', 'bybecat@gmail.com', '2025-08-25 16:12:44', '2025-09-03 15:29:37'),
(35, 'shop_logo', '/uploads/logo.png', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(36, 'shop_banner', '/uploads/banner.jpg', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(37, 'facebook_url', '', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(38, 'instagram_url', '', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(39, 'line_id', '', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(40, 'business_hours', '9:00-18:00', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(41, 'delivery_fee', '50', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(42, 'terms_and_conditions', 'เงื่อนไขการใช้งาน...', '2025-09-15 13:49:52', '2025-09-15 13:49:52'),
(43, 'privacy_policy', 'นโยบายความเป็นส่วนตัว...', '2025-09-15 13:49:52', '2025-09-15 13:49:52');

--
-- Triggers `settings`
--
DELIMITER $$
CREATE TRIGGER `settings_audit_delete` AFTER DELETE ON `settings` FOR EACH ROW BEGIN
    INSERT INTO settings_history (
        setting_key, old_value, new_value, action, changed_by, changed_at
    ) VALUES (
        OLD.setting_key, OLD.setting_value, NULL, 'DELETE', 'system', NOW()
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `settings_audit_insert` AFTER INSERT ON `settings` FOR EACH ROW BEGIN
    INSERT INTO settings_history (
        setting_key, old_value, new_value, action, changed_by, changed_at
    ) VALUES (
        NEW.setting_key, NULL, NEW.setting_value, 'INSERT', 'system', NOW()
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `settings_audit_update` AFTER UPDATE ON `settings` FOR EACH ROW BEGIN
    INSERT INTO settings_history (
        setting_key, old_value, new_value, action, changed_by, changed_at
    ) VALUES (
        NEW.setting_key, OLD.setting_value, NEW.setting_value, 'UPDATE', 'system', NOW()
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `settings_history`
--

CREATE TABLE `settings_history` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `changed_by` varchar(100) DEFAULT 'system',
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings_history`
--

INSERT INTO `settings_history` (`id`, `setting_key`, `old_value`, `new_value`, `changed_by`, `changed_at`, `action`, `ip_address`, `user_agent`) VALUES
(1, 'shop_name', 'ร้านออนไลน์ของฉัน', 'ร้านออนไลน์ทดสอบ', 'system', '2025-08-25 16:15:10', 'UPDATE', NULL, NULL),
(2, 'shop_name', 'ร้านออนไลน์ทดสอบ', 'ทดสอบร้าน 25/8/2568 23:38:22', 'system', '2025-08-25 16:38:22', 'UPDATE', NULL, NULL),
(3, 'promptpay_number', '0123456789', '0987654321', 'system', '2025-08-25 16:38:22', 'UPDATE', NULL, NULL),
(4, 'shop_address', '123 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10110', 'ที่อยู่ทดสอบ', 'system', '2025-08-25 16:38:22', 'UPDATE', NULL, NULL),
(5, 'shop_phone', '02-123-4567', '02-987-6543', 'system', '2025-08-25 16:38:22', 'UPDATE', NULL, NULL),
(6, 'shop_email', 'contact@example.com', 'test@example.com', 'system', '2025-08-25 16:38:22', 'UPDATE', NULL, NULL),
(7, 'shop_name', 'ทดสอบร้าน 25/8/2568 23:38:22', 'ทดสอบร้าน 25/8/2568 23:38:22', 'system', '2025-09-03 15:24:24', 'UPDATE', NULL, NULL),
(8, 'promptpay_number', '0987654321', '0987654321', 'system', '2025-09-03 15:24:24', 'UPDATE', NULL, NULL),
(9, 'shop_address', 'ที่อยู่ทดสอบ', 'ที่อยู่ทดสอบ', 'system', '2025-09-03 15:24:24', 'UPDATE', NULL, NULL),
(10, 'shop_phone', '02-987-6543', '02-987-6543', 'system', '2025-09-03 15:24:24', 'UPDATE', NULL, NULL),
(11, 'shop_email', 'test@example.com', 'test@example.com', 'system', '2025-09-03 15:24:24', 'UPDATE', NULL, NULL),
(12, 'shop_name', 'ทดสอบร้าน 25/8/2568 23:38:22', 'เบบี๋แคท (Bybe CAT)', 'system', '2025-09-03 15:26:18', 'UPDATE', NULL, NULL),
(13, 'promptpay_number', '0987654321', '0987654321', 'system', '2025-09-03 15:26:18', 'UPDATE', NULL, NULL),
(14, 'shop_address', 'ที่อยู่ทดสอบ', 'ที่อยู่ทดสอบ', 'system', '2025-09-03 15:26:18', 'UPDATE', NULL, NULL),
(15, 'shop_phone', '02-987-6543', '02-999-999', 'system', '2025-09-03 15:26:18', 'UPDATE', NULL, NULL),
(16, 'shop_email', 'test@example.com', 'bybecat@gmail.com', 'system', '2025-09-03 15:26:18', 'UPDATE', NULL, NULL),
(17, 'shop_name', 'เบบี๋แคท (Bybe CAT)', 'เบบี๋แคท (Bybe CAT)', 'system', '2025-09-03 15:29:37', 'UPDATE', NULL, NULL),
(18, 'promptpay_number', '0987654321', '0987654321', 'system', '2025-09-03 15:29:37', 'UPDATE', NULL, NULL),
(19, 'shop_address', 'ที่อยู่ทดสอบ', 'ที่อยู่ทดสอบ', 'system', '2025-09-03 15:29:37', 'UPDATE', NULL, NULL),
(20, 'shop_phone', '02-999-999', '02-999-999', 'system', '2025-09-03 15:29:37', 'UPDATE', NULL, NULL),
(21, 'shop_email', 'bybecat@gmail.com', 'bybecat@gmail.com', 'system', '2025-09-03 15:29:37', 'UPDATE', NULL, NULL),
(22, 'shop_logo', NULL, '/uploads/logo.png', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(23, 'shop_banner', NULL, '/uploads/banner.jpg', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(24, 'facebook_url', NULL, '', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(25, 'instagram_url', NULL, '', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(26, 'line_id', NULL, '', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(27, 'business_hours', NULL, '9:00-18:00', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(28, 'delivery_fee', NULL, '50', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(29, 'terms_and_conditions', NULL, 'เงื่อนไขการใช้งาน...', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL),
(30, 'privacy_policy', NULL, 'นโยบายความเป็นส่วนตัว...', 'system', '2025-09-15 13:49:52', 'INSERT', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure for view `customer_stats`
--
DROP TABLE IF EXISTS `customer_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `customer_stats`  AS SELECT `c`.`id` AS `id`, `c`.`customer_name` AS `customer_name`, `c`.`customer_phone` AS `customer_phone`, `c`.`customer_email` AS `customer_email`, `c`.`total_orders` AS `total_orders`, `c`.`total_spent` AS `total_spent`, `c`.`first_order_date` AS `first_order_date`, `c`.`last_order_date` AS `last_order_date`, to_days(`c`.`last_order_date`) - to_days(`c`.`first_order_date`) AS `customer_lifetime_days`, `c`.`total_spent`/ `c`.`total_orders` AS `avg_order_value` FROM `customers` AS `c` WHERE `c`.`status` = 'active' ORDER BY `c`.`total_spent` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `order_stats`
--
DROP TABLE IF EXISTS `order_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `order_stats`  AS SELECT count(0) AS `total_orders`, count(distinct `orders`.`customer_phone`) AS `total_customers`, sum(`orders`.`total_amount`) AS `total_revenue`, avg(`orders`.`total_amount`) AS `avg_order_value`, `orders`.`status` AS `status`, cast(`orders`.`created_at` as date) AS `order_date` FROM `orders` GROUP BY `orders`.`status`, cast(`orders`.`created_at` as date) ;

-- --------------------------------------------------------

--
-- Structure for view `product_stats`
--
DROP TABLE IF EXISTS `product_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `product_stats`  AS SELECT `p`.`id` AS `id`, `p`.`name` AS `name`, `p`.`price` AS `price`, `p`.`stock_quantity` AS `stock_quantity`, `p`.`category_id` AS `category_id`, `c`.`name` AS `category_name`, coalesce(sum(`oi`.`quantity`),0) AS `total_sold`, coalesce(sum(`oi`.`quantity` * `oi`.`price`),0) AS `total_revenue` FROM (((`products` `p` left join `categories` `c` on(`p`.`category_id` = `c`.`id`)) left join `order_items` `oi` on(`p`.`id` = `oi`.`product_id`)) left join `orders` `o` on(`oi`.`order_id` = `o`.`id` and `o`.`status` in ('confirmed','shipped','completed'))) WHERE `p`.`is_active` = 1 GROUP BY `p`.`id`, `p`.`name`, `p`.`price`, `p`.`stock_quantity`, `p`.`category_id`, `c`.`name` ORDER BY coalesce(sum(`oi`.`quantity`),0) DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_cart_customer` (`customer_id`),
  ADD KEY `idx_cart_session` (`session_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_categories_name` (`name`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_phone` (`phone`),
  ADD KEY `idx_customers_name` (`first_name`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_email` (`email`),
  ADD KEY `idx_customers_status` (`status`),
  ADD KEY `idx_customers_created` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_number` (`order_number`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_created` (`created_at`),
  ADD KEY `idx_orders_customer_phone` (`customer_phone`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `idx_orders_customer_status` (`customer_id`,`status`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`),
  ADD KEY `idx_orderitems_product_order` (`product_id`,`order_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payments_order` (`order_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_created` (`created_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_featured` (`is_featured`),
  ADD KEY `idx_products_active` (`is_active`),
  ADD KEY `idx_products_price` (`price`),
  ADD KEY `idx_products_created` (`created_at`),
  ADD KEY `idx_products_name` (`name`),
  ADD KEY `idx_products_price_stock` (`price`,`stock_quantity`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_settings_key` (`setting_key`);

--
-- Indexes for table `settings_history`
--
ALTER TABLE `settings_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_settings_history_key` (`setting_key`),
  ADD KEY `idx_settings_history_date` (`changed_at`),
  ADD KEY `idx_settings_history_action` (`action`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `settings_history`
--
ALTER TABLE `settings_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
