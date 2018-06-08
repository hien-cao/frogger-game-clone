/*
 *
 * Global Constants & Variables
 *
*/

//Input constants:
var ALLOWED_KEYS = {
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down',
	67: 'c'  //to switch player sprite
};

//Screen Dimension constants:
var SCREEN_WIDTH = 505;
var SCREEN_HEIGHT = 606;

//Tile-Grid Dimension constants:
var COL_WIDTH = 101;  //px
var ROW_HEIGHT = 83;  //px
var MAX_COL_INDEX = 4;	// 0 1 2 3 4
var MAX_ROW_INDEX = 5;	// 1
						// 2
						// 3
						// 4
						// 5

//Game constants and variables:
var STARTING_ENEMIES = 10;
var MAX_ENEMIES = 15;  //can increase to this as difficulty goes up
var goalPoints = 2;  //can increase up to 7
var PLAYER_LIVES = 3;
var GEM_POINTS = 3;
var MAX_ROCKS = 4;
var SCORE_THRESHOLD = 25;  //once player scores more than this points, increase game difficulty

/*
 *
 * Enemy Class
 *
*/

// Enemies our player must avoid
var Enemy = function() {
	//for position:
	this.x = 0;
	this.row = 0;  //row is (y) in tile coords
	this.spawn(SCREEN_WIDTH);  //set up the position variables
	
	//for speed:
	this.speed = 0;
	this.setRandomSpeed();  //set up the speed

	//for hit detection:
	this.currentCenterX = 0;  //it's center when taking account its current position
	this.setCurrentCenterX();  //set up the value
};

/* Enemy Constants and Common Variables */

//For graphics:
Enemy.prototype.sprite = 'images/enemy-bug.png';  //enemy image
//For hit detection:
Enemy.prototype.RADIUS = Math.floor(0.40 * COL_WIDTH);  //use most of the bug for hit detection
Enemy.prototype.CENTER_X = Math.floor(COL_WIDTH / 2);  //the center of the bug's body
//For positioning:
Enemy.prototype.Y_OFFSET = -17; //px
Enemy.prototype.enemyHighestRow = 1;  
Enemy.prototype.enemyLowestRow = 3;
//For speed:
Enemy.prototype.MIN_SPEED = 2;
Enemy.prototype.MAX_SPEED = 10;
Enemy.prototype.DEFAULT_SPEED = 20; //px

/* Enemy Methods */

//Sets the position x and row (y) of the enemy
Enemy.prototype.spawn = function(maxRange) {
	_spawnX.call(this, maxRange);  //set x position of the enemy
	_spawnRow.call(this);  //set row (y) position of the enemy

	//Sets the x of the enemy
	//Takes a maxRange so that at the start of the game, some enemies can already be ON the map
	function _spawnX(maxRange) {  
		this.x = -COL_WIDTH + getRandomInt(0, maxRange); //stick offscreen left + random variance
	}

	//Sets the row (y) of the enemy
	//Spawn on a random enemy row (the stone tiles)
	function _spawnRow() {
		this.row = getRandomInt(this.enemyHighestRow, this.enemyLowestRow);
	}
};

//The function above won't work for the green gem's special effect.  In that case,
//you need this other function to spawn bugs off the RIGHT side of the screen:
Enemy.prototype.spawnReverse = function() {
	this.x = SCREEN_WIDTH + COL_WIDTH + getRandomInt(0, 30);  //stick offscreen right + variance
	this.row = getRandomInt(this.enemyHighestRow, this.enemyLowestRow);  //choose a row
};

//set the additional speed factor of this enemy
Enemy.prototype.setRandomSpeed = function() {
	this.speed = getRandomInt(this.MIN_SPEED, this.MAX_SPEED);
};

