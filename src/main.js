import './style.css'
import Phaser from 'phaser'
import Level2Scene from './Level2Scene.js'
import Level3Scene from './Level3Scene.js'

const sizes = {
  width: 850,
  height: 570
}

const speedDown = 300
// Sidescroller
const worldWidth = 2000;

const gameStartDiv = document.querySelector("#gameStartDiv")
const gameStartBtn = document.querySelector("#gameStartBtn")
const gameEndDiv = document.querySelector("#gameEndDiv")
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan")
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan")

let gameStartTime = null;
const totalGameTime = 300000

class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game");
    this.player;
    this.cursor;
    // this.playerSpeed = speedDown + 50;
    this.playerSpeed = 352;
    this.target;
    this.points = 0;
    this.textScore;
    this.textTime;
    this.timedEvent;
    this.remainingTime;
    this.popMusic;
    this.bgMusic;
    this.emitter;
  }

  preload(){
    this.load.image("bg", "assets/sky-bg1.png");
    this.load.image("sunny", "assets/sunny.png");
    this.load.image("tomato", "/assets/tomato.png");
    this.load.image("particles", "/assets/particles.png");
    this.load.audio("pop", "/assets/pop.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");

    this.load.tilemapTiledJSON('map', 'assets/map3.tmj');
    this.load.image('tileset-image', 'assets/grass-tiles5.png');
    this.load.spritesheet("sheet", "/assets/sunny-walk.png", {
      frameWidth: 16,
      frameHeight: 32,
    });
  }

  create(){
    this.isGameOver = false;

    this.scene.pause("scene-game")
    this.popMusic = this.sound.add("pop")
    this.bgMusic = this.sound.add("bgMusic")
    // this.bgMusic.play()
    
    // TILED MAP
    const map = this.make.tilemap({ key: 'map' });

    // 3. Add the tileset image to the map (First param = name in Tiled, Second = preload key)
    const tileset = map.addTilesetImage('grass-tiles5', 'tileset-image');

    // 4. Create the layers
    const grassLayer = map.createLayer('Tile Layer 1', tileset, 0, 0); // Your collision layer
    grassLayer.setDepth(1);
    grassLayer.setScale(3.5) ;

    this.worldFloorY = map.heightInPixels * grassLayer.scaleY;

    this.physics.world.setBounds(
      0, 0,
      map.widthInPixels * grassLayer.scaleX,
      this.worldFloorY
    );

    this.cameras.main.setBounds(
      0,
      this.worldFloorY - sizes.height,
      this.physics.world.bounds.width,
      sizes.height
    );

    // 5. Enable collisions on the walls layer
    // Option A: Exclude empty tiles (-1 means empty space)
    grassLayer.setCollisionByExclusion([-1]);


    // Get original background image dimensions
    const bg = this.textures.get("bg").getSourceImage();

    const scaleX = sizes.width / bg.width;
    const scaleY = sizes.height / bg.height;

    const scale = Math.max(scaleX, scaleY);

    // Create background that fills the screen
    this.background = this.add.tileSprite(
      0,
      0,
      sizes.width,
      sizes.height,
      "bg"
    ).setOrigin(0, 0).setScrollFactor(0);

    // groundLayer.setDepth(1):

    // Scale the actual texture
    this.background.setTileScale(1 / scale, 1 / scale);

    const groundY = this.worldFloorY;

    // Animations
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("sheet", {
        start: 0,
        end: 4
      }),
      frameRate: 6,
      repeat: -1
    });

    this.player = this.physics.add
        .sprite(100, groundY - 100, "sheet" )
        .setOrigin(0, 0)
        .setScale(4);

    // Set idle animation
    this.player.setFrame(4)
    
    this.player.setGravityY(0);

    this.player.setCollideWorldBounds(true);
    this.player.setSize(this.player.width-this.player.width/1.5, this.player.height/2).
    setOffset(this.player.width/7, this.player.height - this.player.height/2);

    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = groundY - sizes.height;

    this.cameras.main.roundPixels = true;
    this.cameras.main.startFollow(
      this.player,
      true,
      1,
      0
    );

    this.cameras.main.setFollowOffset(0, 0);


    // -----------------  Sidescroller --------------

    this.player.setCollideWorldBounds(true);

    this.target = this.physics.add
        .image(0, 0, "tomato")
        .setOrigin(0, 0)
        .setScale(0.4);
        this.target.setMaxVelocity(0, speedDown);

        this.physics.add.overlap(this.target, this.player, this.targetHit, null, this)

    this.cursor = this.input.keyboard.createCursorKeys();

     // 7. Add a collider between the player and the walls layer
    this.physics.add.collider(this.player, grassLayer);

    this.textScore = this.add.text(sizes.width - 120, 10, "Score:0", {
      font: "25px Arial",
      fill: "#fff",
    });
    this.textScore.setScrollFactor(0);

    this.textTime = this.add.text(10, 10, "Remaining Time: 00", {
      font: "25px Arial",
      fill: "#fff"
    });
    this.textTime.setScrollFactor(0);

    // this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this)

    this.emitter = this.add.particles(-100, -50, "particles", {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.0004,
      duration: 100,
      emitting: false,
    })
    this.emitter.startFollow(this.player, this.player.width/ 2, this.player.height / 2, true);

    // Create goal/portal to trigger level 2
    const levelEndX = this.physics.world.bounds.width;

    // 2. Place the goal near the right edge and above the ground floor
    this.goal = this.physics.add.sprite(levelEndX - 100, this.worldFloorY - 100, 'tomato');
    this.goal.setScale(0.5); // Optional: adjust size if the tomato image is huge
    this.goal.body.setAllowGravity(false);
    this.goal.body.setImmovable(true);

    // 3. Detect when player touches the goal
    this.physics.add.overlap(this.player, this.goal, () => {
        console.log("Goal reached!");
        this.scene.start('Level2Scene');
    });
    
  }

  update(){

    // Global Timer
    const gameStartTime = this.registry.get("gameStartTime");
    const totalGameTime = this.registry.get("totalGameTime");

    const elapsedTime = Date.now() - gameStartTime;

    this.remainingTime = Math.max(
        0,
        (totalGameTime - elapsedTime) / 1000
    );

    this.textTime.setText(
        `Remaining Time: ${Math.ceil(this.remainingTime)}`
    );

    if (this.remainingTime <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.gameOver();
    }

    // Keep camera vertically fixed at starting position
    this.cameras.main.scrollY = this.worldFloorY - sizes.height;

    this.background.tilePositionX = this.cameras.main.scrollX;

    /*this.remainingTime = this.timedEvent.getRemainingSeconds()
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`)*/




    if (this.target.y >= this.worldFloorY) {
      this.target.setY(0);

      this.target.setX(
        Phaser.Math.Between(
          this.cameras.main.scrollX,
          this.cameras.main.scrollX + sizes.width - 50
        )
      );
    }

    const {left, right, up} = this.cursor;

    // Horizontal Movement
    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);

      if(!this.player.anims.isPlaying){
        this.player.play("walk")
      }
      this.player.setFlipX(true)
      
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);

      if(!this.player.anims.isPlaying){
        this.player.play("walk")
      }
      this.player.setFlipX(false)

    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop();
      this.player.setFrame(4);
    }

    // Vertical Movement
    if (Phaser.Input.Keyboard.JustDown(up) && this.player.body.blocked.down) {
      this.player.setVelocityY(-640);
    }
  }

  getRandomX(){
    return Phaser.Math.Between(0, worldWidth - 50);
  }

  targetHit(){
    this.popMusic.play();
    this.emitter.start();
    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.points++;
    this.textScore.setText(`Score: ${this.points}`)
  }

  gameOver(){
    this.sys.game.destroy(true)
    if(this.points >= 10){
      gameEndScoreSpan.textContent = this.points
      gameWinLoseSpan.textContent = "Win!"
    } else {
      gameEndScoreSpan.textContent = this.points
      gameWinLoseSpan.textContent = "Lose"
    }

    gameEndDiv.style.display = "flex"

  }
}


const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  pixelArt: true,
  roundPixels: true,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {y: 1200},
      // debug: true
    }
  },
  scene: [GameScene, Level2Scene, Level3Scene]
}

const game = new Phaser.Game(config)

gameStartBtn.addEventListener("click", ()=> {
  gameStartDiv.style.display = "none"

  game.registry.set("gameStartTime", Date.now());
  game.registry.set("totalGameTime", 300000);
  game.scene.resume("scene-game")
})