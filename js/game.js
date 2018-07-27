'use strict'


// criando uma instancia do Phaser (jogo)

// passo a resolução, e a API CANVAS para desenho de imagem na página poderia usar o webGL (tem problemas com linux e mobile)
// game-container é o id da pagina para ser exibida, esta no arquivo game.xml
// é passado tambem um objeto com as respectivas funcoes
var game  = new Phaser.Game(1024,600,Phaser.CANVAS,"game-container",
                            { preload: carregar,
                              create: iniciar,
                              update: logica ,
                              render: desenhar 
                            }
                            )

var background
var player
var cursors
var fireButton

var balls
var square

var item 
var itemfx

var trail
var trailDelay

var imTitle
var imGameOver

//estados
const STATE_TITLE = 0
const STATE_PLAY = 1 
const STATE_GAMEOVER = 2
var state = STATE_TITLE

//score
var score = 0
var highScore = localStorage.getItem('highScore')
var textScore
var textHighScore
var textTime

//constantes
const BACKGROUND_SPEED = 0.33
const PLAYER_SPEED = 200
const BALL_LAUNCHER_DELAY = 2
const BALL_SPEED = 100

function carregar(){
    //digo qual o identificador da hash e o caminho da imagem
    game.load.image('background','assets/background.png')
    game.load.image('player','assets/player.png')
    game.load.image('square','assets/square.png')
    game.load.image('ball','assets/circle.png')
    game.load.image('title','assets/texto_titulo.png')
    game.load.image('gameover','assets/texto_fim_de_jogo.png')
    game.load.image('item','assets/item.png')
    game.load.image('itemFx','assets/circle_effect.png')

}

function iniciar(){

    //inicia o moto fisico
    game.physics.startSystem(Phaser.Physics.Arcade)

    // uso para nao ter que ficar pintando o fundo toda vez ja que vou usar o meu fundo que predice na funcao carregar()
    game.renderer.clearBeforeRender = false


    //teclas
    // captura as teclas do teclado
    cursors = game.input.keyboard.createCursorKeys()
    fireButton = game.input.keyboard.addKey(Phaser.KeyCode.ENTER)

    // fundo 
    background = game.add.sprite(0,0,'background')
    //centraliza a imagem em x
    background.x = game.width/2
    //centraliza a imagem em y
    background.y = game.height/2
    //coloca o centro como ancora
    background.anchor.setTo(0.5,0.5)
    //mudo a escala para preenchimento total da imagem
    background.scale.setTo(1.75,2)



    //textos de score e highScore quando gameOver
    var style = {
                    font: 'bold 16mpx Arial',
                    fill: 'red',
                    textAlign: 'center'
                }
    textScore = game.add.text(game.width/2,game.height/2+100,'SCORE:',style)
    textScore.setShadow(3,3,'rbga(0,0,0,0.5)',2)
    textScore.visible = false


    var style = {
        font: 'bold 16mpx Arial',
        fill: 'red',
        textAlign: 'center'
    }
    textHighScore = game.add.text(game.width/2,game.height/2+125,'SCORE:',style)
    textHighScore.setShadow(3,3,'rbga(0,0,0,0.5)',2)
    textHighScore.visible = false


    trail = game.add.group()
    trailDelay = 0

    //player
    // passando os parametros para o local de inicializacao e passo o identificador da imagem
    player = game.add.sprite(game.width/2,game.height/2+200,"player")

    //mudo o ponto ancora do player
    player.anchor.setTo(0.5,0.5)

    //mudo a escala do player
    player.scale.setTo(0.75,0.75)


    //digo ao motor que o player sera "colidivel"
    game.physics.arcade.enable(player)

    //define o tamanho da caixa de colisao
    player.body.setSize(30,30,17,17)


    //square
    square = game.add.sprite(game.width/2,game.height/2,'square')
    square.anchor.setTo(0.5,0.5)
    square.angle -= 0.5


    //item
    item    = game.add.sprite(0,0,'item')
    item.anchor.setTo(0.5,0.5)
    game.physics.arcade.enable(item)
    resetItem()
    game.add.tween(item.scale)
                    .to( { x: 1.2,y: 1.2 },200 )
                    .to( { x:1, y: 1 },200 )
                    .loop(-1)
                    .start()



    //item fx
    itemfx = game.add.sprite(0,0,'itemFx')
    itemfx.anchor.setTo(0.5,0.5)
    itemfx.kill()

    
    // group balls
    balls = game.add.group()
    balls.enableBody = true


    //testo titulo
    imTitle = createImText('title');
    imGameOver = createImText('gameover');
    imGameOver.visible = false

    //texto do timer
    textTime = game.add.text(game.wdth - 150, 30, "SCORE: 0",
                            
                               {
                                   font: "bold 16px Arial",
                                   fill: "white"
                               } 
                            )
    //defino uma sombra para o texto com sua cor e sua largura
    textTime.setShadow(0,0,"rgba(0,0,0,1)",4)

   
}


function createImText(imKey){
    var img  = game.add.sprite(game.width/2,game.height/2 -130, imKey)
    img.anchor.setTo(0.5,0.5)
    img.tint = 0xff0000
    game.add.tween(img)
                .to( { tint: 0x33000}, 9000 )
                .to( { tint: 0xff000 }, 9000 )
                .to( { tint: 0xfff00  }, 9000 )
                .loop(-1)
                .start()
    return img

}


function resetItem(){
    game.add.tween(item)
            .to( { alpha: 1 }, 500 )
            .start()

    item.body.enable = true
    var x = game.rnd.between(100, game.width-100)
    var y = game.rnd.between(100, game.height-100)
    item.reset(x,y)

}

