import './style.css'
import Phaser from 'phaser'

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
  }

  create(){
    this.scene.pause("scene-game")

    this.popMusic = this.sound.add("pop")
    this.bgMusic = this.sound.add("bgMusic")
    // this.bgMusic.play()

    // this.add.image(0, 0, "bg").setOrigin(0, 0).setScale(1.5);
    /*this.background = this.add.tileSprite(
      0, 0,
      sizes.width,
      sizes.height,
      "bg"
    ).setOrigin(0, 0).setScrollFactor(0);*/
    
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

    // Option B: Or set collision by custom property if you added 'collides: true' in Tiled
    // wallsLayer.setCollisionByProperty({ collides: true });
    



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

    // groundLayer.setDepth(1);

    // Scale the actual texture
    this.background.setTileScale(1 / scale, 1 / scale);

    const groundY = this.worldFloorY;

    this.player = this.physics.add
        .image(100, groundY - 100, "sunny" )
        .setOrigin(0, 0)
        .setScale(0.5);
    // this.player.setImmovable(true);
    // this.player.body.allowGravity = false;
    this.player.setImmovable(false);
    this.player.body.allowGravity = true;
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

    // TILED MAP
    // this.physics.world.setBounds(0, 0, map.widthInPixels * grassLayer.scaleX, map.heightInPixels * grassLayer.scaleY);
    // this.cameras.main.setBounds(0, 0, map.widthInPixels * grassLayer.scaleX, map.heightInPixels * grassLayer.scaleY);
    


    this.player.setCollideWorldBounds(true);
    // Make the camera follow the player
    // this.cameras.main.setBounds(0, 0, worldWidth, sizes.height);
    // this.cameras.main.startFollow(this.player, true, 1, 1);



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

    this.timedEvent = this.time.delayedCall(10000, this.gameOver, [], this)

    this.emitter = this.add.particles(-100, -50, "particles", {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.0004,
      duration: 100,
      emitting: false,
    })
    this.emitter.startFollow(this.player, this.player.width/ 2, this.player.height / 2, true);
    
  }

  update(){
    /*const camera = this.cameras.main;

    const desiredScrollX = this.player.x - sizes.width / 2;

    camera.scrollX = Math.round(
      Phaser.Math.Clamp(
        desiredScrollX,
        0,
        this.physics.world.bounds.width - sizes.width
      )
    );

    camera.scrollY = Math.round(this.worldFloorY - sizes.height);*/

    // Keep camera vertically fixed at starting position
    this.cameras.main.scrollY = this.worldFloorY - sizes.height;

    this.background.tilePositionX = this.cameras.main.scrollX;
    this.remainingTime = this.timedEvent.getRemainingSeconds()
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`)

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
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
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
  scene: [GameScene]
}

const game = new Phaser.Game(config)

gameStartBtn.addEventListener("click", ()=> {
  gameStartDiv.style.display = "none"
  game.scene.resume("scene-game")
})