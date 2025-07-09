import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1752059003418 implements MigrationInterface {
    name = 'Migrations1752059003418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`aptosPublicKey\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`aptosPublicKey\` varchar(66) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`aptosPublicKey\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`aptosPublicKey\` varchar(64) NOT NULL`);
    }

}
