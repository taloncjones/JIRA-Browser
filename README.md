# JIRA-Browser
Chrome extension intended to make navigating through JIRA faster and enable the user to more easily locate tickets of interest.
Note: JIRA cookies must be enabled for extension to work.

##Installation:
1. Download repository to any location.
2. Open Chrome and navigate to Settings.
3. In the left pane, select Extensions.
4. At the top of the Extensions screen, check developer mode (if full screen this will be around the center).
5. Click Load unpacked extension and navigate to the repository location. Select OK once there.
6. Chrome will load the extension and the JIRA icon will appear in the upper right of the Chrome window (with any other extensions).

######Note: If Chrome did not automatically load the extension, refresh (Ctrl+r) the extensions page to force a refresh of all extensions.

##On first click (after installation):
Extension's option page will open and prompt the user for:
####Default JIRA URL
This URL is required for the extension to work. When the extension is opened it will attempt to navigate to this URL and will use the most recent JIRA cookie for credentials.
####Default JIRA project
Optional. This is the default project that will be opened when the extension is opened. If no project is specified the extension will use the last searched-for project.  
######Known bug: On first launch, the extension will be unable to populate its fields and may have layout issues. Once a project is searched for this should no longer be an issue.
####Default tab option
By default this will be "New Tab", but can be changed if desired. This option controls the action taken when the user clicks a JIRA ticket: open in a new tab or update the current tab.

##After first launch:
####The popup will attempt to search for the default project (if specified) or the last searched-for project. If any errors occur the status bar will explain the issue and, if clicked, take the user to the JIRA page needed to resolve the issue.  
####The Ticket field will display the most recent 1000 tickets found and shows: ticket type icon, ticket key, and ticket summary. If clicked, the extension will open the JIRA ticket using the tab option specified.  
####The Previous and Next buttons are currently disabled.  
####They Type(s) field, default "Display All", will filter the displayed tickets based on ticket type. This list is dynamic and will only show ticket types found in the Ticket field.

####The Project bar has search functionality. If the user searches:  
#####ABC-#:    The ticket field will be limited to the results from project ABC and any matching #s in the ticket key.  
######Ex: ABC-2 will find: ABC-2, ABC-12, ABC-20, ABC-22, etc.  
######Ex: ABC-123 will find: ABC-123, ABC-1123, etc.  
#####ABC def:  The ticket field will be limited to the results from project ABC and any matching phrases in the ticket summary.  

######Note: Project bar search and Type(s) filter can be used together. If Type(s) is limiting the results displayed, it's possible there's a match for another ticket type.
    
