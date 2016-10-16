const _ = require('lodash');
const parser = require('./src/tsplib-parser');
const distance = require('euclidean-distance');
const chalk = require('chalk');
const debug = (text) => console.log(chalk.green.bold("[DEBUG] ") + chalk.blue.bold(text))
const success = (text) => console.log(chalk.green.bold("[LOG] "+ text + " ✔️"))

parser.tsplib(process.argv.slice(2), (res) => {
    // console.log(res[0]);
    tabu(res[0]);
});

const TRUCK_AMOUNT = 5;

function tabu(graph){
    const V = graph.vertices;

    let const_matrix = find_cost_matrix(V, graph.dimension)
    success("Cost matrix OK");

    let initial_solution = find_initial_solution(V);
    success("Initial Solution OK (" + initial_solution.iterations + " iteration(s))")

    success("Tabu search finished");
}

function find_initial_solution(vertices){
    const chunk_size = vertices.length / TRUCK_AMOUNT;
    let random_routes = [];
    let iterations = 0;
    while(true){
        iterations ++;
        random_routes = _.chunk(_.shuffle(vertices), chunk_size);
        let route_demands = _.map(random_routes, calculate_demand_from_route);
        if(_.every(route_demands, (riv) => riv < 100)) break;
    }

    return {random_routes, iterations}
}

function calculate_demand_from_route(route){
    let total_demand = _.reduce(route, (sum, route) => {
        return sum += _.toInteger(route.demand)
    }, 0);
    return total_demand;
}

function find_cost_matrix(vertices, dimension){
    debug("Dimension: " + dimension)

    let cost_matrix = Array(dimension).fill(Array(dimension));

    _.forEach(vertices, (row) => {
        _.forEach(vertices, (col) => {
            let d = distance([row.x, row.y], [col.x,col.y]);
            cost_matrix[row.id - 1][col.id -1] = d;
        })

    })
    return cost_matrix;
}
