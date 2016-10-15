const _     = require('lodash');
const fs    = require('fs');
const chalk = require('chalk');
const readline = require('readline');

const err   = chalk.red.bold;
const info  = chalk.blue.bold;

module.exports = {
    tsplib: function(args, callback){
        let t = [];

        args
            .map((filename) => { console.log(info("- " + filename)); return filename; })
            .map((filename) => fs.createReadStream(__dirname + "/../" + filename))
            .forEach((stream) => {
                getContent(stream, (result) => {
                    t.push(result);
                    if(t.length === args.length) callback(t);
                })
            })
    }
}

function getContent(stream, cb){
    const rl = readline.createInterface({
        input: stream
    });

    let DS      = [];
    let NCS     = [];
    let inDS    = false;
    let inNCS   = false;
    let isEOF   = false;

    let name            = '';
    let type            = '';
    let comment         = '';
    let capacity        = '';
    let dimension       = '';
    let edgeWeightType  = '';

    let dsLine = undefined;
    let ncsLine = undefined;

    rl.on('line', (line) => {
        if(line[0] === ' ') line = line.slice(1, line.length)

        const isName        = _.includes(line, 'NAME : ');
        const isType        = _.includes(line, 'TYPE : ');
        const isComment     = _.includes(line, 'COMMENT : ');
        const isCapacity    = _.includes(line, 'CAPACITY : ');
        const isDimension   = _.includes(line, 'DIMENSION : ');
        const isEdgeWeightType   = _.includes(line, 'EDGE_WEIGHT_TYPE : ')
        const isEOF   = _.includes(line, 'EOF')

        const isNodeCoordSection =  _.includes(line, 'NODE_COORD_SECTION');
        const isDemandSection =     _.includes(line, 'DEMAND_SECTION')
        const isDepotSection =     _.includes(line, 'DEPOT_SECTION')

        if(isName)      name        = _.replace(line, 'NAME : ', '');
        if(isType)      type        = _.replace(line, 'TYPE : ', '');
        if(isComment)   comment     = _.replace(line, 'COMMENT : ', '');
        if(isCapacity)  capacity    = _.replace(line, 'CAPACITY : ', '');
        if(isDimension) dimension   = _.replace(line, 'DIMENSION : ', '');
        if(isEdgeWeightType) edgeWeightType = _.replace(line, 'EDGE_WEIGHT_TYPE : ', '');

        if(isNodeCoordSection) ncsLine = 0;
        if(isDemandSection) dsLine = 0;

        if(ncsLine < dimension && !isNodeCoordSection){
            let coord = _.split(line, ' ');

            NCS.push({ n: coord[0], x: coord[1], y: coord[2], v: 0})
            ncsLine++;
        }
        if(dsLine < dimension && !isDemandSection){
            let depot = _.split(line, ' ');
            let matchingIndex = _.toInteger(depot[0]) -1;

            NCS[matchingIndex].v = depot[1];
            dsLine++;
        }
    });

    rl.on('close', () => {
        cb({
            name,
            type,
            comment,
            capacity,
            dimension,
            edgeWeightType,
            // ds: DS,
            vertices: NCS
        })

    })
}
