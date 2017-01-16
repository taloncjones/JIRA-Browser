// Controls the ticket-status loading bar.
function update_bar(percentage) {
  document.getElementById('ticket-loading').style.width = percentage + '%';
}

// Adds ticket type to .my-type-list dropdown if it doesn't already exist.
function populate_types(typeImage, typeName) {
  var node = document.getElementById('type-sort');
  var found = 0;
  if (node.children.length == 0) {
    var type = document.createElement('type');
    dispAll = chrome.i18n.getMessage('displayAll');
    type.innerHTML = dispAll;
    type.value = 'dispAll';
    type.id = 'default';
    type.className = 'ticket type';
    document.getElementById('type-sort').appendChild(type);
  }
  if (node.children.length != 0) {
    for (var i = 0; i < node.children.length; i++) {
      if (node.children[i].value == typeName) {
        found = 1;
        break;
      }
    }
  }
  if (found == 0) {
    var type = document.createElement('type');
    type.innerHTML = typeImage + typeName;
    type.value = typeName;
    type.className = 'ticket type';
    document.getElementById('type-sort').insertBefore(type, node.firstChild);
  }
}

// Adds ticket to .my-ticket-list dropdown.
function populate_dropdown(issueType, issueURL, ticketKey, ticketName, ticketURL) {
  var ticket = document.createElement('ticket');
  var ticketType = '<img class="icon" title="' + issueType + '" src = "' + issueURL + '" />';
  ticket.innerHTML = ticketType + ticketKey + ": " + ticketName;
  ticket.setAttribute('url', ticketURL);
  ticket.setAttribute('key', ticketKey);
  ticket.setAttribute('otherSearch', 0);
  ticket.className = 'ticket';
  document.getElementById('proj-tickets').appendChild(ticket);
  populate_types(ticketType, issueType);
}

// Checks the status of tabOpt and opens URL accordingly.
function tab_check(myURL) {
  chrome.storage.sync.get({
    tabOpt: ''
  }, function(options) {
    if (options.tabOpt === 1) {
      chrome.tabs.create({
        url: myURL
      });
    } else {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function(tabs) {
        chrome.tabs.update(tabs[0].id, {
          url: myURL
        });
      });
    }
  });
}

function bad_URL() {
  document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('URLError');
  document.getElementById('ticket-status').value = 'chrome://extensions/?options=' + chrome.runtime.id;
  document.getElementById('ticket-status').className = 'status ticket';
  document.getElementById('ticket-status').setAttribute('title', chrome.i18n.getMessage('URLError'));
  update_bar(100);
}

function filter_results(projectSearch, typeValue) {
  var count = 0;
  var search = '';
  var typeCompare = '';
  var projCompare = '';
  var node = document.getElementById('proj-tickets');
  if (!projectSearch) {
    projectSearch = document.getElementById('project-field').value.toLocaleLowerCase();
  }
  if (!typeValue) {
    typeValue = document.getElementById('choice').value;
  }

  if (projectSearch.includes(' ')) {
    projectSearch = projectSearch.split(/ (.+)/)[1];
  } else {
    projectSearch = projectSearch.split(/-(.+)/)[1];
  }

  for (var i = 0; i < node.children.length; i++) {
    typeCompare = node.children[i].innerHTML;
    projCompare = node.children[i].textContent.toLocaleLowerCase();
    if (typeValue != 'dispAll') {
      if (typeCompare.includes('title="' + typeValue + '"')) {
        if (projCompare.includes(projectSearch) || !projectSearch) {
          node.children[i].style.display = 'block';
          count++;
        } else {
          node.children[i].style.display = 'none';
        }
      } else {
        node.children[i].style.display = 'none';
      }
    } else if (projCompare.includes(projectSearch) || !projectSearch) {
      node.children[i].style.display = 'block';
      count++;
    } else {
      node.children[i].style.display = 'none';
    }
  }

  document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingFinished') + count + chrome.i18n.getMessage('loadingOf') + node.children.length;
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
    document.getElementById('ticket-status').className = 'status';

    // JIRA project REST URL.
    var restString = 'rest/api/2/search?jql=project=';
    var limitRes = '&maxResults=1000&fields=summary,issuetype';
    var restURL = options.jiraURL + restString + jiraProj + limitRes;

    // JIRA project page URL.
    var searchString = 'issues/?jql=';
    var projSearch = 'project=';
    var searchURL = options.jiraURL + searchString + projSearch + jiraProj;

    // Make JIRA REST request and display status.
    var xhr = new XMLHttpRequest();
    xhr.open("GET", restURL, false);
    xhr.withCredentials = true;
    xhr.onerror = bad_URL();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 0) {
        update_bar(10);
      }
      if (xhr.readyState === 1) {
        update_bar(20);
      }
      if (xhr.readyState === 2) {
        update_bar(40);
      }
      if (xhr.readyState === 3) {
        update_bar(70);
      }
      if (xhr.readyState === 4) {
        update_bar(90);
        if (xhr.status === 200) { // Status OK

          var projTickets = JSON.parse(xhr.responseText);
          var projTotal = projTickets.total;
          for (var i = 0; i < projTickets.issues.length; i++) {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingStatus') + i + chrome.i18n.getMessage('loadingOf') + projTotal;
            var type = projTickets.issues[i].fields.issuetype.name;
            var typeURL = projTickets.issues[i].fields.issuetype.iconUrl;
            var key = projTickets.issues[i].key;
            var summary = projTickets.issues[i].fields.summary;
  //          var selfURL = projTickets.issues[i].self;
            var selfURL = options.jiraURL + 'browse/' + key;
            populate_dropdown(type, typeURL, key, summary, selfURL);
          }

          update_bar(100);
          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loadingFinished') + projTickets.issues.length + chrome.i18n.getMessage('loadingOf') + projTotal;
          document.getElementById('ticket-status').value = searchURL;
          document.getElementById('ticket-status').className = 'status ticket';
          document.getElementById('ticket-status').setAttribute('title', chrome.i18n.getMessage('loadingFinishedStatus'));
        } else if (xhr.status === 401) { // Unable to access (login required)
          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loginRequired');
          document.getElementById('ticket-status').value = searchURL;
          document.getElementById('ticket-status').className = 'status ticket';
          document.getElementById('ticket-status').setAttribute('title', chrome.i18n.getMessage('loginRequiredStatus'));
          update_bar(100);
        } else if (xhr.status === 400) { // Project not found and/or cookie is expired
          if (xhr.getAllResponseHeaders().includes("anonymous")) {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('loginRequired');
            document.getElementById('ticket-status').value = options.jiraURL;
            document.getElementById('ticket-status').className = 'status ticket';
            document.getElementById('ticket-status').setAttribute('title', chrome.i18n.getMessage('loginRequiredStatus'));
            update_bar(100);
          } else {
            document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('projectNotFound');
            document.getElementById('ticket-status').value = searchURL;
            document.getElementById('ticket-status').className = 'status ticket';
            document.getElementById('ticket-status').setAttribute('title', chrome.i18n.getMessage('loadingFinishedStatus'));
            update_bar(100);
          }
        } else {
          document.getElementById('ticket-status').innerHTML = chrome.i18n.getMessage('HTTPError') + xhr.status;
          document.getElementById('ticket-status').value = '';
          document.getElementById('ticket-status').setAttribute('title', '');
          update_bar(100);
        }
      }
    };

    xhr.send();
  });
}