//Updates the enemy's current center (its center in relation to its position on the map)
Enemy.prototype.setCurrentCenterX = function() {
	this.currentCenterX = this.x + this.CENTER_X;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
	// You should multiply any movement by the dt parameter
	// which will ensure the game runs at the same speed for
	// all computers.

	//if the player has picked up a green gem previously, switch the direction of the bugs' movement
	if (gem.gemEffect !== undefined && gem.gemEffect == gem.GREEN) {
		//update oppositely, travel to the left
		this.x -= this.speed * this.DEFAULT_SPEED * dt; //distance travelled

		//bounds check:
		if (this.x <  -COL_WIDTH) {  //bounds:  once fully offscreen LEFT
			this.spawnReverse();  //reset to offscreen RIGHT plus a little variance
			this.setRandomSpeed();  //assign a new random speed
		}
	}
	else {  
		//update normally, travel to the right
		this.x += this.speed * this.DEFAULT_SPEED * dt; //distance travelled

		//bounds check:
		if (this.x > (SCREEN_WIDTH + COL_WIDTH)) {  //once fully offscreen right
			this.spawn(-COL_WIDTH / 2);  //reset to offscreen left plus a little variance
			this.setRandomSpeed();  //assign a new random speed
		}
	}

	this.setCurrentCenterX();  //keep track of its center relative to the map

	this.detectCollision();  //see if enemy bumped into the player

	if (this.x > (SCREEN_WIDTH + COL_WIDTH)) {  //bounds:  once fully offscreen right
		this.spawn(-COL_WIDTH/2);  //reset to offscreen left plus a little variance
		this.setRandomSpeed();  //assign a new random speed
	}
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
	var y = this.row * ROW_HEIGHT + this.Y_OFFSET;  //convert tile coordinate to px (y)
	ctx.drawImage(Resources.get(this.sprite), this.x, y);
};

//Determines whether or not the enemy has collided with the player
  //Source help / adapted from:  https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  //This still uses the idea of circle collision, but since the player and enemy MUST be
  //in the same row, the math is simpler.
Enemy.prototype.detectCollision = function() {
	if (this.row == player.row && !player.wasHit) { //only check if enemy is in same row as player
		//there's a collision when "the distance between the center points of the two sprites is less than
		//their radii added together"

		var distance = Math.abs(this.currentCenterX - player.currentCenterX);
		var bothRadii = this.RADIUS + player.RADIUS;
		if (distance < bothRadii) {
			player.wasHit = true;
			player.lives--;
			stats.render();  //update the number of hearts shown on the display
			if (player.lives === 0) {
				gem.inPlay = false;  //remove the current gem (if any)
				stats.gameFinished = true;  //display the game over banner.
			}
		}
	}
};

//For resetting after a game over.  Reposition, re-speed the enemy, recalc centerX
Enemy.prototype.reset = function() {
	this.spawn(SCREEN_WIDTH);
	this.setRandomSpeed();
	this.setCurrentCenterX();
};


/*
 *
 *  Player Class
 *
*/

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
	//for the sprite image:
	this.spriteIndex = 0;  
	this.setSprite();  //assign the player an image based on its spriteIndex

	//tile coordinates (since moves by tiles)
	this.col = 0;  //x
	this.row = 0;  //y
	this.placeAtStart();  //put player at starting position

	//for hit detection:
	this.currentCenterX = 0;  //it's center when taking account its current position
	this.setCurrentCenterX();  //set this value
	this.wasHit = false;  //bool used for animation
	this.lives = 3;  //3 hits before game over

	//for animation:
	this.rotation = 0;  //radians, used to spin player in circle after being hit

	//for goal detection:
	this.finished = false;  //turns true when crosses finish line (the water tiles)
};

/* Player Constants */

//For hit detection:
Player.prototype.CENTER_X = Math.floor(COL_WIDTH / 2);  //the center of the player's body
//For animation:
Player.prototype.CENTER_Y = COL_WIDTH;  //it's actually about 100 px down from the top, so just use COL_WIDTH
Player.prototype.RADIUS = Math.floor(0.163 * COL_WIDTH);  //half the player's body is about 16px wide
//For positioning:
Player.prototype.Y_OFFSET = -1 * Math.floor(0.13 * COL_WIDTH);  //to center the sprites on a tile
Player.prototype.START_COL = 2;  //starting position tile x
Player.prototype.START_ROW = 5;  //starting position tile y
//For character graphic:
Player.prototype.SPRITES = [
	'images/char-boy.png',
	'images/char-cat-girl.png',
	'images/char-horn-girl.png',
	'images/char-pink-girl.png',
	'images/char-princess-girl.png'
];

