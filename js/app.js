// Create the main varaibles
let gamePlaying, stat, player, enemy, allEnemies = [];
// Create the postion the enemy will appear on y axis
const enemyPosition = [60, 145, 227, 60, 145, 227];
// Create difficulty level variables
let levelListIndex = 0;
const levelList = ['easy', 'medium', 'hard'];

// Create DOM variables
const point = document.querySelector('#point');
const hearts = document.querySelectorAll('li');
const heartsArray = Array.from(hearts);
const modal = document.querySelector('.popup');
const message = document.querySelector('#message');
const character =	document.querySelector('#character');
const level = document.querySelector('#level');
const againButton = document.querySelector('#play-again');


		init();
// @description: enemy class with update, render and difficulty levelSelector methods
class Enemy {

		constructor(x, y, speed) {
				this.x = x; // The position of the enemy on x axis
				this.y = y; // The position of the enemy on y axis
				this.speed = speed; // The speed of the enemy
				this.sprite = 'images/enemy-bug.png'; // The image of the enemy
				this.levelList = {
					easy: 0.3,
					medium: 0.8,
					hard: 1.1,
				};
				this.level = this.levelList['easy'];
		}

		// Update the enemy's position, required method for game
		// Parameter: dt, a time delta between ticks
		update(dt) {
				this.x += this.speed * dt * this.level;

				// Repeat the enemies movement
				if (this.x > 550) {
						this.x = -50;
						// Random the speed again
						this.speed = 100 + Math.floor(Math.random() * 400);
				} 
				// Collision between enemies and player
				if (player.x < this.x + 50 && 
						player.x > this.x - 50 &&
						player.y < this.y + 30 &&
						player.y > this.y - 30) {
								// Return the player to initial position
								player.x = player.orginalPosition.x;
								player.y = player.orginalPosition.y;
								// Update the number of lives
								stat.updateLives();
				}
		}

		// Draw the enemy on the screen
		render() {
				ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
		}

		// Difficulty level selection
		levelSelector(level) {
			this.level = this.levelList[level];
		}
}

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
// @description: player class includes methods: update, render, handleInput, characterSelectoror
class Player {
	constructor(speed) {
		// The player's orginal position
		this.orginalPosition = {
			x: 200,
			y: 380,
		}
		this.x = this.orginalPosition.x;// The position of the player on x axis
		this.y = this.orginalPosition.y;// The position of the player on y axis
		this.speed = speed;// The speed of the player
		this.spritesList = {
			boy: 'images/char-boy.png',
			catGirl: 'images/char-cat-girl.png',
			hornGirl: 'images/char-horn-girl.png',
			pinkGirl: 'images/char-pink-girl.png',
			princessGirl: 'images/char-princess-girl.png',
		};
		this.sprite = this.spritesList.boy;	
	}

	// Update the player's position
	update() {
			// Limit the player's position within the canvas
			if (this.x > 400) {
					this.x = 400;
			}
			if (this.x < 0) {
					this.x = 0;		
			}
			if (this.y > 380) {
					this.y = 380;
			}
			if (this.y < 0) {
					this.x = this.orginalPosition.x;
					this.y = this.orginalPosition.y;
					stat.updatePoint();
			}
	}

	// Draw the player on the screen
	render() {
			ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
	}

	// Handle the player movement
	handleInput(keyPress) {
			switch (keyPress) {
					case 'left':
							this.x -= this.speed + 50;
							break;
					case 'up':
							this.y -= this.speed + 30;
							break;
					case 'right':
							this.x += this.speed + 50;
							break;
					case 'down':
							this.y += this.speed + 30;
							break;
			}
	}

	// Character selection
	characterSelector(character) {
		if (character) {
			this.sprite = this.spritesList[character];
		}
	}
}

// @description: statistics class containing data of player's points, lives, and updatePoint, updateLives, and gameover method.
class Stat {
	constructor() {
		// The defaut number of point and lives
		this.point = 0;
		this.lives = 3;
	}
	// Update the point when the player earn point
	updatePoint() {
		this.point ++;
		point.textContent = 'Point: ' + this.point;
	}

