$(document).ready(function () {
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
            (function interval() {
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
                    setTimeout(interval, 50);
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
            (function interval() {
                // on each run, either light up the button at the current index
                if (i < runCount) {
                    if (!$(buttonSequence[i]).hasClass('lit-btn')) {
                        $(buttonSequence[i]).addClass('lit-btn');
                    // or unlight it if it's already lit; only increment the counter when unlighting
                    } else {
                        $(buttonSequence[i]).removeClass('lit-btn');
                        i++;
                    }
                    setTimeout(interval, 500);
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
                (function interval() {
                    if (i < 20) {
                        buttons.toggleClass('lit-btn');
                        i++;
                        setTimeout(interval, 50);
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
        const paddle = $('#paddle-outer');
        var gameState = 'transition',
            x = ($('#field').width() / 2),
            y = ($('#field').height() / 2),
            dx = 1,
            dy = 1,
            lives = 2,
            currentLives = lives,
            currentRound = 0,
            speed = 5,
            ballRadius = 16,
            paddleLeft = (($('#field').width() / 2)) - (paddle.width() / 2);

        function gameFlow(next) {
            var deferred = $.Deferred();
            switch (next) {
                case 'setup':
                    setup();
                    transitionToBreakout().done(function () {
                        setTimeout(function () {
                            deferred.resolve('showBricks')
                        }, 500);
                    });
                    break;
                case 'showBricks':
                    showBricks().done(function () {
                        setTimeout(function () {
                            deferred.resolve('showInterface');
                        }, 300);
                    });
                    break;
                case 'showInterface':
                    showInterface().done(function () {
                        setTimeout(function () {
                            deferred.resolve('draw');
                        }, 300);
                    });
                    break;
                case 'draw':
                    draw().done(function (next) {
                        switch (next) {
                            case 'loseLife':
                                deferred.resolve('loseLife');
                                break;
                            case 'roundProgress':
                                deferred.resolve('roundProgress');
                                break;
                        }
                    });
                    break;
                case 'roundProgress':
                    roundProgress().done(function () {
                        deferred.resolve('resetBall');
                    });
                    break;
                case 'resetBall':
                    resetBall();
                    growBall(buttonInner).done(function () {
                        setTimeout(function () {
                            deferred.resolve('draw');
                        }, 500);
                    });
                    break;
                case 'loseLife':
                    loseLife().done(function (next) {
                        switch (next) {
                            case 'resetBall':
                                deferred.resolve('resetBall');
                                break;
                            case 'gameOver':
                                deferred.resolve('gameOver');
                                break;
                        }
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
                deferred5 = $.Deferred();
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
                        'height': ballRadius * 2,
                        'width': ballRadius * 2,
                    }, 700, deferred4.resolve);
                    buttonOuter.animate({
                        'height': ballRadius * 2,
                        'width': ballRadius * 2,
                        'top': y - ballRadius,
                        'left': x - ballRadius
                    }, 700, deferred5.resolve);
                }, 300);
            });
            return $.when(deferred3, deferred4, deferred5).promise();
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

        function setup() {
            // set the position of each brick
            $('.brick').each(function (index, element) {
                $(element).css({
                    // convert index to string, find the last character in the index, convert it back to an interger, and multiply that by the width of each brick (100). This will be the value to offset the brick from the left by
                    'left': parseInt(index.toString().substring(index.toString().length - 1)) * 100,
                    // for the top, divide the index by 10 (effectively moving the decimal point one place to the left) and then round the resulting number down (this way, the result given a brick with a single-digit index is 0), and multiply that by the height of one brick, then add 80 for the offset from the top
                    'top': (parseInt(index / 10) * 32) + 80
                });
            });
            // set the number of lives to be displayed
            for (var i = 1; i <= currentLives; i++) {
                $('#lives-container').append('<div class="life-outer"><div class="life rotating hidden"><div class="red corner-top-left"></div><div class="yellow corner-top-right"></div><div class="green corner-bottom-left"></div><div class="blue corner-bottom-right"></div></div></div>');
            }
            paddle.css('left', paddleLeft);
        }

        function showBricks() {
            var deferred = $.Deferred();
            $('.brick').each(function (index, element) {
                // first, a random color is given to each brick so that the colors are different each time!
                $(element).removeClass('red yellow green blue').addClass(chooseColor());
            });
            var i = 0;
            // here, a timed recursive function is used to show the bricks one by one in a rapid succession (but not all at once) for increased visual appeal
            (function interval() {
                if (i < 30) {
                    $('.brick').eq(i).toggleClass('hidden active-brick');
                    i++;
                    setTimeout(interval, 100);
                } else {
                    deferred.resolve();
                }
            })();
            return deferred.promise();
        }

        function showInterface() {
            var livesDeferred = [],
                deferred1 = $.Deferred(),
                deferred2 = $.Deferred(),
                deferred3 = $.Deferred();
            // this is here so that the number of lives can be easily modified by changing only one variable
            $('.life').each(function () {
                livesDeferred.push($.Deferred());
            });
            $('.life').toggleClass('hidden').addClass('rotating')
            .each(function (index, element) {
                growBall(element).done(livesDeferred[index].resolve);
            });
            // show the hidden lives and animate them into their full size
            $.when.apply($, livesDeferred).done(deferred1.resolve);
            if ($('#round-counter').hasClass('hidden')) {
                $('#round-counter').css('color', 'white').text(currentRound).fadeIn(700, deferred2.resolve);
            } else {
                deferred2.resolve();
            }
            // the paddle receives the same animation treatment as the lives
            paddle.removeClass('hidden');
            $('#paddle').removeClass('hidden').animate({
                'height': '24px',
                'width': '128px',
                'top': '0px'
            }, 700, deferred3.resolve);
            return $.when(deferred1, deferred2, deferred3).promise();
        }

        function roundProgress() {
            var deferred = $.Deferred();
            currentRound++;
            shrinkBall(buttonInner).done(function () {
                // new bricks appear
                showBricks().done(function () {
                    $('#round-counter').text(currentRound);
                    deferred.resolve();
                });
            });
            return deferred.promise();
        }

        function checkCollision(top, left, height, width) {
            // note that all the passed-in values refer to the element being checked, while all other variables refer to the ball
            var deferred = $.Deferred(),
                collision = '';
            // if, on the next interval, the ball would be moved inside the object being checked...
            if (y + dy + ballRadius > top && y + dy - ballRadius < top + height && x + dx + ballRadius > left && x + dx - ballRadius < left + width) {
                // which side of the object is the ball colliding with?
                if (!(y + ballRadius > top) || !(y - ballRadius < top + height)) {
                    collision = 'Ycollide';
                    // which section of the top?
                    if (x + dx < left + (width / 4)) {
                        collision += 'L';
                        deferred.resolve(collision);
                    } else if (x + dx > left + ((width / 4) * 3)) {
                        collision += 'R';
                        deferred.resolve(collision);
                    } else {
                        deferred.resolve(collision);
                    }
                } else if (!(x + ballRadius > left)) {
                    collision = 'XcollideL';
                    deferred.resolve(collision);
                } else if (!(x - ballRadius < left + width)) {
                    collision = 'XcollideR';
                    deferred.resolve(collision);
                }
            } else {
                deferred.reject();
            }
            return deferred.promise();
        }

        function checkBrickCollision() {
            var deferred = $.Deferred(),
                event = '';
            $('.active-brick').each(function (index, element) {
                checkCollision(parseInt($(element).css('top')), parseInt($(element).css('left')), $(element).height(), $(element).width()).done(function (collision) {
                    $(element).toggleClass('active-brick hidden');
                    event = collision.substring(0, 8);
                    console.log(collision.substring(0, 8));
                });
            });
            if ($('.brick.hidden').length == $('.brick').length) {
            // is the round over?
                event = 'roundOver';
            }
            switch (event) {
                case 'Xcollide':
                    dx = -dx;
                    deferred.reject();
                    break;
                case 'Ycollide':
                    dy = -dy;
                    deferred.reject();
                    break;
                case 'roundOver':
                    deferred.resolve();
                    break;
            }
            return deferred.promise();
        }

        function checkPaddleCollision() {
            checkCollision(parseInt(paddle.css('top')), paddleLeft, paddle.height(), paddle.width()).done(function (collision) {
                switch (collision.substring(1)) {
                    case 'collideL':
                        dx = -1;
                        break;
                    case 'collideR':
                        dx = 1;
                        break;
                }
                dy = -1;
            });
        }

        function checkEdgeCollision() {
            var deferred = $.Deferred();
            // if the ball is colliding with the top...
            if (y + dy - ballRadius < 0) {
                dy = -dy;
            }
            // if the ball is colliding with the right or the left...
            if (x + dx + ballRadius > $('#field').width() || x + dx - ballRadius < 0) {
                dx = -dx;
            }
            // if the ball is colliding with the bottom...
            if (y + dy + ballRadius > $('#field').height()) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
            return deferred.promise();
        }

        function draw() {
            var deferred = $.Deferred();
            enablePaddle();
            // this is what actually causes the ball to move, a timed recursive function
            (function interval() {
                if (deferred.state() == 'pending') {
                    // on every run, check for collisions and add to the ball's position value
                    checkBrickCollision().done(function () {
                        deferred.resolve('roundProgress');
                    });
                    checkPaddleCollision();
                    checkEdgeCollision().done(function () {
                        deferred.resolve('loseLife');
                    });
                    x += dx;
                    y += dy;
                    // also update the ball's position
                    buttonOuter.css({
                        'top': y - ballRadius,
                        'left': x - ballRadius
                    });
                    setTimeout(interval, speed);
                }
            })();
            return deferred.promise();
        }

        function enablePaddle() {
            // in case this event listener has already been set...
            $(document).off('mousemove');
            $(document).mousemove(function(e) {
                // if the mouse cursor moves too far to the left, stop the paddle at the edge of the "field" until the mouse cursor is centered vertically with it again
                if (e.pageX < $('#field').offset().left + 64) {
                    paddleLeft = 0;
                // do the same if the mouse cursor moves too far to the right
                } else if (e.pageX > $('#field').offset().left + 936) {
                    paddleLeft = 872;
                } else {
                    // otherwise, make the paddle follow the mouse cursor
                    paddleLeft = e.pageX - $('#field').offset().left - 64;
                }
                paddle.css('left', paddleLeft);
            });
        }

        function shrinkBall(ball) {
            var deferred1 = $.Deferred(),
                deferred2 = $.Deferred();
            ball.animate({
                'top': parseInt($(ball).css('top')) + 14,
                'height': '0px',
                'width': '0px'
            }, 500, deferred1.resolve);
            ball.children().animate({
                'height': '0px',
                'width': '0px'
            }, 500).promise().done(deferred2.resolve);
            return $.when(deferred1, deferred2).done(function () {
                ball.addClass('hidden').css({
                    'height': '4px',
                    'width': '4px'
                });
            }).promise();
        }

        function growBall(ball) {
            var deferred1 = $.Deferred(),
                deferred2 = $.Deferred();
            $(ball).removeClass('hidden');
            $(ball).animate({
                'top': '0px',
                'height': '32px',
                'width': '32px'
            }, {
                'duration': 500,
                'queue': false
            }).promise().done(deferred1.resolve);
            $(ball).children().animate({
                'height': '16px',
                'width': '16px'
            }, 500).promise().done(deferred2.resolve);
            return $.when(deferred1, deferred2).promise();
        }

        function resetBall() {
            dx = 1;
            dy = 1;
            x = $('#field').width() / 2;
            y = $('#field').height() / 2;
            $(buttonOuter).css({
                'top': y - ballRadius,
                'left': x - ballRadius
            });
        }

        function loseLife() {
            var deferred = $.Deferred();
            shrinkBall(buttonInner).done(function () {
                if (currentLives > 0) {
                    if (currentLives >= 1) {
                        // after a delay, the rightmost life is shrunk out of sight and then the ball is reset
                        shrinkBall($('.life').eq(currentLives - 1)).done(function () {
                            deferred.resolve(resetBall);
                        });
                    } else {
                        deferred.resolve('resetBall');
                    }
                    currentLives--;
                } else {
                    // if the player is out of lives...
                    deferred.resolve('gameOver');
                }
            });
            return deferred.promise();
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
                                currentRound = 0;
                                currentLives = lives;
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

        gameFlow('setup');
    }

    simon();
});