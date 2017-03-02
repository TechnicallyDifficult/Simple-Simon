'use strict';

var gameState = 'idle';
var buttonChosen;


function playIntro() {
    var buttonOn = false;
    var count = 0;
    // the intro should cause the buttons to rapidly blink in a randomized order
    var intervalId = setInterval(function () {
        if (count < 60) {
            if (!buttonOn) {
                // generate a random interger between 0 and the number of buttons on the page
                buttonChosen = getRandomInt(0, $('.game-button').length);
                // then, out of all the buttons on the page, find the one whose index matches the generated number and light it up
                $('.game-button:eq(' + buttonChosen + ')').addClass('btn-lit');
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
        }
    }, 35);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
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
    }
});