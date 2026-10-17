CREATE TABLE `apex_plugins` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`baseUrl` varchar(2048) NOT NULL,
	`path` varchar(512) NOT NULL,
	`encryptedApiKey` text,
	`enabled` int NOT NULL DEFAULT 0,
	`testStatus` enum('unchecked','connected','failed') NOT NULL DEFAULT 'unchecked',
	`testDetail` varchar(300),
	`testedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_plugins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_skills` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`instructions` text NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `apex_plugins` ADD CONSTRAINT `apex_plugins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_skills` ADD CONSTRAINT `apex_skills_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `apex_plugins_user_enabled_idx` ON `apex_plugins` (`userId`,`enabled`);--> statement-breakpoint
CREATE INDEX `apex_plugins_user_updated_idx` ON `apex_plugins` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `apex_skills_user_enabled_idx` ON `apex_skills` (`userId`,`enabled`);--> statement-breakpoint
CREATE INDEX `apex_skills_user_updated_idx` ON `apex_skills` (`userId`,`updatedAt`);