/* Player Methods */

//Assign the player character an image based on its spriteIndex
Player.prototype.setSprite = function() {
	this.sprite = this.SPRITES[this.spriteIndex];
};

//Increment spriteIndex and keep it in bounds of the SPRITES array
Player.prototype.nextSprite = function() {
	this.spriteIndex < this.SPRITES.length - 1 ? this.spriteIndex++ : this.spriteIndex = 0;
};

//Places player at the starting position
Player.prototype.placeAtStart = function() {
	this.col = this.START_COL;
	this.row = this.START_ROW;
	this.setCurrentCenterX();
};

//Updates the player's current center (its center in relation to its position on the map)
Player.prototype.setCurrentCenterX = function() {
	this.currentCenterX = this.col * COL_WIDTH + this.CENTER_X;
};

//Looks to see if player has stepped on a special tile or item
//If the player reaches the finish, it triggers all the "scored a goal"-related matters
//If the player reaches a gem, it triggers all the gem-related matters
Player.prototype.update = function() {
	//if made it to the finish line (the water)
	if (!this.finished && this.row === 0) {
		gem.resetEffect();  //reset in case player picked up a gem this round
		star.setCol(this.col);  //place the star where the player crossed the goal line
		this.finished = true;  //scored a goal!  Show a gold star
		stats.updateScore(goalPoints, true);  //update the score
		this.placeAtStart();  //reset player position
		gem.spawn();  //spawn a new gem for this next 'level'
	}

	//if stepped on a gem:
	if (gem.inPlay && gem.col === this.col && gem.row == this.row) {
		gem.inPlay = false;  //no longer render the gem
		stats.updateScore(GEM_POINTS, false);  //increase score
		gem.statusEffect();  //trigger the gem's additional effect

		if (gem.gemEffect === gem.BLUE) {  //the blue gem requires some additional prep
			gem.positionRocks();
		}
	}
};

//Draw the player on the screen, first converting from tile coords to px (x,y)
Player.prototype.render = function() {
	var x = this.col * COL_WIDTH;
	var y = this.row * ROW_HEIGHT + this.Y_OFFSET;

	if (this.wasHit) {  //render spinning animation
		this.animateSpin(y);
	}
	else { 
		//render normally, without animation
		ctx.drawImage(Resources.get(this.sprite), x, y);

		//if orange gem was collected, player CANNOT move backwards
		//thus, draw a red x behind him to make it more clear what's in effect
		if (gem.gemEffect !== undefined && gem.gemEffect === gem.ORANGE) {
			this.drawRedX(y);
		}
	}
};

//Source help:  http://stackoverflow.com/questions/2677671/how-do-i-rotate-a-single-object-on-an-html-5-canvas
//Since I don't keep track of currentCenterY, this takes the current y position as an argument
Player.prototype.animateSpin = function(y) {
	this.rotation += 0.025 * 2 * Math.PI;  //rotate 9 degrees per cycle

	if (this.rotation > 2 * Math.PI) {  //circle complete, animation over
		//reset player
		this.rotation = 0;
		this.wasHit = false;
		this.placeAtStart();
	}
	else {  //draw the next step in the rotation
		ctx.save();
		ctx.translate(this.currentCenterX, y + this.CENTER_Y);
		ctx.rotate(this.rotation);
		ctx.drawImage(Resources.get(this.sprite), - this.CENTER_X, -this.CENTER_Y);
		ctx.restore();  //reset
	}
};

//Draws a big red 'X' at the player's feet to inform him/her that they cannont move backwards now
  //(Because they picked up an orange gem this round)
