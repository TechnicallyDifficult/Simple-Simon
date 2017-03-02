"use strict";

var gameState = "idle"

function playIntro() {
    var redOn = false;
    var count = 0;
    var intervalId = setInterval(function () {
        if (count <= 50) {
            if (!redOn) {
                $("#red-button").addClass("lit");
                redOn = true;
            } else {
                $("#red-button").removeClass("lit");
                redOn = false;
            }
            count++;
        } else {
            console.log("Intro over.");
            clearInterval(intervalId);
        }
    }, 35);
}

$("#red-button").click(function() {
    console.log("Button was clicked!");
    gameState = "intro";
    if (gameState == "idle") {
        $("#red-button").removeClass("btn-enabled");
        playIntro();
    }
});