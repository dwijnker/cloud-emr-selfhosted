CREATE TABLE `allergies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`allergen` varchar(255) NOT NULL,
	`allergenType` enum('medication','food','environmental','other'),
	`severity` enum('mild','moderate','severe'),
	`reaction` text,
	`status` enum('active','inactive') DEFAULT 'active',
	`onsetDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allergies_id` PRIMARY KEY(`id`),
	CONSTRAINT `allergies_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`appointmentDate` timestamp NOT NULL,
	`duration` int,
	`provider` varchar(255),
	`appointmentType` varchar(100),
	`location` varchar(255),
	`status` enum('scheduled','completed','cancelled','no-show') DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`),
	CONSTRAINT `appointments_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `cardiacOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`orderDate` date NOT NULL,
	`provider` varchar(255),
	`cardiacCenter` varchar(255),
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cardiacOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `cardiacOrders_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `careGapDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64),
	`gapName` varchar(255) NOT NULL,
	`description` text,
	`criteria` text,
	`measureType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careGapDefinitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `careGapDefinitions_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `careGaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`gapDefinitionId` int,
	`gapName` varchar(255) NOT NULL,
	`status` enum('open','closed') DEFAULT 'open',
	`closedDate` date,
	`closureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careGaps_id` PRIMARY KEY(`id`),
	CONSTRAINT `careGaps_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `clinicalDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`documentType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`documentDate` date,
	`provider` varchar(255),
	`content` text,
	`fileUrl` text,
	`status` enum('draft','final','archived') DEFAULT 'final',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicalDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinicalDocuments_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `documentTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drugIntolerances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`drugName` varchar(255) NOT NULL,
	`rxNorm` varchar(20),
	`reaction` text,
	`severity` enum('mild','moderate','severe'),
	`status` enum('active','inactive') DEFAULT 'active',
	`onsetDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drugIntolerances_id` PRIMARY KEY(`id`),
	CONSTRAINT `drugIntolerances_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `familyHistories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`relation` varchar(50) NOT NULL,
	`condition` varchar(255) NOT NULL,
	`icdCode` varchar(20),
	`ageOfOnset` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyHistories_id` PRIMARY KEY(`id`),
	CONSTRAINT `familyHistories_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `imagingOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`orderDate` date NOT NULL,
	`provider` varchar(255),
	`imagingCenter` varchar(255),
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `imagingOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `imagingOrders_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `immunizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`vaccineName` varchar(255) NOT NULL,
	`cvxCode` varchar(10),
	`administrationDate` date NOT NULL,
	`route` varchar(50),
	`site` varchar(50),
	`manufacturer` varchar(255),
	`lotNumber` varchar(100),
	`nextDueDate` date,
	`provider` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `immunizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `immunizations_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `labOrderTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labOrderId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`loincCode` varchar(20),
	`result` text,
	`referenceRange` varchar(100),
	`unit` varchar(50),
	`status` enum('pending','completed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labOrderTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`orderDate` date NOT NULL,
	`provider` varchar(255),
	`labVendor` varchar(255),
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	`specimenCollectionDate` date,
	`resultDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `labOrders_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `medicalHistories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`historyType` varchar(100) NOT NULL,
	`status` varchar(50),
	`details` text,
	`startDate` date,
	`endDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalHistories_id` PRIMARY KEY(`id`),
	CONSTRAINT `medicalHistories_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`medicationName` varchar(255) NOT NULL,
	`rxNorm` varchar(20),
	`dosage` varchar(100),
	`route` varchar(50),
	`frequency` varchar(100),
	`startDate` date,
	`endDate` date,
	`status` enum('active','discontinued','on-hold') DEFAULT 'active',
	`prescriber` varchar(255),
	`indication` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`),
	CONSTRAINT `medications_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `nonVisitNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`noteDate` date NOT NULL,
	`noteType` varchar(100),
	`content` text NOT NULL,
	`author` varchar(255),
	`status` enum('draft','completed','signed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nonVisitNotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `nonVisitNotes_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `patientFormRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`formName` varchar(255) NOT NULL,
	`requestDate` date NOT NULL,
	`dueDate` date,
	`status` enum('pending','completed','expired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientFormRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `patientFormRequests_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `patientFormSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientFormRequestId` int NOT NULL,
	`submissionDate` date NOT NULL,
	`formData` json,
	`status` enum('submitted','reviewed','approved') DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientFormSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patientForms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`formName` varchar(255) NOT NULL,
	`formType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientForms_id` PRIMARY KEY(`id`),
	CONSTRAINT `patientForms_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `patientInsurance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`insuranceProvider` varchar(255) NOT NULL,
	`memberId` varchar(100) NOT NULL,
	`groupNumber` varchar(100),
	`planName` varchar(255),
	`effectiveDate` date,
	`terminationDate` date,
	`isPrimary` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientInsurance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patientLetters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`letterDate` date NOT NULL,
	`letterType` varchar(100) NOT NULL,
	`category` varchar(100),
	`recipient` varchar(255),
	`content` text,
	`fileUrl` text,
	`status` enum('draft','sent','archived') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientLetters_id` PRIMARY KEY(`id`),
	CONSTRAINT `patientLetters_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` date,
	`gender` enum('M','F','Other','Unknown'),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(10),
	`ssn` varchar(11),
	`mrn` varchar(50),
	`status` enum('active','inactive','deceased') DEFAULT 'active',
	`profilePhotoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_externalId_unique` UNIQUE(`externalId`),
	CONSTRAINT `patients_mrn_unique` UNIQUE(`mrn`)
);
--> statement-breakpoint
CREATE TABLE `prescriptionFills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prescriptionId` int NOT NULL,
	`fillDate` date NOT NULL,
	`pharmacy` varchar(255),
	`quantity` int,
	`daysSupply` int,
	`status` enum('filled','pending','cancelled') DEFAULT 'filled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptionFills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptionRefills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prescriptionId` int NOT NULL,
	`refillDate` date NOT NULL,
	`requestedBy` varchar(255),
	`status` enum('pending','approved','denied') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptionRefills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`medicationName` varchar(255) NOT NULL,
	`rxNorm` varchar(20),
	`dosage` varchar(100),
	`quantity` int,
	`refills` int,
	`prescriptionDate` date NOT NULL,
	`prescriber` varchar(255),
	`status` enum('active','filled','expired','cancelled') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `prescriptions_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`icdCode` varchar(20) NOT NULL,
	`description` varchar(255) NOT NULL,
	`status` enum('active','inactive','resolved') DEFAULT 'active',
	`onsetDate` date,
	`resolutionDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problems_id` PRIMARY KEY(`id`),
	CONSTRAINT `problems_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `providerTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int,
	`providerName` varchar(255) NOT NULL,
	`specialty` varchar(100),
	`role` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`referralDate` date NOT NULL,
	`referringProvider` varchar(255),
	`referredTo` varchar(255) NOT NULL,
	`specialty` varchar(100),
	`reason` text,
	`status` enum('pending','accepted','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `reportInternalNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`content` text NOT NULL,
	`author` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportInternalNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`reportType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`reportDate` date,
	`provider` varchar(255),
	`content` text,
	`fileUrl` text,
	`status` enum('draft','final','archived') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `visitNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`visitDate` date NOT NULL,
	`visitType` varchar(100),
	`provider` varchar(255),
	`chief_complaint` text,
	`history_of_present_illness` text,
	`review_of_systems` text,
	`past_medical_history` text,
	`past_surgical_history` text,
	`medications_review` text,
	`allergies_review` text,
	`physical_exam` text,
	`assessment` text,
	`plan` text,
	`status` enum('draft','completed','signed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitNotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitNotes_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalId` varchar(64),
	`recordDate` timestamp NOT NULL,
	`systolicBP` int,
	`diastolicBP` int,
	`heartRate` int,
	`temperature` decimal(5,2),
	`respiratoryRate` int,
	`weight` decimal(8,2),
	`height` decimal(8,2),
	`bmi` decimal(5,2),
	`oxygenSaturation` decimal(5,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vitals_id` PRIMARY KEY(`id`),
	CONSTRAINT `vitals_externalId_unique` UNIQUE(`externalId`)
);