Player.prototype.drawRedX = function(y) {
	ctx.fillStyle = '#f00';
	ctx.font = '40pt Tahoma, sans-serif';

	ctx.fillText('X', this.currentCenterX, y + ROW_HEIGHT * 1.50);
};

//Using the arrow keys, move Player 1 tile from current position
//Also prevents player from moving off the game screen
//The 'c' key is used to swap character sprites
Player.prototype.handleInput = function(key) {
	if (stats.gameFinished !== undefined && stats.gameFinished) {  //if game was over, any valid key == start new game
		stats.gameOver();  //handle all the game over stuff, reset everything
		stats.gameFinished = false;
		return;  //don't actually move on this key press, just clear off the game over banner
	}

	if (this.finished) {
		this.finished = false;  //remove the 'hey, you scored!' feedback; that is, stop rendering the star
	}

	//if an orange gem was picked up, prevent the player from moving backwards
	if (gem.gemEffect === gem.ORANGE && key === 'down') {
		return;
	}

	//if a blue gem was picked up, check for rocks blocking an exit
	if (gem.gemEffect === gem.BLUE && this.row === 1 && key === 'up') {
		if (allRocks[this.col].inPlay) {  //if rock directly above
			return;  //don't allow movement
		}
	}

	if (!this.wasHit) {  //don't allow movement when death animation is occurring
		switch(key) {
			case 'left':
				this.col > 0 ? this.col-- : this.col = 0;
				break;
			case 'right':
				this.col < MAX_COL_INDEX ? this.col++ : this.col = MAX_COL_INDEX;
				break;
			case 'up':
				this.row > 0 ? this.row-- : this.row = 0;
				break;
			case 'down':
				this.row < MAX_ROW_INDEX ? this.row++ : this.row = MAX_ROW_INDEX;
				break;
			case 'c':
				this.nextSprite();
				this.setSprite();
				break;
		}
	}

	if (key !== 'c') {
		this.setCurrentCenterX();  //if player moved, update his center value
		//do this here instead of in update to save on unnecessary calls (since this changes less frequently)
	}
};

//Player can also use the mouse with the same functionality
//as the keyboard.  (but to change portraits, click the character.  [no c key obviously])
Player.prototype.handleClicks = function(tileCol, tileRow) {
	if (stats.gameFinished !== undefined && stats.gameFinished) {  //if game was over, any valid click == start new game
		stats.gameOver();  //handle all the game over stuff, reset everything
		stats.gameFinished = false;
		return;  //don't actually move on this click, just clear off the game over banner
	}

	if (this.finished) {
		this.finished = false;  //remove the 'hey, you scored!' feedback; that is, stop rendering the star
	}

	if (!this.wasHit) {  //don't allow movement when death animation is occurring

		//To switch character sprites when playing only with mouse:
		if (tileCol === this.col && tileRow === this.row) {  //if clicked directly ON the player
			this.nextSprite();  //swap to the next character sprite
			this.setSprite();
		}

		var nearX = tileCol - this.col;
		var nearY = tileRow - this.row;

		//if an orange gem was picked up, prevent the player from moving backwards
		if (gem.gemEffect === gem.ORANGE && nearY === 1) {
			return;
		}

		//if a blue gem was picked up, check for rocks blocking an exit
		if (gem.gemEffect === gem.BLUE && tileRow === 0) {
			if (allRocks[tileCol].inPlay) {  //if rock in clicked tile
				return;  //don't allow movement
			}
		}

		//move if clicked on an adjacent (including diagonal) tile
		if ((nearX >= -1 && nearX <= 1) && (nearY >= -1 && nearY <= 1)) {
			this.col = tileCol;
			this.row = tileRow;
			this.setCurrentCenterX();  //if player moved, update his center value
			//do this here instead of in update() to save on unnecessary calls (since this changes less frequently)
		}
	}
};

/*
 *
 * Stats Class (lives, score, high score)
 *
*/

