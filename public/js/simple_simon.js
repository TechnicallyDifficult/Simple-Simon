// $(document).ready(function () {
    'use strict';

    var gameState = 'simonIdle',
        buttons = $('.game-btn'),
        buttonContainer = $('#button-container');

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function simon() {
        var buttonSequence = [],
            currentIndex = 0,
            currentRound = 0,
            buttonCount = 1;

        function gameFlow() {
            switch (gameState) {
                case 'simonIdle':
                    idle().done(function (next) {
                        $(document).off('keyup');
                        buttons.off('click');
                        buttons.removeClass('enabled-btn lit-btn');
                        switch (next) {
                            case 'start':
                                gameState = 'simonIntro';
                                break;
                            case 'konami':
                                gameState = 'simonKonamiSkip';
                        }
                        gameFlow();
                    });
                    break;
                case 'simonIntro':
                    playIntro().done(function () {
                        setTimeout(function () {
                            gameState = 'simonComputerTurn';
                            gameFlow();
                        }, 500);
                    });
                    break;
                case 'simonComputerTurn':
                    computerTurn().done(function () {
                        gameState = 'simonPlayerTurn';
                        buttons.addClass('enabled-btn');
                        gameFlow();
                    });
                    break;
                case 'simonPlayerTurn':
                    playerTurn().always(function () {
                        buttons.off('click');
                        buttons.removeClass('enabled-btn');
                        $(document).off('keyup');
                    }).done(function (next) {
                        switch (next) {
                            case 'success':
                                gameState = 'simonSuccessSequence';
                                gameFlow();
                                break;
                            case 'konami':
                                gameState = 'simonKonamiSkip';
                                gameFlow();
                        }
                    }).fail(function () {
                        gameState = 'simonFailureSequence';
                        gameFlow();
                    });
                    break;
                case 'simonSuccessSequence':
                    successSequence().done(function (next) {
                        switch (next) {
                            case 'computerTurn':
                                gameState = 'simonComputerTurn';
                                setTimeout(gameFlow, 500);
                                break;
                            case 'addButton':
                                gameState = 'simonAddButton';
                                gameFlow();
                                break;
                            case 'breakout':
                                breakout();
                                break;
                        }
                    });
                    break;
                case 'simonFailureSequence':
                    failureSequence().done(function () {
                        buttons.addClass('enabled-btn');
                        gameState = 'simonIdle';
                        gameFlow();
                    });
                    break;
                case 'simonAddButton':
                    addButton().done(function () {
                        gameState = 'simonComputerTurn';
                        setTimeout(gameFlow, 500);
                    });
                    break;
                case 'simonKonamiSkip':
                    if (buttonCount < 4) {
                        addButton().done(function () {
                            setTimeout(gameFlow, 300);
                        });
                    } else {
                        breakout();
                    }
            }
        }

        function idle() {
            var deferred = $.Deferred();
            konami().done(function () {
                deferred.resolve('konami');
            });
            buttons.click(function () {
                // Is the button clicked lit up?
                $(this).toggleClass('lit-btn');
                // Are all buttons now lit up?
                if ($('.lit-btn').length == buttonCount) {
                    deferred.resolve('start');
                }
            });
            return deferred.promise();
        }

        function chooseButton() {
            // first generate a random number between 0 and the number of buttons on the page
            var buttonIndex = getRandomInt(0, buttonCount);
            // then find and return the button whose index matches the generated number
            return buttons[buttonIndex];
        }

        function playIntro() {
            var deferred = $.Deferred(),
            // a counter for determining when to stop the intro animation
                count = 0,
                chosenButton = '';
            // the intro should cause the buttons to rapidly blink in a randomized order, using a timed recursive function
            (function foo() {
                if (count < 40) {
                    // on each run, no button has been chosen (and therefore, none are lit), choose one and light it. Otherwise, turn off the previously lit button
                    if (!chosenButton) {
                        chosenButton = chooseButton();
                        $(chosenButton).addClass('lit-btn');
                    } else {
                        $(chosenButton).removeClass('lit-btn');
                        chosenButton = '';
                    }
                    count++;
                    setTimeout(foo, 50);
                } else {
                    // end the intro and allow to proceed to the next phase of the game
                    deferred.resolve();
                }
            })();
            return deferred.promise();
        }

        function computerTurn() {
            var deferred = $.Deferred();
            buttonSequence.push(chooseButton());
            playSequence(buttonSequence.length).done(function () {
                deferred.resolve();
            });
            return deferred.promise();
        }

        function playSequence(runCount) {
            var deferred = $.Deferred(),
                i = 0;
            // this timed recursive function is used in place of setInterval
            (function foo() {
                // on each run, either light up the button at the current index
                if (i < runCount) {
                    if (!$(buttonSequence[i]).hasClass('lit-btn')) {
                        $(buttonSequence[i]).addClass('lit-btn');
                    // or unlight it if it's already lit; only increment the counter when unlighting
                    } else {
                        $(buttonSequence[i]).removeClass('lit-btn');
                        i++;
                    }
                    setTimeout(foo, 500);
                // when the sequence is finished, proceed to the player's turn
                } else {
                    deferred.resolve();
                }
            })();
            return deferred.promise();
        }

        function playerTurn() {
            var deferred = $.Deferred();
            konami().done(function () {
                deferred.resolve('konami');
            });
            buttons.click(function () {
                // if the ID of the button clicked matches the one in the current index of the array
                if ($(this).attr('id') == buttonSequence[currentIndex].id) {
                    currentIndex++;
                    // if the player has finished clicking the buttons in the correct order...
                    if (currentIndex == buttonSequence.length) {
                        deferred.resolve('success');
                    }
                // if the player at any point in the sequence makes a mistake...
                } else {
                    deferred.reject();
                }
            });
            return deferred.promise();
        }

        function addButton() {
            var deferredMain = $.Deferred();
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
                            // perform this task when the animation finishes after a brief delay
                            deferredMain.resolve();
                            buttonCount = 2;
                        });
                    });
                    break;
                case 2:
                    var deferred1 = $.Deferred(),
                        deferred2 = $.Deferred(),
                        deferred3 = $.Deferred(),
                        deferred4 = $.Deferred();
                    $('#r-btn').animate({
                        // first, the red button morphs into a quarter-circle
                        'border-bottom-left-radius': '0',
                        'height': '220px'
                    }, 700, function () {
                        deferred1.resolve();
                    });
                    $('#y-btn').animate({
                        // at the same time as the red one, the yellow button does the same
                        'border-bottom-right-radius': '0',
                        'height': '220px'
                    }, 700, function () {
                        deferred2.resolve();
                    });
                    $.when(deferred1, deferred2).done(function () {
                        $('#g-btn').removeClass('hidden').animate({
                            // when the yellow button's animation finishes (both buttons should finish at the same time), the green button is unhidden and slides into play
                            'left': '0'
                        }, 700, function () {
                            deferred3.resolve();
                        });
                        $('#b-btn').removeClass('hidden').animate({
                            // at the same time as the green one, the blue button does the same from the other side
                            'right': '0'
                        }, 700, function () {
                            deferred4.resolve();
                        });
                    });
                    $.when(deferred3, deferred4).done(function () {
                        buttonCount = 4;
                        deferredMain.resolve();
                    });
                    break;
            }
            return deferredMain.promise();
        }

        function failureSequence() {
            // this function causes all buttons to light up for a brief moment
            var deferred = $.Deferred();
            buttons.addClass('lit-btn');
            setTimeout(function () {
                // and then everything is reset except the number of buttons in play
                buttonSequence = [];
                currentIndex = 0;
                currentRound = 0;
                $('#round-counter').text(currentRound);
                buttons.removeClass('lit-btn');
                deferred.resolve();
            }, 1500);
            return deferred.promise();
        }

        function successSequence() {
            var deferred = $.Deferred();
            currentIndex = 0;
            currentRound++;
            $('#round-counter').text(currentRound);
            // on round 3, add a new button if it hasn't been added already. Do this again on round 6.
            if ((currentRound == 2 && buttonCount < 2) || (currentRound == 5 && buttonCount < 4)) {
                deferred.resolve('addButton');
            // on round 10, begin transition into breakout
            } else if (currentRound == 10) {
                deferred.resolve('breakout');
            } else {
                // otherwise, play the normal success animation and proceed to the computer's turn
                var count = 0;
                (function foo() {
                    if (count < 20) {
                        buttons.toggleClass('lit-btn');
                        count++;
                        setTimeout(foo, 50);
                    } else {
                        deferred.resolve('computerTurn');
                    }
                })();
            }
            return deferred.promise();
        }

        function konami() {
            var keylog = [],
                deferred = $.Deferred();
            const konami = 'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a';
            // this allows the user to enter the konami code when simon is in idle mode to skip directly to breakout. If not all the buttons have been added yet, it does so.
            $(document).keyup(function(e) {
                // if the keylog is full, just get rid of the first value in the array
                if (keylog.length == 10) {
                    keylog.shift();
                }
                keylog.push(e.key);
                if (keylog.join(' ').toUpperCase() == konami.toUpperCase()) {
                    deferred.resolve();
                }
            });
            return deferred.promise();
        }

        gameFlow();
    }

    function breakout() {
        gameState = 'breakout';
        var x = ($('#field').width() / 2),
            y = ($('#field').height() / 2),
            dx = 1,
            dy = 1,
            gameInitialized = false,
            paddleX = ($('#field').width() / 2),
            lives = 2,
            ballMoveInterval,
            bricksBroken = 0,
            currentRound = 0;

        function transitionToBreakout() {
            // first, the round counter fades out
            $('#round-counter').fadeOut({
                'duration': 1000,
                'easing': 'linear'
            });
            // and the background fades to black
            $('body').addClass('fade-to-black').one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function(event) {
                // when that finishes, after a brief delay, the buttons all shrink
                setTimeout(function () {
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
            });;
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
                    // if the index is less than 10, the brick is obviously on the top row and therefore has a top value of 48 since there are 48 pixels of space above the entire field of bricks
                    if (index < 10) {
                        return 48;
                    } else {
                        // otherwise, the value of the top side of the brick is equal to the value of the first digit of its index times the height of each brick (32), then plus 48 pixels to account for the empty space above all the bricks
                        position = parseInt(indexString.substring(0, 1));
                        return (position * 32) + 48;
                    }
                case 'right':
                    // finding the value of the right side of each brick is done exactly the same way as finding the left side's value, except with 1 extra added to the value that will be multiplied by 100, as the right side of each brick is exactly 100 pixels away from the left side
                    position = parseInt(indexString.substring(indexString.length - 1));
                    return (position + 1) * 100;
                case 'bottom':
                    // finding the bottom value of a brick is easy if its index is less than 10 (and therefore is on the top row), as all of them will have a value of 80 (the height of the empty space + the height of each brick)
                    if (index < 10) {
                        return 80;
                    } else {
                        // finding the bottom value of all other bricks is a little more difficult, but is no different than finding the top value of them except for an extra 32 pixels (and thus, we add 1 to position)
                        position = parseInt(indexString.substring(0, 1));
                        return ((position + 1) * 32) + 48;
                    }
            }
        }

        // this function has two main parts
        function initializeBricks(complete) {
            $('.brick').each(function (index, element) {
                // first, a random color is given to each brick
                $(element).removeClass('red yellow green blue').addClass(chooseColor());
                // then, if it hasn't been done already, data attributes are added to each, using the setHitbox function to determine the value of each by passing in the brick's index and a string telling it which value to calculate
                if (!gameInitialized) {
                    $(element).attr({
                        'data-left': setHitbox(index, 'left'),
                        'data-top': setHitbox(index, 'top'),
                        'data-right': setHitbox(index, 'right'),
                        'data-bottom': setHitbox(index, 'bottom')
                    });
                }
            });
            $('#bricks-container').removeClass('hidden');
            // a variable for determining when to stop the recursive function
            var i = 0;
            // here, a timed recursive function is used to show the bricks one by one in a rapid succession (but not all at once) for increased visual appeal
            (function foo() {
                if (i < 30) {
                    $('.brick').eq(i).removeClass('hidden hidden-brick').addClass('active-brick');
                    i++;
                    setTimeout(foo, 100);
                } else {
                    // after all of them have appeared, stop the recursion and move on to showing the lives (if they're not already shown)...
                    if (!gameInitialized) {
                        setTimeout(showLives, 300);
                    }
                }
            })();
        }

        function showLives() {
            // show the hidden lives and animate them into their full size
            $('.life').removeClass('hidden').addClass('rotating');
            $('.life').each(function (index, element) {
                growBall(element, true);
            });
            if (!gameInitialized) {
                showPaddle();
            }
        }

        // this function also shows the round counter
        function showPaddle() {
            // the round counter has some properties set and then fades into existence
            $('#round-counter').css('color', 'white').text(currentRound).fadeIn({
                'duration': 700,
                'easing': 'linear'
            });
            // the paddle receives the same animation treatment as the lives
            $('#paddle').removeClass('hidden').animate({
                'height': '24px',
                'width': '128px',
                'left': '500px',
                'bottom': '0px',
            }, 700, function () {
                // after a delay, the main draw function is called, which starts the ball moving
                gameInitialized = true;
                setTimeout(draw, 300);
            });
        }

        function roundProgress() {
            bricksBroken = 0;
            currentRound++;
            gameState = 'breakoutRoundProgress';
            // freeze the ball's position
            setTimeout(function () {
                shrinkBall(buttonContainer, false, function () {
                    // new bricks appear
                    initializeBricks();
                    setTimeout(function () {
                        $('#round-counter').text(currentRound);
                        resetBall();
                    }, 3000);
                });
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
                gameState = 'breakoutLosingLife';
                loseLife();
            }
        }

        function shrinkBall(ball, life, complete) {
            // lives behave slightly differently than the ball for the purposes of this function
            if (life) {
                ball.animate({
                    'top': parseInt(ball.css('top')) - 16,
                    'left': parseInt(ball.css('left')) - 16
                }, 500);
            }
            ball.children().animate({
                'height': '0px',
                'width': '0px'
            }, 500).promise().done(function () {
                ball.addClass('hidden');
                if (typeof complete == 'function') {
                    complete();
                }
            });
        }

        function growBall(ball, life, complete) {
            $(ball).removeClass('hidden');
            // lives behave slightly differently than the ball for the purposes of this function
            if (life) {
                $(ball).animate({
                    'top': '0px',
                    'left': '0px'
                }, 500);
            }
            $(ball).children().animate({
                'height': '16px',
                'width': '16px'
            }, 500).promise().done(function () {
                // a function to call after the animation is complete
                if (typeof complete == 'function') {
                    complete();
                }
            });
        }

        // this function is for putting the ball back in the center of the field
        function resetBall() {
            x = ($('#field').width() / 2);
            y = ($('#field').height() / 2);
            growBall(buttonContainer, false, function () {
                setTimeout(function () {
                    gameState = 'breakout';
                    dx = 1;
                    dy = 1;
                }, 500);
            });
        }

        function loseLife() {
            // first, the main ball shrinks out of existence
            shrinkBall(buttonContainer, false, function () {
                if (lives > 0) {
                    if (lives >= 1) {
                        // after a delay, the rightmost life is shrunk out of sight and then the ball is reset
                        shrinkBall($('.life').eq(lives - 1), true, resetBall);
                    } else {
                        resetBall();
                    }
                    lives--;
                } else {
                    // if the player is out of lives...
                    gameState = 'breakoutGameOver';
                    gameOver();
                }
            });
        }

        function gameOver() {
            // first all the bricks fade out
            $('.brick').animate({
                'opacity': 0
            }, 1000).promise().done(function () {
                // then some properties are set on them so that the game can be easily restarted
                $('.brick').removeClass('active-brick').addClass('hidden-brick').css('opacity', '100');
                setTimeout(function () {
                    // after a delay, the game over message appears
                    $('#gameover-message').removeClass('hidden');
                    $('#gameover-text').css('opacity', '100');
                    setTimeout(function () {
                        // then after another delay, another message appears
                        $('#startagain-text').css('opacity', '100');
                        setTimeout(function () {
                            // finally, after one more delay, the player is able to click to restart the game
                            $(document).click(function () {
                                $('#gameover-message').addClass('hidden');
                                $('#gameover-text').css('opacity', '0');
                                $('#startagain-text').css('opacity', '0');
                                bricksBroken = 0;
                                currentRound = 0;
                                lives = 2;
                                $('#round-counter').text(currentRound);
                                initializeBricks();
                                showLives();
                                setTimeout(function () {
                                    resetBall();
                                }, 3000);
                                $(document).off('click');
                            });
                        }, 300);
                    }, 1000);
                }, 1000);
            });
        }

        function draw() {
            gameState = 'breakout';
            // this event listener is placed here so that the paddle does not start moving until this function is called
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
            // this is what actually causes the ball to move, another timed recursive function
            (function foo() {
                // on every run, check for collisions and add to the ball's position value
                if (gameState == 'breakout') {
                    checkBrickCollision();
                    checkPaddleCollision();
                    checkEdgeCollision();
                    x += dx;
                    y += dy;
                }
                // on every run, update the ball's position
                buttonContainer.css({
                    'top': y,
                    'left': x
                });
                setTimeout(foo, 5);
            })();
        }

        transitionToBreakout();
    }

    simon();
// });