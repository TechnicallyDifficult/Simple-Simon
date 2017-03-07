'use strict';

var gameState = 'idle',
    buttonSequence = [],
    currentIndex = 0,
    currentRound = 1,
    buttons = $('.game-btn'),
    buttonContainer = $('#button-container'),
    buttonCount = 1,
    buttonsOn = false,
    x = ($('#field').width() / 2),
    y = ($('#field').height() / 2),
    dx = 1,
    dy = 1,
    bricksInitialized = false,
    paddleX = ($('#field').width() / 2),
    lives = 3,
    ballMoveInterval;


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
            }, 700, function () {
                // finally, the yellow button is unhidden and slides into play
                $('#y-btn').removeClass('hidden').animate({
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
    if ((currentRound == 3 && buttonCount < 2) || (currentRound == 6 && buttonCount < 4)) {
        addButton();
    // on round 10, begin transition into breakout
    } else if (currentRound == 10) {
        gameState = 'breakout';
        gameTransition();
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
    $('body').addClass('fade-to-black');
    setTimeout(function () {
        $('body').css('background-color', 'black');
        setTimeout(function () {
            buttons.animate({
                'height': '16px',
                'width': '16px',
                'border-width': '1px'
            }, 700);
            buttonContainer.addClass('rotating').animate({
                'height': '32px',
                'width': '32px',
                'top': y,
                'left': x
            }, 700, function () {
                setTimeout(initializeBricks, 500);
            });
        }, 300);
    }, 1000);
}

function draw() {
    $(document).mousemove(function(event) {
        if (event.pageX < $('#field').offset().left + 64) {
            paddleX = 0;
        } else if (event.pageX > $('#field').offset().left + 936) {
            paddleX = 872;
        } else {
            paddleX = event.pageX - $('#field').offset().left - 64;
        }
        $('#paddle').css('left', paddleX);
    });
    ballMoveInterval = setInterval(function () {
        console.log(ballMoveInterval);
        checkBrickCollision();
        checkPaddleCollision();
        if (y + dy < 0) {
            dy = -dy;
        }
        if (x + dx > $('#field').width() - 32 || x + dx < 0) {
            dx = -dx;
        }
        if (y + dy > $('#field').height() - 32) {
            dx = 0;
            dy = 0;
            loseLife();
        }
        x += dx;
        y += dy;
        buttonContainer.css({
            'top': y,
            'left': x
        });
    }, 8);
}

function chooseColor() {
    switch (getRandomInt(1, 5)) {
        case 1:
            return 'red';
        case 2:
            return 'yellow';
        case 3:
            return 'green';
        case 4:
            return 'blue';
    }
}

function setHitbox(index, side) {
    var position,
        indexString = index.toString();
    switch (side) {
        case 'left':
            position = parseInt(indexString.substring(indexString.length - 1));
            return position * 100;
        case 'top':
            if (indexString.length == 1) {
                return 20;
            } else {
                position = parseInt(indexString.substring(0, 1));
                return (position * 32) + 20;
            }
        case 'right':
            position = parseInt(indexString.substring(indexString.length - 1));
            return (position + 1) * 100;
        case 'bottom':
            if (indexString.length == 1) {
                return 52;
            } else {
                position = parseInt(indexString.substring(0, 1));
                return ((position + 1) * 32) + 20;
            }
    }
}

function initializeBricks() {
    $('.brick').each(function (index, element) {
        $(element).addClass(chooseColor());
        if (!bricksInitialized) {
            $(element).attr({
                'data-left': setHitbox(index, 'left'),
                'data-top': setHitbox(index, 'top'),
                'data-right': setHitbox(index, 'right'),
                'data-bottom': setHitbox(index, 'bottom')
            });
        }
    });
    bricksInitialized = true;
    $('#bricks-container').removeClass('hidden');
    var i = 0;
    var intervalId = setInterval(function () {
        if (i < 30) {
            $('.brick').eq(i).removeClass('hidden hidden-brick');
            i++;
        } else {
            clearInterval(intervalId);
            setTimeout(showPaddle, 300);
        }
    }, 100);
}

function checkBrickCollision() {
    $('.active-brick').each(function (index, element) {
        if (y + dy + 16 > $(element).attr('data-top') && x + dx < $(element).attr('data-right') && y + dy - 16 < $(element).attr('data-bottom') && x + dx + 32 > $(element).attr('data-left')) {
            $(element).removeClass('active-brick').addClass('hidden-brick');
            if (!(y + 16 > $(element).attr('data-top')) || !(y - 16 < $(element).attr('data-bottom'))) {
                dy = -dy;
            } else if (!(x < $(element).attr('data-right')) || !(x + 32 > $(element).attr('data-left'))) {
                dx = -dx;
            }
        }
    });
}

function checkPaddleCollision() {
    if (y + dy > 514 && y + dy < 570 && x + dx + 32 > paddleX && x + dx < paddleX + 128) {
        if (!(x < paddleX + 128) || (x + dx + 32 > paddleX + 96)) {
            dx = 1;
        } else if (!(x + 32 > paddleX) || (x + dx < paddleX + 32)) {
            dx = -1;
        }
        dy = -dy;
    }
}

function showPaddle() {
    $('.life').removeClass('hidden').addClass('rotating')
    $('.life').animate({
        'top': '0px',
        'left': '0px',
    }, 500);
    $('.life-corner').animate({
        'height': '16px',
        'width': '16px'
    }, 700);
    $('#paddle').removeClass('hidden').animate({
        'height': '24px',
        'width': '128px',
        'left': '500px',
        'bottom': '0px',
    }, 700, function () {
        setTimeout(draw, 300);
    });
}

function loseLife() {
    shrinkBall(buttonContainer);
    setTimeout(function () {
        if (lives > 0) {
            if (lives == 3) {
                shrinkBall($('#life-2'));
            } else if (lives == 2) {
                shrinkBall($('#life-1'));
            }
            setTimeout(function () {
                x = ($('#field').width() / 2);
                y = ($('#field').height() / 2);
                console.log('hi');
                buttonContainer.removeClass('hidden');
                buttonContainer.animate({
                    'height': '32px',
                    'width': '32px'
                }, 300);
                buttons.animate({
                    'height': '16px',
                    'width': '16px'
                }, 300, function () {
                    setTimeout(function () {
                        dx = 1;
                        dy = 1;
                    }, 1000);
                });
            }, 800);
            lives--;
        } else {
            clearInterval(ballMoveInterval);
        }
    }, 500);
}

function shrinkBall(ball) {
    ball.children().animate({
        'height': '0px',
        'width': '0px'
    }, 500)
    ball.animate({
        'height': '0px',
        'width': '0px',
        'top': parseInt(ball.attr('top')) + 16,
        'left': parseInt(ball.attr('left')) + 16
    }, 500, function () {
        ball.addClass('hidden');
    });
}

function breakout() {}

buttons.click(function () {
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