var Stats = function() {
	this.heartSprite = 'images/Heart.png';  //represents the player's lives
	this.scale = 0.40;  //since the heart graphic is too big to fit

	//Score label:
	this.scoreLabel = 'Score';
	this.scoreLabelX = Math.floor(2.5 * COL_WIDTH); //x location to render
	this.scoreLabelY = 0; //y location to render

	//Score:
	this.score = 0;  //current game score
	this.scoreY = Math.floor(0.25 * ROW_HEIGHT);  //y location to render (x is same as above label)

	//High Score label:
	this.highLabel = 'High';
	this.highLabelX = Math.floor(4.5 * COL_WIDTH); //x location to render
	this.highLabelY = 0; //y location to render

	//High Score:
	this.high = 0;  //best score ever
	//x location same as label, y location same as score

	//Score Threshold:
	this.scoreThreshold = 0;  //once this goes over X # of points, increase the game difficulty

	//Aesthetics:
	this.labelColor = '#777';
	this.scoreColor = '#000';
	this.labelFont = '12pt Tahoma, sans-serif';
	this.scoreFont = '16pt Tahoma, sans-serif';

	//Game Over:
	  //Banner:
	this.bannerFont = '30pt Tahoma, sans-serif';
	this.bannerY = Math.floor(1.6 * ROW_HEIGHT);  //bannerX is just 0;  bannerWidth is screen_width
	this.bannerHeight = 4 * ROW_HEIGHT;
	this.bannerLabelY = Math.floor(2.25 * ROW_HEIGHT);
	this.bannerScoreY = Math.floor(3.75 * ROW_HEIGHT);
	this.bannerCenterX = Math.floor(SCREEN_WIDTH / 2);
	  //Bool:
	this.gameFinished = false;  //true when player loses last life.  Displays game over banner then
};

/* Stats Methods */

//Render all the stats information, at the top of the canvas, but outside the tile area
Stats.prototype.render = function() {
	ctx.clearRect(0, 0, SCREEN_WIDTH, ROW_HEIGHT * 0.5);
	this.renderHearts();
	this.renderLabels();
	this.renderScores();
};

//Draws a heart to represent each of the player's lives
Stats.prototype.renderHearts = function() {
	ctx.save();
	ctx.scale(this.scale, this.scale);
	for (var i = 0; i < player.lives; i++) {
		ctx.drawImage(Resources.get(this.heartSprite), i * COL_WIDTH, -ROW_HEIGHT * this.scale);
	}
	ctx.restore(); //reset
};

//sets the style for and then draws the text for both labels
Stats.prototype.renderLabels = function() {
	ctx.fillStyle = this.labelColor;
	ctx.font = this.labelFont;

	ctx.fillText(this.scoreLabel, this.scoreLabelX, this.scoreLabelY);  //score
	ctx.fillText(this.highLabel, this.highLabelX, this.highLabelY);  //high
};

//Sets the style for and then draws the text for both score types
Stats.prototype.renderScores = function() {
	ctx.fillStyle = this.scoreColor;
	ctx.font = this.scoreFont;

	ctx.fillText(this.score, this.scoreLabelX, this.scoreY);  //score
	ctx.fillText(this.high, this.highLabelX, this.scoreY);  //high
};

//Increases the current game's score by the value passed in
//Takes a goal boolean which is used to separate goal points from gem points
//Only goal points lead to a checkScoreThreshold call
Stats.prototype.updateScore = function(val, goal) {
	this.score += val;
	this.render();  //update the labels
	this.scoreThreshold += val;
	if (goal) {  //only check threshold on goal scores, not gem pickups
		this.checkScoreThreshold();  //see if this last score put them over the top
	}
};

//Checks to see if the player has scored sufficient points to warrant an
//increase in difficulty
//This is ONLY called after scoring a GOAL, not a gem pickup.
Stats.prototype.checkScoreThreshold = function() {
	//don't go beyond MAX_ENEMIES number of enemies
	if (allEnemies.length < MAX_ENEMIES && this.scoreThreshold >= SCORE_THRESHOLD) {
		this.increaseDifficulty();
		this.increaseGoalPoints();
		this.scoreThreshold = 0;  //reset
	}
};

