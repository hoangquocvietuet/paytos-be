import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1752118713123 implements MigrationInterface {
    name = 'Migrations1752118713123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` DROP COLUMN \`scanPublic\``);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` ADD \`scanPublic\` varchar(66) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` DROP COLUMN \`spendPublic\``);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` ADD \`spendPublic\` varchar(66) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` DROP COLUMN \`spendPublic\``);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` ADD \`spendPublic\` varchar(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` DROP COLUMN \`scanPublic\``);
        await queryRunner.query(`ALTER TABLE \`meta_addresses\` ADD \`scanPublic\` varchar(64) NOT NULL`);
    }

}
