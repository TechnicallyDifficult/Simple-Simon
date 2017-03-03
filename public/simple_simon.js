'use strict';

var gameState = 'idle',
    buttonSequence = [],
    currentIndex = 0,
    currentRound = 1,
    buttons = $('.game-btn'),
    buttonsOn = false;


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function chooseButton() {
    // first generate a random number between 0 and the number of buttons on the page
    var buttonIndex = getRandomInt(0, buttons.length);
    // then find and return the button whose index matches the generated number
    return buttons[buttonIndex];
}

function playIntro() {
    console.log('Playing intro...')
    var count = 0,
        chosenButton;
    // the intro should cause the buttons to rapidly blink in a randomized order
    var intervalId = setInterval(function () {
        if (count < 60) {
            // on each interval, if a button isn't lit, choose one and light it. Otherwise, turn off the previously lit button
            if (!chosenButton) {
                chosenButton = chooseButton();
                $(chosenButton).addClass('lit-btn');
            } else {
                $(chosenButton).removeClass('lit-btn');
                chosenButton = '';
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
        $(buttonSequence[i]).addClass('lit-btn');
        // then wait for 700ms before darkening it again
        setTimeout(function () {
            $(buttonSequence[i]).removeClass('lit-btn');
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
    console.log('Starting player turn...')
    // enable all the buttons again
    for (var i = 0; i < buttons.length; i++) {
        buttons.addClass('enabled-btn');
    }
}

function addButton() {
    console.log('Adding button...');
    switch ($('.game-btn').length) {
        case 1:
            $('.container').append('<div id="y-btn" class="game-btn"></div>');
            $('#r-btn').animate({
                'border-radius': '0%',
                'width': '220px'
            }, 700).animate({
                'border-top-left-radius': '444px',
                'border-bottom-left-radius': '444px'
            }, 700, function () {
                $('#y-btn').animate({
                    'top': '0'
                }, 500);
            });
            break;
    }
    buttons = $('.game-btn');
}

buttons.click(function() {
    if (gameState == 'idle') {
        // Is the button clicked lit up?
        $(this).toggleClass('lit-btn');
        // Are all buttons now lit up?
        if (buttons.hasClass('lit-btn')) {
            buttons.removeClass('enabled-btn lit-btn');
            gameState = 'intro';
            playIntro();
        }
    } else if (gameState == 'playerTurn') {
        // if the ID of the button clicked matches the one in the current index of the array
        if ($(this).attr('id') == buttonSequence[currentIndex].id) {
            console.log('You clicked the correct button!');
            currentIndex++;
            if (currentIndex == buttonSequence.length) {
                buttons.removeClass('enabled-btn');
                gameState = 'computerTurn';
                currentIndex = 0;
                currentRound++;
                console.log('Round: ' + currentRound);
                if (currentRound % 3 == 0 && $('.game-btn').length < 4) {
                    addButton();
                } else { 
                    setTimeout(computerTurn, 700);
                }
            }
        } else {
            console.log('You clicked the wrong button!');
        }
    }
});