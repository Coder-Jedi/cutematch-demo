import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  tileGrid : any;
  tileTypes : any;
  score = 0;
  activeTile1 : any;       //sprite object
  activeTile2 : any;       //sprite object
  canMove = false;
  tileWidth : any;
  tileHeight : any;
  tiles! : Phaser.GameObjects.Group;
  random : any;
  startPosX : any;         //column number in tileGrid for activeTile1
  startPosY : any;         //row number in tileGrid for activeTile1
  count = 0;
  count2 = 1;
  scoreLabel! : Phaser.GameObjects.Text;
  xOffset = 50;
  yOffset = 100;
  tileDropHeight = 0;

    constructor() {
      super({ key: 'main' });
    }
    preload() {
      //loading diamond assets
      this.load.image('red', 'assets/images/red-diamond.png');
      this.load.image('blue', 'assets/images/blue-diamond.png');
      this.load.image('green', 'assets/images/green-diamond.png');
      this.load.image('yellow', 'assets/images/yellow-diamond.png');
    }
    create() {
      //setting bg color
      this.cameras.main.setBackgroundColor('#34495f');

      this.tileTypes = [
        'red',
        'blue',
        'green',
        'yellow'
      ];

      //initialize score to zero
      this.score = 0;

      //Keep track of the tiles the user is trying to swap (if any)
      this.activeTile1 = null;
      this.activeTile2 = null;

      //control whether the player can make a move or not
      this.canMove = false;

      //get the width and height of the individual tiles
      this.tileWidth = this.textures.get('red').getSourceImage().width;
      this.tileHeight = this.textures.get('red').getSourceImage().height;

      //variable to hold tile sprites
      this.tiles = this.add.group();

      //initialize tile grid
      // tileGrid.length --------> limit of x
      // tileGrid[0].length -------> limit of y
      this.tileGrid = [
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null]
      ];

      //initialize X and Y offsets
      this.xOffset = (this.game.scale.width - (this.tileGrid.length*this.tileWidth))/2;

      //random data generator
      var seed = Date.now().toString();
      this.random = new Phaser.Math.RandomDataGenerator([seed]);

      //initialize tiles randomly
      this.initTiles();

      //create scoreboard
      this.createScore();

      //check if the matches are present at the start of the game itself
      //Note :: if the time delay is not added initially, then the flow breaks
      this.time.delayedCall(600, ()=>{this.checkMatch()}, [], this);

    }
    override update() {
      // console.log('update method');
      this.handleSwipe();
    }

    initTiles() {
      // Looping through each element in tileGrid
      for(var i = 0; i < this.tileGrid.length; i++){
        for(var j = 0; j < this.tileGrid[0].length; j++){
          //Add the tile to the game at this grid position
          var tile = this.addTile(i, j);
          //Keep a track of the tiles position in our tileGrid
          this.tileGrid[i][j] = tile;

        }
      }
    }

    addTile(x:any, y:any) {
      //Choose a random tile to add
      var tileToAdd = this.tileTypes[this.random.integerInRange(0, this.tileTypes.length - 1)];

      //Add the tile at the correct x position, but add it to the top of the game (so we can slide it in)
      var tile : Phaser.GameObjects.Sprite  = this.tiles.create(this.xOffset + (x * this.tileWidth) + this.tileWidth / 2, this.tileDropHeight+0, tileToAdd);

      //Animate the tile into the correct vertical position
      this.add.tween({
        targets: tile,
        y: this.yOffset + y*this.tileHeight+ (this.tileHeight/2),
        duration: 500,
        ease: Phaser.Math.Easing.Linear
      });

      //Set the tiles anchor point to the center
      // tile.anchor.setTo(0.5, 0.5);
      tile.setOrigin(0.5,0.5);

      //Enable input on the tile
      // tile.inputEnabled = true;
      tile.setInteractive();

      //Keep track of the type of tile that was added
      // tile.tileType = tileToAdd;
      tile.setData('tileType', tileToAdd);


      //Trigger the tileDown function whenever the user clicks or taps on this tile
      // tile.events.onInputDown.add(this.tileDown, this);
      tile.on('pointerdown', this.tileDown, this);

      return tile;
    }

    tileDown(tile:any, pointer:any) {
      //Keep track of where the user originally clicked
      this.count = 1;
      if(this.canMove){
        this.startPosX = Math.floor((tile.x-this.xOffset) / this.tileWidth);
        this.startPosY = Math.floor((tile.y-this.yOffset) / this.tileHeight);
        this.activeTile1 = this.tileGrid[this.startPosX][this.startPosY];
      }
    }
    tileUp() {
      //Reset the active tiles
      this.activeTile1 = null;
      this.activeTile2 = null;
    }

    handleSwipe() {
      //The user is currently dragging from a tile, so let's see if they have dragged
        //over the top of an adjacent tile
        
        if(this.activeTile1 && !this.activeTile2){
          //Get the location of where the pointer is currently
          var hoverX = this.game.input.activePointer.x;
          var hoverY = this.game.input.activePointer.y;

          //Figure out what position on the grid that translates to
          var hoverPosX = Math.floor((hoverX-this.xOffset)/this.tileWidth);
          var hoverPosY = Math.floor((hoverY-this.yOffset)/this.tileHeight);

          //See if the user had dragged over to another position on the grid
          var difX = (hoverPosX - this.startPosX);
          var difY = (hoverPosY - this.startPosY);

          if(this.count>0){
            console.log('hoverX,Y:',hoverX, hoverY );
            console.log('hoverPosX,Y:',hoverPosX, hoverPosY );
            console.log('startPosX,Y:',this.startPosX, this.startPosY );
            console.log('difX,Y:',difX, difY );
          }
          this.count--;

          //Make sure we are within the bounds of the grid
          if(!(hoverPosY > this.tileGrid[0].length - 1 || hoverPosY < 0) && !(hoverPosX > this.tileGrid.length - 1 || hoverPosX < 0)){
              //If the user has dragged an entire tiles width or height in the x or y direction
              //trigger a tile swap
              if((Math.abs(difY) == 1 && difX == 0) || (Math.abs(difX) == 1 && difY ==0)){
                  //Prevent the player from making more moves whilst checking is in progress
                  this.canMove = false;

                  //Set the second active tile (the one where the user dragged to)
                  this.activeTile2 = this.tileGrid[hoverPosX][hoverPosY];

                  //Swap the two active tiles
                  this.swapTiles();

                  //After the swap has occurred, check the grid for any matches
                  // this.game.time.events.add(500, function(){
                  //     this.checkMatch();
                  // });
                  this.time.delayedCall(500, ()=>{this.checkMatch()}, [], this);
              }
          }
      }
      if(this.count2>0 && this.activeTile2){
        console.log('activeTiles:',this.activeTile1, this.activeTile2);
        this.count2--;
      }
    }
    swapTiles() {
      //If there are two active tiles, swap their positions
      if(this.activeTile1 && this.activeTile2){
        // var tile1Pos = {x:(this.activeTile1.x - this.tileWidth / 2) / this.tileWidth, y:(this.activeTile1.y - this.tileHeight / 2) / this.tileHeight};
        // var tile2Pos = {x:(this.activeTile2.x - this.tileWidth / 2) / this.tileWidth, y:(this.activeTile2.y - this.tileHeight / 2) / this.tileHeight};
        var tile1Pos = {x: Math.floor((this.activeTile1.x-this.xOffset)/this.tileWidth), y: Math.floor((this.activeTile1.y-this.yOffset)/this.tileHeight)};
        var tile2Pos = {x: Math.floor((this.activeTile2.x-this.xOffset)/this.tileWidth), y: Math.floor((this.activeTile2.y-this.yOffset)/this.tileHeight)};

        //Swap them in our "theoretical" grid
        this.tileGrid[tile1Pos.x][tile1Pos.y] = this.activeTile2;
        this.tileGrid[tile2Pos.x][tile2Pos.y] = this.activeTile1;
        console.log('tileGrid:', this.tileGrid);
        console.log('tile1Pos:',tile1Pos);
        console.log('tile2Pos:',tile2Pos);

        //Actually move them on the screen : by swapping x and y coordinates of active tiles
        // this.game.add.tween(this.activeTile1).to({x:tile2Pos.x * this.tileWidth + (this.tileWidth/2), y:tile2Pos.y * this.tileHeight + (this.tileHeight/2)}, 200, Phaser.Easing.Linear.In, true);
        // this.game.add.tween(this.activeTile2).to({x:tile1Pos.x * this.tileWidth + (this.tileWidth/2), y:tile1Pos.y * this.tileHeight + (this.tileHeight/2)}, 200, Phaser.Easing.Linear.In, true);
        this.add.tween({
          targets: this.activeTile1,
          x: this.xOffset + (tile2Pos.x*this.tileWidth) + (this.tileWidth/2),
          y: this.yOffset + (tile2Pos.y*this.tileHeight) + (this.tileHeight/2),
          duration: 200,
          ease: Phaser.Math.Easing.Linear
        });
        this.add.tween({
          targets: this.activeTile2,
          x: this.xOffset + (tile1Pos.x*this.tileWidth) + (this.tileWidth/2),
          y: this.yOffset + (tile1Pos.y*this.tileHeight) + (this.tileHeight/2),
          duration: 200,
          ease: Phaser.Math.Easing.Linear
        });
        this.activeTile1 = this.tileGrid[tile1Pos.x][tile1Pos.y];
        this.activeTile2 = this.tileGrid[tile2Pos.x][tile2Pos.y];
    }
    }

    checkMatch() {
      //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row
        var matches = this.getMatches(this.tileGrid);
        console.log('matches:',matches);
        //If there are matches, remove them
        if(matches.length > 0){
            //Remove the tiles
            this.removeTileGroup(matches);

            //Move the tiles currently on the board into their new positions
            this.resetTiles();

            //Fill the board with new tiles wherever there is an empty spot
            this.fillTiles();
            
            //Trigger the tileUp event to reset the active tiles
            this.time.delayedCall(500, ()=>{
              this.tileUp();
            }, [], this);

            //Check again to see if the repositioning of tiles caused any new matches
            this.time.delayedCall(600, ()=>{
              this.checkMatch();
            }, [], this);

        }
        else {
            //No match so just swap the tiles back to their original position and reset
            this.swapTiles();
            // this.game.time.events.add(500, function(){
            //     this.tileUp();
            //     this.canMove = true;
            // });
            this.time.delayedCall(500, ()=>{
              this.tileUp();
              this.canMove = true;
            }, [], this);
        }
    }
    getMatches(tileGrid:Phaser.GameObjects.Sprite[][]) {
      var matches = [];
      var groups : any = [];
      //Check for vertical matches    ::: x ----> constant  y -----> changing
      for (var i = 0; i < tileGrid.length; i++)
      {
        groups = [];
        for (var j = 0; j < tileGrid[0].length; j++)
        {
          if(j < tileGrid[0].length - 2)
            if (tileGrid[i][j] && tileGrid[i][j + 1] && tileGrid[i][j + 2])
            {
              if (tileGrid[i][j].getData('tileType') == tileGrid[i][j+1].getData('tileType') && tileGrid[i][j+1].getData('tileType') == tileGrid[i][j+2].getData('tileType'))
              {
                if (groups.indexOf(tileGrid[i][j]) == -1)
                {
                  groups.push(tileGrid[i][j]);
                }
                if (groups.indexOf(tileGrid[i][j+1]) == -1)
                {
                  groups.push(tileGrid[i][j+1]);
                }
                if (groups.indexOf(tileGrid[i][j+2]) == -1)
                {
                  groups.push(tileGrid[i][j+2]);
                }
              }
            }
          }
          if(groups.length > 0) matches.push(groups);
      }

      //Check for horizontal matches    ::: y ----> constant  x -----> changing
      for (var j = 0; j < tileGrid[0].length; j++)
      {
        groups = [];
        for (var i = 0; i < tileGrid.length; i++)
        {
          if(i < tileGrid.length - 2)
            if (tileGrid[i][j] && tileGrid[i+1][j] && tileGrid[i+2][j])
            {
              if (tileGrid[i][j].getData('tileType') == tileGrid[i+1][j].getData('tileType') && tileGrid[i+1][j].getData('tileType') == tileGrid[i+2][j].getData('tileType'))
              {
                if (groups.indexOf(tileGrid[i][j]) == -1)
                {
                  groups.push(tileGrid[i][j]);
                }
                if (groups.indexOf(tileGrid[i+1][j]) == -1)
                {
                  groups.push(tileGrid[i+1][j]);
                }
                if (groups.indexOf(tileGrid[i+2][j]) == -1)
                {
                  groups.push(tileGrid[i+2][j]);
                }
              }
            }
          }
          if(groups.length > 0) matches.push(groups);
      }
      
      return matches;
    }

    removeTileGroup(matches:any) {
      //Loop through all the matches and remove the associated tiles
      for(var i = 0; i < matches.length; i++){
        var tempArr = matches[i];
        for(var j = 0; j < tempArr.length; j++){
            var tile = tempArr[j];

            //Find where this tile lives in the theoretical grid
            var tilePos = this.getTilePos(tile);

            //Remove the tile from the screen
            this.tiles.remove(tile, true, true);

            //Increase the users score
            this.incrementScore();

            //Remove the tile from the theoretical grid
            if(tilePos.x != -1 && tilePos.y != -1){
                this.tileGrid[tilePos.x][tilePos.y] = null;
            }
        }
      }
    }
    getTilePos(tile:Phaser.GameObjects.Sprite) {
      var tilePos = {x: -1, y: -1};
      for(var i = 0; i < this.tileGrid.length; i++){
        for(var j = 0; j < this.tileGrid[i].length; j++){
          if(this.tileGrid[i][j]) {
            var currTile : Phaser.GameObjects.Sprite = this.tileGrid[i][j];
            if(currTile.x == tile.x && currTile.y == tile.y) {
              tilePos.x = i;
              tilePos.y = j;
              return tilePos;
            }
          }
        }
      }
      return tilePos;
    }

    resetTiles() {
      //Loop through each column starting from the left
      for (var i = 0; i < this.tileGrid.length; i++)
      {
        //Loop through each tile in column from bottom to top
        for (var j = this.tileGrid[i].length - 1; j > 0; j--)
        {
          //If this space is blank, but the one above it is not, move the one above down
          if(this.tileGrid[i][j] == null && this.tileGrid[i][j-1] != null)
          {
            //Move the tile above down
            var tempTile = this.tileGrid[i][j-1];
            this.tileGrid[i][j] = tempTile;
            this.tileGrid[i][j-1] = null;
            this.add.tween({
              targets: tempTile,
              y: this.yOffset + (this.tileHeight*j) + (this.tileHeight/2),
              duration: 200,
              ease: Phaser.Math.Easing.Linear
            });
            //The positions have changed so start this process again from the bottom
            //NOTE: This is not set to me.tileGrid[i].length - 1 because it will immediately be decremented as
            //we are at the end of the loop.
            j = this.tileGrid[i].length;
          }
        }
      }
    }
    fillTiles() {
      //Check for blank spaces in the grid and add new tiles at that position
      for(var i = 0; i < this.tileGrid.length; i++){
        for(var j = this.tileGrid[i].length - 1; j >= 0; j--){
            if (this.tileGrid[i][j] == null)
            {
                //Found a blank spot so lets add animate a tile there
                var tile = this.addTile(i, j);
                //And also update our "theoretical" grid
                this.tileGrid[i][j] = tile;
            }
        }
    }
    }

    createScore() {
      var scoreFont = "100px Arial";
      this.scoreLabel = this.add.text(this.xOffset + (Math.floor(this.tileGrid[0].length / 2) * this.tileWidth), this.yOffset + (this.tileGrid.length * this.tileHeight), "0", {font: scoreFont, color: "#fff"});
      this.scoreLabel.setOrigin(0.5, 0);
      this.scoreLabel.setAlign('center');
    }
    incrementScore() {
      this.score += 10;
      this.scoreLabel.setText(String(this.score));
    }
  }