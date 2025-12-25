//COUNTER by M. Ali Kapadia

const COUNTER_VAR_NAME = "lastCounter";
const STEPS_VAR_NAME = "lastSteps";

// Restricts inputs to numeric
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
        textbox.addEventListener(event, function() {
        if (inputFilter(this.value)) {
            this.oldValue = this.value;
            this.oldSelectionStart = this.selectionStart;
            this.oldSelectionEnd = this.selectionEnd;
        } else if (this.hasOwnProperty("oldValue")) {
            this.value = this.oldValue;
            this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
        } else {
            this.value = "";
        }
        });
    });
}

var doubleTouchStartTimestamp = 0;
document.addEventListener("touchstart", function(event){
    var now = +(new Date());
    if (doubleTouchStartTimestamp + 500 > now){
        event.preventDefault();
    };
    doubleTouchStartTimestamp = now;
});

//Focus and defocus ensure swapping between the count input and count display
function focusCounter(){
    counterDisplay.style.visibility = "hidden";
    counterInput.focus();
    counterInput.setSelectionRange(0,999);
}

function defocusCounter(){
    counterInput.value = formatValue(counterInput.value);
    counterDisplay.innerHTML = counterInput.value;
    setTimeout(hideCounterDisplay, 120);
}

function hideCounterDisplay(){
    counterDisplay.style.visibility = "visible";
    counterInput.blur();
}

//These round up or down to the nearest 100 number. 
//This is used to determine if confetti should be thrown or not.
function roundUp(value) {
    value++;
    return (~~((value + 99) / 100) * 100);
}

function roundDown(value){
    value--;
    return Math.floor(value / 100) * 100;
}

//For now, just making sure no negative value passes through.
function formatValue(value){
    if(value<0){
        return 0;
    }else{
        return value;
    }
}

//Increments counter by the current step value and checks if confetti should be thrown
function incrementCounter(){
    var stepValue = parseInt(steps.value);
    var oldValue = parseInt(counterInput.value);
    var newValue = formatValue(oldValue + stepValue);
    
    counterInput.value = newValue;
    counterDisplay.innerHTML = newValue;
    defocusCounter();
    saveCounter();

    //Check if passed the threshold to throw confetti
    if(stepValue>=1){
        if(roundUp(newValue)>roundUp(oldValue)){
            throwConfetti();
        }
    }else{
        if(roundDown(newValue)<roundDown(oldValue)){
            throwConfetti();
        }
    }
    //playSFX();
}

//Decrements counter by the current step value
function decrementCounter(){
    var newValue = formatValue(parseInt(counterInput.value) - parseInt(steps.value));
    counterInput.value = newValue;
    counterDisplay.innerHTML = counterInput.value
    defocusCounter();
    saveCounter();
}

function playSFX() {
  //Audio disabled for now.
  //var audio = new Audio('/blip.wav');
  //audio.play();
  //sfx.play();
}

function showSpreadMessage(){
    if(confirm("By printing our small poster and hanging it at your mosque or prayer room (with permission) you can help many others count. Next, you will see the poster to print.")){
        window.open('poster.pdf', '_blank');
    }
}

function resetCounter(){
    if(confirm("Confirm Reset:\nYou're about to reset the counter to 0.")){
        counterInput.value = 0;
        counterDisplay.innerHTML = 0;
        saveCounter();
    }
}

//Writes provided values to cookie. For example the count value or the increment step setting.
function saveToCookie(name, value){
    var expiringYear = (new Date()).getFullYear() + 3;
    var expires = (new Date(expiringYear, 12, 12)).toUTCString();
    document.cookie = name + '=' + value + ';path=/;SameSite=Strict;expires=' + expires;
}

function saveCounter(){
    if(!counterInput.value){
        counterInput.value = 0;
    }
    saveToCookie(COUNTER_VAR_NAME, counterInput.value);
}

function saveSteps(){
    saveToCookie(STEPS_VAR_NAME, steps.value);
}


document.addEventListener("DOMContentLoaded", function(event) { 

    //Initialize objects
    var counterContainer = document.getElementById("counterContainer");
    var counterInput = document.getElementById("counterInput");
    var incrementor = document.getElementById("incrementor");
    var decrementor = document.getElementById("decrementor");
    var edit = document.getElementById("edit");
    var resetter = document.getElementById("resetter");
    var steps = document.getElementById("steps");
    var counterDisplay = document.getElementById("counterDisplay");
    //var controls = document.getElementById("controls");
    //var sfx = document.getElementById("sfx");

    //Install input filters.
    setInputFilter(counterInput, function(value) {return /^-?\d*$/.test(value); });
    
    //Set Input Change Handlers
    counterInput.onblur = function(){
        defocusCounter();
    }
    counterInput.onchange = function(){
        saveCounter();
    }
    steps.onchange = function(){
        saveSteps();
    }

    //Initialize interactions
    counterContainer.onclick = focusCounter;
    counterInput.onclick = focusCounter;
    counterDisplay.click = focusCounter;
    edit.onclick = focusCounter;
    incrementor.onclick = incrementCounter;
    decrementor.onclick = decrementCounter;
    resetter.onclick = resetCounter;
    //spreader.onclick = showSpreadMessage;

    // Load Last Counter Value
    var lastCounterValue = formatValue(document.cookie.replace(/(?:(?:^|.*;\s*)lastCounter\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    if (lastCounterValue) {
        counterInput.value = lastCounterValue;
    }

    //Load Last Steps Value
    var lastStepsValue = document.cookie.replace(/(?:(?:^|.*;\s*)lastSteps\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if (lastStepsValue && parseInt(lastStepsValue) > 0) {
        steps.value = lastStepsValue;
    }

    //Enable odometer effect on the counter display
    var el = document.querySelector('.counter-display');
    var od = new Odometer({
        el: el,
        value: counterInput.value,
        // Any option (other than auto and selector) can be passed in here
        auto: false, // Don't automatically initialize everything with class 'odometer'
        format: '(,ddd).dd', // Change how digit groups are formatted, and how many digits are shown after the decimal point
        duration: 100, // Change how long the javascript expects the CSS animation to take
        theme: 'default', // Specify the theme (if you have more than one theme css file on the page)
    });

    // Execute a function when the user releases a key on the keyboard
    counterInput.addEventListener("keyup", function(event) {
      if (event.keyCode != undefined){
        if (event.keyCode == 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          defocusCounter();
        }  
      }else{
        if (event.code != undefined){
          if (event.code == "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            defocusCounter();
          }
        }
      }
      
    });
});