//Adds another enemy into the game to make it harder
//This can ONLY be called after scoring a GOAL, not a gem pickup.
  //^This is to prevent a rare but possible situation where a player
  //picks up a gem and an enemy spawns on him.  Not very fair
Stats.prototype.increaseDifficulty = function() {
	allEnemies.push(new Enemy());  //toss in another enemy
};

//As a reward for facing an increased difficulty, goal points are worth more.
//Since difficulty PERSISTS (after a game over, the difficulty remains),
//this reward, too, persists.
Stats.prototype.increaseGoalPoints = function() {
	goalPoints++;
};

//updates the player's best ever score upon game finish if it's a new record
Stats.prototype.updateHigh = function() {
	if (this.high < this.score) {
		this.high = this.score;
	}
};

//Basically resets everything and starts a new game
Stats.prototype.gameOver = function() {
	this.updateHigh();  //check to see if there was a high score
	player.lives = PLAYER_LIVES;  //reset player lives to beginning amount
	this.score = 0;  //reset score
	this.scoreThreshold = 0;
	this.render();  //update the display
	gem.resetEffect();  //remove the gemEffect if there was any
	gem.spawn();  //spawn a new gem
	//respawn all the enemies (even extra difficulty ones) at new locations / speeds
	  //^Thus, difficulty persits over to a new game
	allEnemies.forEach(function(enemy) {
		enemy.reset();
	});
};

//Display a game over banner with the player's score so that they get more clear
//feedback that they've lost all 3 of their lives
Stats.prototype.renderGameOver = function() {
	if (stats.gameFinished) {
		//display a red semi-transparent banner:
		ctx.fillStyle = 'rgba(200, 0, 0, 0.75)';
		ctx.fillRect(0, this.bannerY, SCREEN_WIDTH, this.bannerHeight);

		//Draw the 'Game Over' label
		ctx.fillStyle = '#fff';
		ctx.font = this.bannerFont;
		ctx.fillText('Game Over', this.bannerCenterX, this.bannerLabelY);

		//Display the game's score:
		ctx.fillText(this.score, this.bannerCenterX, this.bannerScoreY);
	}
};

/*
 *
 * Star Class  (Feeback for scoring a goal)
 *
*/

var Star = function() {
	this.sprite = 'images/Star.png';

	this.finalCol = 0;  //column to place the star in (the water tile the player steps on)
	this.Y_OFFSET = -1 * Math.floor(0.025 * COL_WIDTH);  //due to transparency, shift star to center
};

/* Star Methods */

//Once player reaches the water, give him/her a gold star
Star.prototype.render = function() {
	if (player.finished) {  //only when player has scored a goal (reached the water)
		ctx.drawImage(Resources.get(this.sprite), this.finalCol * COL_WIDTH, this.Y_OFFSET);
		//Also display a label with the points received for scoring a goal:
		ctx.fillStyle = '#000';
		ctx.font = '20pt Tahoma, sans-serif';
		ctx.fillText('+' + goalPoints, this.finalCol * COL_WIDTH + COL_WIDTH/2, ROW_HEIGHT);
	}
};

//Save the col position of the water tile the player stepped on to score
Star.prototype.setCol = function(col) {
	this.finalCol = col;
};

/*
 *
 * Gem Class
 *
*/

var Gem = function() {
	//graphics:
	this.sprites = [
		'images/Gem Blue.png',  // 0
		'images/Gem Green.png', // 1
		'images/Gem Orange.png' // 2
	];

	//type:
	this.type = 0;  //serves as an index for the graphic, plus determines status effect

	//position:
	this.col = 0;  //x pos in tile coord
	this.row = 0;  //y pos in tile coord
	this.x = 0;  //x in px
	this.y = 0;  //y in px
	this.Y_OFFSET = -1 * Math.floor(0.13 * COL_WIDTH);  //to center the sprites on a tile
	this.spawn();  //sets up a gem

	//detection/collision
	this.inPlay = true;  //true when live, turns false after being picked up

	//status effect
	this.gemEffect = -1;  //-1 is none, otherwise matches its type when picked up
};

