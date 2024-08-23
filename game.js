document.addEventListener('DOMContentLoaded', function(){
    //dom elements
    const main = document.querySelector('main');
    const name = document.querySelector('#name');
    const score = document.querySelector('#score');
    const coin = document.querySelector('#coin');
    const energyDom = document.querySelector('#energy');
    const timerDom = document.querySelector('#timer');
    const canvas = document.querySelector('#canvas');
    const ctx = canvas.getContext('2d');
    const buildingTools = document.querySelectorAll('.building-tool');
    const btnSpeed = document.querySelector('#btn-speed');


    //onload
    loadName();
    //game classes
    class Map{
        static cellSize = 30;
        static colCount = 25;
        static rowCount = 20;
        constructor() {
            //start from top left
            this.image = new Image();
            this.image.src = './assets/other/medievalTile_57.png'; // Changed image source
            //have to wait for the image to load up first or else nothing will be drawn
            // very important!!!
            this.image.onload = () => {
                // Ensure the image is loaded before drawing
                this.draw();
            };
        }
        draw(){
            for(let i = 0; i < Map.colCount; i++){
                //draw row cells
                for(let j = 0; j < Map.rowCount; j++){
                    //draw column cells
                    ctx.drawImage(this.image, i * Map.cellSize ,j * Map.cellSize , Map.cellSize - 1, Map.cellSize - 1);
                }
            }
        }
    }
    class Timer{
        constructor(){
            this.second = 10;//in the beginning there's 10 seconds prep time
            this.interval = null;
        }
        startTimer(){
            // use arrow function because this will refer to the global scope
            this.interval = setInterval(()=>{this.updateTimer()}, 1000);//update the timer every seconds
        }
        updateTimer(){
            if(gameHasEnded){
                clearInterval(this.interval);
                return;
            }
            if(!gameHasStarted && this.second > 0){
                this.second--;
                //update the value in the dom
                timerDom.innerHTML = this.second;
                return;
            }else{
                startGame();
            }
            this.second += gameSpeed;
            //update the value in the dom
            timerDom.innerHTML = this.second;
        }
        stopTimer(){
            clearInterval(this.interval);//stop the timer
        }
    }
    //class for castles
    class Castle{
      constructor(type = 'wood', x , y){
          this.x = x;
          this.y = y;
          this.type = type;
          this.image = new Image();
          this.image.src = this.type === 'wood' ? './assets/castle/wood-castle.png':
              './assets/castle/stone-castle.png';
          //have to wait for the image to load up first or else nothing will be drawn
          this.image.onload = () => {
              this.draw();
          };
          this.generateResourcesInterval = null;
          this.hp = this.type === 'wood' ? 60 : 120;
          this.currentHp = this.hp;
          this.energy = this.type === 'wood' ? 5 : 10;
          this.costs = this.type === 'wood' ? {energy: 50} : {energy: 100, coin: 100};
          this.deductCost();
      }
      draw(){
          if(this.x === null || this.y === null)return;
          // Ensure the image is loaded before drawing
          ctx.drawImage(this.image,this.x,this.y, Map.cellSize, Map.cellSize);
          //draw the health point on top of the castle
          ctx.beginPath();
          //draw the background of depleted hp
          ctx.fillStyle = "#252525";
          ctx.fillRect(this.x + 2 , this.y - 7 , Map.cellSize - 5,5);
          //draw current hp bar in red
          ctx.fillStyle = "red";
          ctx.fillRect(this.x + 2, this.y - 7 , (this.currentHp/ this.hp * Map.cellSize) - 5,5);
          ctx.closePath();

          //start generating resources in every sec
          if(this.generateResourcesInterval)return;
          this.generateResourcesInterval = setInterval(()=>{
            this.generateResources();
          },1000 * gameSpeed);
      }
      generateResources(){
          if(gameHasEnded){
              clearInterval(this.generateResourcesInterval);
              return;
          }
          energy += (this.energy * gameSpeed);
      }
    deductCost(){
        if(!gameHasStarted)return;//the first castle is free of charge
        for(let o of Object.keys(this.costs)){
            switch(o){
                case 'coin':
                    coins -= this.costs[o];break;
                case 'energy':
                    energy -= this.costs[o];break;
                default:break;
            }
        }
    }
    upgrade(){

          //upgrade wood castle to stone castle
          this.type = 'stone';
            this.image = new Image();
            this.image.src = './assets/castle/stone-castle.png';
            //have to wait for the image to load up first or else nothing will be drawn
            this.image.onload = () => {
                this.draw();
            };
            this.hp = 120;
            this.currentHp = this.hp;
            this.energy =  10;
            this.costs =  {energy: 100, coin: 100};
            //deduct cost
            this.deductCost();
    }
    destroy(){
          clearInterval(this.generateResourcesInterval);
          castles.splice(castles.findIndex((c) => c.x === this.x && c.y === this.y) , 1);
          //check whether the last castle has been destroyed
            if(castles.length === 0){
                endGame();
            }
      }
    }
    //class for mines
    class Mine{
        constructor(type = 'silver', x , y){
            this.x = x;
            this.y = y;
            this.type = type;
            this.image = new Image();
            this.image.src = this.type === 'silver' ? './assets/mine/silver-mine-1.png':
                './assets/mine/gold-mine-2.png';
            //have to wait for the image to load up first or else nothing will be drawn
            this.image.onload = () => {
                this.draw();
            };
            this.generateResourcesInterval = null;
            this.hp = this.type === 'silver' ? 30 : 60;
            this.currentHp = this.hp;
            this.coin = this.type === 'silver' ? 5 : 10;
            this.costs = this.type === 'silver' ? {energy: 30} : {energy: 60, coin: 60};
            this.deductCost();

        }
        draw(){
            if(this.x === null || this.y === null)return;

            // Ensure the image is loaded before drawing
            ctx.drawImage(this.image,this.x,this.y, Map.cellSize, Map.cellSize);
            //draw the health point on top of the mine
            ctx.beginPath();
            //draw the background of depleted hp
            ctx.fillStyle = "#252525";
            ctx.fillRect(this.x  + 2 , this.y - 7 , Map.cellSize - 5,5);
            //draw current hp bar in red
            ctx.fillStyle = "red";
            ctx.fillRect(this.x  + 2 , this.y - 7 , (this.currentHp/ this.hp * Map.cellSize) - 5,5);
            ctx.closePath();

            //start generating resources in every sec
            if(this.generateResourcesInterval)return;
            this.generateResourcesInterval = setInterval(()=>{
                this.generateResources();
            },1000 * gameSpeed);
        }
        generateResources(){
            if(gameHasEnded){
                clearInterval(this.generateResourcesInterval);
                return;
            }
            coins += (this.coin * gameSpeed);
        }
        deductCost(){
            if(!gameHasStarted)return;//the first castle is free of charge
            for(let o of Object.keys(this.costs)){
                switch(o){
                    case 'coin':
                        coins -= this.costs[o];break;
                    case 'energy':
                        energy -= this.costs[o];break;
                    default:break;
                }
            }
        }
        upgrade(){

            //upgrade silver mine to gold mine
            this.type = 'gold';
            this.image = new Image();
            this.image.src = './assets/mine/gold-mine-2.png';
            //have to wait for the image to load up first or else nothing will be drawn
            this.image.onload = () => {
                this.draw();
            };
            this.hp = 60;
            this.currentHp = this.hp;
            this.coin = 10;
            this.costs = {energy: 60, coin: 60};

            //deduct cost
            this.deductCost();
        }
        destroy(){
            clearInterval(this.generateResourcesInterval);
            mines.splice(mines.findIndex((m) => m.x === this.x && m.y === this.y), 1);
        }
    }
    //class for bow tower
    class Tower{
        constructor(type = 'bow', x , y){
            this.x = x;
            this.y = y;
            this.type = type;
            this.image = new Image();
            this.image.src = this.type === 'bow' ? './assets/tower/tower-2.png':
                './assets/tower/high-tower-2.png';
            //have to wait for the image to load up first or else nothing will be drawn
            this.image.onload = () => {
                this.draw();
            };
            this.generateResourcesInterval = null;
            this.hp = this.type === 'bow' ? 40 : 80;
            this.currentHp = this.hp;
            this.range = this.type === 'bow' ? 3 : 5;
            this.dmg = this.type === 'bow' ? 5 : 10;
            this.costs = this.type === 'bow' ? {coin: 30} : {energy: 60, coin: 60};

            //deduct the cost from resources
            this.deductCost();

            //arrows
            this.imageArrow1 = new Image();
            this.imageArrow1.src = 'assets/other/laserRed08.png';
            this.imageArrow2= new Image();
            this.imageArrow2.src = 'assets/other/laserRed09.png';

        }
        draw(){
            if(this.x === null || this.y === null)return;
            // Ensure the image is loaded before drawing
            ctx.drawImage(this.image,this.x,this.y, Map.cellSize, Map.cellSize);
            //draw the health point on top of the tower
            ctx.beginPath();
            //draw the background of depleted hp
            ctx.fillStyle = "#252525";
            ctx.fillRect(this.x + 2 , this.y - 7 , Map.cellSize - 5,5);
            //draw current hp bar in red
            ctx.fillStyle = "red";
            ctx.fillRect(this.x + 2, this.y - 7 , Math.max((this.currentHp/ this.hp * Map.cellSize) - 5 , 0),5);
            ctx.closePath();

            //draw the projectile arrows from the tower
            if(this.target){
                //draw the projectile on the monster
                if(range(1,2) === 1){
                    ctx.drawImage(this.imageArrow1, this.target.x , this.target.y , Map.cellSize, Map.cellSize);
                }else{
                    ctx.drawImage(this.imageArrow2, this.target.x , this.target.y , Map.cellSize, Map.cellSize);
                }
            }
            //start generating resources in every sec
            if(this.generateResourcesInterval)return;
            this.generateResourcesInterval = setInterval(()=>{
                this.generateResources();
            },1000 * gameSpeed);//detect and attack one time per second
        }
        generateResources(){//for detecting and shooting at the monster
            if(gameHasEnded){
                clearInterval(this.generateResourcesInterval);
                return;
            }
            //check whether there's monster nearby, can only detect and attack at single monster at a time
            let monsterDetected = monsters.find((m) => (m.x >= this.x -  (3 * Map.cellSize) && m.x <= this.x + (3 * Map.cellSize)) && (m.y >= this.y -  (3 * Map.cellSize) && m.y <= this.y + (3 * Map.cellSize)));

            //if detected a monster target and attack the monster
            if(monsterDetected){
                this.target = monsterDetected;
                    //if already attacking the bloody target
                    if(!this.attackInterval){
                        //1 atk per second
                        this.attackInterval = setInterval(()=>{
                            this.attack();
                        }, 1000 * gameSpeed);
                    }
                    return;
            }

        }
        attack(){
            if(this.target.currentHp > 0){
                //decrease the hp of target
                this.target.currentHp -= this.dmg;
                this.target.currentHp = Math.max(0 , this.target.currentHp);
            }else{
                //if the target is bloody dead stop attack him ma guy
                clearInterval(this.attackInterval);
                this.attackInterval = null;
                this.target.destroy();
                this.target = null;
            }
        }
        deductCost(){
            if(!gameHasStarted)return;//the first castle is free of charge
            for(let o of Object.keys(this.costs)){
                switch(o){
                    case 'coin':
                        coins -= this.costs[o];break;
                    case 'energy':
                        energy -= this.costs[o];break;
                    default:break;
                }
            }
        }
        upgrade(){
            //upgrade bow tower to long bow tower
            this.type = 'long-bow';
            this.image = new Image();
            this.image.src = './assets/tower/high-tower-2.png';
            //have to wait for the image to load up first or else nothing will be drawn
            this.image.onload = () => {
                this.draw();
            };
            this.hp =  80;
            this.currentHp = this.hp;
            this.range =  5;
            this.dmg = 10;
            this.costs =  {energy: 60, coin: 60};

        }
        destroy(){
            towers.splice(towers.findIndex((t) => t.x === this.x && t.y === this.y), 1);
            clearInterval(this.generateResourcesInterval);
        }
    }
    //class for monster
    class Monster{
        constructor(id){
            this.id = id;
            latestMonsterId += 1;
            this.image = new Image();
            this.image.src =  `./assets/monster/monster${Math.floor(Math.random() * 10) + 1}.png`;
            //spawn from outside of the game area
            this.generatePosition();
            //stats
            this.hp = 30;
            this.currentHp = 30;
            this.dmg = 10;
            this.image.onload = () => {
                this.draw();
            }
            this.attackInterval = null;
        }
        generatePosition(){
            //possible positions:  -5 col to 30 col
            this.x = range(-5, 30);
            //if x if between 0 and 25, y have to be before 0 or after 20
            if(this.x >= 0 && this.x <= 25){
                //0, y before 0 & 1, y after 20
                this.y = range(0,1) === 0 ?range(-5, -1) : range(21, 25);
            }else{
                this.y = range(-5 , 25);
            }

            this.y  *=  Map.cellSize;
            this.x  *=  Map.cellSize;
        }
        draw(){
            //draw the monster
            // console.log(this.x , this.y);
            ctx.drawImage(this.image, this.x, this.y , Map.cellSize, Map.cellSize);
            //draw the health point on top of the monster
            ctx.beginPath();
            //draw the background of depleted hp
            ctx.fillStyle = "#252525";
            ctx.fillRect(this.x + 2, this.y - 7 , Map.cellSize - 5,5);
            //draw current hp bar in red
            ctx.fillStyle = "red";
            ctx.fillRect(this.x + 2, this.y - 7 , (this.currentHp/ this.hp * Map.cellSize) - 5,5);
            ctx.closePath();
        }

        update(){
            //if reach a target
            if(this.reachTargetY && this.reachTargetX){
                //if already attacking the bloody target
                if(!this.attackInterval){
                    //1 atk per second
                    this.attackInterval = setInterval(()=>{
                        this.attack();
                    }, 1000 * gameSpeed);
                }

                return;
            }

            //check for nearby buildings 3 cells centered around the monster
            let nearbyCastle = castles.find(c => (c.x >= this.x -  (3*Map.cellSize) && c.x <= this.x + (3*Map.cellSize)) && (c.y >= this.y - (3*Map.cellSize) && c.y <= this.y + (3*Map.cellSize)) );
            if(nearbyCastle){
                //move towards the nearby castle
                this.target = nearbyCastle;
                if(this.x < (nearbyCastle.x - Map.cellSize)){
                    //move rightwards
                    this.x += gameSpeed * 0.0625;
                }else if(this.x > (nearbyCastle.x + Map.cellSize)){
                    //move leftwards
                    this.x -= gameSpeed * 0.0625;
                }else{
                    this.reachTargetX = true;
                }

                if(this.y < (nearbyCastle.y - Map.cellSize)){
                    //move downwards
                    this.y += gameSpeed * 0.05;
                }else if(this.y > (nearbyCastle.y + Map.cellSize)){
                    //move upwards
                    this.y -= gameSpeed * 0.05;
                }else{
                    this.reachTargetY = true;
                }

                return;
            }

            let nearbyMines = mines.find(m => (m.x >= this.x -  (3*Map.cellSize) && m.x <= this.x + (3*Map.cellSize)) && (m.y >= this.y - (3*Map.cellSize) && m.y <= this.y + (3*Map.cellSize)) );
            if(nearbyMines){
                //move towards the nearby castle
                this.target = nearbyMines;
                if(this.x < (nearbyMines.x - Map.cellSize)){
                    //move rightwards
                    this.x += gameSpeed * 0.0625;
                }else if(this.x > (nearbyMines.x + Map.cellSize)){
                    //move leftwards
                    this.x -= gameSpeed * 0.0625;
                }else{
                    this.reachTargetX = true;
                }

                if(this.y < (nearbyMines.y - Map.cellSize)){
                    //move downwards
                    this.y += gameSpeed * 0.05;
                }else if(this.y > (nearbyMines.y + Map.cellSize)){
                    //move upwards
                    this.y -= gameSpeed * 0.05;
                }else{
                    this.reachTargetY = true;
                }

                return;
            }

            let nearbyTowers = towers.find(t => (t.x >= this.x -  (3*Map.cellSize) && t.x <= this.x + (3*Map.cellSize)) && (t.y >= this.y - (3*Map.cellSize) && t.y <= this.y + (3*Map.cellSize)) );
            if(nearbyTowers){
                //move towards the nearby castle
                this.target = nearbyTowers;
                if(this.x < (nearbyTowers.x - Map.cellSize)){
                    //move rightwards
                    this.x += gameSpeed * 0.0625;
                }else if(this.x > (nearbyTowers.x + Map.cellSize)){
                    //move leftwards
                    this.x -= gameSpeed * 0.0625;
                }else{
                    this.reachTargetX = true;
                }

                if(this.y < (nearbyTowers.y - Map.cellSize)){
                    //move downwards
                    this.y += gameSpeed * 0.05;
                }else if(this.y > (nearbyTowers.y + Map.cellSize)){
                    //move upwards
                    this.y -= gameSpeed * 0.05;
                }else{
                    this.reachTargetY = true;
                }
                return;
            }

            //else move towards the center castle
            if(this.x <= (Math.floor(Map.colCount / 2) * Map.cellSize)){
                //move rightwards
                this.x += gameSpeed * 0.0625;
            }else{
                //move leftwards
                this.x -= gameSpeed * 0.0625;
            }

            if(this.y <= (Math.floor(Map.rowCount / 2) * Map.cellSize)){
                //move downwards
                this.y += gameSpeed * 0.05;
            }else{
                //move upwards
                this.y -= gameSpeed * 0.05;
            }
        }
        attack(){
            if(this.target.currentHp > 0){
                this.target.currentHp -= this.dmg;
            }else{
                //stop attacking
                clearInterval(this.attackInterval);
                this.attackInterval = null;
                //destroy the target
                this.target.destroy();
                //remove the target
                this.target = null;
                this.reachTargetX = false;
                this.reachTargetY = false;
            }
        }
        destroy(){
            monsters.splice(monsters.findIndex((m) => m.x === this.x && m.y === this.y), 1);
            //to stop the monster from attacking building while they already fking dead
            clearInterval(this.attackInterval);
            this.attackInterval = null;
            //remove the target
            this.target = null;
            this.reachTargetX = false;
            this.reachTargetY = false;
            //add 1 to score
            scores++;
        }
    }

    //game objects
    let map = new Map();
    let timer = new Timer();
    let castles = [];
    let towers = [];
    let mines = [];
    let monsters = [];
    //game states
    let lastInterval = 0;
    let fps = 60;
    //building tool drag states
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;

    var gameSpeed = 1;
    var latestMonsterId = 1;
    var gameHasStarted = false;
    var gameHasEnded = false;
    var scores = 0;
    var coins = 0;
    var energy = 0;
    var spawnMonsterInterval = null;
    var spawnMonsterSeconds = 5000;//spawn new monsters every 5 sec
    //initiliaze
    requestAnimationFrame(gameLoop);
    timer.startTimer();
    //automatically placed in the center of the game map at the start of the game.
    castles.push(new Castle('wood',
        (Math.floor(Map.colCount / 2) * Map.cellSize),  // x coordinate
        (Math.floor(Map.rowCount / 2) * Map.cellSize)   // y coordinate
    ));
    //global functions
    function loadName(){
        name.innerHTML = localStorage.getItem('name');
    }
    function addGlobalEventListener(selector, eventType, callback, parentElement = document){
        parentElement.querySelector(selector).addEventListener(eventType, callback);
    }
    function updateStats(){
        score.innerHTML = scores;
        energyDom.innerHTML = energy;
        coin.innerHTML = coins;
    }
    function startGame(){
        if(gameHasStarted)return;

        gameHasStarted = true;
        //spawn a monster
        // monsters.push(new Monster(latestMonsterId));
        //spawn monster 1-4  randomly througout the game
        spawnMonsterInterval = setInterval(()=>{
            let random = range(0, 100);//get random probability
            //if get above 70% spawn monsters randomly
            if(random > 70){
                let newMonstersCount = range(1, 4) * (Math.max(Math.floor(timer.second / 10) , 1));//number of monsters increase over time => every 10 seconds

                for(let i = 0; i < newMonstersCount; i++){
                    monsters.push(new Monster(latestMonsterId));
                }
            }

        }, spawnMonsterSeconds * gameSpeed);

    }
    //generate a random number between start to end
    function range(start,end){
        return Math.floor(Math.random()* (end - start + 1)) + start;
    }

    function endGame(){
        //remove the monster spawn interval
        clearInterval(spawnMonsterInterval);
        gameHasEnded = true;
        //store the score,time in the localStorage
        let ranks = JSON.parse(localStorage.getItem('ranks'))||[];
        let name = localStorage.getItem('name');
        ranks.push({
            name: name,
            score: scores,
            time: timer.second,
        });
        localStorage.setItem('ranks', JSON.stringify(ranks));
        //redirect to rank page
        window.location.href = "rank.html";
    }
    function gameLoop(t){
        if(gameHasEnded)return;
        let diff = t - lastInterval;
        if(Math.floor(diff) >= fps/1000){//update the frame 60 times per second
            //clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            //draw the map
            map.draw();

            //draw the castles
            for(let c of castles){
                c.draw();
            }
            //draw the mines
            for(let m of mines){
                m.draw();
            }
            //draw the monsters
            for(let m of monsters){
                m.update();
                m.draw();
            }
            //draw the towers
            for(let t of towers){
                t.draw();
            }
            //call game loop
            requestAnimationFrame(gameLoop);
            lastInterval = t;

            //update stats
            updateStats();
        }

    }

    function dragStart(e) {
        //data transfer
        let data = {
            src: e.target.src,
            type: e.target.getAttribute('id'),
        }
        lastX = e.clientX;
        lastY = e.clientY;
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        //add other drag event to the target tool
        e.target.addEventListener('dragend', dragEnd);
    }
    function dragEnd(e){
        lastX = 0;
        lastY = 0;
    }
    function dragOver(e){
        e.preventDefault();
    }
    function drop(e){
        let dataTransfer  = JSON.parse(e.dataTransfer.getData('application/json'));
        //if the target is on wood castle upgrade the wood castle to stone castle
        let upgradeCastle = castles.find( (c) => ((e.offsetX >= c.x && e.offsetX <= c.x + Map.cellSize) && (e.offsetY >= c.y && e.offsetY <= c.y + Map.cellSize) ) && c.type==='wood');
        if(upgradeCastle){
            if(energy  >= 100 && coins >= 100){
                upgradeCastle.upgrade();
                return;
            }
            //else not enough resources
            alert("Not enough energy or coin!!!");
            return
        }
        //if the target is on silver mine upgrade the silver mine to gold mine
        let silverMine = mines.find( (m) => ((e.offsetX >= m.x && e.offsetX <= m.x + Map.cellSize) && (e.offsetY >= m.y && e.offsetY <= m.y + Map.cellSize) )&& m.type==='silver');
        if(silverMine){
            //check for resources for creating a gold mine
            if(energy >= 60 && coins >= 60){
                silverMine.upgrade();
                return;
            }
            //else not enough resources
            alert("Not enough energy or coin!!!");
            return;
        }

        //if the target is on bow tower upgrade the bow tower to long bow tower
        let bowTower = towers.find( (t) => ((e.offsetX >= t.x && e.offsetX <= t.x + Map.cellSize) && (e.offsetY >= t.y && e.offsetY <= t.y + Map.cellSize) )&& t.type==='bow');
        if(bowTower){
            //check for resources for creating a gold mine
            if(energy >= 60 && coins >= 60){
                bowTower.upgrade();
                return;
            }
            //else not enough resources
            alert("Not enough energy or coin!!!");
            return;
        }

        //if the target is an empty cell and IN(wood castle, silver mine or bow tower )
        if(castles.some( (c) => (e.offsetX >= c.x && e.offsetX <= c.x + Map.cellSize) && (e.offsetY >= c.y && e.offsetY <= c.y + Map.cellSize) || towers.some( (t) => (e.offsetX >= t.x && e.offsetX <= t.x + Map.cellSize) && (e.offsetY >= t.y && e.offsetY <= t.y + Map.cellSize) ))|| mines.some( (m) => (e.offsetX >= m.x && e.offsetX <= m.x + Map.cellSize) && (e.offsetY >= m.y && e.offsetY <= m.y + Map.cellSize))){
            alert('Place on empty cells only!!!');
            return;
        }
        //instantiate different type of game objects
        switch(dataTransfer.type){
            case 'tool-wood-castle' :
                //check for resources for creating a wood castle
                if(energy >= 50){
                    castles.push(new Castle('wood' ,getDropCoordinate(e.offsetX ), getDropCoordinate(e.offsetY )));
                    break;
                }
                //else not enough resources
                alert("Not enough energy!!!");
                break;

            case 'tool-silver-mine':
                if(energy >= 30){
                    mines.push(new Mine('silver' ,getDropCoordinate(e.offsetX ), getDropCoordinate(e.offsetY )));
                    break;
                }
                //else not enough resources
                alert("Not enough energy!!!");
                break;


            case 'tool-bow-tower':
                if(coins  >= 30){
                    towers.push(new Tower('bow' ,getDropCoordinate(e.offsetX ), getDropCoordinate(e.offsetY )));
                    break;
                }
                //else not enough resources
                alert("Not enough coin!!!");
                break;

            default:break;
        }

    }
    function getDropCoordinate(value){
       //check whether the value is perfectly divisible by 30
        if(value > 0 && value % 30 === 0){
            return value;
        }
        //if smaller than zero return 0
        if(value <= 30){
            return 0;
        }
        //else check the closest left
        return value - (value % 30);
    }

    function changeGameSpeed(){
        gameSpeed = gameSpeed === 1 ? 2 : 1;
        btnSpeed.textContent = `Speed x ${gameSpeed === 1 ? 2 : 1}`;
    }
    //event listeners
    buildingTools.forEach(function(e, index) {
        //have to use :scope the specify the child of the parent or else will get error without the :scope
        addGlobalEventListener(':scope > img', 'dragstart', dragStart, e);
    });
    addGlobalEventListener('#canvas', 'dragover', dragOver );
    addGlobalEventListener('#canvas', 'drop', drop );
    addGlobalEventListener('#btn-speed', 'click', changeGameSpeed);
});