//@OnlyCurrentDoc

/**
 * =====================================================================================================
 * SESSIONSELECTOR by Niko
 * version 1.1 (minimum players update)
 * =====================================================================================================
 * Overview:
  SESSIONSELECTOR is a program which is intended to automate the process of creating tables from Google Form preferences. It does this by plugging in to Google Sheet responses and creating a minimalistic user interface from which a DM can check for potential errors and compute. The program's internal weighting is fully adjustable from the UI (but you'd better fill the syntax correctly or it'll explode and it won't be my fault).
 *
  Installation:
  SESSIONSELECTOR is written in Javascript and needs to be manually ported into a given sheet via the following steps:
  1. In the Google Form you want to evaluate, generate a linked Google Sheet.
  2. In the Google Sheet, click Extensions in the ribbon, then open AppsScript.
  3. There should be a .gs file open with some sample code, which you should replace with the SESSIONSELECTOR code.
  4. Save by pressing the floppy disc icon, then refresh the Google Sheets page.
  5. SESSIONSELECTOR can now be accessed via the Session Selector ribbon tab. (You may need to allow the program access.)
 * 
 * Instructions: 
 * There are two ways of using this program. The first way is reccommended as it provides a better UI but the second is an option. Don't try and use both at the same time.
 * 1. Click the Session Selector tab on the ribbon above (refresh the page if it is not there) and open the sidebar.
 * 2. Type =SESSIONSELECTOR(ARRAYFORMULA(Form_Responses[#ALL])) into an empty cell of the sheet. If the appropriate cells are not automatically selected, do so by selecting the whole response table, including the headers, for Form_Responses[#ALL].
 * 
 * RULES OF USAGE:
 * 1. All of the tiered preference questions (eg. 1st pref, 2nd pref...) should begin with the ordinal number (eg. 1st, 2nd...) and have the word "preference" or "preferences" within them. In addition, no other question may have either of these words.
 * 2. No preference question option should have a comma inside. (eg. "Niko's table 12-5pm" is acceptable but "Niko's table, 12-5pm" is not.)
 * 3. There should only be one "checkboxes" style preferences question. (ie. "Remaining preferences?")
 * 4. Two players should never share a name, nor should two sessions.
 * 5. This program is not intended for use with more than 10000 sessions or players.
 * 6. Don't write anything on the sheet. All there should be is the data automatically generated on the table.
 * 
 * Additional Information:
 * 1. If zero people select a particular session in the entire form, it will be automatically discarded and people will not be assigned to it. Similarly, if a player doesn't select a session even in "other preferences", they won't be assigned to it.
 * 2. The program will inform you if it finds entries for players that it doesn't recognise, eg. if someone tries to write wumpusthelonely as a disliked player but misspells it or wumpus doesn't sign up, the program will spit a "Error(nonexistent noRef): wampithelonely"
 * 3. If a player doesn't enter a specific preference ranking, eg. giving a 1st and 3rd but not a 2nd, all lower ranked preferences will be bumped up to fill to rank.
 * 
*/

// =====================================================================================================
// 0/3. GOOGLE SHEETS
// This section pertains to google sheets functionality and the UI. The HTML element is generated entirely from strings in this JS code.
// =====================================================================================================
defaultFormOptions = ["1,0.7,0.4,0.1", "-10000,0.6", "-1000000,-10000", "2,4", "100000", "checked=true", ""]

formStart = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>change html content </title>

  <script>
     function submitForm() {
      document.getElementById("submitButton").value="Loading...";
      google.script.run.submit(document.getElementById("submissionForm"));
     }
   </script>
</head>

<body>
   <form id="submissionForm">

    <h3>Options</h3>
