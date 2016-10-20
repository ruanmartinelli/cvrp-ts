const _ = require('lodash');
const parser = require('./src/tsplib-parser');
const distance = require('euclidean-distance');
const chalk = require('chalk');
const debug = (text) => console.log(chalk.green.bold("[DEBUG] ") + chalk.blue.bold(text))
const success = (text) => console.log(chalk.green.bold("[LOG] "+ text + " ✔️"))
const equal = require('deep-equal')

parser.tsplib(process.argv.slice(2), (res) => {
    // console.log(res[0]);
    tabu(res[0]);
});

const TRUCK_AMOUNT = 5;
let CAPACITY = 0;

function tabu(graph){
    const V = graph.vertices;
    const max_iterations = 100;

    CAPACITY = graph.capacity;

    let cost_matrix = find_cost_matrix(V, graph.dimension)
    success("Cost matrix OK");

    let initial_solution = find_initial_solution(V, {id: 1, demand:0});
    success("Initial Solution OK (" + initial_solution.iterations + " iteration(s))")

    initial_solution.cost = find_solution_cost(initial_solution, cost_matrix)
    debug("Initial solution cost: " + initial_solution.cost);

    //test
    let count = 0;
    let current = _.cloneDeep(initial_solution);
    let best = _.cloneDeep(current);
    let tabu_list = [];
    let tabu_list_size = 1;

    while(count < 22000){
        let candidate = _.cloneDeep(current);

        // rsh = route swap helper
        let rsh = random_routes(candidate.routes);

        let route2_index = _.findIndex(candidate.routes, (route) => _.isEqual(rsh.route2, route));
        let route1_index = _.findIndex(candidate.routes, (route) => _.isEqual(rsh.route1, route));

        // adds node1 to route2 right before node2
        candidate.routes[route2_index] = add_node_before(rsh.node1, rsh.node2, rsh.route2);

        // removes node1 from route1
        candidate.routes[route1_index].splice(rsh.node1_index, 1);

        // TODO: fix this, tabu list is not working properly yet
        if(!is_tabu(tabu_list, candidate.routes)){
            const cost_is_better = find_solution_cost(candidate, cost_matrix) < find_solution_cost(current, cost_matrix);
            if(cost_is_better){
                current = _.cloneDeep(candidate);

                const cost_is_best = find_solution_cost(candidate, cost_matrix) < find_solution_cost(best, cost_matrix);

                if(cost_is_best){
                    console.log("Found new best", find_solution_cost(candidate, cost_matrix));
                    best = _.cloneDeep(candidate);
                }
            }
            add_to_tabu(tabu_list, current.routes, tabu_list_size);
        }else{
            console.log("Ops, tabu found");
        }
        count++;
    }

    console.log(find_solution_cost(best, cost_matrix));
    success("Tabu search finished on "+count+ " iterations.");
}

function add_to_tabu(tabu_list, routes, tabu_list_size){
    let r = _.cloneDeep(routes)
    tabu_list.push(r);
    if(tabu_list.length > tabu_list_size){
        tabu_list.shift();
    }
}

function is_tabu(tabu_list, routes){
    _.forEach(tabu_list, forbidden_routes => {
        if(equal(routes, forbidden_routes)){
            return true;
        }
    })
    return false;
}

function add_node_before(new_node, reference_node, route){
    let index_reference = _.findIndex(route, (node) => node.id === reference_node.id)

    route.splice(index_reference - 1, 0, new_node);

    return route;
}

function random_routes(routes){
    let route1 = [];
    let route2 = [];
    let node1 = {};
    let node2 = {};
    let node1_index = 0;
    while(1){
        while(1){
            route1 = _.sample(routes);
            route2 = _.sample(routes);
            if(route1.length > 3 && (route1 != route2)) break;
        }

        node1 = _.sample(_.slice(route1, 1, route1.length - 1));
        node1_index = _.findIndex(route1, (n) => _.isEqual(n, node1));
        node2 = find_closest(node1, route2);

        if(find_route_demand(route2) + node1.demand < CAPACITY) break;
    }
    return {route1, route2, node1, node2, node1_index};
}

function find_route_demand(route){
    return _.reduce(route, (sum, node) => sum += node.demand, 0);
}

function find_closest(node, route){
    let closest = route[0];

    _.forEach(route, (n) => {
        if(node_distance(node, n) < node_distance(node, closest)){
            closest = n;
        }
    })

    return closest;
}

function node_distance(node1, node2){
    return distance([node1.x, node1.y], [node2.x, node2.y])
}

function find_solution_cost(solution, cost_matrix){
    let sum = 0;

    let routes = [];

    routes = _.flattenDeep(solution.routes);
    _.map(routes, (node, index) => {
        let current_node = routes[index]

        if(index < routes.length -1){
            let next_node = routes[index + 1]
            let cost = cost_matrix[current_node.id - 1][next_node.id - 1];
            sum += cost;
        }
    })
    return sum;
}

function find_initial_solution(vertices, depot_node){
    const chunk_size = vertices.length / TRUCK_AMOUNT;
    let routes = [];
    let iterations = 0;
    while(true){
        iterations ++;
        routes = _.chunk(_.shuffle(vertices), chunk_size);

        // adds depot node to end of every route
        _.map(routes, route => {
            route.push(depot_node);
        });

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
