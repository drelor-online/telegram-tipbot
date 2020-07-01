
const { db } = require('./database.js')
const PQ = require('pg-promise').ParameterizedQuery


//Checks if an user exists : return Boolean
function userExists(id) {
    let selectUsers = new PQ({text: 'SELECT * from users where tg_id = $1', values: [id]})
    return db.query(selectUsers).then(res => {
        if (res[0] === undefined) {
            return false
        } else if (res[0]) {
            return true;
        }
    }).catch(err => {
    })
}

//Registers an user in the database : return Boolean
function registerUser(id, username) {
    let insertUser = new PQ({text: "INSERT INTO users (tg_id, balance, username) VALUES ('$1', '100', '$2')", values: [id, username]})
    return db.query(insertUser).then(() => {
        return true
    }).catch(err => {
        return false
    })
}
//Updates the user nickname
function updateNickName(id, username) {
    let updateNick = new PQ({text: "UPDATE users set username = $1 where tg_id = $2", values: [username, id]})
    return db.query(updateNick).then(() => {
        return true;
    }).catch(err => {
        return false;
    })
}

//Checks an user balance : return String
function getUserBalance(id) {
    let selectBalance = new PQ({text: "SELECT balance from users where tg_id = $1", values: [id]})
    return db.query(selectBalance).then(res => {
        if (res[0] === undefined) {
            return false
        } else if (res[0]) {
            return res[0]
        }
    }).catch(err => {
        return false;
    })
}

//Checks if an user has enought balance : return Boolean
function userHasEnoughtBalance(id, balance) {
    let selectBalance = new PQ({text: "SELECT balance from users where tg_id = $1", values: [id]})
    return db.query(selectBalance).then(res => {
        if (Number(res[0].balance) < Number(balance)) {
            return false;
        } else {
            return true;
        }
    }).catch(err => {
        return false;
    })
}

//Adds Balance to an user : return Boolean
function addBalance(id, amount) {
    let selectBalance = new PQ({text: "SELECT balance from users where tg_id = $1", values: [id]})
    return db.query(selectBalance).then(res => {
        var newBalance = Number(res[0].balance) + Number(amount)
        let updateBalance = new PQ({text: "UPDATE users SET balance = $1 where tg_id = $2", values:[newBalance, id]})
        db.query(updateBalance).then(res => {
            return true;
        }).catch(err => {
            return false;
        })
    }).catch(err => {
        return false;
    })
}
//Substracts Balance to an user : return Boolean
function substractBalance(id, amount) {
    let selectBalance = new PQ({text: "SELECT balance from users where tg_id = $1", values: [id]})
    return db.query(selectBalance).then(res => {
        var newBalance = Number(res[0].balance) - Number(amount)
        let updateBalance = new PQ({text: "UPDATE users SET balance = $1 where tg_id = $2", values:[newBalance, id]})
        db.query(updateBalance).then(res => {
            return true;
        }).catch(err => {
            return false;
        })
    }).catch(err => {
        return false;
    })
}
//Gets a list of random users given the amount of desired users : return Arr
function getRandomUsers(numberOfUsers) {
    return db.query("SELECT count(*) from users").then(res => {
        if (Number(numberOfUsers) > Number(res[0].count)) {
            return [false, res[0].count]
        } else {
            let selectRandom = new PQ({text: 'select * from users orders by random limit $1', values:[numberOfUsers]})
            return db.query(selectRandom).then(data => {
                return [true, data];
            })
        }
    })

}
//randomize an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//checks if an user is a member of the group (requires context)
function checkIfMember(ctx) {
    return function (uid, cid) {
        return ctx.getChatMember(uid, cid).then(data => {
            if (data.status == "member") {
                return true;
            } else {
                return false;
            }
        }).catch(err => {
            console.log(err)
        })
    };
};

//return the list of users in the room that are members
function returnMembers(chatId, checkIfMember, numberOfUsers) {
    //array to be filled
    var members = []

    //Returns all the user and the number of users
    return db.query("SELECT * FROM users").then(async function (data) {
        //in the returned user list we check that each member is in the group, if it is, we push the member to an array
        for (let i in data) {
            if (members.length < numberOfUsers) {
                await checkIfMember(data[i].tg_id, chatId)
                    .then(res => {
                        if (res) {
                            //if the user has a undefined username it won't be rained
                            if (data[i].username != "undefined") {
                                members.push([data[i].tg_id, data[i].username]);
                            }
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            } else {
                break;
            }
        }
        //We randomize the array
        shuffleArray(members);
        if (numberOfUsers > members.length) {
            return [false, members.length]
        } else {
            return [true, members]
        }

    }).catch(err => {
        console.log(err)
    })
}

module.exports = {
    userExists, registerUser, getUserBalance, addBalance, substractBalance, getRandomUsers, userHasEnoughtBalance, returnMembers, checkIfMember, updateNickName
}