	// Update the lives when the player lose lives
	updateLives() {
		this.lives --;
		heartsArray[this.lives].style.visibility = 'hidden';
		if (this.lives === 0) {
			this.gameover();
		}
	}

	// Function to inform the player when the game is over
	gameover() {
		modal.classList.add('show');
		message.textContent = `Your point is ${this.point}`;
		gamePlaying = false;
		// Stop all enemies moving
		allEnemies.forEach(function(enemy) {
			enemy.speed = 0;
		});
		// Stop the player moving
		player.speed = 0;
	}	
}

// @description: function to start the game
function init() {
	gamePlaying = true;
	closeModal();
	playAgain();
}

// @description: function to reset game
function reset() {
	gamePlaying = true;
	Array.from(document.querySelectorAll('li')).forEach(function(heart) {
		heart.style.visibility = 'visible';
	});
	allEnemies = [];
	player = null;
	stat = null;
	// Create new enemies, player and statistics data
	stat = new Stat();
	player = new Player(50);
	enemyPosition.forEach(function(yPosition) {
		enemy = new Enemy(0, yPosition, 100 + Math.floor(Math.random() * 400));
		allEnemies.push(enemy);
	});
	character.textContent = 'Character: Boy';
	level.textContent = 'Level: EASY';
	point.textContent = 'Point: 0';
}

// @description: function to close icon on modal
function closeModal() {
	//Define close icon for modal
	const close = document.querySelector('.close');
	close.addEventListener('click', function() {
		let modal = document.querySelector('.popup');
		modal.classList.remove('show');
		reset();
	});
}

// @description: function to playAgain button on modal
function  playAgain() {
	//Define playAgain
	againButton.addEventListener('click', function() {
		let modal = document.querySelector('.popup');
		modal.classList.remove('show');
		reset();
	});
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
stat = new Stat(); // new statistics data
player = new Player(50);// new player
enemyPosition.forEach(function(yPosition) {// Create the enemies in the defined position
	enemy = new Enemy(0, yPosition, 100 + Math.floor(Math.random() * 400));
	allEnemies.push(enemy);// store enemy into an array
});

// This listens for key-press to change difficulty level
document.addEventListener('keypress', function(evt) {
	if (gamePlaying) {
		if(evt.keyCode === 108) {
			levelListIndex < 2 ? levelListIndex ++ : levelListIndex = 0;
			document.querySelector('#level').textContent = 'Level: ' + levelList[levelListIndex].toUpperCase();
			allEnemies.forEach(function(enemy) {
				enemy.levelSelector(levelList[levelListIndex]);
			});
		}
	}
}); 

// This listens for key-press to change the game character
document.addEventListener('keypress', function(evt) {
	if (gamePlaying) {
		let allowedKeys = {
			49: 'boy',
			50: 'catGirl',
			51: 'hornGirl',
			52: 'pinkGirl',
			53: 'princessGirl',
		};

		let characterName = {
			boy: 'Boy',
			catGirl: 'Cat Girl',
			hornGirl: 'Horn Girl',
			pinkGirl: 'Pink Girl',
			princessGirl: 'Princess Girl',
		};

		if (evt.keyCode === 49 || 
				evt.keyCode === 50 || 
				evt.keyCode === 51 || 
				evt.keyCode === 52 || 
				evt.keyCode === 53 
		) {
			player.characterSelector(allowedKeys[evt.keyCode]);
		}
		
		if (characterName[allowedKeys[evt.keyCode]] !== undefined) {
			document.querySelector('#character').textContent = 'Character: ' + characterName[allowedKeys[evt.keyCode]];
		}
	}
});

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(evt) {
		var allowedKeys = {
				37: 'left',
				38: 'up',
				39: 'right',
				40: 'down',
		};
		player.handleInput(allowedKeys[evt.keyCode]);
});