/* Gem constants (to allow for easier readability) */

Gem.prototype.BLUE = 0;
Gem.prototype.GREEN = 1;
Gem.prototype.ORANGE = 2;

/* Gem Methods */

//Creates a gem:  chooses its location and its type
Gem.prototype.spawn = function() {
	this.randomPosition();
	this.randomType();
	this.inPlay = true;
};

//Places the gem on a random tile that's NOT where the player starts
Gem.prototype.randomPosition = function() {
	this.col = getRandomInt(0, MAX_COL_INDEX);
	this.row = getRandomInt(1, MAX_ROW_INDEX);  //1 so that it's not in the water

	//don't place a gem right on the player's starting position
	if (this.col === player.START_COL && this.row == player.START_ROW) {
		this.randomPosition();  //try again!
	}

	this.x = this.col * COL_WIDTH;
	this.y = this.row * ROW_HEIGHT + this.Y_OFFSET;
};

//Choose a random gem type from the set of available gem sprites
Gem.prototype.randomType = function() {
	this.type = getRandomInt(0, this.sprites.length - 1);
};

//draws the sprite on the map, converts from tile coords to px
Gem.prototype.render = function() {
	if (this.inPlay) {  //draw only if player hasn't already picked up
		ctx.drawImage(Resources.get(this.sprites[this.type]), this.x, this.y);
	}
};

//Based on the gem type, cause a different change to the gameplay
//blue (0):  rocks form in the water and block goal line exits
//green (1):  switches travel direction of the enemies (moonwalking bugs!!!)
//orange (2):  prevents player from moving backwards
Gem.prototype.statusEffect = function() {
	this.gemEffect = this.type;
};

//When the blue gem is picked up, it places rocks over the exit points to block movement
//This function, to introduce some randomness, first shuffles the indexes of the available rocks.
//Then it chooses a random number for how many rocks to place in the exit row.
//It then steps through that array of shuffled indexes to activate that number of rocks.
Gem.prototype.positionRocks = function() {
	var shuffledIndexes = shuffleArray(allRocks.length);

	var numOfRocks = getRandomInt(1, MAX_COL_INDEX);  //min: one rock, max: one open exit space

	for (var i = 0; i < numOfRocks; i++) {
		allRocks[shuffledIndexes[i]].activate();
	}
};

//Turns off any gem effect
//If the gem was blue, turns off any rocks that were active
Gem.prototype.resetEffect = function() {
	if (gem.gemEffect === gem.BLUE) {
		allRocks.forEach(function(rock) {
			rock.deactivate();
		});
	}

	this.gemEffect = -1;  //reset
};

/*
 *
 * Rock Class
 *
*/

var Rock = function(index) {
	//position:
	this.col = index;  //x tile coord
	//y is always the same, the row of water

	//for movement prevention:
	this.inPlay = false;  //when true, rock blocks exit
};

/* Rock Constants */

Rock.prototype.SPRITE = 'images/Rock.png';
Rock.prototype.Y = -1 * Math.floor(0.125 * COL_WIDTH);

/* Rock Methods */

//Draw the rock, but only when a blue gem has been picked up.
//Also, only draw if this particular rock has been activated (inPlay)
Rock.prototype.render = function() {
	if (gem.gemEffect !== undefined && gem.gemEffect === gem.BLUE && this.inPlay) {
		ctx.drawImage(Resources.get(this.SPRITE), this.col * COL_WIDTH, this.Y);
	}
};

//Sets a rock to active, meaning that it functions as a boulder blocking the player's path
Rock.prototype.activate = function() {
	this.inPlay = true;
};

//Sets rock to inactive, meaning the player can't see and it can't interfere with the player
Rock.prototype.deactivate = function() {
	this.inPlay = false;
};

