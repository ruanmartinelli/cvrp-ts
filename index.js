const _ = require('lodash');
const parser = require('./src/tsplib-parser');

parser.tsplib(process.argv.slice(2), (res) => {
    console.log(res[0]);
    // tabu(res[0]);
});

const tabu_list_size = 7;
const max_iter = 100;
let tabu_list = [];

function tabu(problem){
    let iter = 0;
    let V = _.map(problem.ncs, node => {
        // console.log(node);
        return {
            n: node.n,
            x: node.x,
            y: node.y,
            v: problem.ds[node.n]
        }
    })

    console.log(V);


    while(iter < max_iter){
        // console.log("Iter[", iter,"]");


        iter++;
    }
}
