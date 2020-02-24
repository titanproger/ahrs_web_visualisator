// Used for convert callback style to async/await style
async function asyncCallback(cb, f) {
    if(!cb) {
        f();
        return;
    }

    try {
        cb(null, await f());
    } catch(err) {
        cb(err);
    }
}
module.exports = asyncCallback