// defino oque deve haver no inicio do game
function startGame(){

    //retira o titulo do inicio do jogo
    imTitle.visible = false

    // ele começa andando para a direita
    player.body.velocity.x = PLAYER_SPEED

    //usar o time para ganhar pontos a cada segundo
    game.time.events.loop(Phaser.Timer.SECOND, addScore)

    //cria bola a cada x segundos
    game.time.events.loop(Phaser.Timer.SECOND * BALL_LAUNCHER_DELAY,launchBall)
}




function addScore(amount = 5){
        score += amount
        textTime.text = "SCORE:"+ score
}

// atualiza a logica do jogo, 60fps
function logica(){
    if(state == STATE_PLAY)
        updatePlayer()
    else
        if(state == STATE_TITLE){
            if(fireButton.isDown){
                state = STATE_PLAY
                startGame()
            }
        }else
        if(state == STATE_GAMEOVER){
            if(fireButton.isDown)
                location.reload() //solucao feia
        }


    // usada para rotacionar a imagem de fundo
    background.angle += BACKGROUND_SPEED


    //tratar colisao
    // overlap avisa se um objeto sobrepor o outro
    game.physics.arcade.overlap(player,balls,gameOver)

    // faz com que as bolas se rebatem
    game.physics.arcade.collide(balls)

    // faz com que haja contato entre o player e o item e chame a funcao de coleta de pontos
    game.physics.arcade.overlap(player,item,collectItem)

}


function collectItem(){
    addScore(100)
    item.body.enable = false

    //faz item sumir
    game.add.tween(item)
    .to( { alpha: 0  }, 500 )
    .start()
    .onComplete.add(resetItem)

    itemfx.reset(item.x,item.y)
    itemfx.scale.setTo(0.2,0.2)

    // abre o arco (itemFx)
    game.add.tween(itemfx)
    .to( { alpha: 0  }, 600 )
    .start()
    

    game.add.tween(itemfx.scale)
    .to( { x: 1.5, y:1.5  }, 600 )
    .start()
    .onComplete.add(resetFx)
}

function resetFx(){
        itemfx.kill()
        itemfx.alpha = 1
        itemfx.scale.setTo(0,0)


}

function desenhar(){

    //mosttra a caixa de colisao do player
   // game.debug.body(player)

}

// capturar as telcas e mover o player
function updatePlayer(){
    // se for pressionado o botao para a esquerda é mudada a velociadade em relacao a X e zerada a de Y e logo em seguida mudo a rotacao do objeto para a direcao oposta
    if(cursors.left.isDown){
        player.body.velocity.x =- PLAYER_SPEED
        player.body.velocity.y = 0
        player.angle = 180

    } else
    if(cursors.right.isDown){
        player.body.velocity.x = PLAYER_SPEED
        player.body.velocity.y = 0
        player.angle = 0

    } else
    if(cursors.up.isDown){
        player.body.velocity.x = 0
        player.body.velocity.y =- PLAYER_SPEED
        player.angle = 270

    } else
    if(cursors.down.isDown){
        player.body.velocity.x = 0 
        player.body.velocity.y = PLAYER_SPEED
        player.angle = 90

    }

    //criar rastro
    if(trailDelay-- < 0){
        trailDelay = 2
        var obj = trail.create(player.x, player.y,'player')
        obj.anchor.setTo(0.5,0.5)
        obj.scale.setTo(0.75,0.75)
        obj.angle = player.angle
        obj.alpha = 0.5
        game.add.tween(obj)
                .to( { alpha: 0 },1000  )
                .start()
                .onComplete.add( (target) => target.destroy() )
    }
    
    

    //wrap na tela (fazer com que passando do limite da borda, apareca na outra)
    const PADDING = 0.4
    if(player.body.x <PADDING)
        player.body.x = game.width - PADDING
    else 
        if(player.body.x > game.width - PADDING)
            player.body.x   = PADDING
    else 
        if(player.body.y <  PADDING)
            player.body.y   = game.height - PADDING
    else 
        if(player.body.y > game.height - PADDING)
            player.body.y   = PADDING
}

// funcao que cria as bolas no game
function launchBall(){
    // crio as bolas na tela
    var ball = balls.create(game.width/2,game.height/2,'ball')
    ball.alpha = 0
    game.add.tween(ball)
            .to({ alpha: 1 }, 250)
            .start()
    //coloca a ancora no centro
    ball.anchor.setTo(0.5,0.5)
    // diz que sera algo que possa colidir
    ball.body.collideWorldBounds = true

    //diz que ela poderá bater e voltar nos cantos
    ball.body.bounce.setTo(1,1)// 100% de elasticidade
    ball.body.setSize(30,30,17,17)
    ball.scale.setTo(0.75,0.75)

    //define velocidade de forma rand
    ball.body.velocity.x = game.rnd.between(-BALL_SPEED,BALL_SPEED)
    ball.body.velocity.y = game.rnd.between(-BALL_SPEED,BALL_SPEED)

    // impede que a bola fique parada (ou quase)
    if(Math.abs(ball.body.velocity.x)< 20)
        ball.body.velocity.x *= 10
    if(Math.abs(ball.body.velocity.y)< 20)
        ball.body.velocity.y *= 10
}



function gameOver(){
    player.kill()
    game.time.events.stop()
    imGameOver.visible = true
    state = STATE_GAMEOVER

    //mostra score e highScore

    if(score > highScore)
        highScore = score

    textScore.visible = true
    textScore.text = "SCORE:"+ score
    textHighScore.visible = true
    textHighScore.text = "HIGH SCORE:"+ highScore

    localStorage.setItem('highScore',highScore)



}