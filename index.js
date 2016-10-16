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

    let cost_matrix = find_cost_matrix(V, graph.dimension)
    success("Cost matrix OK");

    let initial_solution = find_initial_solution(V);
    success("Initial Solution OK (" + initial_solution.iterations + " iteration(s))")

    let solution_cost = find_solution_cost(initial_solution, cost_matrix)
    debug("Initial solution cost: " + solution_cost);

    success("Tabu search finished");
}

function find_solution_cost(solution, cost_matrix){
    const routes = solution.routes;
    let costs = [];

    _.forEach(routes, (route) => {
        let route_cost = 0;
        for(var i = 0; i < route.length -1; i++){
            route_cost += cost_matrix[route[i].id -1][route[i+1].id -1]
        }
        costs.push(_.toInteger(route_cost.toFixed(2)))
    })

    const total_cost = _.reduce(costs, (sum,v) => sum += v , 0)

    return total_cost;
}

function find_initial_solution(vertices){
    const chunk_size = vertices.length / TRUCK_AMOUNT;
    let routes = [];
    let iterations = 0;
    while(true){
        iterations ++;
        routes = _.chunk(_.shuffle(vertices), chunk_size);
        let route_demands = _.map(routes, calculate_demand_from_route);
        if(_.every(route_demands, (riv) => riv < 100)) break;
    }

    return {routes, iterations}
}

function calculate_demand_from_route(route){
    let total_demand = _.reduce(route, (sum, route) => {
        return sum += _.toInteger(route.demand)
    }, 0);
    return total_demand;
}

function find_cost_matrix(vertices, dimension){
    debug("Dimension: " + dimension)

    let cost_matrix = [];

    for(var i = 0; i < vertices.length; i++){
        cost_matrix.push([])
        for(var j = 0; j < vertices.length; j++){
            let p1 = [vertices[i].x, vertices[i].y]
            let p2 = [vertices[j].x, vertices[j].y]
            const d = distance(p1, p2);

            cost_matrix[i].push(d);
        }
    }
    return cost_matrix;
}
