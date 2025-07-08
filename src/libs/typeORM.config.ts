import { join } from 'path';

import { DataSource } from 'typeorm';

import { env } from 'src/config';

const dataSource = new DataSource({
  type: 'mysql',
  url: env.database.url,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: false,
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
});

export default dataSource;
