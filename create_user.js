const mariadb = require('mariadb');
(async () => {
  const conn = await mariadb.createConnection({host: 'localhost', user: 'root'});
  await conn.query("CREATE USER IF NOT EXISTS 'fat_user'@'localhost' IDENTIFIED BY 'fat_pass';");
  await conn.query("GRANT ALL PRIVILEGES ON fat_system.* TO 'fat_user'@'localhost';");
  await conn.query("FLUSH PRIVILEGES;");
  console.log('User created');
  await conn.end();
})();
