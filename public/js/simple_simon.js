'use strict';

var gameState = 'idle',
    buttonSequence = [],
    currentIndex = 0,
    currentRound = 1,
    buttons = $('.game-btn'),
    buttonContainer = $('#button-container'),
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
        // after a delay, darken it again
        setTimeout(function () {
            $(buttonSequence[i]).removeClass('lit-btn');
            i++;
            // after another delay, run through all this again
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
    // this function causes all buttons to light up for a brief moment
    gameState = 'failure';
    buttons.toggleClass('enabled-btn lit-btn');
    setTimeout(function () {
        // and then everything is reset except the number of buttons in play
        buttonSequence = [];
        currentIndex = 0;
        currentRound = 1;
        $('#round-counter').text(currentRound - 1);
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
    $('#round-counter').text(currentRound - 1);
    // on round 3, add a new button if it hasn't been added already. Do this again on round 6.
    if ((currentRound == 3 && buttonCount < 2) || (currentRound == 6 && buttonCount < 4)) {
        addButton();
    // on round 10, begin transition into breakout
    } else if (currentRound == 10) {
        gameState = 'breakout';
        breakout();
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

function breakout() {
    var x = ($('#field').width() / 2),
        y = ($('#field').height() / 2),
        dx = 1,
        dy = 1,
        bricksInitialized = false,
        paddleX = ($('#field').width() / 2),
        lives = 2,
        ballMoveInterval,
        bricksBroken = 0,
        currentRound = 0;

    function transitionToBreakout() {
        // first, the round counter fades out
        $('#round-counter').fadeOut(1000, 'linear');
        // and the background fades to black
        $('body').addClass('fade-to-black');
        setTimeout(function () {
            // and stays that way
            $('body').css('background-color', 'black');
            setTimeout(function () {
                // after a brief delay, the buttons all shrink
                buttons.animate({
                    'height': '16px',
                    'width': '16px',
                    'border-width': '1px'
                }, 700);
                // as does the container holding them
                buttonContainer.addClass('rotating').animate({
                    'height': '32px',
                    'width': '32px',
                    'top': y,
                    'left': x
                }, 700, function () {
                    // after another delay, the bricks are initialized
                    setTimeout(initializeBricks, 500);
                });
            }, 300);
        }, 1000);
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

    // This function calculates the value to be used in the data attributes that will be added to each brick for the purpose of later checking collisions
    function setHitbox(index, side) {
        var position,
            // the passed-in index is converted into a string so that it can be divided up later
            indexString = index.toString();
        switch (side) {
            case 'left':
                // find the last character in the index, convert it back to an interger, and multiply that by the width of each brick (100). This will be the value for the brick's left side
                position = parseInt(indexString.substring(indexString.length - 1));
                return position * 100;
            case 'top':
                // if the index is only one digit long, the brick is obviously on the top row and therefore has a top value of 20 since there are 20 pixels of space above the entire field of bricks
                if (indexString.length == 1) {
                    return 20;
                } else {
                    // otherwise, the value of the top side of the brick is equal to the value of the first digit of its index times the height of each brick (32), then plus 20 pixels to account for the empty space above all the bricks
                    position = parseInt(indexString.substring(0, 1));
                    return (position * 32) + 20;
                }
            case 'right':
                // finding the value of the right side of each brick is done exactly the same way as finding the left side's value, except with 1 extra added to the value that will be multiplied by 100, as the right side of each brick is exactly 100 pixels away from the left side
                position = parseInt(indexString.substring(indexString.length - 1));
                return (position + 1) * 100;
            case 'bottom':
                // finding the bottom value of a brick is easy if its index is a single-digit number (and therefore is on the top row), as all of them will have a value of 52 (the height of the empty space + the height of each brick)
                if (indexString.length == 1) {
                    return 52;
                } else {
                    // finding the bottom value of all other bricks is a little more difficult, but is no different than finding the top value of them except for an extra 32 pixels (and thus, we add 1 to position)
                    position = parseInt(indexString.substring(0, 1));
                    return ((position + 1) * 32) + 20;
                }
        }
    }

    // this function has two main parts
    function initializeBricks() {
        $('.brick').each(function (index, element) {
            // first, a random color is given to each brick
            $(element).addClass(chooseColor());
            // then, if it hasn't been done already, data attributes are added to each, using the setHitbox function to determine the value of each by passing in the brick's index and a string telling it which value to calculate
            if (!bricksInitialized) {
                $(element).attr({
                    'data-left': setHitbox(index, 'left'),
                    'data-top': setHitbox(index, 'top'),
                    'data-right': setHitbox(index, 'right'),
                    'data-bottom': setHitbox(index, 'bottom')
                });
            }
        });
        $('#bricks-container').removeClass('hidden');
        // a variable for determining when to stop the setInterval
        var i = 0;
        // here, a setInterval function is used to show the bricks one by one in a rapid succession (but not all at once) for increased visual appeal
        var intervalId = setInterval(function () {
            if (i < 30) {
                $('.brick').eq(i).removeClass('hidden hidden-brick');
                i++;
            } else {
                // after all of them have appeared, clear the interval and move on to showing the paddle...
                clearInterval(intervalId);
                // ...unless this has already happened before
                if (!bricksInitialized) {
                    setTimeout(showPaddle, 300);
                }
                bricksInitialized = true;
            }
        }, 100);
    }

    // this function also shows the life and round counters
    function showPaddle() {
        // first, it shows the hidden lives and animates them into their full size
        $('.life').removeClass('hidden').addClass('rotating');
        $('.life').animate({
            'top': '0px',
            'left': '0px',
        }, 500);
        $('.life-corner').animate({
            'height': '16px',
            'width': '16px'
        }, 700);
        // the round counter has some properties set and then fades into existence
        $('#round-counter').css('color', 'white').text(currentRound).fadeIn(700, 'linear');
        // the paddle receives the same treatment as the lives
        $('#paddle').removeClass('hidden').animate({
            'height': '24px',
            'width': '128px',
            'left': '500px',
            'bottom': '0px',
        }, 700, function () {
            // after a delay, the main draw function is called, which starts the ball moving
            setTimeout(draw, 300);
        });
    }

    function checkBrickCollision() {
        $('.active-brick').each(function (index, element) {
            // if, on the next interval, the ball would be moved inside the brick being checked...
            if (y + dy + 16 > $(element).attr('data-top') && x + dx < $(element).attr('data-right') && y + dy - 16 < $(element).attr('data-bottom') && x + dx + 32 > $(element).attr('data-left')) {
                $(element).removeClass('active-brick').addClass('hidden-brick');
                bricksBroken++;
                if (bricksBroken == 30) {
                    roundProgress();
                } else {
                    // on which axis should the ball be reflected?
                    // if the ball is not already both above the brick's bottom boundary and below the brick's top boundary, then it must be colliding with the brick from either the top or the bottom
                    if (!(y + 16 > $(element).attr('data-top')) || !(y - 16 < $(element).attr('data-bottom'))) {
                        // therefore, the ball's y-axis movement should be reversed
                        dy = -dy;
                    // otherwise, if the ball is not already between both of the brick's side boundaries, then it must be colliding with one of the sides
                    } else if (!(x < $(element).attr('data-right')) || !(x + 32 > $(element).attr('data-left'))) {
                        // therefore, the ball's x-asis movement should be reversed
                        dx = -dx;
                    }
                }
            }
        });
    }

    function checkPaddleCollision() {
        // this function uses the same logic as checkBrickCollision to determine whether and how the ball is colliding with the paddle
        if (y + dy > 514 && y + dy < 570 && x + dx + 32 > paddleX && x + dx < paddleX + 128) {
            if (!(x < paddleX + 128) || (x + dx + 32 > paddleX + 96)) {
                // if the ball is colliding with the right side of the paddle or the rightmost 1/4th of the top of the paddle, set the ball's x-direction movement to the right
                dx = 1;
            } else if (!(x + 32 > paddleX) || (x + dx < paddleX + 32)) {
                // otherwise, if the ball is colliding with the left side of the paddle or the leftmost 1/4th of the top of the paddle, set the ball's x-direction movement to the left
                dx = -1;
            }
            // in all cases of the ball colliding with the paddle, reverse the ball's y-direction movement
            dy = -dy;
        }
    }

    function checkEdgeCollision() {
        // if the ball is colliding with the top...
        if (y + dy < 0) {
            dy = -dy;
        }
        // if the ball is colliding with the right or the left...
        if (x + dx > $('#field').width() - 32 || x + dx < 0) {
            dx = -dx;
        }
        // if the ball is colliding with the bottom...
        if (y + dy > $('#field').height() - 32) {
            // freeze the ball's movement
            dx = 0;
            dy = 0;
            loseLife();
        }
    }

    // this function is used for the little animations when the player loses a life
    function shrinkBall(ball) {
        // since each ball is made up of a container div and 4 smaller divs, we have to animate each of them separately
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

    function loseLife() {
        // first, the main ball shrinks out of existence
        shrinkBall(buttonContainer);
        setTimeout(function () {
            if (lives > 0) {
                // after a delay, the rightmost life is shrunk out of sight
                shrinkBall($('.life').eq(lives - 1));
                setTimeout(function () {
                    // after another delay, the ball is moved back into the center of the field...
                    x = ($('#field').width() / 2);
                    y = ($('#field').height() / 2);
                    // and then is reshown
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
                // if the player is out of lives, that's it! Nothing else happens.
                clearInterval(ballMoveInterval);
            }
        }, 500);
    }

    function draw() {
        // this event listener is included in this function so that the paddle does not start moving until this function is called
        // it is what allows the mouse to control the paddle
        $(document).mousemove(function(event) {
            // if the mouse cursor moves too far to the left, stop the paddle at the edge of the "field" until the mouse cursor is centered vertically with it again
            if (event.pageX < $('#field').offset().left + 64) {
                paddleX = 0;
            // do the same if the mouse cursor moves too far to the right
            } else if (event.pageX > $('#field').offset().left + 936) {
                paddleX = 872;
            } else {
                // otherwise, make the paddle follow the mouse cursor
                paddleX = event.pageX - $('#field').offset().left - 64;
            }
            $('#paddle').css('left', paddleX);
        });
        // this is what actually causes the ball to move
        ballMoveInterval = setInterval(function () {
            // on every interval, check for collisions
            checkBrickCollision();
            checkPaddleCollision();
            checkEdgeCollision();
            x += dx;
            y += dy;
            buttonContainer.css({
                'top': y,
                'left': x
            });
        }, 5);
    }

    transitionToBreakout();
}

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