# session-selector

Overview:

SESSIONSELECTOR is a program which is intended to automate the process of creating tables from Google Form preferences. It does this by plugging in to Google Sheet responses and creating a minimalistic user interface from which a DM can check for potential errors and compute. The program's internal weighting is fully adjustable from the UI. 

Session Selector is a .gs file because of its use in Google Sheets, but it is written in Javascript and functionally identical to a .js file. To trial the code, there is a set of test data in the session selector code that can be used labelled testData.
 
Installation:
SESSIONSELECTOR is written in Javascript and needs to be manually ported into a given sheet via the following steps:
  1. In the Google Form you want to evaluate, generate a linked Google Sheet.
  2. In the Google Sheet, click Extensions in the ribbon, then open AppsScript.
  3. There should be a .gs file open with some sample code, which you should replace with the SESSIONSELECTOR code.
  4. Save by pressing the floppy disc icon, then refresh the Google Sheets page.
  5. SESSIONSELECTOR can now be accessed via the Session Selector ribbon tab. (You may need to allow the program access.)

Instructions:

There are two ways of using this program. The first way is reccommended as it provides a better UI but the second is an option. Don't try and use both at the same time.
 1. Click the Session Selector tab on the ribbon above (refresh the page if it is not there) and open the sidebar.
 2. Type =SESSIONSELECTOR(ARRAYFORMULA(Form_Responses[#ALL])) into an empty cell of the sheet. If the appropriate cells are not automatically selected, do so by selecting the whole response table, including the headers, for Form_Responses[#ALL].
 
RULES OF USAGE:
 1. All of the tiered preference questions (eg. 1st pref, 2nd pref...) should begin with the ordinal number (eg. 1st, 2nd...) and have the word "preference" or "preferences" within them. In addition, no other question may have either of these words.
 2. No preference question option should have a comma inside. (eg. "Niko's table 12-5pm" is acceptable but "Niko's table, 12-5pm" is not.)
 3. There should only be one "checkboxes" style preferences question. (ie. "Remaining preferences?")
 4. Two players should never share a name, nor should two sessions.
 5. This program is not intended for use with more than 10000 sessions or players.
 6. Don't write anything on the sheet. All there should be is the data automatically generated on the table.
 
Additional Information:
 1. If zero people select a particular session in the entire form, it will be automatically discarded and people will not be assigned to it. Similarly, if a player doesn't select a session even in "other preferences", they won't be assigned to it.
 2. The program will inform you if it finds entries for players that it doesn't recognise, eg. if someone tries to write wumpusthelonely as a disliked player but misspells it or wumpus doesn't sign up, the program will spit a "Error(nonexistent noRef): wampithelonely"
 3. If a player doesn't enter a specific preference ranking, eg. giving a 1st and 3rd but not a 2nd, all lower ranked preferences will be bumped up to fill to rank.
