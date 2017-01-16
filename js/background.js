var views = chrome.extension.getViews({
  type: 'popup'
});

var loadingBar = 0;
var loadingComplete = 0;
var loadingPercent = '';

// Controls the ticket-status loading bar.
function update_bar() {
  loadingPercent = Math.round((loadingBar / loadingComplete) * 1000) / 10 + '%';
  document.getElementById('ticket-loading').style.width = loadingPercent;
}

// Adds ticket to .ticket-field dropdown.
function populate_dropdown(ticketType, ticketName, ticketURL) {
  var option = document.createElement('option');
  option.innerHTML = ticketType + ' ' + ticketName;
  option.value = ticketURL;
  option.className = "ticket";
  document.getElementById('ticket-field').appendChild(option);
}

// Saves the requested project to lastProj (for if no default is specified), gets JIRA URL,
// and pulls tickets for requested project.
function pull_tickets(jiraProj) {
  chrome.storage.sync.set({
    lastProj: jiraProj
  });
  chrome.storage.sync.get({
    jiraURL: '',
    tabOpt: ''
  }, function(options) {
    // Display loading status.
    document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingStatus');
    document.getElementById('ticket-status').value = '';

    // JIRA project REST URL.
    var restString = 'rest/api/2/search?jql=project=';
    var limitRes = '&maxResults=1000&fields=summary,issuetype';
    var restURL = options.jiraURL + restString + jiraProj + limitRes;
    populate_dropdown('(REST)', jiraProj, restURL);

    // JIRA project page URL.
    var searchString = 'issues/?jql=';
    var projSearch = 'project=';
    var searchURL = options.jiraURL + searchString + projSearch + jiraProj;

    // Make JIRA REST request and display status.
    var xhr = new XMLHttpRequest();
    xhr.open("GET", restURL, false);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) { // Status OK

          var projTickets = JSON.parse(xhr.responseText);
          var projTotal = projTickets.total;
          loadingComplete = projTickets.issues.length;
          loadingBar = 0;
          for (var i = 0; i < projTickets.issues.length; i++) {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingStatus') + i + chrome.i18n.getMessage('loadingOf') + projTotal;
            var type = projTickets.issues[i].fields.issuetype.name;
            var key = projTickets.issues[i].key;
            var summary = projTickets.issues[i].fields.summary;
            var self = projTickets.issues[i].self;
            populate_dropdown(type, key + ": " + summary, self);
            loadingBar++;
            update_bar();
          }

          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingFinished') + projTickets.issues.length + chrome.i18n.getMessage('loadingOf') + projTotal;
          document.getElementById('ticket-status').value = searchURL;
        } else if (xhr.status === 401) { // Unable to access (login required)
          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loginRequired');
          document.getElementById('ticket-status').value = searchURL;
          document.getElementById('ticket-loading').style.width = '100%';
        } else if (xhr.status === 400) { // Project not found and/or cookie is expired
          if (xhr.getAllResponseHeaders().includes("anonymous")) {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loginRequired');
            document.getElementById('ticket-status').value = options.jiraURL;
            document.getElementById('ticket-loading').style.width = '100%';
          } else {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('projectNotFound');
            document.getElementById('ticket-status').value = searchURL;
            document.getElementById('ticket-loading').style.width = '100%';
          }
        } else {
          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('HTTPError') + xhr.status;
          document.getElementById('ticket-status').value = '';
          document.getElementById('ticket-loading').style.width = '100%';
        }
      }
    };

    xhr.send();
  });
}

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  if (msg.subject === 'updateTickets') {
    pull_tickets(msg.url);
  }
});