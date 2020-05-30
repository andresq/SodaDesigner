/*
=-=-=-=-=-=-=-=-=-=-=-=-
Soda Designer
=-=-=-=-=-=-=-=-=-=-=-=-
Student ID: 23587271
Comment (Required):

=-=-=-=-=-=-=-=-=-=-=-=-
*/
const http = require("http");
const Jimp = require("jimp");
const fs = require("fs");
const url = require("url");

const port = 3000;
const server = http.createServer();


// Loading into memory (compared to reading form disk in A4)
const can = {
    lid: { path: "assets/can/can-lid.png" },
    body: { path: "assets/can/can-body.png" },
    label: { path: "assets/can/can-label.png" }
};
const flavors = [
    { id: "apple", path: "assets/flavor/apple.png", x: 120, y: 265 },
    { id: "banana", path: "assets/flavor/banana.png", x: 80, y: 285 },
    { id: "cherry", path: "assets/flavor/cherry.png", x: 100, y: 250 },
    { id: "coconut", path: "assets/flavor/coconut.png", x: 110, y: 270 },
    { id: "crab", path: "assets/flavor/crab.png", x: 83, y: 305 },
    { id: "grape", path: "assets/flavor/grape.png", x: 93, y: 268 },
    { id: "mango", path: "assets/flavor/mango.png", x: 100, y: 295 },
    { id: "orange", path: "assets/flavor/orange.png", x: 90, y: 265 },
    { id: "watermelon", path: "assets/flavor/watermelon.png", x: 75, y: 280 }
];



const hexToRgb = function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return (
        result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            }
            : { r: 255, g: 255, b: 255 }
    );
};


const create_can = function(can, color, flavor, filename, res){
    let new_can = can.body.resource.clone();
    let colored_can = new_can.color([
        {apply: "red", params: [color.r]},
        {apply: "green", params: [color.g]},
        {apply: "blue", params: [color.b]}
    ]);

    // Lid and Colored Can
    let Lid_Can = can.lid.resource.blit(colored_can, 0, 0);
    let Lid_Can_Label = Lid_Can.blit(can.label.resource, 40, 210);
    let Flavor_Can = Lid_Can_Label.blit(flavor.resource, flavor.x, flavor.y);

    // Makes files, and AFTER its done writing then it will deliver a res back with image just created
    Flavor_Can.write(filename, () => deliver_can(filename, res));
}

const deliver_can = function(filename, res){
    console.log("**** Can Delivery! ****");
    let image = fs.createReadStream(filename);
    res.writeHead(200, {'Content-Type':'image/png'});
    image.pipe(res);
}

const open_asset = function () {
    let numOfFiles = flavors.length + 3;
    let counter = 0;
    // Loading can (its 3 parts) into JIMP and add JIMP_resource as a property to each can part
    for (let part in can) {
        Jimp.read(can[part].path, (err, image) => {
            if (err) {
                throw err;
            }
            counter++;
            can[part].resource = image;
            if (counter === numOfFiles) {
                // console.log(can);
                // console.log(flavors);
                start_server();
            }
        });
    }
    // Loading flavors into JIMP and add JIMP_resource as a property to each flavor
    for (let flavor in flavors) {
        Jimp.read(flavors[flavor].path, (err, image) => {
            if (err) { throw err; }
            counter++;
            flavors[flavor].resource = image;
            if (counter === numOfFiles) {
                // console.log(flavors);
                // console.log(can);
                start_server();
            }
        });
    }
}
// Server functions
const listening_handler = function () {
    console.log(`Now listening on Port ${port}`);
}

const connection_handler = function (req, res) {
    console.log(`Connection request from ${req.url} from ${req.socket.remoteAddress}`);
    // Root
    if (req.url === '/') {
        const form = fs.createReadStream('html/form.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        form.pipe(res);
        // Note: No need for res.end() because pipe() does this automatically
    } else if (req.url === '/image-credits.txt') {
        const credits = fs.createReadStream('assets/image-credits.txt');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        credits.pipe(res);
    } else if (req.url.startsWith('/design')) {
        const user_input = url.parse(req.url, true).query; // user_input is an object (color AS hex & flavor)
        user_input.color = hexToRgb(user_input.color); // user_input.color is now an object with 3 properties (r,g,b)

        let i = flavors.findIndex(flavor => flavor.id === user_input.flavor); // returns the FIRST index with the id === input
        if (i === -1) { // not found, (which is possible if the user doesnt use the form and goes straigt to the URL and makes query there)
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h2 style="text-align: center;"> 404 Not Found </h2>');
            res.end();
        } else {
            // Go forward with creating/delivering can
            let color = user_input.color; // makes the filename the same given in specs
            // Else replace color.X   with   user_input.color.X
            let filename = `./tmp/${flavors[i].id}-${color.r}-${color.g}-${color.b}.png`;

            // ***** CACHE *****
            // If filename exist, then just deliver the image 
            // ELSE create(then deliver)
            if(fs.existsSync(filename)){
                console.log('\n**** File Exists - Using Cache ****')
                deliver_can(filename, res);
            } else {
                console.log('\n**** File DNE - Creating Can ****')
                create_can(can, color, flavors[i], filename, res);
            }
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write('<h2 style="text-align: center;"> 404 Not Found </h2>');
        res.end();
    }
}

const start_server = function (can, flavors) {
    server.listen(port);
    server.on('listening', listening_handler); // Says what port server is listening to
    server.on('request', connection_handler);
}

open_asset();
