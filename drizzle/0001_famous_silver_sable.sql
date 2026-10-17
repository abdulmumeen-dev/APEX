CREATE TABLE `apex_approvals` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`runId` varchar(36) NOT NULL,
	`action` varchar(200) NOT NULL,
	`details` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`decisionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `apex_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_bridges` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`protocol` enum('apex_bridge_v1','openai_compatible_agent') NOT NULL,
	`endpoint` varchar(2048) NOT NULL,
	`encryptedApiKey` text,
	`bridgeStatus` enum('unchecked','connected','failed') NOT NULL DEFAULT 'unchecked',
	`statusDetail` varchar(300),
	`testedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_bridges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_library_items` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('prompt','tool','workflow') NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`body` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_library_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_memories` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_messages` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`role` enum('user','assistant','tool') NOT NULL,
	`content` text NOT NULL,
	`toolName` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apex_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_providers` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`kind` enum('api','server','local') NOT NULL,
	`baseUrl` varchar(2048) NOT NULL,
	`modelId` varchar(200) NOT NULL,
	`encryptedApiKey` text,
	`isDefault` int NOT NULL DEFAULT 0,
	`testStatus` enum('unchecked','connected','failed') NOT NULL DEFAULT 'unchecked',
	`testDetail` varchar(300),
	`testedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_run_steps` (
	`id` varchar(36) NOT NULL,
	`runId` varchar(36) NOT NULL,
	`sequence` int NOT NULL,
	`kind` varchar(40) NOT NULL,
	`label` varchar(200) NOT NULL,
	`status` enum('running','completed','blocked','failed') NOT NULL,
	`detail` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `apex_run_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_runs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`status` enum('blocked','running','waiting_approval','succeeded','failed','cancelled') NOT NULL,
	`task` text NOT NULL,
	`providerId` varchar(36),
	`allowBridges` int NOT NULL DEFAULT 0,
	`result` text,
	`error` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `apex_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_sessions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL DEFAULT 'New task',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_workflows` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`triggerType` enum('manual','schedule','webhook') NOT NULL DEFAULT 'manual',
	`definition` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apex_workspace_files` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(512) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isCurrent` int NOT NULL DEFAULT 1,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_workspace_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `apex_workspace_files_user_path_version_uq` UNIQUE(`userId`,`path`,`version`)
);
--> statement-breakpoint
ALTER TABLE `apex_approvals` ADD CONSTRAINT `apex_approvals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_approvals` ADD CONSTRAINT `apex_approvals_runId_apex_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `apex_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_bridges` ADD CONSTRAINT `apex_bridges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_library_items` ADD CONSTRAINT `apex_library_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_memories` ADD CONSTRAINT `apex_memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_messages` ADD CONSTRAINT `apex_messages_sessionId_apex_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `apex_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_providers` ADD CONSTRAINT `apex_providers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_run_steps` ADD CONSTRAINT `apex_run_steps_runId_apex_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `apex_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_runs` ADD CONSTRAINT `apex_runs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_runs` ADD CONSTRAINT `apex_runs_sessionId_apex_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `apex_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_sessions` ADD CONSTRAINT `apex_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_workflows` ADD CONSTRAINT `apex_workflows_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apex_workspace_files` ADD CONSTRAINT `apex_workspace_files_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `apex_approvals_user_status_idx` ON `apex_approvals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `apex_bridges_user_idx` ON `apex_bridges` (`userId`);--> statement-breakpoint
CREATE INDEX `apex_bridges_status_idx` ON `apex_bridges` (`userId`,`bridgeStatus`);--> statement-breakpoint
CREATE INDEX `apex_library_user_kind_idx` ON `apex_library_items` (`userId`,`kind`);--> statement-breakpoint
CREATE INDEX `apex_memories_user_updated_idx` ON `apex_memories` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `apex_messages_session_created_idx` ON `apex_messages` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `apex_providers_user_idx` ON `apex_providers` (`userId`);--> statement-breakpoint
CREATE INDEX `apex_providers_default_idx` ON `apex_providers` (`userId`,`isDefault`);--> statement-breakpoint
CREATE INDEX `apex_run_steps_run_sequence_idx` ON `apex_run_steps` (`runId`,`sequence`);--> statement-breakpoint
CREATE INDEX `apex_runs_user_started_idx` ON `apex_runs` (`userId`,`startedAt`);--> statement-breakpoint
CREATE INDEX `apex_runs_session_idx` ON `apex_runs` (`sessionId`);--> statement-breakpoint
CREATE INDEX `apex_sessions_user_updated_idx` ON `apex_sessions` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `apex_workflows_user_updated_idx` ON `apex_workflows` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `apex_workspace_files_current_idx` ON `apex_workspace_files` (`userId`,`path`,`isCurrent`);--> statement-breakpoint
CREATE INDEX `apex_workspace_files_user_updated_idx` ON `apex_workspace_files` (`userId`,`updatedAt`);