// Pulls JIRA tickets for default project (or last project if no default) when user opens popup.
// If no JIRA URL has been specified (options not configured), opens option page instead.
function pull_defaults() {
  chrome.storage.sync.get({
    jiraURL: '',
    jiraProj: '',
    lastProj: ''
  }, function(options) {
    // If no JIRA URL
    if (!options.jiraURL) {
      if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+).
        chrome.runtime.openOptionsPage();
      } else {
        // Reasonable fallback.
        window.open(chrome.runtime.getURL('../html/options.html'));
      }
    } else { // JIRA URL found, open default project or, if not found, last project.
      if (!options.jiraProj) {
        document.getElementById('project-field').value = options.lastProj;
        if (options.lastProj) {
          pull_tickets(options.lastProj);
        }
      } else {
        document.getElementById('project-field').value = options.jiraProj;
        pull_tickets(options.jiraProj);
      }
    }
  });
  document.getElementById('choice').value = 'dispAll';
}

window.addEventListener('load', pull_defaults);
document.getElementById('project-field').addEventListener('keyup', function() {
  var newProj = document.getElementById('project-field').value.toLocaleLowerCase();
  var node = document.getElementById('proj-tickets');
  var type = document.getElementById('type-sort');
  if (newProj.includes(' ') || newProj.includes('-')) {
    filter_results(newProj, '');
  } else {
    while (node.hasChildNodes()) {
      node.removeChild(node.lastChild);
    }
    while (type.hasChildNodes()) {
      type.removeChild(type.lastChild);
    }
    pull_tickets(newProj);
    var dispAll = chrome.i18n.getMessage('displayAll');
    document.getElementById('choice').innerHTML = '<type>' + dispAll + '</type>';
    document.getElementById('choice').value = 'dispAll';
  }
});
document.getElementById('proj-tickets').addEventListener('click', function(e) {
  var target = e.target;
  if (target.tagName === 'IMG') {
    target = target.parentNode;
  } else if (target.tagName === 'LI' || target.tagName === 'TICKET') {} else {
    return;
  }
  var jiraOpen = target.getAttribute('url');
  tab_check(jiraOpen);
});
document.getElementById('ticket-status').addEventListener('click', function() {
  var jiraOpen = document.getElementById('ticket-status').value;
  if (jiraOpen) {
    tab_check(jiraOpen);
  }
});
document.getElementById('choice').addEventListener('click', function() {
  document.getElementById('dropdown').style.display = 'block';
  window.location.hash = '#default';
});
document.getElementById('type-sort').addEventListener('click', function(e) {
  var target = e.target;
  var search = target.value;
  var count = 0;
  var node = document.getElementById('proj-tickets');
  if (target.tagName === 'IMG') {
    target = target.parentNode;
  } else if (target.tagName === 'LI' || target.tagName === 'TYPE') {} else {
    return;
  }

  document.getElementById('choice').innerHTML = '<type>' + target.innerHTML + '</type>';
  document.getElementById('choice').value = target.value;
  document.getElementById('dropdown').style.display = 'none';
  var search = target.value;
  filter_results('', search);
});