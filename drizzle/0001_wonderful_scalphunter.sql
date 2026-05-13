CREATE TABLE `vulnerability_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractAddress` varchar(42) NOT NULL,
	`category` enum('reentrancy','overflow','access-control','oracle','logic','other') NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`nullifier` varchar(128) NOT NULL,
	`merkleTreeRoot` varchar(128) NOT NULL,
	`proofScope` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vulnerability_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `vulnerability_reports_nullifier_unique` UNIQUE(`nullifier`)
);
