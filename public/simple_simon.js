'use strict';

var gameState = 'idle',
    buttonSequence = [],
    currentIndex = 0;


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function chooseButton() {
    // first generate a random number between 0 and the number of buttons on the page
    var buttonIndex = getRandomInt(0, $('.game-button').length);
    // then find and return the button whose index matches the generated number
    return $('.game-button:eq(' + buttonIndex + ')');
}

function playIntro() {
    var buttonOn = false;
    var count = 0;
    // the intro should cause the buttons to rapidly blink in a randomized order
    var intervalId = setInterval(function () {
        if (count < 60) {
            if (!buttonOn) {
                chooseButton().addClass('btn-lit');
                buttonOn = true;
            } else {
                // if there are any buttons lit up, make them dark again
                $('.game-button').removeClass('btn-lit');
                buttonOn = false;
            }
            count++;
        } else {
            console.log('Intro over.');
            // end the intro and proceed to the next phase of the game
            clearInterval(intervalId);
            gameState = 'computerTurn';
            setTimeout(computerTurn, 700);
        }
    }, 35);
}

function computerTurn() {
    console.log('Starting computer turn...')
    buttonSequence.push(chooseButton());
    playSequence(buttonSequence.length, 0);
}

function playSequence(runCount, i) {
    if (i < runCount) {
        // first, light up the button at the current index
        buttonSequence[i].addClass('btn-lit');
        // then wait for 700ms before darkening it again
        setTimeout(function () {
            buttonSequence[i].removeClass('btn-lit');
            i++;
            // after another 700ms, run through all this again
            setTimeout(function () {
                playSequence(runCount, i);
            }, 700);
        }, 700);
    // once finished playing the entire sequence...
    } else {
        gameState = 'playerTurn'
        playerTurn();
    }
}

function playerTurn() {
    console.log('starting player turn...')
    $('.game-button').addClass('btn-enabled');
}

$('.game-button').click(function() {
    console.log('Button was clicked!');
    if (gameState == 'idle') {
        // Is the button clicked lit up?
        if (!$(this).hasClass('btn-lit')) {
            $(this).addClass('btn-lit');
            // Are all buttons now lit up?
            if ($('.game-button').hasClass('btn-lit')) {
                $('.game-button').removeClass('btn-enabled btn-lit');
                gameState = 'intro';
                playIntro();
            }
        } else {
            $(this).removeClass('btn-lit');
        }
    } else if (gameState == 'playerTurn') {
        if (this.id == buttonSequence[currentIndex][0].id) {
            console.log('You clicked the correct button!');
            currentIndex++;
            if (currentIndex == buttonSequence.length) {
                $('.game-button').removeClass('btn-enabled');
                gameState = 'computerTurn';
                currentIndex = 0;
                setTimeout(computerTurn, 700);
            }
        } else {
            console.log('You clicked the wrong button!');
        }
    }
});

