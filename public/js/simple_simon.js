// $(document).ready(function () {
    'use strict';

    const buttons = $('.game-btn');
    const buttonInner = $('#button-inner');
    const buttonOuter = $('#button-outer');

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function simon() {
        var gameState = 'idle',
            buttonSequence = [],
            currentIndex = 0,
            currentRound = 0,
            buttonCount = 1;

        function gameFlow() {
            var deferred = $.Deferred();
            switch (gameState) {
                case 'idle':
                    idle().done(function (next) {
                        $(document).off('keyup');
                        buttons.off('click');
                        buttons.removeClass('enabled-btn lit-btn');
                        switch (next) {
                            case 'start':
                                gameState = 'intro';
                                break;
                            case 'konami':
                                gameState = 'konamiSkip';
                                break;
                        }
                        deferred.resolve();
                    });
                    break;
                case 'intro':
                    playIntro().done(function () {
                        gameState = 'computerTurn';
                        setTimeout(deferred.resolve, 500);
                    });
                    break;
                case 'computerTurn':
                    computerTurn().done(function () {
                        gameState = 'playerTurn';
                        buttons.addClass('enabled-btn');
                        deferred.resolve();
                    });
                    break;
                case 'playerTurn':
                    playerTurn().done(function (next) {
                        $(document).off('keyup');
                        buttons.off('click');
                        buttons.removeClass('enabled-btn');
                        switch (next) {
                            case 'success':
                                gameState = 'successSequence';
                                break;
                            case 'konami':
                                gameState = 'konamiSkip';
                                break;
                            case 'failure':
                                gameState = 'failureSequence';
                                break;
                        }
                        deferred.resolve();
                    });
                    break;
                case 'successSequence':
                    successSequence().done(function (next) {
                        switch (next) {
                            case 'computerTurn':
                                gameState = 'computerTurn';
                                setTimeout(deferred.resolve, 500);
                                break;
                            case 'addButton':
                                gameState = 'addButton';
                                deferred.resolve();
                                break;
                            case 'breakout':
                                deferred.reject();
                                break;
                        }
                    });
                    break;
                case 'failureSequence':
                    failureSequence().done(function () {
                        buttons.addClass('enabled-btn');
                        gameState = 'idle';
                        deferred.resolve();
                    });
                    break;
                case 'addButton':
                    addButton().done(function () {
                        gameState = 'computerTurn';
                        setTimeout(deferred.resolve, 500);
                    });
                    break;
                case 'konamiSkip':
                    if (buttonCount < 4) {
                        addButton().done(function () {
                            setTimeout(deferred.resolve, 300);
                        });
                    } else {
                        deferred.reject();
                    }
            }
            deferred.promise()
            .done(gameFlow)
            .fail(breakout);
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
            playSequence(buttonSequence.length).done(deferred.resolve);
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
                if ($(this).attr('id') == buttonSequence[currentIndex].id) {
                    currentIndex++;
                    // if the player has finished clicking the buttons in the correct order...
                    if (currentIndex == buttonSequence.length) {
                        deferred.resolve('success');
                    }
                // if the player at any point in the sequence makes a mistake...
                } else {
                    deferred.resolve('failure');
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
                var i = 0;
                (function foo() {
                    if (i < 20) {
                        buttons.toggleClass('lit-btn');
                        i++;
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
        var gameState = 'transition',
            x = ($('#field').width() / 2),
            y = ($('#field').height() / 2),
            dx = 1,
            dy = 1,
            gameInitialized = false,
            paddleX = ($('#field').width() / 2),
            lives = 2,
            bricksBroken = 0,
            currentRound = 0;
        const paddle = $('#paddle');

        function gameFlow() {
            var deferred = $.Deferred();
            switch (gameState) {
                case 'transition':
                    setBricks();
                    transitionToBreakout().done(function () {
                        gameState = 'showBricks';
                        setTimeout(deferred.resolve, 500);
                    });
                    break;
                case 'showBricks':
                    showBricks().done(function () {
                        if (paddle.hasClass('hidden')) {
                            gameState = 'showInterface';
                            setTimeout(showInterface, 300);
                        } else {}
                    });
                    break;
            }
            deferred.promise().done(gameFlow);
        }

        function transitionToBreakout() {
            var deferred1 = $.Deferred(),
                deferred2 = $.Deferred(),
                deferred3 = $.Deferred(),
                deferred4 = $.Deferred(),
                deferred5 = $.Deferred(),
                deferredMain = $.Deferred();
            $('#round-counter').fadeOut(1000, 'linear', function () {
                deferred1.resolve();
            });
            // the background fades to black
            $('body').addClass('fade-to-black').one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', deferred2.resolve);
            // when that finishes, after a brief delay, the buttons all shrink
            $.when(deferred1, deferred2).done(function () {
                setTimeout(function () {
                    buttons.animate({
                        'height': '16px',
                        'width': '16px',
                        'border-width': '1px'
                    }, 700, deferred3.resolve);
                    // as does the container holding them
                    buttonInner.addClass('rotating').animate({
                        'height': '32px',
                        'width': '32px',
                    }, 700, deferred4.resolve);
                    buttonOuter.animate({
                        'height': '32px',
                        'width': '32px',
                        'top': y,
                        'left': x
                    }, 700, deferred5.resolve);
                }, 300);
            });
            $.when(deferred3, deferred4, deferred5).done(deferredMain.resolve);
            return deferredMain.promise();
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

        function setBricks() {
            // set the position of each brick
            $('.brick').each(function (index, element) {
                $(element).css({
                    // convert index to string, find the last character in the index, convert it back to an interger, and multiply that by the width of each brick (100). This will be the value to offset the brick from the left by
                    'left': parseInt(index.toString().substring(index.toString().length - 1)) * 100,
                    'top': (parseInt(index / 10) * 32) + 80
                });
            });
        }

        function showBricks() {
            var deferred = $.Deferred();
            $('.brick').each(function (index, element) {
                // first, a random color is given to each brick so that the colors are different each time!
                $(element).removeClass('red yellow green blue').addClass(chooseColor());
            });
            var i = 0;
            // here, a timed recursive function is used to show the bricks one by one in a rapid succession (but not all at once) for increased visual appeal
            (function foo() {
                if (i < 30) {
                    $('.brick').eq(i).toggleClass('hidden active-brick');
                    i++;
                    setTimeout(foo, 100);
                } else {
                    deferred.resolve();
                }
            })();
            return deferred.promise();
        }

        function showInterface() {
            // show the hidden lives and animate them into their full size
            $('.life').toggleClass('hidden').addClass('rotating');
            $('.life').each(function (index, element) {
                growBall(element, true);
            });
            if ($('#round-counter').hasClass('hidden')) {
                $('#round-counter').css('color', 'white').text(currentRound).fadeIn(700);
            }
            // the paddle receives the same animation treatment as the lives
            paddle.removeClass('hidden').animate({
                'height': '24px',
                'width': '128px',
                'left': '500px',
                'top': '546px'
            }, 700);
        }

        function showLives() {
            // show the hidden lives and animate them into their full size
            $('.life').toggleClass('hidden').addClass('rotating');
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
            $('#round-counter').css('color', 'white').text(currentRound).fadeIn(700);
            // the paddle receives the same animation treatment as the lives
            paddle.removeClass('hidden').animate({
                'height': '24px',
                'width': '128px',
                'left': '500px',
                'top': '546px'
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
                shrinkBall(buttonInner, false, function () {
                    // new bricks appear
                    showBricks();
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
                if (y + dy + 32 > parseInt($(element).css('top')) && x + dx < parseInt($(element).css('left')) + 100 && y + dy < parseInt($(element).css('top')) + 32 && x + dx + 32 > parseInt($(element).css('left'))) {
                    $(element).toggleClass('active-brick hidden');
                    bricksBroken++;
                    if ($('.brick.hidden').length == $('.brick').length) {
                        roundProgress();
                    } else {
                        // on which axis should the ball be reflected?
                        // if the ball is not already both above the brick's bottom boundary and below the brick's top boundary, then it must be colliding with the brick from either the top or the bottom
                        if (!(y + 32 > parseInt($(element).css('top'))) || !(y < parseInt($(element).css('top')) + 32)) {
                            // therefore, the ball's y-axis movement should be reversed
                            dy = -dy;
                        // otherwise, if the ball is not already between both of the brick's side boundaries, then it must be colliding with one of the sides
                        } else if (!(x + 32 > parseInt($(element).css('left'))) || !(x < parseInt($(element).css('left')) + 100)) {
                            // therefore, the ball's x-asis movement should be reversed
                            dx = -dx;
                        }
                    }
                }
            });
        }

        function checkPaddleCollision() {
            // this function uses the same logic as checkBrickCollision to determine whether and how the ball is colliding with the paddle
            if (y + dy + 32 > parseInt(paddle.css('top')) && y + dy < parseInt(paddle.css('top')) + 24 && x + dx + 32 > paddleX && x + dx < paddleX + 128) {
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
            if (x + dx + 32 > $('#field').width() || x + dx < 0) {
                dx = -dx;
            }
            // if the ball is colliding with the bottom...
            if (y + dy  + 32 > $('#field').height()) {
                // freeze the ball's movement
                gameState = 'breakoutLosingLife';
                loseLife();
            }
        }

        function shrinkBall(ball, life, complete) {
            // lives behave slightly differently than the ball for the purposes of this function
            if (life) {
                ball.animate({
                    'top': parseInt($(ball).css('top')) + 14,
                }, 500);
            }
            ball.children().animate({
                'height': '0px',
                'width': '0px'
            }, 500).promise().done(function () {
                ball.addClass('hidden').css({
                    'height': '4px',
                    'width': '4px'
                });
                if (typeof complete == 'function') {
                    complete();
                }
            });
        }

        function growBall(ball, life) {
            var deferred1 = $.Deferred(),
                deferred2 = $.Deferred(),
                deferred3 = $.Deferred(),
                deferredMain = $.Deferred();
            $(ball).removeClass('hidden');
            $(ball).animate({
                'top': '0px'
            }, 500, deferred1.resolve);
            $(ball).animate({
                'height': '32px',
                'width': '32px'
            }, {
                'duration': 500,
                'queue': false
            }).promise().done(deferred2.resolve);
            $(ball).children().animate({
                'height': '16px',
                'width': '16px'
            }, 500).promise().done(deferred3.resolve);
            $.when(deferred1, deferred2, deferred3).done(deferredMain.resolve);
            return deferredmain.promise();
        }

        // this function is for putting the ball back in the center of the field
        function resetBall() {
            x = ($('#field').width() / 2);
            y = ($('#field').height() / 2);
            growBall(buttonInner, false, function () {
                setTimeout(function () {
                    gameState = 'breakout';
                    dx = 1;
                    dy = 1;
                }, 500);
            });
        }

        function loseLife() {
            // first, the main ball shrinks out of existence
            shrinkBall(buttonInner, false, function () {
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
                $('.brick').removeClass('active-brick').addClass('hidden').css('opacity', '100');
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
                                showBricks();
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
            $(document).mousemove(function(e) {
                // if the mouse cursor moves too far to the left, stop the paddle at the edge of the "field" until the mouse cursor is centered vertically with it again
                if (e.pageX < $('#field').offset().left + 64) {
                    paddleX = 0;
                // do the same if the mouse cursor moves too far to the right
                } else if (e.pageX > $('#field').offset().left + 936) {
                    paddleX = 872;
                } else {
                    // otherwise, make the paddle follow the mouse cursor
                    paddleX = e.pageX - $('#field').offset().left - 64;
                }
                paddle.css('left', paddleX);
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
                buttonOuter.css({
                    'top': y,
                    'left': x
                });
                setTimeout(foo, 5);
            })();
        }

        gameFlow();
    }

    simon();
// });