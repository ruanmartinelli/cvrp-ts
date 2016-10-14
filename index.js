const parser = require('./src/tsp-parser');

parser.tsplib(process.argv.slice(2), (res) => {
    console.log(res[0]);
});