`
formEnd = `
<h3>Instructions and Rules</h3>

    <p>1. The printout from calculation will appear above these instructions. Each row is a session, beginning with the name of the session and followed by the players assigned to it, separated by commas.<br>2. Don't write anything on the sheet other than what's in the table.<br>3. Make sure no players share usernames and no sessions share names.<br>4. You can have more than three ranking questions but always name them "Nth preference?"<br>5.1 Weighting is the scoring for a given permutation. You can edit these values, where each line is written as [1st place, 2nd place... Nth place], [Disliked player, Liked player], [Min, max players] respectively. Remember to follow the syntax or the sidebar will freeze and you won't know why.<br>5.2 Max/min players applies a weighting penalty if there are more or less players than that in a session.<br>5.3 Iterations is the number of permutations that the program will try. The higher the number, the more accurate, but the longer it takes. Be aware that the program will timeout if computation exceeeds 6 minutes, so beware of making this number higher than about 1000000.<br>5.4 Pre-check mode should be toggled if you want the program to automatically find possible typos that players have written for their disliked and liked players but not perform the actual calculation. Full mode will perform the full calculation.<br>6. No session name should have a comma inside. (eg. "Niko's table 12-5pm" is acceptable but "Niko's table, 12-5pm" is not.)</p>

   </form>

   <p><i>Created by nikothe11th</i></p>

  <script>
  function changeHeader() {
    // unused
  }
  </script>
