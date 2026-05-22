1. copy .env.copy
2. remove the .copy > resulting in .env
3. adjust with the mysql
4. run `npx prisma db push` for first timer
5. future update for database MUST use migration
6. run `npm install`
7. run `npx prisma generate`
8. run `npm run start:dev`
