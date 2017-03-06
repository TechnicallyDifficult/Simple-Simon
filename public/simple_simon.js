'use strict';

var gameState = 'idle',
    buttonSequence = [],
    currentIndex = 0,
    currentRound = 1,
    buttons = $('.game-btn'),
    buttonCount = 1,
    buttonsOn = false;


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function chooseButton() {
    // first generate a random number between 0 and the number of buttons on the page
    var buttonIndex = getRandomInt(0, buttonCount);
    // then find and return the button whose index matches the generated number
    return buttons[buttonIndex];
}

function playIntro() {
    // a counter for determining when to stop the intro animation
    var count = 0;
    var chosenButton;
    // the intro should cause the buttons to rapidly blink in a randomized order
    var intervalId = setInterval(function () {
        if (count < 40) {
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
            // end the intro and proceed to the next phase of the game
            clearInterval(intervalId);
            gameState = 'computerTurn';
            setTimeout(computerTurn, 500);
        }
    }, 50);
}

function computerTurn() {
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
            }, 500);
        }, 500);
    // once finished playing the entire sequence...
    } else {
        gameState = 'playerTurn'
        buttons.addClass('enabled-btn');
    }
}

function addButton() {
    switch (buttonCount) {
        case 1:
            $('#r-btn').animate({
                // first, the red button morphs into a rectangle with about half its initial width
                'border-radius': '0%',
                'width': '220px'
            }, 700).animate({
                // then it morphs into a semicircle
                'border-top-left-radius': '444px',
                'border-bottom-left-radius': '444px'
            }, 700).animate({
                // and then moves slightly to the left
                'left': '-111px'
            }, 700, function () {
                // finally, the yellow button is unhidden and slides into play
                $('#y-btn').removeClass('hidden');
                // the red button has its CSS changed slightly so that it doesn't appear to jump to the left after the yellow button is unhidden
                $('#r-btn').css('left', '0');
                // and then the yellow button slides into play
                $('#y-btn').animate({
                    'top': '0'
                }, 500, function () {
                    // when the animation finishes, after a brief delay, start the computer's turn again
                    setTimeout(computerTurn, 300);
                });
            });
            buttonCount = 2;
            break;
        case 2:
            $('#r-btn').animate({
                // first, the red button morphs into a quarter-circle
                'border-bottom-left-radius': '0',
                'height': '220px'
            }, 700);
            $('#y-btn').animate({
                // at the same time as the red one, the yellow button does the same
                'border-bottom-right-radius': '0',
                'height': '220px'
            }, 700, function () {
                $('#g-btn').removeClass('hidden').animate({
                    // when the yellow button's animation finishes (both buttons should finish at the same time), the green button is unhidden and slides into play
                    'left': '0'
                }, 700);
                $('#b-btn').removeClass('hidden').animate({
                    // at the same time as the green one, the blue button does the same from the other side
                    'right': '0'
                }, 700, function () {
                    // when the animation finishes, after a brief delay, start the computer's turn again
                    setTimeout(computerTurn, 500);
                });
            });
            buttonCount = 4;
            break;
    }
    buttons = $('.game-btn');
}

function failureSequence() {
    gameState = 'failure';
    buttons.toggleClass('enabled-btn lit-btn');
    setTimeout(function () {
        buttonSequence = [];
        currentIndex = 0;
        currentRound = 1;
        gameState = 'idle';
        buttons.toggleClass('enabled-btn lit-btn');
    }, 1500);
}

function successSequence() {
    // just like with the intro, a counter for determining when to stop the success animation
    buttons.removeClass('enabled-btn');
    gameState = 'computerTurn';
    currentIndex = 0;
    currentRound++;
    // on round 3, add a new button if it hasn't been added already. Do this again on round 6.
    if ((currentRound % 3 == 0 && buttonCount < 2) || (currentRound % 6 == 0 && buttonCount < 4)) {
        addButton();
    } else {
        // otherwise, play the normal success animation and proceed to the computer's turn
        var count = 0;
        var intervalId = setInterval(function () {
            if (count < 20) {
                buttons.toggleClass('lit-btn');
                count++;
            } else {
                clearInterval(intervalId);
                setTimeout(computerTurn, 400);
            }
        }, 50);
    }
}

function gameTransition() {
    buttons.animate({
        'height': '16px',
        'width': '16px',
        'border-width': '1px'
    }, 500);
    $('#button-container').addClass('rotating');
}

buttons.click(function() {
    if (gameState == 'idle') {
        // Is the button clicked lit up?
        $(this).toggleClass('lit-btn');
        // Are all buttons now lit up?
        for (var i = 0; i < buttonCount; i++) {
            // if at any point a button that is off is encountered...
            if (!$(buttons[i]).hasClass('lit-btn')) {
                buttonsOn = false;
                break;
            } else {
                buttonsOn = true;
            }
        }
        if (buttonsOn) {
            buttons.removeClass('enabled-btn lit-btn');
            buttonsOn = false;
            gameState = 'intro';
            playIntro();
        }
    } else if (gameState == 'playerTurn') {
        // if the ID of the button clicked matches the one in the current index of the array
        if ($(this).attr('id') == buttonSequence[currentIndex].id) {
            currentIndex++;
            // if the player has finished clicking the buttons in the correct order...
            if (currentIndex == buttonSequence.length) {
                successSequence();
            }
        } else {
            failureSequence();
        }
    }
});