import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1751948620537 implements MigrationInterface {
    name = 'Migrations1751948620537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`nonces\` (\`id\` varchar(36) NOT NULL, \`value\` varchar(255) NOT NULL, \`aptosPublicKey\` varchar(255) NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` timestamp NOT NULL, UNIQUE INDEX \`IDX_f4012d075ae191c725d31e20ff\` (\`value\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f4012d075ae191c725d31e20ff\` ON \`nonces\``);
        await queryRunner.query(`DROP TABLE \`nonces\``);
    }

}
