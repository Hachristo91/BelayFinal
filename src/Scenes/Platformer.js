class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 1200;
        this.MAX_SPEED = 400
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600 ;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.keys = {};
        this.warping = false;
        this.win = false;
        this.reward = "";
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 24 tiles wide and 200 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 24, 200);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.groundLayer.layer.data.forEach(function (row) {
            row.forEach(function (tile) {
                if (tile.properties.semicollides == true) {
                    tile.setCollision(false, false, true, false);
                    // or less verbosely:
                    // tile.setCollision(false, false, true, false)
                }
            })
        })

        this.decoLayer = this.map.createLayer("Deco", this.tileset, 0, 0);

        // Find objects in the "Objects" layer in Phaser
        // Look for them by finding objects with name x
        // Assign the texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.diamond = this.map.createFromObjects("Objects", {
            name: "diamond",
            key: "tilemap_sheet",
            frame: 67
        });

        this.coin = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        
        this.springs = this.map.createFromObjects("Objects", {
            name: "spring",
            key: "tilemap_sheet",
            frame: 108
        });

        this.pipe = this.map.createFromObjects("Objects", {
            name: "pipe",
            key: "tilemap_sheet",
            frame: 135
        });

        this.pipe2 = this.map.createFromObjects("Objects", {
            name: "pipe2",
            key: "tilemap_sheet",
            frame: 135
        });

        this.flag = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 111
        });

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.diamond, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.springs, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.pipe, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.pipe2, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.coin, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.springGroup = this.add.group(this.springs);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 3510, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(this.MAX_SPEED, 1000);

        this.points = [
            this.map.widthInPixels/2, 3400,
            this.map.widthInPixels/2, 1200
        ];

        this.pipePath = [
            316, 3140,
            316, 3068,
            154, 3068,
            154, 2996,
            172, 2996
        ];

        this.pipe2Path = [
            352, 1672,
            352, 1636,
            424, 1636,
            424, 1366,
            406, 1366
        ];

        this.curve = new Phaser.Curves.Spline(this.points);
        this.curve2 = new Phaser.Curves.Spline(this.pipePath);
        this.curve3 = new Phaser.Curves.Spline(this.pipe2Path);

        my.sprite.autoScroll = this.add.follower(this.curve, this.curve.points[0].x, this.curve.points[0].y, "tilemap_sheet", "158");
        my.sprite.autoScroll.visible = false;
        my.sprite.pipeShadow = this.add.follower(this.curve2, this.curve2.points[0].x, this.curve2.points[0].y, "kenny-particles", "circle_01.png");
        my.sprite.pipeShadow.setScale(0.04)
        my.sprite.pipeShadow.visible = false;
        my.sprite.pipeShadow2 = this.add.follower(this.curve3, this.curve3.points[0].x, this.curve3.points[0].y, "kenny-particles", "circle_01.png");
        my.sprite.pipeShadow2.setScale(0.04)
        my.sprite.pipeShadow2.visible = false;

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coin
        this.physics.add.overlap(my.sprite.player, this.diamond, (obj1, obj2) => {
            obj2.destroy()
            this.sound.play("diamond", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
            this.reward = "Diamond";
            my.sprite.autoScroll.startFollow({
                from: 0,
                to: 1,
                delay: 0,
                duration: 20000,
                ease: 'Linear',
                repeat: 0,
                yoyo: false,
                rotateToPath: true,
                rotationOffset: -90
            })
        });

        // Handle collision detection with coin
        this.physics.add.overlap(my.sprite.player, this.coin, (obj1, obj2) => {
            obj2.destroy()
            this.sound.play("coin", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
            this.reward = "Coin";
            my.sprite.autoScroll.startFollow({
                from: 0,
                to: 1,
                delay: 0,
                duration: 30000,
                ease: 'Linear',
                repeat: 0,
                yoyo: false,
                rotateToPath: true,
                rotationOffset: -90
            })
        });

        // Handle collision detection with springs
        this.physics.add.overlap(my.sprite.player, this.springGroup, (obj1, obj2) => {
            my.sprite.player.body.setVelocityY(-800);
            this.sound.play("spring", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
        });

        // Handle collision detection with pipe entrance
        this.physics.add.overlap(my.sprite.player, this.pipe, (obj1, obj2) => {
            my.sprite.player.visible = false;
            my.sprite.player.x = 306;
            my.sprite.player.y = 3060;
            my.sprite.pipeShadow.visible = true;
            this.warping = true;
            my.sprite.pipeShadow.startFollow({
                from: 0,
                to: 1,
                delay: 0,
                duration: 2000,
                ease: 'Sine.easeIn',
                repeat: 0,
                yoyo: false,
                rotateToPath: false,
                rotationOffset: -90,
                onComplete: () => {
                    console.log("complete");
                    this.warping = false;
                    my.sprite.pipeShadow.visible = false;
                    my.sprite.player.x = 190;
                    my.sprite.player.y = 2996;
                    my.sprite.player.visible = true;
                }
            })
        });

        // Handle collision with second pipe entrance
        this.physics.add.overlap(my.sprite.player, this.pipe2, (obj1, obj2) => {
            my.sprite.player.visible = false;
            my.sprite.player.x = 370;
            my.sprite.player.y = 1363;
            my.sprite.pipeShadow2.visible = true;
            this.warping = true;
            my.sprite.pipeShadow2.startFollow({
                from: 0,
                to: 1,
                delay: 0,
                duration: 2000,
                ease: 'Sine.easeIn',
                repeat: 0,
                yoyo: false,
                rotateToPath: false,
                rotationOffset: -90,
                onComplete: () => {
                    this.warping = false;
                    my.sprite.pipeShadow2.visible = false;
                    my.sprite.player.visible = true;
                }
            })
        });

        // Handle collision with flag
        this.physics.add.overlap(my.sprite.player, this.flag, (obj1, obj2) => {
            this.win = true
            obj2.destroy();
            if(this.reward == "Diamond"){
                this.add.bitmapText(2, 1101, "rocketSquare", "You Won the " + this.reward);
            } else {
                this.add.bitmapText(50, 1101, "rocketSquare", "You Won the " + this.reward);
            }
            this.add.bitmapText(10, 1121, "rocketSquare", "Press R to Restart");
            this.sound.play("win", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
        });

        // set up Phaser-provided cursor key input
        this.keys.left = this.input.keyboard.addKey('A');
        this.keys.right = this.input.keyboard.addKey('D');
        this.keys.up = this.input.keyboard.addKey('SPACE');

        this.rKey = this.input.keyboard.addKey('R');

        this.physics.world.drawDebug = false;

        // debug key listener (assigned to X key)
        //this.input.keyboard.on('keydown-X', () => {
           // this.physics.world.drawDebug = this.physics.world.drawDebug ? true : false
            //this.physics.world.debugGraphic.clear()
        //}, this);

        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: {start: 0.03, end: 0.1, },
            random: true,
            lifespan: 350,
            maxAliveParticles: 3,
            alpha: {start: 1, end: 0.1},
            gravityY: -400 
        });

        my.vfx.walking.stop();
        
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.autoScroll, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

    }

    update() {
        if(this.keys.left.isDown && this.warping == false && this.win == false){
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }

        } else if(this.keys.right.isDown && this.warping == false && this.win == false) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }


        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jump", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        if((my.sprite.player.y-my.sprite.autoScroll.y) > 270){
            this.sound.play("death", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("deathScene");
        }
    }
}