/*
 *
 * Object Instantiation
 *
*/

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i = 0; i < STARTING_ENEMIES; i++) {
	allEnemies.push(new Enemy());
}

var player = new Player();

var stats = new Stats();

var star = new Star();

var gem = new Gem();


var allRocks = [];
for (var i = 0; i <= MAX_COL_INDEX; i++) {  //make 5 rocks, one for each column
	allRocks.push(new Rock(i));
}

/*
 *
 * Event Listeners
 *
*/

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.  (Well, I did!)
document.addEventListener('keyup', function(event) {
	player.handleInput(ALLOWED_KEYS[event.keyCode]);
});

//This function stops keypresses from scrolling the page:
document.addEventListener('keydown', function(event) {
	for (var prop in ALLOWED_KEYS) {
		if (event.keyCode === parseInt(prop)) {
			event.preventDefault();
		}
	}
});

//This adds the mouse as a control option
  //Source help:  http://www.homeandlearn.co.uk/JS/html5_canvas_mouse_events.html
document.querySelector('#canvas').addEventListener('mousedown', function(event) {
	event.preventDefault();  //to stop mouse from highlighting 'Controls' text

	//convert mouse clicks to tile coordinates:
	var tileCol = Math.floor(event.offsetX / COL_WIDTH);
	//y is a little awkward due to the transparency included in the tile graphics
	//In effect, it's like there's an extra 60%-row of padding at the top of the canvas
	var tileRow = Math.floor((event.offsetY - ROW_HEIGHT * 0.60) / ROW_HEIGHT);

	if (tileRow >= 0 && tileRow < MAX_ROW_INDEX + 1) {  //weed out any clicks not on the actual tiles
		player.handleClicks(tileCol, tileRow);
	}
});

//This adds touch controls
  //The problem before was that, unlike clicks!!!, touch data comes with decimals...
/*
	Listens for touches, converts touch to tile coordinates, weeds out non-map tiles
*/
var myCanvas = document.querySelector('#canvas');
myCanvas.addEventListener('touchstart', function(event) {
	event.preventDefault();  //MUST do this to prevent that 300ms delay
	var intTouchX = Math.floor(event.targetTouches[0].pageX) - myCanvas.offsetLeft;
	var intTouchY = Math.floor(event.targetTouches[0].pageY) - myCanvas.offsetTop;

	var tileCol = Math.floor(intTouchX / COL_WIDTH);
	var tileRow = Math.floor((intTouchY - ROW_HEIGHT * 0.60) / ROW_HEIGHT);

	if (tileRow >= 0 && tileRow < MAX_ROW_INDEX + 1) {
		player.handleClicks(tileCol, tileRow);
	}

});

/*
 *
 * Other Functions
 *
*/

//returns a random integer between the provided range, inclusively
function getRandomInt(min, max) {
	max++; //to make the max inclusive
	return Math.floor(Math.random() * (max - min)) + min;
}

//Source:  taken and adapted from my own card game "Super Sevens"
//Takes the length of an array and then returns an array of shuffled indexes
function shuffleArray(length) {
	var tempArray = [];
	var arraySize = length;

	for (var i = 0; i < length; i++) {  //create array of sequential indexes
		tempArray.push(i);
	}

	//shuffle the index numbers:
	//Choose a random index and swap it's entry with one
	//available at the back of the array.  Step down and repeat.
	var iRandom, temp;
	while (arraySize > 0) {
		arraySize--;
		iRandom = getRandomInt(0, arraySize);
		temp = tempArray[iRandom];  
		tempArray[iRandom] = tempArray[arraySize];
		tempArray[arraySize] = temp;
	}

	return tempArray;
}

/* List of Added Extras:
  -switch character sprites
  -mouse input
  -animations: collision-spin / star appears upon goal scored
  -a lives (hearts) system
  -score/high score
  -game over
  -gem collection for extra points
  -gem status effects:
    -blue:   block exits with boulders
    -green:  reverse travel direction of the enemies
    -orange: prevent player from moving backwards
  -difficulty increases:  more enemies based on higher scores
*/
