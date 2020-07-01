require('dotenv/config')
const { Telegraf } = require('telegraf')
const rateLimit = require('telegraf-ratelimit')


const bot = new Telegraf(process.env.token)

let userCommon = require("./users.js")
let check = require("./checkFunctions.js")
// Set limit to 20 message per 1 seconds
const limitConfig = {
    window: 1000,
    limit: 20,
    onLimitExceeded: (ctx, next) => ctx.reply('ANTISPAM - Rate limit exceeded, try again later')
}
bot.use(rateLimit(limitConfig))



bot.command('help', (ctx) => {
    ctx.replyWithMarkdown('<b>List of commands</b>\n<b>1.</b> /help\n <b>2.</b> /tip [positive-amount-of-tokens] <i>(You must reply to an user in order to use this command)</i>\n <b>3.</b> /balance <i>It allows to check your balance if you are registered</i>\n <b>4.</b> /register <i>In order to create a wallet </i>\n <b>5. </b>/rain [number_of_users] [number_of_tokens] <i>Make it rain!!! </i> \n <b>6. </b>/updateusername <i>Run this command after setting up a telegram alias to update your profile and be able to use/receive tips and rains</i>', { parse_mode: 'HTML' }).catch(err => {
        console.log(err)
    })
})


bot.command('register', (ctx) => {
    let myId = ctx.update.message.from.id
    let myUsername = ctx.update.message.from.username
    userCommon.registerUser(myId, myUsername).then(res => {
        if (res) {
            ctx.reply("Welcome to Xtake.cash, your are now an xtaker!! 💲💲")
        } else {
            ctx.reply("OOps😦!! There was an error registering the user. Maybe your user already exists 🤔? Check /balance")
        }
    })
})

bot.command('balance', (ctx) => {
    let myId = ctx.update.message.from.id
    userCommon.userExists(myId).then(res => {
        if (res) {
            userCommon.getUserBalance(myId).then(res => {
                if (res == false) {
                    ctx.reply("You are not registered")
                } else {
                    ctx.reply("Your balance is: " + res.balance + " $COIN 🤑🤑")
                }
            })
        } else {
            ctx.reply("OOps!! You must sign-up, to use this command. Run /register to become an xtaker 🤑!")
        }
    })

})

bot.command('tip', (ctx) => {
    let myId = ctx.update.message.from.id
    let repliedId = ""
    let exists = false;

    if (ctx.message.reply_to_message != undefined) {
        repliedId = ctx.message.reply_to_message.from.id;
        exists = true;
    } else {
        ctx.reply("Oops😅!! There was an error. You must reply to someone with the /tip command to use this feature 😄.")
    }


    if (repliedId != undefined && exists == true) {
        let message = ctx.message.text.toString()
        message = message.split(" ") //message[1] is the arg

        //checks if the tip is numeric
        if (check.isNumeric(message[1])) {
            userCommon.userHasEnoughtBalance(myId, message[1]).then(res => {
                if (res) {
                    userCommon.userExists(repliedId).then(res => {
                        if (ctx.message.reply_to_message.from.username == undefined) {
                            ctx.reply("⛔️ The user must have a telegram alias in order to be tiped and receive rains. Tell him to run /updateusername once he has setup an alias")
                        } else {
                            if (res) {
                                userCommon.addBalance(repliedId, message[1]).then(res => {
                                    userCommon.substractBalance(myId, message[1]).then(res => {
                                        ctx.reply("@" + ctx.message.reply_to_message.from.username + " has been tiped: " + message[1] + " $COIN 🤑")
                                    }).catch(err => {
                                        ctx.reply("Error in the operation 😨")
                                    })
                                }).catch(err => {
                                    ctx.reply("Error in the operation 😨")
                                })
                            } else {
                                ctx.reply("The other user is not registered, creating account... 😄")
                                userCommon.registerUser(repliedId, ctx.message.reply_to_message.from.username).then(res => {
                                    if (res) {
                                        userCommon.addBalance(repliedId, message[1]).then(res => {
                                            userCommon.substractBalance(myId, message[1]).then(res => {
                                                ctx.reply("@" + ctx.message.reply_to_message.from.username + " has been tiped: " + message[1] + " $COIN 🤑")
                                            }).catch(err => {
                                                ctx.reply("Error in the operation 😨")
                                            })
                                        }).catch(err => {
                                            ctx.reply("Error in the operation 😨")
                                        })
                                    } else {
                                        ctx.reply("Error in the operation 😨")
                                    }
                                }).catch(err => {
                                    ctx.reply("Error in the operation 😨")
                                })
                            }
                        }
                    })
                } else {
                    ctx.reply("You dont enought balance for this tip 😕")
                }
            })
        } else {
            //it also evaluates there for negative value
            ctx.reply("Non numeric tip ⛔️, the tip must be /tip {positive_number}")
        }
    }

})



bot.command('rain', async (ctx) => {
    //check if an user has a member rank in the group
    let chatid = ctx.message.chat.id
    let myId = ctx.update.message.from.id
    let message = ctx.message.text.toString()
    message = message.split(" ")
    let numberOfUsers = message[1]
    let tipAmount = message[2]
    let totalAmountToTip = numberOfUsers * tipAmount

    if (tipAmount != undefined && numberOfUsers != undefined) {
        if (tipAmount == 0 || numberOfUsers == 0) {
            ctx.reply("Users or Balances can't be 0 ⛔️!!")
        } else {
            if (Number(numberOfUsers) > 10) {
                ctx.reply("You cant rain for more than 10 users ⛔️!!")
            } else {
                userCommon.userHasEnoughtBalance(myId, totalAmountToTip).then(res => {
                    if (res) {
                        userCommon.returnMembers(chatid, userCommon.checkIfMember(ctx), numberOfUsers).then(res => {
                            if (res[0] == false) {
                                ctx.reply("⛔️⛔️ There are only " + res[1] + " users in the system.")
                            } else if (res[0] == true) {
                                let tipedUsers = []
                                var userArray = res[1]

                                for (let i = 0; i < userArray.length; i++) {
                                    userCommon.addBalance(userArray[i][0], tipAmount)
                                    tipedUsers.push(userArray[i][1])
                                }

                                let composedString = []
                                for (let i in tipedUsers) {
                                    composedString.push("@" + tipedUsers[i])
                                }

                                userCommon.substractBalance(myId, totalAmountToTip).then(res => {
                                    ctx.reply("Tiping users: " + numberOfUsers + ". Amount: " + tipAmount + " COIN with a total value of: " + totalAmountToTip + " 🤑🤑")
                                    ctx.reply("Users: " + composedString.join() + " have been tiped")
                                })
                            }
                        })
                    } else {
                        if (totalAmountToTip == NaN) {
                            totalAmountToTip = 0
                        }
                        ctx.reply("You dont have enought balance to rain: " + totalAmountToTip + " COIN 😕")
                    }
                })
            }
        }
    } else {
        ctx.reply("⛔️!! The command must have the format:  /rain [number_of_users] [number_of_tokens]")
    }
})

bot.command('updateusername', (ctx) => {
    let myId = ctx.update.message.from.id
    let myUsername = ctx.update.message.from.username;
    if(myUsername != undefined){
        userCommon.updateNickName(myId, myUsername).then(res =>{
            if(res){
                ctx.reply("Username updated 🤙")
            }else{
                ctx.reply("Error updating the username 😕")
            }
        })
    }else{
        ctx.reply("⛔️⛔️ You have to setup a telegram alias!!")
    }
    
})

bot.launch()