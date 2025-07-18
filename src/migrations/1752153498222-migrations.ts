import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1752153498222 implements MigrationInterface {
  name = 'Migrations1752153498222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`ephemeral_keys\` (\`ephId\` varchar(36) NOT NULL, \`ephemeralKey\` varchar(255) NOT NULL, \`txHash\` varchar(255) NOT NULL, \`blockHeight\` bigint NOT NULL, \`seenAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`stealth_id\` varchar(36) NULL, PRIMARY KEY (\`ephId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transactions\` (\`user_id\` varchar(255) NOT NULL, \`sender_address\` varchar(255) NOT NULL, \`stealth_address\` varchar(255) NOT NULL, \`event_index\` varchar(255) NOT NULL, \`transaction_block_height\` bigint NOT NULL, \`direction\` enum ('IN', 'OUT') NOT NULL, \`amount\` decimal NULL, PRIMARY KEY (\`user_id\`, \`stealth_address\`, \`event_index\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stealth_addresses\` (\`stealthId\` varchar(36) NOT NULL, \`address\` varchar(255) NOT NULL, \`viewTag\` smallint NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`meta_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_4efd957e1ab5de431437520fc3\` (\`address\`), PRIMARY KEY (\`stealthId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meta_addresses\` (\`metaId\` varchar(36) NOT NULL, \`scanPublic\` varchar(255) NOT NULL, \`spendPublic\` varchar(255) NOT NULL, \`scanPrivateEncrypted\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, PRIMARY KEY (\`metaId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`userId\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`aptosPublicKey\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), PRIMARY KEY (\`userId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`nonces\` (\`id\` varchar(36) NOT NULL, \`value\` varchar(255) NOT NULL, \`aptosPublicKey\` varchar(255) NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` timestamp NOT NULL, UNIQUE INDEX \`IDX_f4012d075ae191c725d31e20ff\` (\`value\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ephemeral_keys\` ADD CONSTRAINT \`FK_8c5fb5457c8bb6c4f780570f9b7\` FOREIGN KEY (\`stealth_id\`) REFERENCES \`stealth_addresses\`(\`stealthId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stealth_addresses\` ADD CONSTRAINT \`FK_5102c89a44bcdb2f5761883fce8\` FOREIGN KEY (\`meta_id\`) REFERENCES \`meta_addresses\`(\`metaId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta_addresses\` ADD CONSTRAINT \`FK_907705c14de59804fbcd708d396\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`userId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta_addresses\` DROP FOREIGN KEY \`FK_907705c14de59804fbcd708d396\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stealth_addresses\` DROP FOREIGN KEY \`FK_5102c89a44bcdb2f5761883fce8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ephemeral_keys\` DROP FOREIGN KEY \`FK_8c5fb5457c8bb6c4f780570f9b7\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f4012d075ae191c725d31e20ff\` ON \`nonces\``,
    );
    await queryRunner.query(`DROP TABLE \`nonces\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`meta_addresses\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4efd957e1ab5de431437520fc3\` ON \`stealth_addresses\``,
    );
    await queryRunner.query(`DROP TABLE \`stealth_addresses\``);
    await queryRunner.query(`DROP TABLE \`transactions\``);
    await queryRunner.query(`DROP TABLE \`ephemeral_keys\``);
  }
}
