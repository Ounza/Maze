const {Engine, Render, Runner, World, Bodies, Body, Events} = Matter; //Pull out Matter library objects
//Maze dimensions
const cellsHorizontal = 14; //the number of cells in the horizontal
const cellsVertical = 10; //Number of cells in vertical
const width = window.innerWidth; //whole viewable width
const height = window.innerHeight;//whole viewable height
const unitLengthX = width/cellsHorizontal;
const unitLengthY = height/cellsVertical;
const engine = Engine.create();
engine.world.gravity.y = 0; //Disable gravity
const {world} = engine; //When we create an engine we get a world object
const render = Render.create({
    element:document.body, //render the representation of world in the body
    engine: engine,
    //our canvas
    options: {
        wireframes: false, //get solid shapes instead of outlines
        width,
        height
    }
});
Render.run(render); //start working and draw in our world
Runner.run(Runner.create(), engine); //Runner coordinates changes from state A to state B

let hasWon = false;

//Walls - elements cant go past this
const walls = [
    Bodies.rectangle(width/2, 0, width, 2, { isStatic: true}),
    Bodies.rectangle(width/2, height, width, 2, { isStatic: true}),
    Bodies.rectangle(0, height/2, 2, height, { isStatic: true}),
    Bodies.rectangle(width, height/2, 2, height, { isStatic: true})
];
World.add(world, walls); //for it to show up

//Maze generation - the grid, verticals and horizontals
//Helper function to shuffle array elements
const shuffle = (arr) => {
    let counter = arr.length;
    while(counter>0){
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index]; //swap
        arr[index] = temp
    }
    return arr;
};

const grid = Array(cellsVertical)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
.fill(null)
.map(() => Array(cellsHorizontal-1).fill(false));

const horizontals = Array(cellsVertical-1)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);
console.log(startColumn);
console.log(startRow);

//Function to iterate through our maze/cells

const stepThroughCell = (row, column) => {
//If I have visited the cell at [row][column] then return
if(grid[row][column]){
    return;
}
//Mark the cell as being visited
grid[row][column]= true;
//Assemble randomly ordered list of neighbors
const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column+1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
]);

//randomize these neighbors

//For each neighbor...
for(let neighbor of neighbors){

//See if that neighbor is out of bounds
const[nextRow, nextColumn, direction] = neighbor;
if(nextRow< 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal){
    continue;
}

//If we have visited that neighbor continue to next neighbor
if(grid[nextRow][nextColumn]){
    continue;
}
//Remove a wall from either horizontals/verticals array
if(direction === 'left'){
    verticals[row][column - 1] = true; //row doesnt change
}else if (direction === 'right'){
    verticals[row][column] = true;
}else if (direction === 'up'){
    horizontals[row -1][column] = true;
}else if(direction === 'down'){
    horizontals[row][column] = true;
}

stepThroughCell(nextRow, nextColumn);
//Visit the next cell- Recursively call stepThrough

}//end for loop


};


stepThroughCell(startRow,startColumn);

//Iterate over horizontals and verticals and if false draw a wall
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2, 
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5, {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red',
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY/2,
            5,
            unitLengthY, {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red',
                }
            }
        );
        World.add(world,wall);
});
});

//Goal
const goal = Bodies.rectangle(
    width-unitLengthX/2,
    height-unitLengthY/2,
    unitLengthX * .7,
    unitLengthY * .7,
    {
        isStatic:true,
        label: 'goal',
        render: {
            fillStyle: 'green',
        }
    }
    );
World.add(world, goal);

//Ball
const ballRadius= Math.min(unitLengthX, unitLengthY)
const ball = Bodies.circle(
    unitLengthX/2,
    unitLengthY/2,
    ballRadius * .25, {
        label: 'ball',
        render: {
            fillStyle: 'blue',
        }
    }
);
World.add(world,ball);

//Keypresses - Maze navigaton
document.addEventListener('keydown', (event) => {
    const{x, y} = ball.velocity;
    console.log(x,y);
    if(event.key === 'w'){
        Body.setVelocity(ball, {x, y: y-5}); //update in upwards direction 5 units
    }
    if(event.key === 'd'){
        Body.setVelocity(ball, {x: x+5, y}); //Move to the right
    }
    if(event.key === 's'){
        Body.setVelocity(ball, {x, y: y+5}); //Move downwards
    }
    if(event.key === 'a'){
        Body.setVelocity(ball, {x: x-5, y});
    }
});

//Win condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels= ['ball', 'goal'];
        if (
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
        ){
            hasWon = true;
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1; //turn gravity on
            world.bodies.forEach(body => {
                if(body.label === 'wall'){
                    Body.setStatic(body, false);
                }
            })
        }
        
    });
});
