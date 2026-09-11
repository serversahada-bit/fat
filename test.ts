import 'dotenv/config';
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

prisma.user.findUnique({ where: { username: 'admin' } })
  .then(u => {
    console.log('User:', u);
    if (u) {
      console.log('Password Match:', bcrypt.compareSync('admin', u.password!));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
