# telegram-tipbot
Telegram tipbot to distribute tokens.

Create a .env file in the root directory to make it work.

```
DATABASE_URL=postgredatabaseurl
token=telegramtoken
```

Available commands are:

```
/help -> in order to get information about the bot
/register -> in order to create an account
/balance -> in order to check your balance
/tip -> in order to tip an user. You must reply to a message in order to use it.
/rain -> To rain tokens
/updateusername -> To update your usename since only telegram users with an username can tip and receive rains

```

Deployment:

- Make sure that the bot is connected to a database by setting the url in the .env file.
- Make sure to setup the bot token by settings its token in the .env file.
- Run bot.js as a daemon. For example using forever.js
