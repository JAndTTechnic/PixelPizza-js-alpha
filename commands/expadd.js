module.exports = {
    name: "expadd",
    description: "add exp to yourself or another user",
    args: true,
    minArgs: 1,
    maxArgs: 2,
    aliases: ["addexp"],
    usage: "<amount> [user]",
    userLevel: 3,
    execute(message, args, client){
        if (isNaN(parseInt(args[0])) || parseInt(args[0]) < 1) return message.delete();
        let user = message.author;
        if (args.length > 1){
            if (isNaN(parseInt(args[1]))) return message.delete();
            user = client.users.cache.get(args[1]);
        }
        require("../functions/addexp").addExp(parseInt(args[0]), user.id);
        require("../functions/checklevelroles").checkLevelRoles(user.id, client);
        message.delete();
    }
}