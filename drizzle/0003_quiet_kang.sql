CREATE TABLE `apex_api_tokens` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`tokenPrefix` varchar(24) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `apex_api_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `apex_api_tokens_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `apex_runs` ADD `allowPlugins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `apex_api_tokens` ADD CONSTRAINT `apex_api_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `apex_api_tokens_user_created_idx` ON `apex_api_tokens` (`userId`,`createdAt`);