</body>
</html>
`

// When you enter Google Sheets, add a new ribbon option to access the Session Selector.
function onOpen() {
 SpreadsheetApp
   .getUi()
   .createMenu("Session Selector")
   .addItem("New computation", "showSidebar")
   .addToUi();
}

// When you select the option in the ribbon dropdown, show the basic version of the sidebar.
function showSidebar(formOptions = defaultFormOptions, middleBits = "<p>-</p>") {
 // Load in the required elements for the form. If no ones are loaded in from a previous object, then use the defaults.
 var formOptions = `
 <label for="weighting">Weighting ranked</label>
    <input type="text" id="weightingRanked" value="` + formOptions[0] + `" name="weightingRanked"><br>
    <label for="weighting">Weighting players</label>
    <input type="text" id="weightingPlayers" value="` + formOptions[1] + `" name="weightingPlayers"><br>
    <label for="weighting">Weighting MinMax</label>
    <input type="text" id="weightingMinMax" value="` + formOptions[2] + `" name="weightingMinMax"><br>

    <label for="minMaxPlayers">Min/Max players</label>
    <input type="text" id="minMaxPlayers" value="` + formOptions[3] + `" name="minMaxPlayers"><br>
    <label for="iterations">Iterations</label>
    <input type="number" id="iterations" value="` + formOptions[4] + `" name="iterations"><br>

    <input type="radio" id="html" name="mode" value="Pre-check" ` + formOptions[5] + `>
    <label for="preCheck">Pre-check</label>
    <input type="radio" id="css" name="mode" value="Full" ` + formOptions[6] + `>
    <label for="full">Full</label><br><br>
    
    <input type="button" id="submitButton" value="Submit" onclick="submitForm();"><br>

    <h3>Printout</h3>
  `

 // Create the sidebar. Add in the middeBits, which are the results of computation if there are any.
 var widget = HtmlService.createHtmlOutput(formStart + formOptions + middleBits + formEnd);
 widget.setTitle("Session Selector");
 SpreadsheetApp.getUi().showSidebar(widget);
}

function submit(form) {
 // When you submit the form in the sidebar, calculate, then reconstruct the sidebar with the calculation in the middle.
 // Gather the data from the Google Sheet. In this instance, it seizes all filled cells.
 var sheet = SpreadsheetApp.getActiveSheet();
 var responses = sheet.getDataRange().getValues()

 // The form data for weighting needs to be cleaned. Convert ranked and players and min/max from strings to arrays, convert all within to numbers, then append. 
 var weightingTotal = []
 var temp
 
 temp = form.weightingRanked.split(",")
 for(var i = 0; i < temp.length; i++){
  temp[i] = Number(temp[i])
 }
 weightingTotal.push(temp);
 temp = form.weightingPlayers.split(",")
 for(var i = 0; i < temp.length; i++){
  temp[i] = Number(temp[i])
 }
 weightingTotal.push(temp);
 temp = form.weightingMinMax.split(",")
 for(var i = 0; i < temp.length; i++){
  temp[i] = Number(temp[i])
 }
 weightingTotal.push(temp);

 // The form data for proceeding is in the radio buttons and needs to be turned into boolean.
 var tempProceed = false
 if(form.mode == "Full"){
  tempProceed = true
 }

 // I don't know remember what temp does so i'm making a bonus little tempMaxMin to hold the info for that one input
 var tempMaxMin = []
 tempMaxMin = form.minMaxPlayers.split(",")
 for(var i = 0; i < tempMaxMin.length; i++){
  tempMaxMin[i] = Number(tempMaxMin[i])
 }

 // Perform the SESSIONSELECTOR calculation, then iterate through to print it out with <br> in the middle.
 var rawResults = SESSIONSELECTOR(responses, tempProceed, tempMaxMin, form.iterations, weightingTotal)
 var sendingResults = ""

 // tableTime is to note when the tables are ready to be constructed.
 var tableTime = 0
 for(var i = 0; i < rawResults.length; i++){
  if (tableTime == 0){
    sendingResults += rawResults[i] + "<br>"
  } else {
    // Slowly construct the printout of the tables in a way that is less ugly.
    sendingResults += "<i>" + rawResults[i][0] + "</i> (" + (rawResults[i].length - 1) + ") " + rawResults[i][1]
    for (var j = 2; j < rawResults[i].length; j++){
      sendingResults += ", " + rawResults[i][j]
    }
    sendingResults += "<br>"
  }
  


  if (rawResults[i] == "Best tables:"){
    tableTime = 1
  }
 }
 
 // Before we recreate the sidebar, we need to keep the options which we got. All are fairly straightforwards except the radio buttons which require a bit more finesse.
 var archiveFormOptions = []
 archiveFormOptions.push(form.weightingRanked)
 archiveFormOptions.push(form.weightingPlayers)
 archiveFormOptions.push(form.weightingMinMax)
 archiveFormOptions.push(form.minMaxPlayers)
 archiveFormOptions.push(form.iterations)
 if(form.mode == "Full"){
  archiveFormOptions.push("")
  archiveFormOptions.push("checked=true")
 } else {
  archiveFormOptions.push("checked=true")
  archiveFormOptions.push("")
 }
 
 // Recreate the sidebar.
 showSidebar(archiveFormOptions, sendingResults)
}

// =====================================================================================================
// 1/3. FUNCTIONS
// Auxilliary functions used in the main program. Skip to "SESSIONSELECTOR" for instructions and main code body.
// =====================================================================================================
defaultWeighting = [
  // The weighting for 1st, 2nd, 3rd, and every place thereafter. In the assessment, if they have placements after your last one, it will count as the last one.
  [1, 0.7, 0.4, 0.1],
  // The weighting for noRef and yesRef.
  [-10000, 0.6],
  // The weighting for too many players.
  [-1000000, -10000]
]

// A sample of fictional data used for testing.
var testData = [
["Timestamp",	"Name",	"Discord username",	"Character name, class(es) and level(s)",	"Has your character been approved by the DMs?",	"Is there anyone you don't want to play with?",	"Is there anyone you do want to play with?",	"1st preference?",	"2nd preference?",	"3rd preference?",	"Remaining preferences?",	"Anything else you want to make known?"],
["2025/10/24 10:40:01 AM GMT+11",	"First    ",	"firsttheworst", "Reddius, Barbarian 1",	"Yes",	"numberofdeath,   bOAtagons",	"onlyahandful",	"     AppLes   ",	"Durians",	"Bananas",	"Cucumbers, Eggplants, Figs", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Second",	"secondthebest", "Orangeness, Wizard 1",	"Yes",	"theluckyslotter",	"sideofinfinity",	"Cucumbers",	"    Bananas",	"Apples",	"", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Third",	"hairychesthaver", "Yellow Ranger, Ranger 1",	"Yes",	"firsttheworst",	"secondthebest   ,  theluckyslotter  ",	"Bananas",	"Cucumbers",	"Apples",	"Durians, Figs, Bananas, Cucumbers", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Fourth",	"      numberofdeath", "Green Greens, Paladin 1",	"Yes",	"",	"hairychesthaver",	"Durians",	"",	"Apples",	"", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Fifth",	"ONLYAHANDFUL", "Bluezy, Figther 1",	"Yes",	"theluckyslotter, MISSING_PLAYER",	"",	"Durians",	"Apples",	"Bananas",	"", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Sixth",	"bestagons", "Indigonzales, Sorcerer 1",	"Yes",	"theluckyslotter",	"",	"Bananas",	"Apples",	"Cucumbers",	"Durians", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Seventh",	"theluckyslotter", "Violet, Rogue 1",	"Yes",	"",	"hairychesthaver, PLEASE_PLAY_WITH_ME",	"Bananas",	"Apples",	"",	"", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Eighth",	"sideofinfinity", "Pinky Promise, Monk 1",	"Yes",	"",	"",	"Cucumbers",	"Apples",	"Durians", "Cucumbers", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Ninth",	"afullglass", "Darkness, Druid 1",	"Yes",	"",	"",	"Figs",	"Eggplants",	"Bananas", "Durians, Cucumbers, Apples, Figs, Eggplants", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Tenth",	"decimalage", "Sunny, Artificer 1",	"Yes",	"",	"",	"Eggplants",	"Eggplants",	"Apples", "Apples, Bananas, Durians, Cucumbers, Figs, Eggplants", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Eleventh",	"nikofromoneshot", "Rue, Cleric 1",	"Yes",	"",	"afullglass, decimalage",	"Apples",	"Bananas",	"Apples", "Figs, Eggplants", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Twelth",	"verydivisible", "Splittake, Fighter 1",	"Yes",	"sideofinfinity",	"",	"Durians",	"Bananas",	"Eggplants", "Apples, Figs, Eggplants", ""],
["2025/10/24 10:40:01 AM GMT+11",	"Thirteenth",	"bakersdozen", "Ass Jim, Paladin 1",	"Yes",	"",	"",	"Cucumbers",	"Bananas",	"Cucumbers", "Bananas, Eggplants", ""],
["2025/10/24 10:40:01 AM GMT+11",	"",	`fortune
  favours
  the
  bold`, "",	"",	"",	"",	"",	"",	"", "", ""],
]

// Get the Nth column of an matrix and return an array.
function getColumn (anArray, columnNumber) {
  return anArray.map(row => row[columnNumber]);
}

// Take only the unique values of an array and return an array.
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

// For a given string "target", search the pointerArray for it and append to the result each matching item from the resultArray. Return an array.
function findLikers(target, pointerArray, resultArray){
  var likers = []
  for(var i = 0; i < pointerArray.length; i++) {
    if (pointerArray[i] == target) {
        likers.push(resultArray[i])
    } 
  }
  return likers
}

// For a given string or array, finds the first non-numerical element (the element is converted into a number even if it's a string). Return the integer index.
function findFirstNonNumber(array) {
    for (var i = 0; i < array.length; i++) {
    if (!(Number.isInteger(Number(array[i])))) {
      return i
    }
  }
  return -1
}

// Remove all instances of empty strings from an array.
function removeBlanks (value) {
  return value != ""
}

// Transpose an Array^2.
function transpose(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  const grid = [];
  for (let j = 0; j < cols; j++) {
    grid[j] = Array(rows);
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[j][i] = matrix[i][j];
    }
  }
  return grid;
}

// Take a float and produce an assessment value unless it's -1, in which case it's 0.
function reciprocal(value){
  if (value == -1) {
    return 0
  } else {
    return 1 / (value + 1)
  }
}

// Take a draft of tables (matrix) and assess it next to a ranked list of prefrences, with a player reference sheet to identify which element of ranked preferences corresponds to which player. 
// Output a numerical value that represents the quality of the draft.
function assessment(matrix, prefRef, playerRef, noRef, yesRef, minMax = [2, 4], weighting = defaultWeighting){
  var quotient = 0
  // j is matrix row (session, ABC) and i is matrix column (player, 123). 
  for(var j = 0; j < matrix.length; j++){
    for(var i = 0; i < matrix[j].length; i++){
      // If i == 0, that means it's a session assessment and not a player, so ignore code that searches for player stuff
      if (i == 0 && matrix[j][0] != "NO_SESSION") {
        // Apply a penalty if there's less than minimum ppl in a table. The 1+ is there to offset the 1 of the session name.
        quotient += Math.max(1 + minMax[0] - matrix[j].length, 0) * weighting[2][0]
        // We also need to assess if there are too many people in a session, and apply a penalty if there is.
        quotient += Math.max(matrix[j].length - minMax[1] - 1, 0) * weighting[2][1]

      // Beyond this point is for i > 0, which is players. Players assigned to the NO_SESSION session receive a flat penalty and ignore other gains and penalties.
      } else if (matrix[j][0] == "NO_SESSION"){
        quotient += weighting[0][0] * -5

      // Finally, this next section encompasses all players who are not in an empty session.
      } else {
        // For each row of the input matrix, travel along (starting at the second element, aka. index 1,) to find preferences. First, find the element at index 1, which is a preference. Lookup the player who that corresponds to. Go to the preference reference and lookup the matrix's index 0 element (the session which they signed up to) to find which ranking that player gave their session. 
        // Then convert that ranking to a numerical value and add it together.
        quotient += weighting[0][Math.min(prefRef[playerRef.indexOf(matrix[j][i])].indexOf(matrix[j][0]), defaultWeighting[0].length - 1)]

        // Now that we're also looking at individual elements, let's also take the opportunity to search for yes and no refs. Each looks up their disliked players, then looks up if they're in the same session as them. If they are not, it returns 0. If they are, it returns 1, in which case the program multiplies to create a point modification.
        // In both instances, the noRef and yesRef are split using the split method to extract potential multiple answers. If there was only a single answer, it still works. 
        for(var k = 0; k < noRef[playerRef.indexOf(matrix[j][i])].length; k++){
          quotient += Number(matrix[j].includes(noRef[playerRef.indexOf(matrix[j][i])][k]) * weighting[1][0])
        }
        // Similarly, a successful yesRef grants a small bonus.
        for(var k = 0; k < yesRef[playerRef.indexOf(matrix[j][i])].length; k++){
          quotient += Number(matrix[j].includes(yesRef[playerRef.indexOf(matrix[j][i])][k]) * weighting[1][1])
        }
      }
    }
  }
  return quotient
}

// turns [a, b, c] into [a, a, b, b, c, c]
function duplicateElements(array, times) {
  return array.reduce((res, current) => {
      return res.concat(Array(times).fill(current));
  }, []);
}

// Take an input matrix, and observe each possible permuation if you were to pick one choice from each row. Return each possible permutation as a row of the output matrix.
function getPermutations(matrix){
  // Initial setup: make a matrix of arrays where the arrays are one element long and contain only the first element from the input.
  var output = []
  for(var i = 0; i < matrix[0].length; i++){
    output.push([matrix[0][i]])
  }

  // For each row of the input matrix, duplicate the current output by the number of possible choices of the row, then add in one element to each row for the new choices.
  for(var i = 1; i < matrix.length; i++){
    // JSON.parse has been used here to create a deep clone instead of a shallow one. 
    output = JSON.parse(JSON.stringify(duplicateElements(output, matrix[i].length)));
    
    // Adding in the new choices requires using the modulo so that you "wraparound" possible choices to add. eg. from array of choices [a, b] you need to assign a, b, a, b, a, b, etc.
    for(var j = 0; j < output.length; j++){
      output[j].push(matrix[i][j % matrix[i].length])
    }
  }
  
  return output
}

// Remove the first instance of a value from an array and return that array.
function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

// Takes an array and makes it a matrix where each element is an array with one element which is the same as the one from the original array. 
function matrixify(array){
  var output = []
  for(var i = 0; i < array.length; i++){
    output.push([array[i]])
  }
  return output
}

// Gets a random integer between a low and high number, where it can equal the lowest but not the highest.
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

// Finds the index of the highest value in an array.
function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex;
}

// This method tests an array to see if it's empty.
function isNotEmpty(element, index, array) {
  return element != "";
}

function SESSIONSELECTOR(responses=testData, proceed = true, maximumPlayers = [2,4], iterationsNo = 100000, weighting = defaultWeighting) {
  // =====================================================================================================
  // 2/3. DATA COLLECTION
  // Converting the raw responses into usuable arrays.
  // =====================================================================================================
  printOut = []

  // Trim the blanks before and after each entry. While we're here, also make everything lowercase so case sensitivity doesn't get in the way for the purpose of methods like .include()
  for (var i = 0; i < responses.length; i++){
    for (var j = 0; j < responses[i].length; j++){
      responses[i][j] = String(responses[i][j])
      responses[i][j] = responses[i][j].trim().toLowerCase()
      responses[i][j] = responses[i][j].replace(/\n+/g, '');
    }
  }

  // Use the shift function to separate the question headers from the responses.
  var questions = responses.shift()
  // Get player usernames, the people they don't want to play with, and the people they want to play with. Note that all of the things it searches for have been put into lowercase because all the responses, including the titles, are too.
  var players = getColumn(responses, questions.indexOf("discord username"))
  var noRef = getColumn(responses, questions.indexOf("is there anyone you don't want to play with?"))
  var yesRef = getColumn(responses, questions.indexOf("is there anyone you do want to play with?"))

  // Remove the blanks for noRef and yesRef specifically because they're user based entries that can have silly spaces in them and they're not always in the middle so they can't be trimmed properly. 
  for(var i = 0; i < noRef.length; i++){
    noRef[i] = noRef[i].replace(/\s+/g, '');
    // Additionally, take each string element of noRef and yesRef, and turn them into arrays split by comma.
    noRef[i] = noRef[i].split(',')
  }
  for(var i = 0; i < yesRef.length; i++){
    yesRef[i] = yesRef[i].replace(/\s+/g, '');
    yesRef[i] = yesRef[i].split(',')
  }

  // Setup the collection phase for all the preferences. preferencesRanked is used for the numbered preferences (eg. 1st, 2nd, 3rd). preferencesOther and preferencesOther2 are used for the unranked preferences (eg. list any other preferences) - the former becomes an array with every preference as an element, while the latter becomes an Array^2 which has one array for each player.
  var preferencesRanked = []
  var preferencesOther
  var preferencesOther2 = []
  // Starting at ordinal 1 for 1st preference and increasing, find the question with the Nth preference, then extract the corresponding column of preferences from the responses. Ranked preferences are added to preferencesRanked and checkbox mixed preferences are added to preferencesOther.
  var ordinalPreference = 1
  for (var i = 0; i < questions.length; i++){
    if (questions[i].includes("preference")) {
      if (questions[i].includes("preferences")) {
        preferencesOther = getColumn(responses, i);
      } else if (Number(questions[i].substring(0,findFirstNonNumber(questions[i]))) == ordinalPreference) {
        preferencesRanked.push(getColumn(responses, i));
        ordinalPreference++
      }
    }
  }
  // Get the preferences from ALL the ranked preferences, and add to the Totality.
  var preferencesTotality = []
    for (var i = 0; i < preferencesRanked.length; i++){
    preferencesTotality = preferencesTotality.concat(preferencesRanked[i])
  }
  // Get the preferences from the unranked preferences, split it open to acquire the individual values from each list that includes multiple (eg. "Apples, Oranges" becomes [Apples, Oranges]). tempOther is a temporary variable to help with this.
  // Notice how the split() method here uses ", " with a space after the comma, unlike no/yesRef. This is because they are pre-cleaned from their output from the Google Form and always have the comma and space format. 
  var tempOther = [] 
  for (var i = 0; i < preferencesOther.length; i++){
    tempOther = tempOther.concat(preferencesOther[i].split(', '))
    preferencesOther2[i] = preferencesOther[i].split(', ')
  }
  // Combine the ranked and unranked, then remove blanks. Finally, use the totality to get a list of one and only one instance of every present session.
  preferencesTotality = preferencesTotality.concat(tempOther)
  preferencesTotality = preferencesTotality.filter(removeBlanks)
  var uniqueSessions = preferencesTotality.filter(onlyUnique)
  uniqueSessions.push("NO_SESSION") 
  
  // Create matrix preferenceReference to hold everyone's references, ranked. Other is ranked by popularity.
  var preferenceReference = transpose(preferencesRanked)
  for (var i = 0; i < preferenceReference.length; i++){
    // Combine each player's ranked preference array with their unranked preference array to make one big array.
    preferenceReference[i] = preferenceReference[i].concat(preferencesOther2[i])
    
    // If the preferences of a player are completely empty, assign them to NO_SESSION to avoid errors.
    //if (preferenceReference[i].some(isNotEmpty) == false){
    if (true) {
      preferenceReference[i].push("NO_SESSION")
    } 
    // Remove unnecessary blanks so the program won't consider them for swaps.
    preferenceReference[i] = preferenceReference[i].filter(removeBlanks)
  }
  
  // Go through all of the player preferences and elminate repeat sessions.
  for(var i = 0; i < preferenceReference.length; i++) {
    preferenceReference[i] = preferenceReference[i].filter(onlyUnique)
  }

  var errorList = [[], [], []]
  // Final check to make sure that every instance of player names in noRef and yesRef are actually real names in the player list.
  for(var i = 0; i < noRef.length; i++){
    for(var j = 0; j < noRef[i].length; j++){
      // Obviously, if it's empty (because there was no entry for liked/disliked player) then it ignores that.
      if(players.includes(noRef[i][j]) == false && noRef[i][j] != ""){
        errorList[0].push(noRef[i][j])
      }
    }
  }
  for(var i = 0; i < yesRef.length; i++){
    for(var j = 0; j < yesRef[i].length; j++){
      if(players.includes(yesRef[i][j]) == false && yesRef[i][j] != ""){
        errorList[1].push(yesRef[i][j])
      }
    }
  }
  printOut.push("Missing noRef: " + errorList[0].toString())
  printOut.push("Missing yesRef: " + errorList[1].toString())

  // Also check that there are no intances of two players having the same name.
  var ohNo = 0
  for(var i = 0; i < players.length; i++){
    example = players[i]
    if(players.filter(players => players === example).length > 1){
      errorList[2].push(players[i])
      ohNo = 1
    }
  }
  // This process makes duplicates of any repeated usernames and cuts out repeats.
  errorList[2] = errorList[2].filter(onlyUnique)
  printOut.push("Duplicate usernames: " + errorList[2].toString())
  // Duplicates stops the system from working so please remove them.
  if (ohNo == 1){
    proceed = false
    printOut.push("Computation ended. Please remove duplicate usernames before proceeding.")
  }
  
  // Exits out before iteration begins if in pre-check mode.
  if (proceed == false){
    return printOut
  }

  // =====================================================================================================
  // 3/3. RANDOM ITERATION
  // Select a number of random starting points, then make swaps for each one until swaps no longer help.
  // =====================================================================================================

  // draftTable is the working matrix for the current iteration. draftTablesSimple is a version which is just an array and not a matrix, and corresponds with the players array. randomSession is the randomly selected starting session for each player in a given iteration
  var draftTables = matrixify(uniqueSessions)
  var draftTablesSimple = []
  var randomSession = ""

  // The recorder variables for the best of stuff. In particular, bestOfAllTime holds the bestTables and bestAssessment from every random iteration.
  var bestTables = []
  var bestTablesSimple = []
  var bestAssessment = 0
  var bestOfAllTime = []

  for(var i = 0; i < iterationsNo; i++){
    // First, reset the draftTable so it's just a matrix where each array has only the session name. Similarly, reset draftTablesSimple so it is an empty array.
    //console.log("Iteration " + i)
    draftTables = matrixify(uniqueSessions)
    draftTablesSimple = []

    // For each player, select a random session for them to join from all of their possible preferences and fill in draftTablesSimple. j is the index of the player.
    for(var j = 0; j < preferenceReference.length; j++){
      randomSession = preferenceReference[j][getRandomInt(0, preferenceReference[j].length)]
      draftTablesSimple.push(randomSession)
    }

    // Then create draftTables from draftTablesSimple
    for(var j = 0; j < draftTablesSimple.length; j++){
      draftTables[uniqueSessions.indexOf(draftTablesSimple[j])].push(players[j])
    }
    
    // Set defaults.
    bestTables = draftTables
    bestTablesSimple = draftTablesSimple
    bestAssessment = assessment(draftTables, preferenceReference, players, noRef, yesRef, maximumPlayers, weighting)

    var readyToMoveOn = 1
    // Begin to make swaps. j is the player (1,2,3) and k is the session (a,b,c)
    for(var j = 0; j < preferenceReference.length; j++){
      readyToMoveOn = 1

      for(var k = 0; k < preferenceReference[j].length; k++){
        // Replace one session from draftTablesSimple to another session. This is the "swap", where the player at that index becomes assigned to a new session.
        draftTablesSimple[j] = preferenceReference[j][k]

        // Then create draftTables from draftTablesSimple. It should be exactly the same except for the swap.
        draftTables = matrixify(uniqueSessions)
        for(var l = 0; l < draftTablesSimple.length; l++){
          draftTables[uniqueSessions.indexOf(draftTablesSimple[l])].push(players[l])
        }
        
        // If the swap made it better, introduce a new best, and make readyToMove on false so the iteration will loop.
        if(assessment(draftTables, preferenceReference, players, noRef, yesRef, maximumPlayers, weighting) > bestAssessment){
          bestAssessment = assessment(draftTables, preferenceReference, players, noRef, yesRef, maximumPlayers, weighting)
          bestTablesSimple = draftTablesSimple
          bestTables = draftTables

          readyToMoveOn = 0
        } else {
          // If the swap didn't make it better, revert to previous.
          draftTablesSimple = bestTablesSimple
        }
      }
      // If the iteration needs to loop, do so by making j = -1, so that on the next loop the program adds 1 and it becomes j = 0. Also, make the draftTablesSimple equal to the current best so swaps come from a superior starting point.
      if(readyToMoveOn == 0){
        j = -1        
        draftTablesSimple = bestTablesSimple

      }
    }

    // After each iteration is complete and no more good swaps can be performed, add the current tables and their score to bestOfAllTime for later sorting.
    bestOfAllTime.push([bestTables, bestAssessment])
  }

  // actualBestTables is used for the final return.
  var actualBestTables = bestOfAllTime[indexOfMax(getColumn(bestOfAllTime, 1))]

  printOut.push("Assessment score: " + actualBestTables[1])
  printOut.push("")
  printOut.push("Best tables:")
  for(var i = 0; i < actualBestTables[0].length; i++){
    printOut.push(actualBestTables[0][i])
  }
  
  return printOut
}