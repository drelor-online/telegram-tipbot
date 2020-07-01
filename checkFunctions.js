//checks if the value is a positive number
function isNumeric(value) {
    return /^\d+$/.test(value);
}

module.exports= {
    isNumeric
}