-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 25, 2025 at 05:53 PM
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
(1, 'admin', 'admin@example.com', '$2b$12$ELQzi1UKLpB5ayuyPtL8DecWlLFayfeS7Br8TEb/Rfk52Xn.lf/ie', 'Admin', 'User', 'super_admin', 'active', '2025-08-23 17:55:00', '2025-07-08 14:40:18', '2025-08-23 17:55:00');

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
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
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

INSERT INTO `customers` (`id`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `first_order_date`, `last_order_date`, `total_orders`, `total_spent`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'สมชาย ใจดี', '081-234-5678', NULL, '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 1340.00, 'active', NULL, '2025-08-23 18:04:22', '2025-08-23 18:04:22'),
(2, 'nattakit', '0811111111', NULL, NULL, '2025-07-04 21:32:08', '2025-07-04 21:32:08', 1, 450.00, 'active', NULL, '2025-08-23 18:04:22', '2025-08-23 18:04:22'),
(3, 'สมหญิง รักดี', '082-345-6789', NULL, '456 ถนนพหลโยธิน ตำบลสุเทพ อำเภอเมือง เชียงใหม่ 50200', '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 1250.00, 'active', NULL, '2025-08-23 18:04:22', '2025-08-23 18:04:22'),
(4, 'อนุชา สมบูรณ์', '083-456-7890', NULL, '', '2025-07-04 19:53:08', '2025-07-04 19:53:08', 1, 630.00, 'active', NULL, '2025-08-23 18:04:22', '2025-08-23 18:04:22');

-- --------------------------------------------------------

--
-- Stand-in structure for view `customer_stats`
-- (See below for the actual view)
--
CREATE TABLE `customer_stats` (
`id` int(11)
,`customer_name` varchar(100)
,`customer_phone` varchar(20)
,`customer_email` varchar(255)
,`total_orders` int(11)
,`total_spent` decimal(12,2)
,`first_order_date` datetime
,`last_order_date` datetime
,`customer_lifetime_days` int(7)
,`avg_order_value` decimal(16,6)
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `order_number`, `customer_name`, `customer_phone`, `customer_address`, `customer_email`, `notes`, `total_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'ORD1704123456', 'สมชาย ใจดี', '081-234-5678', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', NULL, NULL, 1340.00, 'paid', '2025-07-04 12:53:08', '2025-08-23 18:04:22'),
(2, 3, 'ORD1704123457', 'สมหญิง รักดี', '082-345-6789', '456 ถนนพหลโยธิน ตำบลสุเทพ อำเภอเมือง เชียงใหม่ 50200', NULL, NULL, 1250.00, 'confirmed', '2025-07-04 12:53:08', '2025-08-23 18:04:22'),
(3, 4, 'ORD1704123458', 'อนุชา สมบูรณ์', '083-456-7890', '', NULL, NULL, 630.00, 'pending', '2025-07-04 12:53:08', '2025-08-23 18:04:22'),
(4, 2, 'ORD1751639528042RF52', 'nattakit', '0811111111', NULL, NULL, NULL, 450.00, 'pending', '2025-07-04 14:32:08', '2025-08-23 18:04:22');

--
-- Triggers `orders`
--
DELIMITER $$
CREATE TRIGGER `update_customer_stats_after_order` AFTER INSERT ON `orders` FOR EACH ROW BEGIN
    DECLARE customer_exists INT DEFAULT 0;
    DECLARE customer_id_var INT DEFAULT NULL;
    
    -- ตรวจสอบว่าลูกค้าคนนี้มีในตารางหรือยัง
    SELECT COUNT(*), id INTO customer_exists, customer_id_var
    FROM customers 
    WHERE customer_phone = NEW.customer_phone;
    
    IF customer_exists = 0 THEN
        -- สร้างลูกค้าใหม่
        INSERT INTO customers (
            customer_name, 
            customer_phone, 
            customer_email, 
            customer_address,
            first_order_date,
            last_order_date,
            total_orders,
            total_spent
        ) VALUES (
            NEW.customer_name,
            NEW.customer_phone,
            NEW.customer_email,
            NEW.customer_address,
            NEW.created_at,
            NEW.created_at,
            1,
            NEW.total_amount
        );
        
        SET customer_id_var = LAST_INSERT_ID();
    ELSE
        -- อัปเดตข้อมูลลูกค้าที่มีอยู่
        UPDATE customers 
        SET 
            customer_name = NEW.customer_name,
            customer_email = COALESCE(NEW.customer_email, customer_email),
            customer_address = COALESCE(NEW.customer_address, customer_address),
            last_order_date = NEW.created_at,
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE customer_phone = NEW.customer_phone;
    END IF;
    
    -- อัปเดต customer_id ในตาราง orders
    UPDATE orders 
    SET customer_id = customer_id_var 
    WHERE id = NEW.id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_customer_stats_after_order_update` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    IF OLD.total_amount != NEW.total_amount OR OLD.status != NEW.status THEN
        UPDATE customers 
        SET 
            total_spent = total_spent - OLD.total_amount + NEW.total_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE customer_phone = NEW.customer_phone;
    END IF;
END
$$
DELIMITER ;

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
(6, 4, 1, 1, 450.00, '2025-07-04 14:32:08');

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
(1, 'เสื้อยืดสีขาว', 'เสื้อยืดผ้าคอตตอน 100% สีขาว ใส่สบาย ระบายอากาศดี', 450.00, 24, 1, '/uploads/tshirt-white.jpg', 1, 1, '2025-07-04 12:52:42', '2025-07-04 14:32:08'),
(2, 'เสื้อยืดสีดำ', 'เสื้อยืดผ้าคอตตอน 100% สีดำ ใส่สบาย ระบายอากาศดี', 450.00, 30, 1, '/uploads/tshirt-black.jpg', 1, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(3, 'กางเกงยีนส์ผู้ชาย', 'กางเกงยีนส์ผู้ชาย สีน้ำเงิน ผ้าดีมีความยืดหยุ่น', 890.00, 15, 1, '/uploads/jeans-men.jpg', 0, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(4, 'กระเป๋าสะพาย', 'กระเป๋าสะพายหนังแท้ สีน้ำตาล ใส่ของได้เยอะ', 1250.00, 8, 2, '/uploads/bag-leather.jpg', 1, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(5, 'แก้วกาแฟเซรามิค', 'แก้วกาแฟเซรามิคสีขาว ความจุ 300ml', 180.00, 50, 2, '/uploads/mug-ceramic.jpg', 0, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(6, 'น้ำมันมะพร้าวธรรมชาติ', 'น้ำมันมะพร้าวแท้ 100% ไม่ผ่านการกลั่น ขนาด 250ml', 320.00, 20, 3, '/uploads/coconut-oil.jpg', 1, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(7, 'หูฟังไร้สาย', 'หูฟังไร้สายคุณภาพสูง เสียงใสชัด', 2500.00, 12, 4, '/uploads/wireless-headphone.jpg', 1, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42'),
(8, 'ลูกฟุตบอล', 'ลูกฟุตบอลมาตรฐาน FIFA ขนาด 5', 650.00, 18, 5, '/uploads/football.jpg', 0, 1, '2025-07-04 12:52:42', '2025-07-04 12:52:42');

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
(1, 'shop_name', 'ร้านออนไลน์ของฉัน', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(2, 'promptpay_number', '0123456789', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(3, 'shop_address', '123 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10110', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(4, 'shop_phone', '02-123-4567', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(5, 'shop_email', 'contact@example.com', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(6, 'shop_description', 'ร้านค้าออนไลน์ที่ให้บริการสินค้าคุณภาพดี ราคาสุดคุ้ม', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(7, 'free_shipping_minimum', '500', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(8, 'currency', 'THB', '2025-07-04 12:52:02', '2025-07-04 12:52:02'),
(9, 'timezone', 'Asia/Bangkok', '2025-07-04 12:52:02', '2025-07-04 12:52:02');

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
  ADD UNIQUE KEY `customer_phone` (`customer_phone`),
  ADD KEY `idx_customers_name` (`customer_name`),
  ADD KEY `idx_customers_phone` (`customer_phone`),
  ADD KEY `idx_customers_email` (`customer_email`),
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
  ADD KEY `idx_orders_customer` (`customer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`);

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
  ADD KEY `idx_products_created` (`created_at`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_settings_key` (`setting_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
